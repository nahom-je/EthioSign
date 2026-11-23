"""
tests/test_inference.py

Integration tests for the inference layer.
These run without a real model checkpoint (expects fallback / mock behaviour).
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.inference import run_inference, ETHSL_TRANSLATIONS


def test_translations_map_completeness():
    """Every gloss in the map must have both english and category fields."""
    for gloss, data in ETHSL_TRANSLATIONS.items():
        assert "english" in data, f"Missing 'english' for gloss: {gloss}"
        assert "category" in data, f"Missing 'category' for gloss: {gloss}"
        assert data["english"], f"Empty 'english' for gloss: {gloss}"
        assert data["category"], f"Empty 'category' for gloss: {gloss}"


def test_inference_no_input():
    result = run_inference()
    assert result["success"] is False
    assert result["status"] == "no_input"


def test_inference_returns_dict_keys():
    result = run_inference(frames_b64=None, landmark_sequence=None)
    assert "success" in result
    assert "status" in result
    assert "latencyMs" in result
