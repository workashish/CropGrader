# CropWise — AI-Based Real-Time Crop Image Analytics for PMFBY/CROPIC

> **Problem Statement ID:** 25262 | **Category:** Software | **Theme:** Agriculture, FoodTech & Rural Development  
> **Organization:** Ministry of Agriculture & Farmers Welfare (MoA&FW)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Literature Review](#3-literature-review)
4. [Objectives & Project Utility](#4-objectives--project-utility)
5. [System Architecture](#5-system-architecture)
6. [Application Pages & Routes](#6-application-pages--routes)
7. [Key Features](#7-key-features)
8. [Business Logic Reference](#8-business-logic-reference)
9. [Technology Stack](#9-technology-stack)
10. [Database Schema & Migrations](#10-database-schema--migrations)
11. [API Reference](#11-api-reference)
12. [Security](#12-security)
13. [Installation & Setup](#13-installation--setup)
14. [Deployment](#14-deployment)
15. [Strengths & Limitations](#15-strengths--limitations)
16. [Future Roadmap](#16-future-roadmap)
17. [Conclusion](#17-conclusion)

---

## 1. Project Overview

**CropWise** is an AI-powered agricultural intelligence platform built to address the real-time crop monitoring and insurance claim settlement needs of the **Pradhan Mantri Fasal Bima Yojana (PMFBY)** initiative under the **CROPIC** (Collection of Real-Time Observations & Photo of Crops) programme.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| 🔬 **AI/ML Visual Analysis** | Google Gemini Vision (zero-shot multimodal LLM) for crop quality grading |
| 📱 **Mobile-First Design** | Responsive web app — no app installation required |
| 📊 **Real-Time Dashboard** | Per-user stats, recent activity, and system capability overview |
| 🌍 **Multi-Language Support** | 10 Indian regional languages with localStorage-cached translations |
| 💰 **Market Price Linkage** | Grade-based fair pricing with certification premiums |
| 🧪 **ML Model Comparison** | Live parallel scoring by 5 classical ML algorithms via Python microservice |
| 📤 **Export & History** | CSV export and PDF preview of all past analyses |

---

## 2. Problem Statement

### Background

The Ministry of Agriculture is launching **CROPIC** under PMFBY to revolutionize crop monitoring and insurance claim settlement across India, with a nationwide rollout planned after 2025 pilots.

### Current Challenges

| Challenge | Impact |
|-----------|--------|
| **Manual Bias** | Subjective loss assessment leads to inconsistent claims |
| **Delays** | Physical field visits are time-consuming (48–72 hours) |
| **Transparency Issues** | Farmers lose trust in the insurance process |
| **Data Inconsistency** | No standardized data collection method |
| **Scalability** | Cannot handle India's 140+ million farming households |

### The Need

An end-to-end digital solution is required that can:
- Capture, transmit, and analyse crop images in real time
- Automate crop growth tracking with objective loss assessment
- Support timely and unbiased crop insurance claim processing

---

## 3. Literature Review

### 3.1 Traditional Image-Based Crop Assessment

| Paper / Method | Limitation | Our Solution |
|----------------|------------|--------------|
| CNN-based disease detection (PlantVillage Dataset) | Requires extensive labelled training data; struggles with real-world conditions | Gemini Vision uses foundation-model training, works on diverse real-world images without retraining |
| NDVI satellite imagery | Low resolution (10–30 m), weather-dependent, delayed updates | Real-time ground-truth photos at crop level with instant processing |

### 3.2 Manual Crop Insurance Assessment (Current PMFBY Process)

| Issue | Our Solution |
|-------|--------------|
| Subjective grading by field officers | AI assigns objective grades (A/B/C/D) with confidence scores |
| 48–72 hour assessment delays | Real-time analysis in < 3 seconds |
| No audit trail | Complete database logging with timestamps and geo-data |

### 3.3 Existing Mobile Crop Applications

| App | Gap | Our Advantage |
|-----|-----|---------------|
| **Plantix** | Only disease detection; no grading or insurance integration | Full grading + pricing + batch processing + pest diagnosis |
| **Kisan Suvidha** | Information portal only; no AI analysis | End-to-end AI-powered assessment pipeline |
| **eNAM** | Market prices only; no quality linkage | Price estimation linked to AI-determined grade |

### 3.4 Explainable AI (XAI) in Agriculture

- **Gap:** Most agricultural AI systems are black-box models.
- **Our Approach:** Full XAI explanations with a 6-factor scoring breakdown:
  - Color Quality | Size & Shape | Surface Quality | Disease/Pest Damage | Ripeness | Overall Appeal
- Every grade includes human-readable reasoning in the user's preferred language.

### 3.5 Multilingual AI in Rural Applications

- **Research Gap:** Most agri-tech solutions are English-only.
- **Our Implementation:** 10 Indian languages with real-time translation:
  English | हिन्दी | मराठी | తెలుగు | தமிழ் | ಕನ್ನಡ | বাংলা | ગુજરાતી | ਪੰਜਾਬੀ | മലയാളം

---

## 4. Objectives & Project Utility

### Primary Objectives

1. **Automated Crop Quality Grading**
   - AI-powered grading system with 4-tier classification (A/B/C/D)
   - Multi-parameter scoring: Color, Size, Surface, Disease, Ripeness
   - Confidence percentage for each assessment (0–100%)

2. **Pest & Disease Detection**
   - Multi-image diagnostic capability (up to 4 images)
   - Issue classification: Disease | Pest | Nutrient | Abiotic Stress
   - Severity assessment: Low | Medium | High | Critical
   - Treatment recommendations with future precautions

3. **Batch Processing for Large-Scale Assessment**
   - Process up to 10 images simultaneously
   - Statistical analysis: Mean, Variance, Standard Deviation
   - Consistency scoring and outlier detection
   - Grade distribution visualization

4. **Market Price Estimation**
   - Grade-linked pricing with region-based adjustments
   - Certification premiums: Organic (+10%), Pesticide-Free (+10%), Self-Declaration (+5%)
   - Support for 8+ Indian regions

5. **Accuracy Monitoring & Continuous Improvement**
   - Confusion matrix and per-class precision/recall/F1
   - Ground truth logging for model evaluation
   - Confidence distribution analytics

### Expected Outcomes

| Metric | Target |
|--------|--------|
| **Assessment Time** | < 3 seconds per image |
| **Languages Supported** | 10 Indian languages |
| **Grading Accuracy** | Comparable to expert human graders |
| **Scalability** | Unlimited concurrent users via cloud |
| **Transparency** | 100% auditable with explanation |

### Utility for Stakeholders

| Stakeholder | Benefit |
|-------------|---------|
| **Farmers** | Fair, unbiased insurance claims; understand quality factors |
| **Insurance Companies** | Faster claim processing, reduced fraud |
| **Government (PMFBY)** | Real-time nationwide crop health monitoring |
| **Mandis / APMCs** | Grade-based pricing transparency |
| **Agricultural Officers** | Digital evidence for assessments |

---

## 5. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE (React + TypeScript)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Single    │ │    Batch    │ │    Pest     │ │    Price    │            │
│  │   Grader    │ │   Grading   │ │  Detection  │ │  Estimator  │            │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘            │
└─────────┼───────────────┼───────────────┼───────────────┼───────────────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Express.js Backend)                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Request Validation & File Handling                │   │
│  │                          (Multer + CORS + JSON)                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    GEMINI AI API    │  │   TRANSLATION API   │  │    SUPABASE DB      │
│  (Vision Analysis)  │  │   (MyMemory API)    │  │   (PostgreSQL)      │
│                     │  │                     │  │                     │
│  • Crop Grading     │  │  • 10 Languages     │  │  • grading_results  │
│  • Pest Detection   │  │  • Real-time        │  │  • batch_results    │
│  • XAI Explanations │  │    Translation      │  │  • price_estimations│
│                     │  │                     │  │  • pest_diagnostics │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Grading Workflow

```
                    ┌─────────────────┐
                    │   User Uploads  │
                    │   Crop Image    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Image Validation│
                    │ (JPEG/PNG/WebP) │
                    │   Max 10 MB     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Convert to    │
                    │    Base64       │
                    └────────┬────────┘
                             │
                             ▼
             ┌───────────────────────────────┐
             │      GEMINI VISION API        │
             │                               │
             │  1. Identify Produce Type     │
             │  2. Analyze 6 Quality Metrics │
             │  3. Assign Grade (A/B/C/D)    │
             │  4. Calculate Confidence      │
             │  5. Generate XAI Explanation  │
             └───────────────┬───────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Response JSON  │
                    │   Validation    │
                    │  & Normalisation│
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │   Confidence    │           │   Confidence    │
    │    >= 70%       │           │     < 70%       │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │  Auto-Approved  │           │ Flagged for     │
    │    Result       │           │ Human Review    │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             └──────────────┬──────────────┘
                            ▼
                   ┌─────────────────┐
                   │ Save to Database│
                   │   (Supabase)    │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Display Result │
                   │  Grade + Scores │
                   │  + Explanation  │
                   └─────────────────┘
```

---

## 6. Application Pages & Routes

All routes except `/auth` are protected — unauthenticated users are redirected to the login page.

| Route | Page | Description |
|-------|------|-------------|
| `/auth` | Auth | Sign up / Sign in via Supabase email auth |
| `/` | Dashboard | Hero overview, quick-stat cards, recent grading activity feed |
| `/grader` | Single Crop Grader | Upload one image → Gemini AI grade + ML comparison chart |
| `/batch` | Batch Grading | Upload 2–10 images → aggregate stats, grade distribution chart |
| `/pest` | Pest & Disease Scanner | Upload up to 4 images → AI pest/disease diagnosis |
| `/price` | Market Price Estimator | Grade × Region × Quantity × Certifications → price breakdown |
| `/accuracy` | Accuracy Dashboard | Confusion matrix, per-class F1, confidence histogram |
| `/history` | Grading History | Full history tabs (single, batch, price, pest) + CSV/PDF export |

---

## 7. Key Features

### 7.1 Single Crop Analysis
- Upload any JPEG/PNG/WebP image (max 10 MB)
- AI auto-identifies the produce type (Mango, Tomato, Apple, Banana, Orange, Potato, Onion, Carrot)
- 6-parameter quality scoring visualised as progress bars: **Color Quality · Size & Shape · Surface Quality · Disease/Pest · Ripeness · Overall Appeal**
- Circular confidence gauge with percentage
- Confidence ≥ 70% → Auto-Approved; < 70% → Flagged for Human Review
- Full XAI explanation and recommendations from Gemini Vision
- **Ground Truth Logging**: supply the correct grade after grading to contribute to accuracy metrics
- **ML Comparison Chart**: live parallel scoring from 5 classical ML algorithms (SVM, KNN, Random Forest, Decision Tree, Naïve Bayes) via the Python microservice — displayed as a multi-line chart for each quality factor

### 7.2 Batch Processing
- Drag-and-drop or file-picker upload of 2–10 images
- Per-image grade cards with outlier flags
- Aggregate statistics: Average Score, Min, Max, Consistency Score (%)
- Variance & Standard Deviation computed on overall scores
- Outlier detection: samples > 1.5 × standard deviation from mean are flagged
- Grade distribution bar chart (A/B/C/D with colour coding)
- Batch recommendation text based on average score and consistency

### 7.3 Pest & Disease Scanner
- Upload 1–4 images for multi-angle diagnosis
- Issue type classification: **Disease · Pest · Nutrient Deficiency · Abiotic Stress · Unknown**
- Severity levels with colour-coded badges: **Low · Medium · High · Critical**
- Structured output: Symptoms, Likely Causes, Current Solutions, Future Precautions, Monitoring checklist, When to Escalate, Disclaimer
- All text translated to the user's selected language

### 7.4 Market Price Estimator
- Inputs: Crop type, Grade (A/B/C/D), Quantity (kg), Region, Certification toggles
- Certification premiums: Organic +10%, Pesticide-Free +10%, Self-Declaration +5% (mutually exclusive with organic/pesticide-free)
- Price breakdown bar chart (Base Price → Grade Adjustment → Each Premium)
- Result saved to `price_estimations` table in Supabase

### 7.5 Accuracy Dashboard
- Loads from `GET /api/evaluations/metrics`
- 4×4 confusion matrix heatmap
- Per-class precision, recall, F1 score table
- Confidence distribution histogram (5 bins: 0–20%, 21–40%, 41–60%, 61–80%, 81–100%)
- Mean Absolute Error (MAE) for score predictions

### 7.6 Grading History & Export
- Tabbed view: Single Analyses | Batch Runs | Price Estimations | Pest Diagnoses
- **Export to CSV** for single results, batch results, and price estimations
- **PDF Preview** — HTML-in-window report for printing
- **Clear All Data** — permanently deletes all user records (with confirmation dialog)

### 7.7 Multi-Language Support
- 10 Indian languages via `LanguageContext` and `AutoTranslate` wrapper:

| Code | Language |
|------|----------|
| `en` | English |
| `hi` | हिन्दी (Hindi) |
| `mr` | मराठी (Marathi) |
| `te` | తెలుగు (Telugu) |
| `ta` | தமிழ் (Tamil) |
| `kn` | ಕನ್ನಡ (Kannada) |
| `bn` | বাংলা (Bengali) |
| `gu` | ગુજરાતી (Gujarati) |
| `pa` | ਪੰਜਾਬੀ (Punjabi) |
| `ml` | മലയാളം (Malayalam) |

- Language selection is persisted in `localStorage` under key `agrigrade.language`
- Translations are cached in `localStorage` per language to reduce repeat API calls
- A DOM `MutationObserver` keeps the page translated as content changes dynamically

---

## 8. Business Logic Reference

### 8.1 Grade Thresholds (Overall Score → Grade)

| Grade | Minimum Score |
|-------|--------------|
| **A** | 90 |
| **B** | 75 |
| **C** | 55 |
| **D** | 0 (any score below C) |

### 8.2 Grade Price Multipliers

| Grade | Multiplier |
|-------|------------|
| **A** | 1.25× (25% above base) |
| **B** | 1.00× (base price) |
| **C** | 0.75× (25% below base) |
| **D** | 0.50× (50% below base) |

### 8.3 Base Market Prices (₹/kg)

| Crop | Base Price |
|------|-----------|
| Mango | ₹80 |
| Tomato | ₹40 |
| Apple | ₹150 |
| Banana | ₹50 |
| Orange | ₹70 |
| Potato | ₹30 |
| Onion | ₹35 |
| Carrot | ₹45 |

### 8.4 Supported Regions

Delhi NCR · Mumbai · Chennai · Kolkata · Bangalore · Hyderabad · Pune · Ahmedabad

### 8.5 Certification Premiums (applied on grade-adjusted price)

| Certification | Premium |
|---------------|---------|
| Organic | +10% |
| Pesticide-Free | +10% |
| Self-Declaration | +5% *(only if neither Organic nor Pesticide-Free is selected)* |

---

## 9. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 + TypeScript | Type-safe UI development |
| **UI Components** | Shadcn/UI + Radix UI | Accessible, customisable components |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **State Management** | TanStack Query | Server state synchronisation |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Charts** | Recharts | Data visualisation (bar, pie, line) |
| **Routing** | React Router v6 | Client-side navigation |
| **Authentication** | Supabase Auth | Email-based sign-up/sign-in with JWT sessions |
| **Backend Runtime** | Node.js 18+ (ESM) | Server-side JavaScript |
| **API Framework** | Express.js v5 | REST API routing |
| **AI Engine** | Google Gemini Vision (`gemini-flash-lite-latest`) | Zero-shot multimodal LLM grading & pest diagnosis |
| **Database** | Supabase (PostgreSQL) | Managed database with Row-Level Security |
| **File Upload** | Multer (memory storage) | Multi-file handling, 10 MB / 12 files limit |
| **Translation** | MyMemory API | Free machine translation for 10 Indian languages |
| **ML Microservice** | Python 3 + FastAPI + OpenCV + scikit-learn | Classical ML comparison (SVM, KNN, RF, DT, NB) |
| **ML Serialisation** | joblib | Save/load trained scikit-learn models |
| **Build Tool** | Vite | Fast HMR development and production bundling |
| **Testing** | Vitest + Testing Library | Unit and integration tests |
| **Containerisation** | Docker | Portable backend image |
| **Cloud Deployment** | Fly.io | Backend hosting (`fly.toml`) |

---

## 10. Database Schema & Migrations

Migration files are in `frontend/supabase/migrations/`. Run them in your Supabase project via the SQL editor or the Supabase CLI.

| File | Contents |
|------|----------|
| `20260206084337_*.sql` | Creates `grading_results`, `batch_grading_results`, `price_estimations` tables with RLS policies and indexes |
| `20260208094500_add_pest_diagnostics.sql` | Adds `pest_diagnostics` table with RLS policies and indexes |

### Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUPABASE DATABASE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐     ┌─────────────────────────┐                │
│  │    grading_results      │     │  batch_grading_results  │                │
│  ├─────────────────────────┤     ├─────────────────────────┤                │
│  │ id (UUID, PK)           │     │ id (UUID, PK)           │                │
│  │ user_id (FK → users)    │     │ user_id (FK → users)    │                │
│  │ image_url               │     │ average_grade           │                │
│  │ crop_type               │     │ average_score           │                │
│  │ grade (A/B/C/D)         │     │ min_score, max_score    │                │
│  │ confidence              │     │ variance, std_deviation │                │
│  │ overall_score           │     │ consistency_score       │                │
│  │ color_quality           │     │ grade_distribution (JSONB)│              │
│  │ size_shape              │     │ batch_recommendation    │                │
│  │ surface_quality         │     │ outlier_count           │                │
│  │ disease_pest            │     │ image_count             │                │
│  │ ripeness                │     │ created_at              │                │
│  │ overall_appeal          │     └─────────────────────────┘                │
│  │ explanation_* (6 cols)  │                                                │
│  │ recommendations[]       │     ┌─────────────────────────┐                │
│  │ observations[]          │     │    price_estimations    │                │
│  │ requires_verification   │     ├─────────────────────────┤                │
│  │ created_at              │     │ id (UUID, PK)           │                │
│  └─────────────────────────┘     │ user_id (FK → users)    │                │
│                                   │ crop_type, grade        │                │
│  ┌─────────────────────────┐     │ quantity, region        │                │
│  │    pest_diagnostics     │     │ base_price              │                │
│  ├─────────────────────────┤     │ grade_adjustment        │                │
│  │ id (UUID, PK)           │     │ organic_premium         │                │
│  │ user_id (FK → users)    │     │ pesticide_free_premium  │                │
│  │ produce_identified      │     │ total_premium_%         │                │
│  │ issue_type              │     │ final_price_per_kg      │                │
│  │ issue_name              │     │ total_price             │                │
│  │ confidence_percent      │     │ created_at              │                │
│  │ severity                │     └─────────────────────────┘                │
│  │ symptoms[]              │                                                │
│  │ likely_causes[]         │     ┌─────────────────────────┐                │
│  │ current_solution[]      │     │       auth.users        │                │
│  │ future_precautions[]    │     ├─────────────────────────┤                │
│  │ monitoring[]            │     │ id (UUID, PK)           │                │
│  │ when_to_escalate        │     │ email                   │                │
│  │ disclaimer              │     │ created_at              │                │
│  │ image_count             │     │ (Supabase Auth)         │                │
│  │ created_at              │     └─────────────────────────┘                │
│  └─────────────────────────┘                                                │
│                                                                              │
│                    Row Level Security (RLS) Enabled                          │
│                   Users can only access their own data                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

All four tables have RLS policies: users may SELECT, INSERT, and DELETE only their own rows. Performance indexes are created on `user_id` and `created_at` columns.

---

## 11. API Reference

All requests that accept file uploads use `multipart/form-data`. JSON-body endpoints use `Content-Type: application/json`.

### Backend Endpoints (`backend/app.js`)

| Endpoint | Method | Body / Params | Description |
|----------|--------|---------------|-------------|
| `POST /api/grade` | POST | `image` (file), `produceType` (string, optional), `language` (string, optional) | Single image AI grading via Gemini + optional ML comparison |
| `POST /api/batch-grade` | POST | `images` (files, max 10), `produceType`, `language` | Batch grading with statistical summary |
| `POST /api/pest-diagnosis` | POST | `images` (files, max 4), `produceType`, `language` | Pest / disease detection and recommendations |
| `POST /api/translate` | POST | `{ texts: string[], target: string, source?: string }` | Batch text translation via MyMemory API |
| `POST /api/evaluations` | POST | `{ predictedGrade, groundTruthGrade?, predictedScore?, confidence?, produceType? }` | Log a ground-truth evaluation record |
| `GET /api/evaluations/metrics` | GET | — | Compute and return accuracy metrics from all logged evaluations |

### ML Microservice Endpoint (`backend/ml_service/server.py`)

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `GET /health` | GET | — | Check if the service is running and models are loaded |
| `POST /api/ml-compare` | POST | `image` (file) | Return quality scores from SVM, KNN, Random Forest, Decision Tree, and Naïve Bayes |

### Frontend API Calls (`frontend/src/lib/gradingService.ts`)

The frontend derives the backend URL from `VITE_API_BASE_URL` (defaults to `http://localhost:3000`).

---

## 12. Security

| Mechanism | Details |
|-----------|---------|
| **Row-Level Security (RLS)** | All four Supabase tables enforce `auth.uid() = user_id` for SELECT, INSERT, and DELETE |
| **JWT Authentication** | Supabase Auth issues JWTs; `useAuth` hook persists session in `localStorage` and listens to `onAuthStateChange` |
| **Protected Routes** | `ProtectedRoute` component redirects unauthenticated users to `/auth` |
| **Input Validation** | Multer enforces JPEG/PNG/WebP file type and ≤ 10 MB file size server-side |
| **CORS** | Express CORS middleware — configure `CORS_ORIGIN` in production |
| **Environment Variables** | All secrets (`GEMINI_API_KEY`, Supabase keys) are in `.env` files; never committed to source control |
| **AI Response Validation** | Backend strictly validates and normalises all Gemini JSON responses; invalid responses return HTTP 502 |

---

## 13. Installation & Setup

### Prerequisites

- Node.js ≥ 18
- Python 3.9+ (for the ML comparison service)
- A Supabase project (free tier works) with migrations applied
- A Google Gemini API key (free tier available at [ai.google.dev](https://ai.google.dev))

### Environment Variables

**`backend/.env`**

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-flash-lite-latest   # optional — this is the default
PORT=3000
# Optional translation settings
TRANSLATE_EMAIL=your_email@example.com  # increases MyMemory API rate limit
TRANSLATE_MAX_CHARS=450
```

**`frontend/.env`**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000
```

### Database Setup

Apply the migration files to your Supabase project (SQL Editor or CLI):

```sh
# Option A — Supabase CLI
supabase db push

# Option B — paste each file into the Supabase SQL editor
frontend/supabase/migrations/20260206084337_*.sql
frontend/supabase/migrations/20260208094500_add_pest_diagnostics.sql
```

### Running the Application

```sh
# 1. Install and start the frontend dev server
cd frontend
npm install
npm run dev           # http://localhost:5173

# 2. Install and start the backend API server (separate terminal)
cd backend
npm install
node app.js           # http://localhost:3000

# 3. Install and start the Python ML microservice (separate terminal, optional)
cd backend/ml_service
pip install -r requirements.txt
python3 -m uvicorn server:app --host 0.0.0.0 --port 5001
# If the ML service is not running, the ML comparison chart shows an offline notice
```

### Build for Production

```sh
cd frontend
npm run build         # Output in frontend/dist/
npm run preview       # Preview the production build locally
```

### Run Tests

```sh
cd frontend
npm run test          # Run Vitest test suite (vitest.config.ts)
```

---

## 14. Deployment

### Docker (Backend)

A `Dockerfile` and `.dockerignore` are provided in the `backend/` directory.

```sh
cd backend
docker build -t cropwise-backend .
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  cropwise-backend
```

Set `SKIP_ML_SERVICE=true` in the Docker environment if you don't need the Python ML microservice inside the container.

### Fly.io

A `fly.toml` is included in `backend/` for one-command deployment to [Fly.io](https://fly.io):

```sh
cd backend
fly deploy
fly secrets set GEMINI_API_KEY=your_key
```

### Frontend (Vercel / Netlify)

A `vercel.json` is provided in `frontend/`. Deploy with:

```sh
cd frontend
npm run build
# Upload frontend/dist/ to Vercel, Netlify, or any static host
```

---

## 15. Strengths & Limitations

### Strengths

| Feature | Benefit |
|---------|---------|
| **Real-time AI Analysis** | Results in < 3 seconds, eliminating assessment delays |
| **Objective Grading** | Eliminates human bias with consistent AI evaluation |
| **Explainable AI (XAI)** | Transparent reasoning builds farmer trust |
| **Multi-language** | Accessible to farmers across all major Indian states |
| **Scalable Architecture** | Cloud-based; handles unlimited concurrent users |
| **Cost-Effective** | Reduces the need for physical field visits |
| **Audit Trail** | Complete logging for regulatory compliance |
| **Batch Processing** | High throughput for large-scale operations |
| **Secure & Private** | Row-Level Security ensures data isolation |
| **Mobile-Responsive** | Works on any device without an app installation |
| **ML Comparison** | Side-by-side Gemini vs. 5 classical ML algorithms for transparency |
| **Export & Reporting** | CSV and PDF export of all analysis history |

### Current Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Internet Dependency** | Requires connectivity for AI processing | Consider offline-first PWA with sync |
| **Image Quality Sensitivity** | Poor images reduce accuracy | Built-in capture guidance provided |
| **API Cost** | Gemini API usage scales with volume | Implement caching and rate limiting |
| **Limited Crop Types** | Currently 8 crop types supported | Easily extensible via `frontend/src/lib/constants.ts` |
| **No Geo-tagging** | Images don't auto-capture location | Integrate browser Geolocation API |
| **Single Image Limitation** | Some defects require multiple angles | Batch grading partially addresses this |
| **ML Service Optional** | Classical ML comparison unavailable without Python service | Backend degrades gracefully — ML chart shows offline notice |

---

## 16. Future Roadmap

### Phase 1 — Enhanced Capabilities (3–6 months)
1. **Geo-tagged Image Capture** — Automatic GPS coordinates with each photo
2. **Offline Mode** — PWA with local processing for low-connectivity areas
3. **Native Mobile App** — React Native for iOS/Android with camera optimisation
4. **More Crop Types** — Expand to 25+ crops including cereals, pulses, vegetables

### Phase 2 — Advanced Intelligence (6–12 months)
5. **Satellite Integration** — Overlay with ISRO/NASA satellite data for field-level monitoring
6. **Weather Correlation** — Link damage patterns to IMD weather data
7. **Yield Prediction** — ML models for harvest estimation based on crop health
8. **Temporal Tracking** — Same-plot multi-stage analysis across the full growth cycle

### Phase 3 — Ecosystem Integration (12–18 months)
9. **PMFBY Portal API** — Direct integration with government insurance systems
10. **eNAM Integration** — Push grades to the National Agriculture Market
11. **Blockchain Audit Trail** — Immutable record of assessments for dispute resolution
12. **Farmer ID Linking** — Aadhaar / Kisan Credit Card integration

### Phase 4 — AI Evolution (Ongoing)
13. **Federated Learning** — Improve models using local data without central upload
14. **Edge AI** — On-device inference for instant offline grading
15. **Multi-Modal Analysis** — Combine images with audio descriptions from farmers
16. **Drone Integration** — Support for aerial crop images at scale

---

## 17. Conclusion

**CropWise** delivers a complete AI-powered solution for the CROPIC initiative:

| PMFBY Requirement | Our Solution |
|-------------------|--------------|
| Real-time crop monitoring | ✅ Instant AI analysis |
| Objective loss assessment | ✅ 6-parameter scoring |
| Reduce manual bias | ✅ AI-driven grading |
| Farmer-friendly interface | ✅ Multi-language, simple UI |
| Scalable platform | ✅ Cloud-native architecture |
| Evidence-based claims | ✅ Complete audit trail |

> **"Empowering Indian Agriculture with Intelligent, Transparent, and Inclusive Technology"**
