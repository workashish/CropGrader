# ── Stage 1: Node + Python combined image ────────────────────────────────────
FROM node:20-slim

# Install Python 3 + pip (needed for the ML micro-service)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install Python dependencies ──────────────────────────────────────────────
COPY ml_service/requirements.txt ml_service/requirements.txt
RUN python3 -m pip install --no-cache-dir --break-system-packages -r ml_service/requirements.txt

# ── Install Node dependencies ────────────────────────────────────────────────
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Copy application code ────────────────────────────────────────────────────
COPY . .

# ── Expose the port fly.io will route to ─────────────────────────────────────
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV ML_SERVICE_URL=http://localhost:5001

# ── Start the Node server (which auto-starts the Python ML service) ──────────
CMD ["node", "app.js"]
