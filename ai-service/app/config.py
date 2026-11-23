"""
app/config.py

Centralised configuration for the EthioSign AI Inference Service.
All values are read from environment variables with sane defaults.
"""

import os
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR        = Path(__file__).resolve().parent.parent
MODELS_DIR      = BASE_DIR / "models"
WEIGHTS_DIR     = MODELS_DIR / "weights"
DICT_PATH       = BASE_DIR / "models" / "gloss_dict.npy"

# ── Checkpoint ───────────────────────────────────────────────────────────────
# Download from:
# https://github.com/ethio-artifical/CESLR/releases/download/baseline-res18-epoch38/dev_02.58_epoch38_model.pt
MODEL_CHECKPOINT = os.environ.get(
    "ETHIOSIGN_MODEL_PATH",
    str(WEIGHTS_DIR / "dev_02.58_epoch38_model.pt")
)

# ── Inference settings ────────────────────────────────────────────────────────
DEVICE          = os.environ.get("ETHIOSIGN_DEVICE", "auto")   # auto | cpu | cuda | mps
IMAGE_SIZE      = int(os.environ.get("ETHIOSIGN_IMG_SIZE", "256"))
CROP_SIZE       = int(os.environ.get("ETHIOSIGN_CROP_SIZE", "224"))
MAX_FRAMES      = int(os.environ.get("ETHIOSIGN_MAX_FRAMES", "120"))
MIN_CONF        = float(os.environ.get("ETHIOSIGN_MIN_CONF", "0.65"))

# ── Service ───────────────────────────────────────────────────────────────────
HOST            = os.environ.get("ETHIOSIGN_HOST", "0.0.0.0")
PORT            = int(os.environ.get("ETHIOSIGN_PORT", "8000"))
CORS_ORIGINS    = os.environ.get("ETHIOSIGN_CORS_ORIGINS", "*").split(",")
