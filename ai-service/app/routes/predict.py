"""
app/routes/predict.py

FastAPI router for sign recognition prediction endpoints.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.inference import run_inference
from app.model_loader import get_loader

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Inference"])


# ── Request / Response Schemas ────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Flexible input accepted from the React frontend.
    At least one of frame, frames, landmarks, or landmark_sequence must be provided.
    """
    frame: Optional[str]           = Field(None, description="Single base-64 JPEG frame")
    frames: Optional[list[str]]    = Field(None, description="List of base-64 frames (clip)")
    landmarks: Optional[list]      = Field(None, description="Flat 258-value landmark vector OR list of them")
    mode: Optional[str]            = Field("auto", description="'frame' | 'sequence' | 'landmarks' | 'auto'")


class PredictionDetail(BaseModel):
    amharic:    str
    english:    str
    category:   str
    confidence: float
    model:      str


class PredictResponse(BaseModel):
    success:    bool
    prediction: Optional[PredictionDetail] = None
    status:     str
    latencyMs:  Optional[float]            = None
    message:    Optional[str]              = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/ai/predict", response_model=PredictResponse,
             summary="Recognize an Ethiopian Sign Language gesture")
async def predict(req: PredictRequest):
    """
    Accepts one or more webcam frames or MediaPipe landmark vectors and
    returns the recognized EthSL gloss with confidence and English translation.

    **Input priority order:**
    1. `frames` (list of base-64 JPEG frames) → best accuracy
    2. `landmarks` (MediaPipe landmark sequence) → lowest latency
    3. `frame` (single base-64 JPEG frame) → single-frame fallback

    **Response status values:**
    - `high_confidence`   — prediction reliable (≥ 85 % confidence)
    - `medium_confidence` — prediction likely (65–84 %)
    - `unrecognized`      — sign outside vocabulary or confidence below threshold
    - `model_unavailable` — checkpoint file not yet downloaded
    - `no_input`          — no valid input provided
    """
    # Determine which input path to use
    frames_b64 = req.frames or ([req.frame] if req.frame else None)

    # landmarks can be either a single vector or a list of vectors
    landmark_sequence = None
    landmark_vector   = None
    if req.landmarks is not None:
        if isinstance(req.landmarks[0], (list, tuple)):
            landmark_sequence = req.landmarks
        else:
            landmark_vector = req.landmarks

    if not frames_b64 and not landmark_sequence and not landmark_vector:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one of: 'frame', 'frames', or 'landmarks'."
        )

    result = run_inference(
        frames_b64=frames_b64,
        landmark_sequence=landmark_sequence,
        landmark_vector=landmark_vector,
        mode=req.mode or "auto"
    )
    return result


@router.get("/health", summary="Service health & model status")
async def health():
    loader = get_loader()
    return {
        "status":        "healthy",
        "service":       "EthioSign AI Inference Service",
        "version":       "1.0.0",
        "modelLoaded":   loader.is_loaded,
        "modelName":     "CESLR-ResNet18-BiLSTM-CTC",
        "targetLanguage": "EthSL (Ethiopian Sign Language)",
        "vocabularySize": len(loader.gloss_dict) if loader.gloss_dict else 0,
        "device":        str(loader.device),
        "loadError":     loader.load_error,
    }


@router.get("/glossary", summary="List all recognized EthSL glosses")
async def glossary():
    loader = get_loader()
    glosses = list(loader.gloss_dict.keys()) if loader.gloss_dict else []
    return {
        "count":  len(glosses),
        "glosses": sorted(glosses)
    }
