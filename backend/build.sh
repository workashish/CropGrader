#!/usr/bin/env bash
# build.sh — Render build script for the combined Node.js + Python backend
set -euo pipefail

echo "==> Installing Node.js dependencies …"
npm install

echo "==> Installing Python dependencies …"
pip install -r ml_service/requirements.txt

echo "==> Build complete."
