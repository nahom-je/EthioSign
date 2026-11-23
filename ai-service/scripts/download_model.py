"""
scripts/download_model.py

Utility script to download the CESLR pretrained checkpoint.

Usage:
    python scripts/download_model.py

The checkpoint (380 MB) is downloaded from the official GitHub Release:
  https://github.com/ethio-artifical/CESLR/releases/tag/baseline-res18-epoch38

It is saved to:
  ai-service/models/weights/dev_02.58_epoch38_model.pt

The gloss dictionary (from the CESLR preprocess/ folder) is also
downloaded and saved to:
  ai-service/models/gloss_dict.npy
"""

import os
import sys
import hashlib
import urllib.request
from pathlib import Path

WEIGHTS_DIR  = Path(__file__).parent.parent / "models" / "weights"
MODEL_URL    = (
    "https://github.com/ethio-artifical/CESLR/releases/download/"
    "baseline-res18-epoch38/dev_02.58_epoch38_model.pt"
)
MODEL_FILE   = WEIGHTS_DIR / "dev_02.58_epoch38_model.pt"
MODEL_SHA256 = "5dde4fcf3448a8475d8b34ea6cf07c3a6a1519d27e6e755bac0574167b0f5631"

GLOSS_URL    = (
    "https://raw.githubusercontent.com/ethio-artifical/CESLR/main/"
    "preprocess/CESLR/gloss_dict.npy"
)
GLOSS_FILE   = Path(__file__).parent.parent / "models" / "gloss_dict.npy"


def download_with_progress(url: str, dest: Path, label: str):
    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.exists():
        print(f"  ✓  {label} already exists at {dest}")
        return

    print(f"  ↓  Downloading {label} ...")
    print(f"     Source : {url}")
    print(f"     Dest   : {dest}")

    def reporthook(count, block_size, total_size):
        if total_size > 0:
            pct = min(100, count * block_size * 100 // total_size)
            bar = "█" * (pct // 4) + "░" * (25 - pct // 4)
            sys.stdout.write(f"\r  [{bar}] {pct:3d}%  ({count * block_size // 1_048_576} MB)")
            sys.stdout.flush()

    urllib.request.urlretrieve(url, str(dest), reporthook)
    print()   # newline after progress bar


def verify_sha256(path: Path, expected: str):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    actual = h.hexdigest()
    if actual.lower() != expected.lower():
        raise ValueError(
            f"SHA-256 mismatch for {path.name}!\n"
            f"  Expected: {expected}\n"
            f"  Actual:   {actual}\n"
            "The file may be corrupted — please delete and re-download."
        )
    print(f"  ✓  SHA-256 verified: {actual[:16]}…")


def main():
    print("\n" + "=" * 60)
    print("  EthioSign — CESLR Model Download Utility")
    print("=" * 60)

    # 1. Gloss dictionary (small, ~2 KB)
    download_with_progress(GLOSS_URL, GLOSS_FILE, "gloss_dict.npy")

    # 2. Pretrained checkpoint (~380 MB)
    download_with_progress(MODEL_URL, MODEL_FILE, "CESLR checkpoint (380 MB)")

    # 3. SHA-256 integrity check
    print("\n  Verifying file integrity…")
    verify_sha256(MODEL_FILE, MODEL_SHA256)

    print("\n  ✓  All files ready.")
    print(f"  Model path : {MODEL_FILE}")
    print(f"  Gloss dict : {GLOSS_FILE}")
    print("\n  Start the inference service with:")
    print("    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n")


if __name__ == "__main__":
    main()
