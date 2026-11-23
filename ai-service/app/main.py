"""
app/main.py  — FastAPI application entry point

EthioSign AI Inference Service
  POST /api/ai/predict   — Sign recognition (frames or landmarks)
  GET  /api/health       — Service & model status
  GET  /api/glossary     — All recognised EthSL glosses
  GET  /docs             — Swagger UI (auto-generated)
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.model_loader import get_loader
from app.routes.predict import router as predict_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  EthioSign AI Inference Service — Starting up")
    logger.info("=" * 60)

    loader = get_loader()
    loader.load()

    if loader.is_loaded:
        logger.info(f"  ✓ CESLR model ready   device={loader.device}  vocab={len(loader.gloss_dict)} glosses")
    else:
        logger.warning(f"  ⚠  Model not loaded — {loader.load_error or 'unknown reason'}")
        logger.warning("    Download checkpoint and restart to enable live inference.")

    yield  # ← app runs here

    logger.info("EthioSign AI Service — Shutting down cleanly.")


# ── Application factory ───────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="EthioSign AI Inference Service",
        description=(
            "Real-time Ethiopian Sign Language (EthSL) recognition API powered by "
            "the CESLR ResNet18-BiLSTM-CTC model trained on the continuous EthSL corpus."
        ),
        version="1.0.0",
        docs_url="/docs",
        lifespan=lifespan
    )

    # CORS — allow the React dev server and production frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(predict_router)

    return app


app = create_app()


# ── Dev entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT

    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
        reload_excludes=["models/weights/*"]   # don't watch the 380 MB .pt file
    )
