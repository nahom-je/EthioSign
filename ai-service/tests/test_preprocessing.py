"""
tests/test_preprocessing.py

Unit tests for frame decoding and landmark normalisation utilities.
Run with:  python -m pytest tests/ -v
"""

import base64
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.preprocessing import (
    decode_base64_frame,
    resize_and_crop,
    normalise_landmark_sequence,
    build_clip_from_frames,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_jpeg_b64(h=480, w=640, with_header=True) -> str:
    """Create a tiny solid-colour JPEG encoded as base-64."""
    import cv2
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:] = (120, 80, 200)
    _, buf = cv2.imencode(".jpg", img)
    b64 = base64.b64encode(buf.tobytes()).decode()
    if with_header:
        return f"data:image/jpeg;base64,{b64}"
    return b64


# ── Tests: decode_base64_frame ────────────────────────────────────────────────

def test_decode_with_header():
    b64 = _make_jpeg_b64(with_header=True)
    frame = decode_base64_frame(b64)
    assert frame is not None
    assert frame.shape == (480, 640, 3)
    assert frame.dtype == np.uint8


def test_decode_without_header():
    b64 = _make_jpeg_b64(with_header=False)
    frame = decode_base64_frame(b64)
    assert frame is not None


def test_decode_invalid_string():
    frame = decode_base64_frame("not-a-valid-base64!!!")
    assert frame is None


def test_decode_empty_string():
    frame = decode_base64_frame("")
    assert frame is None


# ── Tests: resize_and_crop ────────────────────────────────────────────────────

def test_resize_and_crop_shape():
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    result = resize_and_crop(frame, size=256, crop=224)
    assert result.shape == (224, 224, 3)


def test_resize_square_input():
    frame = np.zeros((300, 300, 3), dtype=np.uint8)
    result = resize_and_crop(frame, size=256, crop=224)
    assert result.shape == (224, 224, 3)


# ── Tests: normalise_landmark_sequence ───────────────────────────────────────

def _make_sequence(T=30, dim=258):
    return (np.random.rand(T, dim) * 0.8 + 0.1).tolist()


def test_normalise_shape():
    seq = _make_sequence()
    result = normalise_landmark_sequence(seq)
    assert result.shape == (30, 258)


def test_normalise_wrist_at_origin():
    seq = _make_sequence()
    result = normalise_landmark_sequence(seq)
    # Left wrist x offset should be ~0 for each frame
    assert np.allclose(result[:, 0], 0.0, atol=1e-5)


def test_normalise_bad_shape():
    # Should warn and return unchanged
    bad = [[0.1, 0.2, 0.3]] * 10  # Only 3 dims, not 258
    result = normalise_landmark_sequence(bad)
    assert result.shape[1] == 3  # Returned as-is


# ── Tests: build_clip_from_frames ─────────────────────────────────────────────

def test_build_clip_valid():
    frames = [_make_jpeg_b64() for _ in range(5)]
    clip = build_clip_from_frames(frames)
    assert len(clip) == 5
    assert clip[0].shape == (224, 224, 3)


def test_build_clip_mixed_valid_invalid():
    frames = [_make_jpeg_b64(), "INVALID", _make_jpeg_b64()]
    clip = build_clip_from_frames(frames)
    assert len(clip) == 2  # 1 invalid silently skipped


def test_build_clip_empty():
    clip = build_clip_from_frames([])
    assert clip == []
