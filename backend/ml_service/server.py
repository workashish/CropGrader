"""
server.py
─────────
FastAPI microservice that accepts a crop image and returns quality-dimension
scores from 5 classical ML algorithms (SVM, KNN, Random Forest, Decision Tree,
Naïve Bayes).

Start:  uvicorn server:app --host 0.0.0.0 --port 5000 --reload
"""

from __future__ import annotations
import time
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from feature_extraction import extract_features, FEATURE_NAMES
from ml_models import load_models, predict_all, SCORE_KEYS
from bootstrap import generate_and_train


# ── Lifespan: load (or bootstrap) models on startup ────────────────────────────

_models: dict[str, object] | None = None


@asynccontextmanager
async def lifespan(application: FastAPI):
    global _models
    _models = load_models()
    if _models is None:
        print("[ml_service] No trained models found — running bootstrap …")
        _models = generate_and_train()
    else:
        print(f"[ml_service] Loaded {len(_models)} trained models from disk.")
    yield
    _models = None


app = FastAPI(
    title="AgriGrade ML Comparison Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "modelsLoaded": _models is not None,
        "algorithms": list(_models.keys()) if _models else [],
    }


# ── Prediction endpoint ────────────────────────────────────────────────────────

@app.post("/api/ml-compare")
async def ml_compare(image: UploadFile = File(...)):
    """
    Accept a crop image and return quality scores from all 5 ML algorithms.

    Response shape:
    {
      "success": true,
      "data": {
        "models": {
          "SVM": { "colorQuality": 82.3, "sizeShape": 78.1, … },
          "KNN": { … },
          …
        },
        "featuresExtracted": 18,
        "featureValues": { "h_mean": 0.42, … },
        "inferenceTimeMs": 45
      }
    }
    """
    if _models is None:
        return JSONResponse(
            status_code=503,
            content={"error": "Models not loaded. Service is starting up."},
        )

    try:
        image_bytes = await image.read()
        start = time.perf_counter()

        # 1. Extract features via OpenCV
        features = extract_features(image_bytes)

        # 2. Run all 5 models
        results = predict_all(_models, features)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

        # Build feature name→value map for transparency
        feature_values = {
            name: round(float(features[i]), 4)
            for i, name in enumerate(FEATURE_NAMES)
        }

        return {
            "success": True,
            "data": {
                "models": results,
                "featuresExtracted": len(FEATURE_NAMES),
                "featureValues": feature_values,
                "inferenceTimeMs": elapsed_ms,
            },
        }

    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"ML inference failed: {str(exc)}"},
        )


# ── Retrain endpoint (for future use with real labelled data) ──────────────────

@app.post("/api/retrain")
async def retrain():
    """Re-bootstrap models. In future, accept labelled data for fine-tuning."""
    global _models
    _models = generate_and_train()
    return {"success": True, "message": "Models retrained from bootstrap data."}
