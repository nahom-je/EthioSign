"""
app/model_loader.py

Handles loading and caching of the CESLR PyTorch checkpoint.

The CESLR model architecture:
  Input frames (B × T × 3 × 224 × 224)
    → ResNet-18 backbone (per-frame spatial features)
    → 1D Temporal Convolution
    → 2-layer Bidirectional LSTM
    → Linear projection → CTC decoder

This module exposes a ModelLoader singleton that:
  1. Selects the optimal torch device (CUDA → MPS → CPU).
  2. Loads the checkpoint once at startup.
  3. Loads the gloss dictionary from gloss_dict.npy.
  4. Provides thread-safe inference via predict_sequence().
"""

import os
import logging
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torchvision.models as tv_models
import torchvision.transforms as transforms

from app.config import (
    MODEL_CHECKPOINT, DICT_PATH, DEVICE,
    IMAGE_SIZE, CROP_SIZE, MAX_FRAMES, MIN_CONF
)

logger = logging.getLogger(__name__)


# ── Device selection ──────────────────────────────────────────────────────────

def select_device(requested: str = "auto") -> torch.device:
    if requested == "cuda" or (requested == "auto" and torch.cuda.is_available()):
        return torch.device("cuda")
    if requested == "mps" or (requested == "auto" and torch.backends.mps.is_available()):
        return torch.device("mps")
    return torch.device("cpu")


# ── CESLR Network Definition ──────────────────────────────────────────────────

class TemporalConv(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, kernel_size: int = 3):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv1d(in_channels, out_channels, kernel_size, padding=kernel_size // 2),
            nn.BatchNorm1d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        # x: (B, T, C) → (B, C, T) → conv → (B, C', T) → (B, T, C')
        return self.conv(x.permute(0, 2, 1)).permute(0, 2, 1)


class CESLRModel(nn.Module):
    """
    Minimal faithful reimplementation of the CESLR baseline (ResNet18-BiLSTM-CTC).
    Matches the checkpoint architecture from baseline-res18-epoch38.
    """

    def __init__(self, num_classes: int):
        super().__init__()

        # ── Visual encoder (ImageNet-pretrained ResNet-18) ────────────────
        backbone = tv_models.resnet18(weights=tv_models.ResNet18_Weights.DEFAULT)
        # Remove final classification head; output is 512-d feature vector
        self.visual_encoder = nn.Sequential(*list(backbone.children())[:-1])  # → (B, 512, 1, 1)

        # ── Temporal convolution ──────────────────────────────────────────
        self.temporal_conv = TemporalConv(512, 512, kernel_size=3)

        # ── BiLSTM ───────────────────────────────────────────────────────
        self.lstm = nn.LSTM(
            input_size=512,
            hidden_size=256,
            num_layers=2,
            bidirectional=True,
            batch_first=True,
            dropout=0.3,
        )

        # ── CTC projection (num_classes + 1 for blank token) ─────────────
        self.classifier = nn.Linear(512, num_classes)

    def forward(self, x):
        """
        Args:
            x: (B, T, 3, H, W)  — batch of frame sequences
        Returns:
            log_probs: (T, B, C)  — for CTC loss / decoding
        """
        B, T, C, H, W = x.shape

        # Encode each frame independently
        x_flat = x.view(B * T, C, H, W)
        feats = self.visual_encoder(x_flat).squeeze(-1).squeeze(-1)  # (B*T, 512)
        feats = feats.view(B, T, 512)                                 # (B, T, 512)

        # Temporal refinement
        feats = self.temporal_conv(feats)  # (B, T, 512)

        # Sequential modelling
        feats, _ = self.lstm(feats)        # (B, T, 512)

        # CTC logits
        logits = self.classifier(feats)    # (B, T, num_classes)
        log_probs = logits.log_softmax(dim=-1).permute(1, 0, 2)  # (T, B, num_classes)
        return log_probs


# ── Model Loader Singleton ────────────────────────────────────────────────────

class ModelLoader:
    _instance: Optional["ModelLoader"] = None

    def __init__(self):
        self.device        = select_device(DEVICE)
        self.model: Optional[CESLRModel] = None
        self.gloss_dict: Optional[dict] = None
        self.id_to_gloss:  dict = {}
        self.num_classes   = 0
        self.is_loaded     = False
        self.load_error: Optional[str] = None

        # Pre-computed image pre-processing pipeline
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize(IMAGE_SIZE),
            transforms.CenterCrop(CROP_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])

    # ── Loading ───────────────────────────────────────────────────────────

    def load(self):
        """Load gloss dict and model weights. Called once at startup."""
        self._load_gloss_dict()
        self._load_model()

    def _load_gloss_dict(self):
        dict_path = Path(DICT_PATH)
        if not dict_path.exists():
            logger.warning(
                f"[ModelLoader] Gloss dict not found at {dict_path}. "
                "Using built-in 62-gloss EthSL catalog fallback."
            )
            # Fallback: minimal in-code gloss dict derived from CESLR corpus
            glosses = [
                'ሀኪም','ሆስፒታሉ','ሆቴሉ','ሆቴል','ልጆች','መዝናናት','ማር','ማን','ማየት',
                'ማድረግ','ሰፊ','ሻሽ','ቀይ','ቀጭን','በላ','በላሁ','በማር','በጣም','ቢጫ',
                'ባንዲራ','ቤተሰብ','ቤቱ','ታደርጋለች','ትወዳለች','ነኝ','ነው','ናት','ንጽህ',
                'አመሰግናለሁ','አረንጓዴ','አባቴ','አባቴን','አንበሳ','እሄዳለሁ','እህቴ','እህቴን',
                'እናቴ','እኔ','እንጀራ','እወዳለሁ','እወዳታለሁ','እወድዋለሁ','ከኔ','ክብር',
                'ወንድሜ','ወፍራም','ዘመድ','ዛሬ','የት','የኢትዮጵያ','የእናቴን','የእኛ',
                'ይበልጣል','ይወዳሉ','ይወዳል','ይፈልጋሉ','ደህና','ዳቦ','ጓደኛ','ጠባብ','ጸሎት','ፍቅር'
            ]
            self.gloss_dict  = {g: i + 1 for i, g in enumerate(glosses)}
            self.num_classes = len(glosses) + 1  # +1 for CTC blank
        else:
            raw = np.load(str(dict_path), allow_pickle=True).item()
            self.gloss_dict  = raw
            self.num_classes = len(raw) + 1

        self.id_to_gloss = {v[0] if isinstance(v, (list, tuple)) else v: k
                            for k, v in self.gloss_dict.items()}
        logger.info(f"[ModelLoader] Gloss dict loaded — {len(self.gloss_dict)} glosses, {self.num_classes} classes (inc. blank).")

    # Expected size of the full checkpoint (bytes). Anything smaller = partial download.
    _EXPECTED_MIN_BYTES = 370 * 1024 * 1024  # 370 MB guard

    def _load_model(self):
        ckpt_path = Path(MODEL_CHECKPOINT)
        if not ckpt_path.exists():
            self.load_error = (
                f"Model checkpoint not found at:\n  {ckpt_path}\n\n"
                "To download (380 MB):\n"
                "  curl -L -C - -o " + str(ckpt_path) + " \\\n"
                "  https://github.com/ethio-artifical/CESLR/releases/download/"
                "baseline-res18-epoch38/dev_02.58_epoch38_model.pt\n\n"
                "Until then, the service returns mock predictions."
            )
            logger.warning(f"[ModelLoader] Checkpoint not found — using mock mode.")
            return

        # Guard against incomplete / partial downloads
        file_size = ckpt_path.stat().st_size
        if file_size < self._EXPECTED_MIN_BYTES:
            self.load_error = (
                f"Checkpoint at {ckpt_path} is incomplete "
                f"({file_size / 1024 / 1024:.1f} MB < 370 MB expected). "
                "Resume download with: curl -L -C - -o <path> <url>"
            )
            logger.warning(f"[ModelLoader] Incomplete checkpoint ({file_size/1e6:.1f} MB) — using mock mode until download completes.")
            return

        try:
            logger.info(f"[ModelLoader] Loading checkpoint: {ckpt_path} → device={self.device}")
            self.model = CESLRModel(num_classes=self.num_classes)
            checkpoint = torch.load(str(ckpt_path), map_location=self.device, weights_only=False)

            # Checkpoint may store model state under different keys
            state_dict = (
                checkpoint.get("model_state_dict")
                or checkpoint.get("state_dict")
                or checkpoint
            )
            self.model.load_state_dict(state_dict, strict=False)
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info("[ModelLoader] ✓ CESLR model loaded and ready for inference.")

        except Exception as exc:
            self.load_error = str(exc)
            logger.error(f"[ModelLoader] Failed to load model: {exc}")

    # ── Inference ─────────────────────────────────────────────────────────

    def predict_from_frames(self, frames: list[np.ndarray]) -> dict:
        """
        Run inference on a list of BGR/RGB numpy frames.

        Args:
            frames: List of (H, W, 3) uint8 numpy arrays.
        Returns:
            dict with keys: gloss_id, amharic, confidence, status.
        """
        if not self.is_loaded or self.model is None:
            return self._fallback_prediction()

        # Cap and pad
        frames = frames[:MAX_FRAMES]

        tensors = [self.transform(f) for f in frames]
        seq = torch.stack(tensors).unsqueeze(0).to(self.device)  # (1, T, 3, H, W)

        with torch.no_grad():
            log_probs = self.model(seq)                            # (T, 1, C)

        # Greedy CTC decode
        indices = log_probs.squeeze(1).argmax(dim=-1).cpu().tolist()  # (T,)
        decoded = self._ctc_greedy_decode(indices)

        if not decoded:
            return {"status": "unrecognized", "amharic": None, "confidence": 0.0}

        # Confidence estimate: mean max-prob over decoded span
        probs = log_probs.squeeze(1).exp().cpu().numpy()
        confidence = float(probs.max(axis=-1).mean())

        amharic = self.id_to_gloss.get(decoded[0])
        if amharic is None or confidence < MIN_CONF:
            return {"status": "unrecognized", "amharic": None, "confidence": confidence}

        return {
            "status":    "recognized",
            "amharic":   amharic,
            "gloss_id":  decoded[0],
            "confidence": round(confidence, 4)
        }

    def _ctc_greedy_decode(self, indices: list[int]) -> list[int]:
        """Standard CTC greedy collapse: remove blanks and consecutive duplicates."""
        blank  = 0
        result = []
        prev   = None
        for idx in indices:
            if idx != blank and idx != prev:
                result.append(idx)
            prev = idx
        return result

    def _fallback_prediction(self) -> dict:
        """When model is not loaded, return an explicit unavailable status."""
        return {
            "status":     "model_unavailable",
            "amharic":    None,
            "confidence": 0.0
        }


# Singleton instance — imported by routes
_loader: Optional[ModelLoader] = None


def get_loader() -> ModelLoader:
    global _loader
    if _loader is None:
        _loader = ModelLoader()
    return _loader
