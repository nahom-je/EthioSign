"""
app/preprocessing.py

Pre-processing utilities for the EthioSign AI Inference Service.

Responsibilities:
  1. Decode base-64 JPEG frame strings sent by the React frontend.
  2. Resize and centre-crop to the model's expected (224, 224) input.
  3. Normalise landmark coordinate sequences (optional — used when the
     frontend sends MediaPipe landmark vectors instead of raw frames).
  4. Build multi-frame clip tensors from a sequence of frames.
"""

import base64
import logging
from typing import Optional

import cv2
import numpy as np

from app.config import IMAGE_SIZE, CROP_SIZE

logger = logging.getLogger(__name__)


# ── Frame decoding ────────────────────────────────────────────────────────────

def decode_base64_frame(b64_string: str) -> Optional[np.ndarray]:
    """
    Decode a base-64 encoded JPEG / PNG frame to a (H, W, 3) uint8 RGB array.

    Accepts strings with or without the data-URI prefix:
      'data:image/jpeg;base64,...'  or plain base-64 bytes.

    Returns:
        np.ndarray  : RGB frame  (H, W, 3)
        None        : on decoding failure
    """
    if not b64_string:
        return None

    try:
        # Strip optional data-URI header
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]

        raw = base64.b64decode(b64_string)
        buf = np.frombuffer(raw, dtype=np.uint8)
        frame_bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)

        if frame_bgr is None:
            logger.warning("[Preprocessing] cv2.imdecode returned None — invalid image bytes.")
            return None

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        return frame_rgb

    except Exception as exc:
        logger.error(f"[Preprocessing] Frame decode error: {exc}")
        return None


# ── Geometric transforms ──────────────────────────────────────────────────────

def resize_and_crop(frame: np.ndarray, size: int = IMAGE_SIZE, crop: int = CROP_SIZE) -> np.ndarray:
    """
    Resize the shorter side to `size`, then centre-crop to (crop × crop).
    Matches the CESLR training augmentation pipeline exactly.
    """
    h, w = frame.shape[:2]

    # Resize shorter side
    scale = size / min(h, w)
    new_w = int(round(w * scale))
    new_h = int(round(h * scale))
    resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # Centre crop
    top  = (new_h - crop) // 2
    left = (new_w - crop) // 2
    cropped = resized[top:top + crop, left:left + crop]

    return cropped


# ── Landmark sequence normalisation ──────────────────────────────────────────

def normalise_landmark_sequence(sequence: list[list[float]]) -> np.ndarray:
    """
    Normalise a sequence of flat landmark vectors so that the wrist (index 0
    of left-hand block) is at the origin, reducing signer-position variance.

    Args:
        sequence: List of T flat vectors, each of length 258
                  [leftHand(63) | rightHand(63) | pose(132)]

    Returns:
        np.ndarray of shape (T, 258), float32, normalised.
    """
    arr = np.array(sequence, dtype=np.float32)  # (T, 258)

    if arr.ndim != 2 or arr.shape[1] != 258:
        logger.warning("[Preprocessing] Landmark sequence has unexpected shape; skipping normalisation.")
        return arr

    # Use left wrist (index 0) x,y as anchor for translation invariance
    anchor_x = arr[:, 0:1]   # (T, 1)
    anchor_y = arr[:, 1:2]

    normalised = arr.copy()
    # Shift all x coords (every 3rd starting at 0, within hands and pose)
    normalised[:, 0::3] -= anchor_x
    normalised[:, 1::3] -= anchor_y

    return normalised


# ── Clip assembly ─────────────────────────────────────────────────────────────

def build_clip_from_frames(frames_b64: list[str]) -> list[np.ndarray]:
    """
    Decode a list of base-64 frames and return a list of RGB numpy arrays.
    Invalid frames are silently skipped.
    """
    decoded = []
    for b64 in frames_b64:
        frame = decode_base64_frame(b64)
        if frame is not None:
            decoded.append(resize_and_crop(frame))
    return decoded
