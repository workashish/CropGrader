# CropWise — AI-Powered Crop Quality Grading

## About

CropWise is an AI-based real-time crop image analytics platform built for PMFBY/CROPIC (Problem Statement ID: 25262). It uses Google Gemini Vision for multi-parameter quality grading, pest detection, batch processing, and market price estimation across 10 Indian languages.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend:** Node.js + Express + Google Gemini AI
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **ML Service:** Python + FastAPI + OpenCV + scikit-learn

## Getting Started

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Start backend (separate terminal)
cd ../backend && node app.js

# Start ML service (separate terminal)
cd ../backend/ml_service && python3 -m uvicorn server:app --port 5001
```

## Features

- Single & batch crop grading (A/B/C/D) with 6-parameter scoring
- Pest & disease detection with treatment recommendations
- ML model comparison (SVM, KNN, Random Forest, Decision Tree, Naïve Bayes)
- Market price estimation with certification premiums
- Accuracy dashboard with confusion matrix
- 10 Indian language support
