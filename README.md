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
6. [Key Features](#6-key-features)
7. [Technology Stack](#7-technology-stack)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [Security](#10-security)
11. [Installation & Setup](#11-installation--setup)
12. [Strengths & Limitations](#12-strengths--limitations)
13. [Future Roadmap](#13-future-roadmap)
14. [Conclusion](#14-conclusion)

---

## 1. Project Overview

**CropWise** is an AI-powered agricultural intelligence platform built to address the real-time crop monitoring and insurance claim settlement needs of the **Pradhan Mantri Fasal Bima Yojana (PMFBY)** initiative under the **CROPIC** (Collection of Real-Time Observations & Photo of Crops) programme.

### Core Pillars

| Pillar | Description |
|--------|-------------|
| 🔬 **AI/ML Visual Analysis** | Gemini Vision-powered crop quality assessment |
| 📱 **Mobile-First Design** | Responsive web app accessible on any device without installation |
| 📊 **Real-Time Dashboard** | Map-based visualization for agricultural authorities |
| 🌍 **Multi-Language Support** | 10 Indian regional languages supported |
| 💰 **Market Price Linkage** | Grade-based fair pricing with certification premiums |

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

## 6. Key Features

### 6.1 Single Crop Analysis
- Upload a high-resolution image
- AI auto-detects crop type (Mango, Tomato, Apple, Banana, Orange, Potato, Onion, Carrot)
- 6-parameter quality scoring with visual bars
- Confidence gauge with percentage
- XAI observations and actionable recommendations

### 6.2 Batch Processing
- Upload up to 10 images simultaneously
- Statistical analysis: Average, Min, Max, Variance, Standard Deviation
- Grade distribution bar chart (A/B/C/D)
- Consistency scoring for batch uniformity
- Outlier detection and flagging

### 6.3 Pest & Disease Scanner
- Multi-image upload (up to 4 images for improved diagnosis)
- Issue classification: Disease | Pest | Nutrient | Abiotic
- Severity assessment with colour-coded badges
- Actionable treatment recommendations
- Future precautions and monitoring guidelines

### 6.4 Market Price Estimator
- Grade-linked base pricing
- Regional price adjustments (8 major cities/regions)
- Certification premiums visualisation
- Quantity-based total calculation with price breakdown chart

### 6.5 Accuracy Dashboard
- Real-time accuracy metrics
- Confusion matrix visualisation
- Per-class precision, recall, F1 scores
- Confidence distribution histogram
- Ground truth logging for continuous improvement

### 6.6 Multi-Language Support
- 10 Indian languages with real-time AI response translation
- Language preference persisted across sessions

---

## 7. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 + TypeScript | Type-safe UI development |
| **UI Components** | Shadcn/UI + Radix UI | Accessible, customisable components |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **State Management** | TanStack Query | Server state synchronisation |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Charts** | Recharts | Data visualisation |
| **Backend Runtime** | Node.js 18+ | Server-side JavaScript |
| **API Framework** | Express.js | REST API routing |
| **AI Engine** | Google Gemini Vision (`gemini-flash-lite-latest`) | Multi-modal image analysis |
| **Database** | Supabase (PostgreSQL) | Managed database with Auth & RLS |
| **File Upload** | Multer | Multi-file handling |
| **Translation** | MyMemory API | Multi-language support |
| **ML Service** | Python + FastAPI + OpenCV + scikit-learn | SVM/KNN/RF/DT/NB model comparison |
| **Build Tool** | Vite | Fast development and bundling |
| **Testing** | Vitest | Unit and integration testing |

---

## 8. Database Schema

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

---

## 9. API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/grade` | POST | Single image crop grading |
| `/api/grade-batch` | POST | Multiple image batch grading |
| `/api/pest-diagnosis` | POST | Pest / disease detection |
| `/api/evaluation` | POST | Log ground truth for accuracy tracking |
| `/api/accuracy-metrics` | GET | Fetch accuracy dashboard data |
| `/api/translate` | POST | Text translation |

---

## 10. Security

| Mechanism | Details |
|-----------|---------|
| **Row-Level Security (RLS)** | Users can only read/write their own data in Supabase |
| **JWT Authentication** | Secure session management via Supabase Auth |
| **Input Validation** | File type (JPEG/PNG/WebP) and size (≤ 10 MB) restrictions enforced by Multer |
| **CORS Configuration** | Controlled cross-origin access on the Express server |
| **Environment Variables** | All secrets (API keys, DB URLs) stored in `.env`; never committed to source control |

---

## 11. Installation & Setup

### Prerequisites

- Node.js ≥ 18
- Python 3.9+ (for the ML comparison service)
- A Supabase project with the schema applied
- A Google Gemini API key

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-flash-lite-latest   # optional, this is the default
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

### Running the Application

```sh
# 1. Install frontend dependencies and start dev server
cd frontend
npm install
npm run dev

# 2. Install backend dependencies and start the API server (separate terminal)
cd backend
npm install
node app.js

# 3. Start the Python ML comparison service (separate terminal)
cd backend/ml_service
pip install -r requirements.txt
python3 -m uvicorn server:app --port 5001
```

### Build for Production

```sh
cd frontend
npm run build       # Output in frontend/dist/
```

---

## 12. Strengths & Limitations

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

### Current Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Internet Dependency** | Requires connectivity for AI processing | Consider offline-first PWA with sync |
| **Image Quality Sensitivity** | Poor images reduce accuracy | Built-in capture guidance provided |
| **API Cost** | Gemini API usage scales with volume | Implement caching and rate limiting |
| **Limited Crop Types** | Currently 8 crop types supported | Easily extensible via constants |
| **No Geo-tagging** | Images don't auto-capture location | Integrate browser Geolocation API |
| **Single Image Limitation** | Some defects require multiple angles | Batch grading partially addresses this |

---

## 13. Future Roadmap

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

## 14. Conclusion

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
