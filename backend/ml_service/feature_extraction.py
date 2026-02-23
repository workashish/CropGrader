"""
feature_extraction.py
─────────────────────
Extracts 18 numerical features from a crop image using OpenCV.
These features feed into the classical ML models (SVM, KNN, RF, DT, NB).

Feature groups:
  • Color (6):  H/S/V channel mean & std in HSV space
  • Texture (5): Laplacian variance, gradient stats, local roughness, edge density
  • Shape (4):  Aspect ratio, extent, solidity, circularity from largest contour
  • Defect (3): Dark-spot ratio, bright-spot ratio, color variance
"""

import cv2
import numpy as np

IMG_SIZE = 256
FEATURE_NAMES = [
    # Color (6)
    "h_mean", "h_std", "s_mean", "s_std", "v_mean", "v_std",
    # Texture (5)
    "laplacian_var", "gradient_mean", "gradient_std", "texture_roughness", "edge_density",
    # Shape (4)
    "aspect_ratio", "extent", "solidity", "circularity",
    # Defect (3)
    "dark_ratio", "bright_ratio", "color_variance",
]

NUM_FEATURES = len(FEATURE_NAMES)


def decode_image(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes to a BGR OpenCV image, resized to standard dimensions."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return cv2.resize(img, (IMG_SIZE, IMG_SIZE))


def _color_features(hsv: np.ndarray) -> list[float]:
    h, s, v = cv2.split(hsv)
    return [
        float(np.mean(h)) / 180.0,
        float(np.std(h)) / 180.0,
        float(np.mean(s)) / 255.0,
        float(np.std(s)) / 255.0,
        float(np.mean(v)) / 255.0,
        float(np.std(v)) / 255.0,
    ]


def _texture_features(gray: np.ndarray) -> list[float]:
    # Laplacian variance → focus / blur indicator
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var()) / 10000.0

    # Sobel gradient magnitude
    sx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    mag = np.sqrt(sx ** 2 + sy ** 2)
    grad_mean = float(np.mean(mag)) / 255.0
    grad_std = float(np.std(mag)) / 255.0

    # Local standard deviation (texture roughness)
    gray_f = gray.astype(np.float64)
    mean_sq = cv2.blur(gray_f ** 2, (7, 7))
    sq_mean = cv2.blur(gray_f, (7, 7)) ** 2
    local_std = np.sqrt(np.abs(mean_sq - sq_mean))
    roughness = float(np.mean(local_std)) / 255.0

    # Edge density via Canny
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.sum(edges > 0)) / (IMG_SIZE * IMG_SIZE)

    return [lap_var, grad_mean, grad_std, roughness, edge_density]


def _shape_features(gray: np.ndarray) -> list[float]:
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return [1.0, 0.5, 0.5, 0.5]

    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    perimeter = cv2.arcLength(largest, True)
    x, y, w, h = cv2.boundingRect(largest)
    hull_area = cv2.contourArea(cv2.convexHull(largest))

    aspect_ratio = float(w) / max(h, 1)
    extent = area / max(w * h, 1)
    solidity = area / max(hull_area, 1)
    circularity = (4 * np.pi * area) / max(perimeter ** 2, 1)

    return [
        min(aspect_ratio, 3.0) / 3.0,   # normalise to ~[0,1]
        float(np.clip(extent, 0, 1)),
        float(np.clip(solidity, 0, 1)),
        float(np.clip(circularity, 0, 1)),
    ]


def _defect_features(hsv: np.ndarray) -> list[float]:
    h, s, v = cv2.split(hsv)
    total = IMG_SIZE * IMG_SIZE
    dark_ratio = float(np.sum(v < 60)) / total
    bright_ratio = float(np.sum(v > 240)) / total
    color_variance = float(np.mean([np.std(h), np.std(s), np.std(v)])) / 255.0
    return [dark_ratio, bright_ratio, color_variance]


def extract_features(image_bytes: bytes) -> np.ndarray:
    """
    Extract an 18-dimensional feature vector from raw image bytes.
    Returns shape (18,) numpy array with values roughly in [0, 1].
    """
    img = decode_image(image_bytes)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    features = (
        _color_features(hsv)
        + _texture_features(gray)
        + _shape_features(gray)
        + _defect_features(hsv)
    )
    return np.array(features, dtype=np.float64)
