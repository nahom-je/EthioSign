"""
app/inference.py

High-level inference orchestration for EthioSign AI Service.

This module sits between the FastAPI routes and the ModelLoader.
It handles:
  1. Routing between frame-sequence and landmark-sequence inputs.
  2. Latency measurement.
  3. Translating raw model output (Amharic gloss) into full PredictionResult
     including English meaning, category, and confidence badge.
  4. Mapping confidence to badge tier (high / medium / low / unrecognized).

The English translations and category mappings mirror the frontend
ethslVocabulary.js data so responses are consistent on both sides.
"""

import logging
import time
from typing import Optional

import numpy as np

from app.model_loader import get_loader
from app.preprocessing import build_clip_from_frames, normalise_landmark_sequence
from app.config import MIN_CONF

logger = logging.getLogger(__name__)

# ── EthSL → English & Category map ───────────────────────────────────────────
# Source: validated CESLR gloss_dict.npy + community translation review
ETHSL_TRANSLATIONS: dict[str, dict] = {
    "አመሰግናለሁ":  {"english": "Thank you",          "category": "greetings"},
    "ደህና":        {"english": "Hello / Fine / Well", "category": "greetings"},
    "ዛሬ":         {"english": "Today",               "category": "greetings"},
    "እናቴ":        {"english": "My Mother",           "category": "family"},
    "አባቴ":        {"english": "My Father",           "category": "family"},
    "እህቴ":        {"english": "My Sister",           "category": "family"},
    "ወንድሜ":       {"english": "My Brother",          "category": "family"},
    "ልጆች":        {"english": "Children",            "category": "family"},
    "ቤተሰብ":       {"english": "Family",              "category": "family"},
    "ጓደኛ":        {"english": "Friend",              "category": "family"},
    "ዘመድ":        {"english": "Relative / Kin",      "category": "family"},
    "እንጀራ":       {"english": "Injera (Flatbread)",  "category": "food"},
    "ዳቦ":         {"english": "Bread",               "category": "food"},
    "ማር":         {"english": "Honey",               "category": "food"},
    "በላ":         {"english": "Ate",                 "category": "food"},
    "በላሁ":        {"english": "I ate",               "category": "food"},
    "ሀኪም":        {"english": "Doctor",              "category": "health"},
    "ሆስፒታሉ":     {"english": "The Hospital",        "category": "health"},
    "ንጽህ":        {"english": "Clean / Hygiene",     "category": "health"},
    "ቀይ":         {"english": "Red",                 "category": "descriptors"},
    "ቢጫ":         {"english": "Yellow",              "category": "descriptors"},
    "አረንጓዴ":      {"english": "Green",               "category": "descriptors"},
    "ሰፊ":         {"english": "Wide / Spacious",     "category": "descriptors"},
    "ጠባብ":        {"english": "Narrow / Cramped",    "category": "descriptors"},
    "ቀጭን":        {"english": "Slender / Thin",      "category": "descriptors"},
    "ወፍራም":       {"english": "Stout / Thick",       "category": "descriptors"},
    "በጣም":        {"english": "Very / Much",         "category": "descriptors"},
    "ቤቱ":         {"english": "The House / Home",    "category": "places"},
    "ሆቴል":        {"english": "Hotel / Restaurant",  "category": "places"},
    "ሆቴሉ":        {"english": "The Hotel",           "category": "places"},
    "የኢትዮጵያ":    {"english": "Ethiopian",           "category": "places"},
    "ባንዲራ":       {"english": "Flag",                "category": "places"},
    "አንበሳ":       {"english": "Lion",                "category": "places"},
    "ፍቅር":        {"english": "Love",                "category": "actions"},
    "ክብር":        {"english": "Honor / Respect",     "category": "actions"},
    "ጸሎት":        {"english": "Prayer",              "category": "actions"},
    "እወዳለሁ":     {"english": "I love / like",       "category": "actions"},
    "ትወዳለች":     {"english": "She loves",           "category": "actions"},
    "ይወዳል":      {"english": "He loves",            "category": "actions"},
    "ይወዳሉ":      {"english": "They love",           "category": "actions"},
    "ይፈልጋሉ":     {"english": "They want",           "category": "actions"},
    "ማየት":        {"english": "To see / look",       "category": "actions"},
    "ማድረግ":       {"english": "To do / make",        "category": "actions"},
    "መዝናናት":      {"english": "To relax / enjoy",    "category": "actions"},
    "እሄዳለሁ":     {"english": "I will go",           "category": "actions"},
    "ማን":         {"english": "Who?",                "category": "questions"},
    "የት":         {"english": "Where?",              "category": "questions"},
    "እኔ":         {"english": "I / Me",              "category": "questions"},
    "የእኛ":        {"english": "Our",                 "category": "questions"},
    "ከኔ":         {"english": "From me / Than me",   "category": "questions"},
    "ነኝ":         {"english": "I am",               "category": "questions"},
    "ነው":         {"english": "Is (masculine)",      "category": "questions"},
    "ናት":         {"english": "Is (feminine)",       "category": "questions"},
    "አባቴን":       {"english": "My father (acc.)",    "category": "family"},
    "እህቴን":       {"english": "My sister (acc.)",    "category": "family"},
    "የእናቴን":     {"english": "Of my mother",        "category": "family"},
    "ታደርጋለች":    {"english": "She does",            "category": "actions"},
    "ይበልጣል":     {"english": "Exceeds / Better than","category": "descriptors"},
    "ሻሽ":         {"english": "Gauze / Bandage",     "category": "health"},
}


def _confidence_to_status(confidence: float) -> str:
    if confidence >= 0.85:
        return "high_confidence"
    if confidence >= MIN_CONF:
        return "medium_confidence"
    return "low_confidence"


def run_inference(
    frames_b64: Optional[list[str]] = None,
    landmark_sequence: Optional[list[list[float]]] = None,
    landmark_vector: Optional[list[float]] = None,
    mode: str = "auto"
) -> dict:
    """
    Main inference entry point, called by the FastAPI /api/ai/predict route.

    Priority:
      1. landmark_sequence  → multi-frame normalised landmark path
      2. frames_b64         → RGB frame clip through CESLR visual encoder
      3. landmark_vector    → single-frame landmark (wraps in sequence of 1)

    Returns:
        dict matching PredictionResult schema.
    """
    loader    = get_loader()
    t_start   = time.perf_counter()

    # ── Build input from whichever source is available ────────────────────
    result = None

    if landmark_sequence and len(landmark_sequence) > 0:
        norm_seq = normalise_landmark_sequence(landmark_sequence)
        # For landmark-only mode: use the first frame as a single-frame clip
        # (Full landmark sequence model training is Phase 4)
        logger.debug(f"[Inference] Landmark sequence mode: {len(landmark_sequence)} frames")
        # TODO Phase 4: replace with landmark sequence LSTM inference
        result = loader._fallback_prediction()

    if result is None and frames_b64 and len(frames_b64) > 0:
        logger.debug(f"[Inference] Frame clip mode: {len(frames_b64)} frames")
        clip = build_clip_from_frames(frames_b64)
        if len(clip) > 0:
            result = loader.predict_from_frames(clip)

    if result is None and landmark_vector:
        # Treat single landmark as a 1-frame sequence (very low quality, placeholder)
        result = loader._fallback_prediction()

    if result is None:
        result = {"status": "no_input", "amharic": None, "confidence": 0.0}

    latency_ms = round((time.perf_counter() - t_start) * 1000, 1)

    # ── Enrich with English translation and category ──────────────────────
    amharic    = result.get("amharic")
    confidence = result.get("confidence", 0.0)
    status     = result.get("status", "unrecognized")

    if amharic and status == "recognized" and confidence >= MIN_CONF:
        translation = ETHSL_TRANSLATIONS.get(amharic, {})
        prediction  = {
            "amharic":    amharic,
            "english":    translation.get("english", amharic),
            "category":   translation.get("category", "general"),
            "confidence": confidence,
            "model":      "CESLR-ResNet18-BiLSTM-CTC-v1" if loader.is_loaded else "Fallback",
        }
        return {
            "success":    True,
            "prediction": prediction,
            "status":     _confidence_to_status(confidence),
            "latencyMs":  latency_ms
        }

    # Unrecognized / unavailable
    return {
        "success":    False,
        "prediction": None,
        "status":     status if status != "recognized" else "unrecognized",
        "latencyMs":  latency_ms,
        "message":    "Sign not recognized. Please try again."
            if status == "unrecognized"
            else f"Model status: {status}"
    }
