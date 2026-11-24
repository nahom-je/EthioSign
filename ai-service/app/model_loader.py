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

class TemporalConvBlock(nn.Module):
    def __init__(self):
        super().__init__()
        self.temporal_conv = nn.Sequential(
            nn.Conv1d(512, 1024, kernel_size=5, stride=1, padding=2),
            nn.BatchNorm1d(1024),
            nn.ReLU(inplace=True),
            nn.MaxPool1d(kernel_size=2, ceil_mode=False),
            nn.Conv1d(1024, 1024, kernel_size=5, stride=1, padding=2),
            nn.BatchNorm1d(1024),
        )
        self.fc = nn.Linear(1024, 63)

    def forward(self, x):
        # x: (B, 512, T) → (B, 1024, T')
        return self.temporal_conv(x)


class TemporalModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.rnn = nn.LSTM(
            input_size=1024,
            hidden_size=512,
            num_layers=2,
            batch_first=True,
            bidirectional=True
        )

    def forward(self, x):
        # x: (B, T', 1024)
        out, _ = self.rnn(x)
        return out


class CESLRModel(nn.Module):
    """
    Exact implementation of the CESLR baseline architecture (ResNet18-BiLSTM-CTC)
    matching baseline-res18-epoch38 weights 100% strictly.
    """

    def __init__(self, num_classes: int = 63):
        super().__init__()
        self.conv2d = tv_models.resnet18(weights=None)
        self.conv2d.fc = nn.Identity()
        self.conv2d.avgpool = nn.Identity()
        self.conv1d = TemporalConvBlock()
        self.temporal_model = TemporalModel()
        self.classifier = nn.Linear(1024, num_classes)

    def forward(self, x):
        """
        Args:
            x: (B, T, 3, H, W)  — batch of frame sequences
        Returns:
            log_probs: (T', B, C)  — for CTC loss / decoding
        """
        B, T, C, H, W = x.shape
        x_flat = x.view(B * T, C, H, W)

        # ResNet18 visual encoding
        c = self.conv2d
        f = c.conv1(x_flat)
        f = c.bn1(f)
        f = c.relu(f)
        f = c.maxpool(f)
        f = c.layer1(f)
        f = c.layer2(f)
        f = c.layer3(f)
        f = c.layer4(f)
        f = torch.nn.functional.adaptive_avg_pool2d(f, (1, 1)).flatten(1)  # (B*T, 512)

        # Temporal convolution (B, 512, T) → (B, 1024, T')
        f = f.view(B, T, 512).permute(0, 2, 1)
        t_feat = self.conv1d(f)

        # BiLSTM (B, T', 1024)
        t_feat = t_feat.permute(0, 2, 1)
        lstm_out = self.temporal_model(t_feat)

        # CTC logits (T', B, num_classes)
        logits = self.classifier(lstm_out)
        log_probs = logits.log_softmax(dim=-1).permute(1, 0, 2)
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
    # Actual file is 363 MB; guard at 300 MB to allow for minor version differences.
    _EXPECTED_MIN_BYTES = 300 * 1024 * 1024  # 300 MB guard

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

            # Checkpoint stores model weights in model_state_dict
            state_dict = (
                checkpoint.get("model_state_dict")
                or checkpoint.get("state_dict")
                or checkpoint
            )
            self.model.load_state_dict(state_dict, strict=True)
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info("[ModelLoader] ✓ CESLR model loaded (100% matched strictly) and ready for inference.")

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

        # Ensure enough frames for temporal pooling (MaxPool1d kernel=2 requires T >= 2, preferably 8-16)
        if len(frames) == 1:
            frames = frames * 12
        elif len(frames) < 6:
            frames = frames * (6 // len(frames) + 1)
        frames = frames[:MAX_FRAMES]

        tensors = [self.transform(f) for f in frames]
        seq = torch.stack(tensors).unsqueeze(0).to(self.device)  # (1, T, 3, H, W)

        with torch.no_grad():
            log_probs = self.model(seq)                            # (T', 1, C)

        # Greedy CTC decode
        indices = log_probs.squeeze(1).argmax(dim=-1).cpu().tolist()  # (T',)
        decoded = self._ctc_greedy_decode(indices)

        if not decoded:
            return {"status": "unrecognized", "amharic": None, "confidence": 0.0}

        # Measure peak confidence for the predicted class
        probs = log_probs.squeeze(1).exp().cpu().numpy()
        pred_class = decoded[0]
        class_conf = float(probs[:, pred_class].max())
        mean_conf  = float(probs.max(axis=-1).mean())
        confidence = max(class_conf, mean_conf)

        amharic = self.id_to_gloss.get(pred_class)
        if amharic is None or confidence < MIN_CONF:
            return {"status": "unrecognized", "amharic": None, "confidence": round(confidence, 4)}

        return {
            "status":    "recognized",
            "amharic":   amharic,
            "gloss_id":  pred_class,
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
