"""
bootstrap.py
────────────
Generates synthetic training data and trains all five classical ML models.

How it works
────────────
1. Randomly sample 2 000 feature vectors from realistic distributions that
   mirror what OpenCV would extract from agricultural produce images.
2. Apply deterministic scoring rules (domain heuristics) to each feature
   vector to produce 6 quality-dimension labels.
3. Add Gaussian noise to labels so models learn to generalise.
4. Train all five algorithms on this dataset.
5. Save trained models to disk.

This gives you a legitimate bootstrapped baseline.  As you collect real
ground-truth evaluations through the app, you can retrain the models on
real data for even more accurate comparisons.

Usage
─────
    python bootstrap.py            # train + save
    python bootstrap.py --verify   # train + save + print sample predictions
"""

from __future__ import annotations
import argparse
import numpy as np
from ml_models import SCORE_KEYS, train_all, save_models, predict_all

N_SAMPLES = 800
RANDOM_SEED = 42


def _sample_features(rng: np.random.Generator, n: int) -> np.ndarray:
    """
    Sample n synthetic 18-dim feature vectors from broad, overlapping
    distributions that simulate real-world agricultural image diversity.
    Features are roughly in [0, 1].
    """
    rows = np.zeros((n, 18))

    # Color features (indices 0-5) — wide spread to mimic real variety
    rows[:, 0] = rng.beta(2, 2, n)              # h_mean  (uniform-ish)
    rows[:, 1] = rng.beta(1.5, 3, n)            # h_std   (can be high)
    rows[:, 2] = rng.beta(2, 2.5, n)            # s_mean  (not always rich)
    rows[:, 3] = rng.beta(1.5, 3, n)            # s_std
    rows[:, 4] = rng.beta(2, 2.5, n)            # v_mean  (not always bright)
    rows[:, 5] = rng.beta(1.5, 3, n)            # v_std

    # Texture features (indices 6-10) — noisy, overlapping
    rows[:, 6] = rng.exponential(0.25, n)        # laplacian_var (wider)
    rows[:, 7] = rng.beta(2, 2, n)               # gradient_mean
    rows[:, 8] = rng.beta(2, 2.5, n)             # gradient_std
    rows[:, 9] = rng.beta(2, 3, n)               # roughness
    rows[:, 10] = rng.beta(2, 3, n)              # edge_density

    # Shape features (indices 11-14) — more variance
    rows[:, 11] = np.clip(rng.normal(0.4, 0.2, n), 0, 1)  # aspect_ratio
    rows[:, 12] = rng.beta(2, 2, n)              # extent
    rows[:, 13] = rng.beta(3, 2, n)              # solidity
    rows[:, 14] = rng.beta(2, 2, n)              # circularity

    # Defect features (indices 15-17) — higher incidence
    rows[:, 15] = rng.beta(2, 4, n)              # dark_ratio  (more defects)
    rows[:, 16] = rng.beta(2, 4, n)              # bright_ratio
    rows[:, 17] = rng.beta(2, 3, n)              # color_variance (higher)

    return np.clip(rows, 0, 1)


def _rule_based_scores(features: np.ndarray) -> np.ndarray:
    """
    Convert feature matrix (n, 18) → label matrix (n, 6) using
    domain heuristics.  Output values are on [0, 100].
    """
    h_mean    = features[:, 0]
    h_std     = features[:, 1]
    s_mean    = features[:, 2]
    s_std     = features[:, 3]
    v_mean    = features[:, 4]
    v_std     = features[:, 5]
    lap_var   = features[:, 6]
    grad_mean = features[:, 7]
    grad_std  = features[:, 8]
    roughness = features[:, 9]
    edge_dens = features[:, 10]
    aspect    = features[:, 11]
    extent    = features[:, 12]
    solidity  = features[:, 13]
    circular  = features[:, 14]
    dark_r    = features[:, 15]
    bright_r  = features[:, 16]
    col_var   = features[:, 17]

    # ── Color Quality: saturation + brightness (harder — needs both) ────
    color = (
        s_mean * 0.35
        + v_mean * 0.25
        + (1 - s_std) * 0.15
        + (1 - h_std) * 0.10
        + (1 - col_var) * 0.15
    ) * 100 + 15  # base offset: pure features underestimate quality

    # ── Size & Shape: geometric regularity (noisy in real images) ────────
    shape = (
        solidity * 0.25
        + circular * 0.25
        + extent * 0.20
        + (1 - np.abs(aspect - 0.5)) * 0.30
    ) * 100 + 12

    # ── Surface Quality: texture smoothness (hardest for classical ML) ───
    surface = (
        (1 - roughness) * 0.25
        + (1 - edge_dens) * 0.20
        + (1 - grad_std) * 0.20
        + np.clip(lap_var * 3, 0, 1) * 0.15
        + (1 - grad_mean) * 0.20
    ) * 100 + 10

    # ── Disease / Pest: defect detection (ambiguous from features) ───────
    disease = (
        (1 - dark_r) * 0.30
        + (1 - col_var) * 0.25
        + (1 - roughness) * 0.20
        + (1 - bright_r) * 0.15
        + solidity * 0.10
    ) * 100 + 8

    # ── Ripeness: colour-stage proxy (limited without semantic knowledge) ─
    ripeness = (
        s_mean * 0.30
        + (1 - h_std) * 0.20
        + v_mean * 0.20
        + (1 - s_std) * 0.15
        + h_mean * 0.15
    ) * 100 + 15

    # ── Overall Appeal: weighted composite ───────────────────────────────
    overall = (
        color * 0.25 + shape * 0.15 + surface * 0.20
        + disease * 0.20 + ripeness * 0.20
    )

    Y = np.column_stack([color, shape, surface, disease, ripeness, overall])
    return np.clip(Y, 0, 100)


def generate_and_train(seed: int = RANDOM_SEED, n_samples: int = N_SAMPLES):
    rng = np.random.default_rng(seed)

    print(f"[bootstrap] Generating {n_samples} synthetic training samples …")
    X = _sample_features(rng, n_samples)
    Y_clean = _rule_based_scores(X)

    # Heavy Gaussian noise (σ=12) — classical ML on hand-crafted features
    # has significant error; this prevents memorisation and reflects
    # the genuine difficulty of the task without semantic understanding.
    noise = rng.normal(0, 12, Y_clean.shape)
    Y = np.clip(Y_clean + noise, 0, 100)

    print("[bootstrap] Training 5 ML models …")
    models = train_all(X, Y)

    print("[bootstrap] Saving trained models to disk …")
    save_models(models)

    print("[bootstrap] ✅ Done. Models saved to trained_models/")
    return models


def _verify(models):
    """Print sample predictions for a synthetic feature vector."""
    rng = np.random.default_rng(99)
    sample = _sample_features(rng, 1)[0]
    results = predict_all(models, sample)

    print("\n── Sample prediction ──")
    for algo, scores in results.items():
        line = "  ".join(f"{k}={v:5.1f}" for k, v in scores.items())
        print(f"  {algo:16s} │ {line}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap ML model training")
    parser.add_argument("--verify", action="store_true", help="Print sample predictions after training")
    args = parser.parse_args()

    trained = generate_and_train()
    if args.verify:
        _verify(trained)
