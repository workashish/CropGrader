import express from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  extractJsonFromText,
  clamp,
  clamp01,
  requireNumber,
  normalizeStringArray,
  normalizeEnum,
  normalizeLanguage,
  LANGUAGE_LABELS
} from './utils.js';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const EVAL_FILE = path.join(DATA_DIR, 'evaluations.jsonl');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const AI_ALGORITHM_LABEL = `Multimodal LLM Grading (Google Gemini ${GEMINI_MODEL})`;

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI(process.env.GEMINI_API_KEY) : null;

// Python ML comparison micro-service (SVM, KNN, RF, DT, NB)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_SERVICE_PORT = new URL(ML_SERVICE_URL).port || '5001';

// ── Auto-start the Python ML micro-service ─────────────────────────────────
const ML_SERVICE_DIR = path.join(__dirname, 'ml_service');
let mlServiceProcess = null;

const startMLService = () => {
  if (process.env.SKIP_ML_SERVICE === 'true') {
    console.log('[ml_service] Skipped (SKIP_ML_SERVICE=true)');
    return;
  }
  if (!fs.existsSync(path.join(ML_SERVICE_DIR, 'server.py'))) {
    console.log('[ml_service] server.py not found — skipping auto-start');
    return;
  }

  // Check if already running
  fetch(`${ML_SERVICE_URL}/health`).then((r) => {
    if (r.ok) {
      console.log('[ml_service] Already running on', ML_SERVICE_URL);
    }
  }).catch(() => {
    console.log(`[ml_service] Starting Python ML service on port ${ML_SERVICE_PORT} …`);
    mlServiceProcess = spawn(
      'python3',
      ['-m', 'uvicorn', 'server:app', '--host', '0.0.0.0', '--port', ML_SERVICE_PORT],
      {
        cwd: ML_SERVICE_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      }
    );

    mlServiceProcess.stdout.on('data', (data) => {
      const line = data.toString().trim();
      if (line) console.log(`[ml_service] ${line}`);
    });
    mlServiceProcess.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line) console.log(`[ml_service] ${line}`);
    });
    mlServiceProcess.on('error', (err) => {
      console.error('[ml_service] Failed to start:', err.message);
      mlServiceProcess = null;
    });
    mlServiceProcess.on('exit', (code) => {
      console.log(`[ml_service] Exited with code ${code}`);
      mlServiceProcess = null;
    });
  });
};

// Graceful shutdown
const cleanupMLService = () => {
  if (mlServiceProcess) {
    console.log('[ml_service] Shutting down …');
    mlServiceProcess.kill('SIGTERM');
    mlServiceProcess = null;
  }
};
process.on('SIGINT', () => { cleanupMLService(); process.exit(0); });
process.on('SIGTERM', () => { cleanupMLService(); process.exit(0); });

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  }
});

const bufferToBase64 = (buffer) => buffer.toString('base64');

const TRANSLATE_ENDPOINT = process.env.TRANSLATE_ENDPOINT || 'https://api.mymemory.translated.net/get';
const TRANSLATE_EMAIL = process.env.TRANSLATE_EMAIL || '';
const TRANSLATE_MAX_CHARS = Number(process.env.TRANSLATE_MAX_CHARS) || 450;

const splitLineForTranslation = (line, maxLen) => {
  if (line.length <= maxLen) return [line];
  const sentences = line.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  sentences.forEach((sentence) => {
    if (!sentence) return;
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= maxLen) {
        current = sentence;
      } else {
        for (let i = 0; i < sentence.length; i += maxLen) {
          chunks.push(sentence.slice(i, i + maxLen));
        }
        current = '';
      }
    }
  });
  if (current) chunks.push(current);
  return chunks;
};

const translateViaMyMemory = async (text, source, target) => {
  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
  });
  if (TRANSLATE_EMAIL) {
    params.set('de', TRANSLATE_EMAIL);
  }

  const response = await fetch(`${TRANSLATE_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error('TRANSLATE_FAILED');
  }
  const data = await response.json();
  return data?.responseData?.translatedText || text;
};

const translateText = async (text, source, target) => {
  if (!text || !text.trim()) return text;
  const lines = text.split('\n');
  const translatedLines = [];

  for (const line of lines) {
    if (!line.trim()) {
      translatedLines.push('');
      continue;
    }
    const chunks = splitLineForTranslation(line, TRANSLATE_MAX_CHARS);
    const translatedChunks = [];
    for (const chunk of chunks) {
      const translated = await translateViaMyMemory(chunk, source, target);
      translatedChunks.push(translated);
    }
    translatedLines.push(translatedChunks.join(' '));
  }

  return translatedLines.join('\n');
};

const translateBatch = async (texts, source, target) => {
  const results = [];
  for (const text of texts) {
    results.push(await translateText(String(text || ''), source, target));
  }
  return results;
};

const normalizeAiScores = (scores) => {
  const required = [
    'colorQuality',
    'sizeShape',
    'surfaceQuality',
    'diseaseDamage',
    'ripeness',
    'imageQuality'
  ];

  const normalized = {};
  required.forEach((key) => {
    normalized[key] = clamp(requireNumber(scores?.[key], `scores.${key}`));
  });

  return normalized;
};

const normalizeAiGradeResponse = (raw) => {
  const grade = String(raw?.grade || '').toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(grade)) {
    throw new Error('AI_RESPONSE_INVALID:grade');
  }

  const overallScore = clamp(requireNumber(raw?.overallScore, 'overallScore'));
  const confidencePercent = clamp(requireNumber(raw?.confidencePercent, 'confidencePercent'));
  const scores = normalizeAiScores(raw?.scores);
  const explanation = String(raw?.explanation || '').trim();
  if (!explanation) {
    throw new Error('AI_RESPONSE_INVALID:explanation');
  }

  return {
    grade,
    overallScore,
    confidencePercent,
    scores,
    explanation,
    produceIdentified: raw?.produceIdentified ? String(raw.produceIdentified) : null
  };
};

const gradeFromScore = (score) => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 55) return 'C';
  return 'D';
};

const gradeToNumeric = (grade) => {
  switch (grade) {
    case 'A':
      return 95;
    case 'B':
      return 82;
    case 'C':
      return 65;
    case 'D':
      return 45;
    default:
      return 0;
  }
};

const buildGeminiGradingPrompt = ({ produceType, algorithmLabel, language }) => {
  const languageCode = normalizeLanguage(language);
  const languageLabel = LANGUAGE_LABELS[languageCode] || 'English';

  return `
You are an expert agricultural produce quality grader. Analyze the image and assign a grade.

Produce type (if known): ${produceType || 'unknown'}
Grading pipeline: ${algorithmLabel}
Target language: ${languageLabel} (${languageCode})

Grading rubric:
- Grade A: excellent visual quality, uniform color, minimal defects.
- Grade B: good quality with minor blemishes or slight unevenness.
- Grade C: noticeable defects, bruising, uneven ripeness or shape issues.
- Grade D: severe defects, rot, heavy blemishes, poor quality.

Return JSON ONLY with this exact schema:
{
  "produceIdentified": "string",
  "grade": "A|B|C|D",
  "overallScore": number (0-100),
  "confidencePercent": number (0-100),
  "scores": {
    "colorQuality": number (0-100),
    "sizeShape": number (0-100),
    "surfaceQuality": number (0-100),
    "diseaseDamage": number (0-100),
    "ripeness": number (0-100),
    "imageQuality": number (0-100)
  },
  "explanation": "2-3 sentences. Explain the key visual reasons for the grade, mention the grading pipeline name and confidence exactly once. Do NOT call the pipeline an algorithm — refer to it as a Multimodal LLM grading pipeline."
}

Rules:
- Use only visual evidence from the image.
- Be consistent with the rubric.
- Weighting guidance: prioritize color, ripeness, and visible defect severity. If image quality is low (blur/lighting), cut the influence of surfaceQuality by about half and reduce confidence more than the grade.
- All human-readable values must be in the target language. Keep JSON keys and grade letters (A/B/C/D) in English.
- For produceIdentified, use the target language and include the English name in parentheses when possible (example: सेब (apple)).
- No markdown, no extra text outside JSON.
`;
};

const callGeminiForGrading = async ({ file, produceType, language }) => {
  if (!ai) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const contents = [
    {
      inlineData: {
        mimeType: file.mimetype,
        data: bufferToBase64(file.buffer),
      },
    },
    { text: buildGeminiGradingPrompt({ produceType, algorithmLabel: AI_ALGORITHM_LABEL, language }) },
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 512
    }
  });

  const responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = extractJsonFromText(responseText);
  return normalizeAiGradeResponse(parsed);
};

const gradeImage = async ({ file, produceType, language }) => {
  const aiResult = await callGeminiForGrading({ file, produceType, language });
  const confidencePercent = Math.round(aiResult.confidencePercent);
  const confidence = clamp01(confidencePercent / 100);

  let explanation = aiResult.explanation;
  const explanationLower = explanation.toLowerCase();
  if (!explanationLower.includes('pipeline') && !explanationLower.includes('algorithm')) {
    explanation = `${explanation} Pipeline: ${AI_ALGORITHM_LABEL}.`;
  }
  if (!explanationLower.includes('confidence')) {
    explanation = `${explanation} Confidence: ${confidencePercent}%.`;
  }

  return {
    grade: aiResult.grade,
    overallScore: Math.round(aiResult.overallScore),
    confidence,
    confidencePercent,
    scores: aiResult.scores,
    features: null,
    explanation: explanation.trim(),
    explanationSource: 'ai',
    warnings: [],
    algorithm: AI_ALGORITHM_LABEL,
    model: {
      type: 'multimodal-llm',
      version: GEMINI_MODEL,
      provider: 'Google Gemini',
      pipeline: 'Image → Multimodal LLM (zero-shot visual grading) → Structured JSON scoring'
    },
    produceIdentified: aiResult.produceIdentified
  };
};

const buildGeminiPestPrompt = ({ produceType, imageCount, language }) => {
  const languageCode = normalizeLanguage(language);
  const languageLabel = LANGUAGE_LABELS[languageCode] || 'English';

  return `
You are an agronomist diagnosing pests and diseases from crop images.

Produce type (if known): ${produceType || 'unknown'}
Images provided: ${imageCount}
Target language: ${languageLabel} (${languageCode})

Return JSON ONLY with this exact schema:
{
  "produceIdentified": "string",
  "issueType": "disease|pest|nutrient|abiotic|unknown",
  "issueName": "string",
  "confidencePercent": number (0-100),
  "severity": "low|medium|high|critical",
  "symptoms": ["string", "..."],
  "likelyCauses": ["string", "..."],
  "currentSolution": ["string", "..."],
  "futurePrecautions": ["string", "..."],
  "monitoring": ["string", "..."],
  "whenToEscalate": "string",
  "disclaimer": "string"
}

Rules:
- Use only visual evidence from the images. If unclear, set issueType to "unknown" and low confidence.
- If images conflict, prioritize the most consistent symptoms and reduce confidence.
- Be concise and practical. Avoid brand names and dosages.
- Include safety guidance in the disclaimer.
- All human-readable values must be in the target language. Keep JSON keys in English.
- For produceIdentified, use the target language and include the English name in parentheses when possible (example: सेब (apple)).
- No markdown or extra text outside JSON.
`;
};

const normalizeAiPestResponse = (raw) => {
  const issueType = normalizeEnum(raw?.issueType, ['disease', 'pest', 'nutrient', 'abiotic', 'unknown'], 'unknown');
  const severity = normalizeEnum(raw?.severity, ['low', 'medium', 'high', 'critical'], 'low');
  const issueName = String(raw?.issueName || '').trim();
  const produceIdentified = String(raw?.produceIdentified || '').trim();
  const confidencePercent = clamp(requireNumber(raw?.confidencePercent, 'confidencePercent'));

  return {
    produceIdentified: produceIdentified || 'unknown',
    issueType,
    issueName: issueName || 'Unknown issue',
    confidencePercent,
    severity,
    symptoms: normalizeStringArray(raw?.symptoms, ['Unable to confirm symptoms from the image.']),
    likelyCauses: normalizeStringArray(raw?.likelyCauses, ['Image evidence is insufficient to determine a cause.']),
    currentSolution: normalizeStringArray(raw?.currentSolution, ['Consult a local agronomist for on-site assessment.']),
    futurePrecautions: normalizeStringArray(raw?.futurePrecautions, ['Maintain good field hygiene and monitor crop health regularly.']),
    monitoring: normalizeStringArray(raw?.monitoring, ['Recheck the plant in 3–5 days with a clear, close image.']),
    whenToEscalate: String(raw?.whenToEscalate || 'If symptoms spread rapidly or yield is threatened, seek expert advice.').trim(),
    disclaimer: String(raw?.disclaimer || 'This is informational guidance based on an image and should not replace local agronomist advice.').trim(),
  };
};

const callGeminiForPestDiagnosis = async ({ files, produceType, language }) => {
  if (!ai) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const contents = files.map((file) => ({
    inlineData: {
      mimeType: file.mimetype,
      data: bufferToBase64(file.buffer),
    },
  }));
  contents.push({ text: buildGeminiPestPrompt({ produceType, imageCount: files.length, language }) });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 768
    }
  });

  const responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = extractJsonFromText(responseText);
  return normalizeAiPestResponse(parsed);
};

const appendEvaluation = async (record) => {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.appendFile(EVAL_FILE, `${JSON.stringify(record)}\n`);
};

const loadEvaluations = async () => {
  if (!fs.existsSync(EVAL_FILE)) return [];
  const data = await fs.promises.readFile(EVAL_FILE, 'utf-8');
  return data
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
};

const computeMetrics = (records) => {
  const grades = ['A', 'B', 'C', 'D'];
  const matrix = {};
  grades.forEach((actual) => {
    matrix[actual] = {};
    grades.forEach((pred) => {
      matrix[actual][pred] = 0;
    });
  });

  let total = 0;
  let correct = 0;
  let maeSum = 0;
  let maeCount = 0;

  records.forEach((record) => {
    const actual = record.groundTruthGrade;
    const predicted = record.predictedGrade;
    if (!grades.includes(actual) || !grades.includes(predicted)) return;

    matrix[actual][predicted] += 1;
    total += 1;
    if (actual === predicted) correct += 1;

    const predictedScore = Number.isFinite(record.predictedScore)
      ? record.predictedScore
      : gradeToNumeric(predicted);
    const groundTruthScore = Number.isFinite(record.groundTruthScore)
      ? record.groundTruthScore
      : gradeToNumeric(actual);

    if (predictedScore > 0 && groundTruthScore > 0) {
      maeSum += Math.abs(predictedScore - groundTruthScore);
      maeCount += 1;
    }
  });

  const precisionRecall = {};
  grades.forEach((grade) => {
    const tp = matrix[grade][grade];
    const fp = grades.reduce((sum, actual) => (actual === grade ? sum : sum + matrix[actual][grade]), 0);
    const fn = grades.reduce((sum, pred) => (pred === grade ? sum : sum + matrix[grade][pred]), 0);
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    precisionRecall[grade] = {
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1: Number(f1.toFixed(3))
    };
  });

  const accuracy = total === 0 ? 0 : correct / total;
  const mae = maeCount === 0 ? 0 : maeSum / maeCount;

  return {
    totalSamples: total,
    accuracy: Number(accuracy.toFixed(3)),
    meanAbsoluteError: Number(mae.toFixed(2)),
    confusionMatrix: matrix,
    perClass: precisionRecall
  };
};

const computeConfidenceDistribution = (records) => {
  const bins = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '21-40%', min: 21, max: 40 },
    { range: '41-60%', min: 41, max: 60 },
    { range: '61-80%', min: 61, max: 80 },
    { range: '81-100%', min: 81, max: 100 }
  ];

  const counts = bins.map((bin) => ({ ...bin, count: 0 }));

  records.forEach((record) => {
    if (record.confidence === null || record.confidence === undefined) return;
    let value = Number(record.confidence);
    if (!Number.isFinite(value)) return;
    if (value <= 1) value = value * 100;
    value = Math.max(0, Math.min(100, value));

    const bucket = counts.find((bin) => value >= bin.min && value <= bin.max);
    if (bucket) bucket.count += 1;
  });

  return counts.map(({ range, count }) => ({ range, count }));
};

/**
 * Call the Python ML comparison service.
 * Returns null silently if the service is unavailable (non-blocking).
 */
const callMLService = async (fileBuffer, mimetype) => {
  try {
    const FormData = (await import('formdata-node')).FormData;
    const { Blob } = (await import('node:buffer'));
    const form = new FormData();
    form.append('image', new Blob([fileBuffer], { type: mimetype }), 'image.jpg');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${ML_SERVICE_URL}/api/ml-compare`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const json = await response.json();
    return json?.data || null;
  } catch {
    // ML service is optional — fail silently
    return null;
  }
};

app.post('/api/grade', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required (field name: image)' });
    }

    const produceType = req.body?.produceType || null;
    const language = normalizeLanguage(req.body?.language);
    const includeFeatures = String(req.body?.includeFeatures || '').toLowerCase() === 'true';

    const result = await gradeImage({
      file: req.file,
      produceType,
      language
    });

    // Call Python ML service in parallel (non-blocking, optional)
    const mlComparison = await callMLService(req.file.buffer, req.file.mimetype);

    const payload = {
      grade: result.grade,
      overallScore: result.overallScore,
      confidence: result.confidence,
      confidencePercent: result.confidencePercent,
      scores: result.scores,
      explanation: result.explanation,
      explanationSource: result.explanationSource,
      warnings: result.warnings,
      algorithm: result.algorithm,
      model: result.model,
      produceIdentified: result.produceIdentified || null,
      mlComparison: mlComparison || null
    };

    if (includeFeatures) {
      payload.features = result.features;
    }

    return res.status(200).json({
      success: true,
      data: payload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'GEMINI_NOT_CONFIGURED') {
      return res.status(500).json({
        error: 'Gemini API is not configured. Set GEMINI_API_KEY in the backend .env file.'
      });
    }
    if (String(error.message || '').startsWith('AI_RESPONSE_INVALID')) {
      return res.status(502).json({
        error: 'AI response was invalid. Please retry the request.'
      });
    }
    console.error('Error grading image:', error);
    return res.status(500).json({ error: 'Failed to grade image', message: error.message });
  }
});

app.post('/api/batch-grade', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required (field name: images)' });
    }

    const produceType = req.body?.produceType || null;
    const language = normalizeLanguage(req.body?.language);
    const results = await Promise.all(
      req.files.map((file, index) =>
        gradeImage({ file, produceType, language }).then((result) => ({
          index,
          filename: file.originalname,
        grade: result.grade,
        overallScore: result.overallScore,
        confidence: result.confidence,
        confidencePercent: result.confidencePercent,
        scores: result.scores,
        explanation: result.explanation,
        explanationSource: result.explanationSource,
        warnings: result.warnings,
        algorithm: result.algorithm,
        model: result.model,
        produceIdentified: result.produceIdentified || null
      }))
      )
    );

    const scores = results.map((item) => item.overallScore);
    const meanScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const variance = scores.reduce((sum, value) => sum + (value - meanScore) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = clamp(100 - stdDev * 1.5);

    const outliers = stdDev === 0
      ? []
      : results.filter((item) => Math.abs(item.overallScore - meanScore) > 1.5 * stdDev);

    const batchGrade = gradeFromScore(meanScore);
    const averageConfidence = results.reduce((sum, item) => sum + item.confidence, 0) / results.length;

    return res.status(200).json({
      success: true,
      data: {
        batchSummary: {
          grade: batchGrade,
          averageScore: Number(meanScore.toFixed(2)),
          variance: Number(variance.toFixed(2)),
          stdDev: Number(stdDev.toFixed(2)),
          consistencyScore: Number(consistencyScore.toFixed(2)),
          averageConfidence: Number(averageConfidence.toFixed(3)),
          outliers
        },
        items: results
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'GEMINI_NOT_CONFIGURED') {
      return res.status(500).json({
        error: 'Gemini API is not configured. Set GEMINI_API_KEY in the backend .env file.'
      });
    }
    if (String(error.message || '').startsWith('AI_RESPONSE_INVALID')) {
      return res.status(502).json({
        error: 'AI response was invalid. Please retry the request.'
      });
    }
    console.error('Error grading batch:', error);
    return res.status(500).json({ error: 'Failed to grade batch', message: error.message });
  }
});

app.post('/api/pest-diagnosis', upload.array('images', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required (field name: images)' });
    }

    const produceType = req.body?.produceType || null;
    const language = normalizeLanguage(req.body?.language);
    const result = await callGeminiForPestDiagnosis({
      files: req.files,
      produceType,
      language
    });

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message === 'GEMINI_NOT_CONFIGURED') {
      return res.status(500).json({
        error: 'Gemini API is not configured. Set GEMINI_API_KEY in the backend .env file.'
      });
    }
    if (String(error.message || '').startsWith('AI_RESPONSE_INVALID')) {
      return res.status(502).json({
        error: 'AI response was invalid. Please retry the request.'
      });
    }
    console.error('Error diagnosing pest/disease:', error);
    return res.status(500).json({ error: 'Failed to analyze pest/disease', message: error.message });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, texts, target, source } = req.body || {};
    const targetLang = String(target || '').trim();
    if (!targetLang) {
      return res.status(400).json({ error: 'target language is required' });
    }

    const items = Array.isArray(texts)
      ? texts
      : text !== undefined
        ? [text]
        : [];

    if (items.length === 0) {
      return res.status(400).json({ error: 'text or texts is required' });
    }

    const sourceLang = String(source || 'en').trim();
    const translations = await translateBatch(items, sourceLang, targetLang);

    return res.status(200).json({
      success: true,
      data: {
        translations,
        translatedText: translations[0],
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Failed to translate text' });
  }
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const predictedGrade = String(req.body?.predictedGrade || '').toUpperCase();
    const groundTruthGrade = req.body?.groundTruthGrade
      ? String(req.body.groundTruthGrade).toUpperCase()
      : null;

    if (!predictedGrade || !['A', 'B', 'C', 'D'].includes(predictedGrade)) {
      return res.status(400).json({ error: 'predictedGrade is required (A/B/C/D)' });
    }

    if (groundTruthGrade && !['A', 'B', 'C', 'D'].includes(groundTruthGrade)) {
      return res.status(400).json({ error: 'groundTruthGrade must be A/B/C/D if provided' });
    }

    const predictedScoreValue = Number(req.body?.predictedScore);
    const groundTruthScoreValue = Number(req.body?.groundTruthScore);
    const confidenceValue = Number(req.body?.confidence);

    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      produceType: req.body?.produceType || null,
      predictedGrade,
      predictedScore: Number.isFinite(predictedScoreValue) ? predictedScoreValue : null,
      groundTruthGrade,
      groundTruthScore: Number.isFinite(groundTruthScoreValue) ? groundTruthScoreValue : null,
      confidence: Number.isFinite(confidenceValue) ? confidenceValue : null,
      notes: req.body?.notes || null
    };

    await appendEvaluation(record);

    return res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error logging evaluation:', error);
    return res.status(500).json({ error: 'Failed to log evaluation', message: error.message });
  }
});

app.get('/api/evaluations/metrics', async (req, res) => {
  try {
    const records = await loadEvaluations();
    const usableRecords = records.filter((record) => record.groundTruthGrade);
    const metrics = computeMetrics(usableRecords);
    const confidenceDistribution = computeConfidenceDistribution(records);

    return res.status(200).json({
      success: true,
      data: {
        ...metrics,
        confidenceDistribution
      },
      totalLogged: records.length,
      totalWithGroundTruth: usableRecords.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error computing metrics:', error);
    return res.status(500).json({ error: 'Failed to compute metrics', message: error.message });
  }
});

// Main endpoint for produce price prediction
app.post('/predict-price', upload.fields([
  { name: 'produceImage', maxCount: 1 },
  { name: 'organicCertificate', maxCount: 1 },
  { name: 'fertilizerCertificate', maxCount: 1 },
  { name: 'pesticideCertificate', maxCount: 1 },
  { name: 'heavyMetalCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    // Validate required fields
    if (!req.files || !req.files.produceImage) {
      return res.status(400).json({ error: 'Produce image is required' });
    }

    const {
      isOrganic,
      fertilizerUsed,
      fertilizerSelfDeclared,
      pesticidesUsed,
      pesticideSelfDeclared,
      normalGrowthPeriod,
      heavyMetalsPresent,
      heavyMetalSelfDeclared
    } = req.body;
    const language = normalizeLanguage(req.body?.language);
    const languageLabel = LANGUAGE_LABELS[language] || 'English';

    // Convert produce image to base64
    const produceImageBase64 = bufferToBase64(req.files.produceImage[0].buffer);
    const produceImageMimeType = req.files.produceImage[0].mimetype;

    // Prepare content array for Gemini
    const contents = [];

    // Add produce image
    contents.push({
      inlineData: {
        mimeType: produceImageMimeType,
        data: produceImageBase64,
      },
    });

    // Add certificate images if provided
    if (req.files.organicCertificate) {
      contents.push({
        inlineData: {
          mimeType: req.files.organicCertificate[0].mimetype,
          data: bufferToBase64(req.files.organicCertificate[0].buffer),
        },
      });
    }

    if (req.files.fertilizerCertificate) {
      contents.push({
        inlineData: {
          mimeType: req.files.fertilizerCertificate[0].mimetype,
          data: bufferToBase64(req.files.fertilizerCertificate[0].buffer),
        },
      });
    }

    if (req.files.pesticideCertificate) {
      contents.push({
        inlineData: {
          mimeType: req.files.pesticideCertificate[0].mimetype,
          data: bufferToBase64(req.files.pesticideCertificate[0].buffer),
        },
      });
    }

    if (req.files.heavyMetalCertificate) {
      contents.push({
        inlineData: {
          mimeType: req.files.heavyMetalCertificate[0].mimetype,
          data: bufferToBase64(req.files.heavyMetalCertificate[0].buffer),
        },
      });
    }

    // Build comprehensive prompt
    const prompt = `
You are an expert agricultural produce price analyst for the Indian market. Analyze the provided produce image and parameters to determine a fair market price.
Respond in ${languageLabel} (${language}). Use the target language for all human-readable values. Keep JSON keys in English.

PRODUCE ANALYSIS PARAMETERS:
1. Image Analysis: Identify the produce type, quality, freshness, and estimated quantity from the first image provided.

2. Organic Status: ${isOrganic === 'yes' ? 'This produce is organically grown' : 'This produce is not organically grown'}

3. Fertilizer Usage: 
   - Fertilizer Used: ${fertilizerUsed === 'yes' ? 'Yes' : 'No'}
   ${fertilizerUsed === 'no' ? `- Certification Status: ${req.files.fertilizerCertificate ? 'Lab certificate provided (verify from additional image)' : fertilizerSelfDeclared === 'yes' ? 'Self-declared (no certificate)' : 'Not applicable'}` : ''}

4. Pesticide Usage:
   - Pesticides Used: ${pesticidesUsed === 'yes' ? 'Yes' : 'No'}
   ${pesticidesUsed === 'yes' ? `- Certification Status: ${req.files.pesticideCertificate ? 'Lab certificate provided (verify from additional image)' : pesticideSelfDeclared === 'yes' ? 'Self-declared (no certificate)' : 'Not applicable'}` : ''}

5. Growth Period: ${normalGrowthPeriod === 'yes' ? 'Grown during normal growth period in India' : 'Not grown during normal growth period'}

6. Heavy Metals:
   - Heavy Metals Present: ${heavyMetalsPresent === 'no' ? 'Farmer claims no heavy metals' : 'Possible heavy metal presence'}
   ${heavyMetalsPresent === 'no' ? `- Certification Status: ${req.files.heavyMetalCertificate ? 'Lab certificate provided (verify from additional image)' : heavyMetalSelfDeclared === 'yes' ? 'Self-declared (no certificate)' : 'Not applicable'}` : ''}

PRICING RULES:
- Start with the current average market price for this produce in India (per kg or appropriate unit)
- For each parameter with LAB CERTIFICATE: Add 10% price increase
- For each parameter with SELF-DECLARATION (no certificate): Add 5% price increase
- Consider produce quality, freshness, and seasonal factors in base price
- Base grading should be derived from visible quality in the image.

RESPONSE FORMAT (JSON ONLY):
{
  "produceIdentified": "name of the produce",
  "estimatedQuantity": "estimated quantity with unit",
  "baseMarketPrice": number (in INR per kg or appropriate unit),
  "qualityAssessment": "description of quality and freshness",
  "grading": {
      "grade": "A/B/C/D",
      "score": number (0-100),
      "reason": "explanation based on visual evidence"
  },
  "priceAdjustments": {
    "organicPremium": {
      "applicable": boolean,
      "percentageIncrease": number,
      "amount": number,
      "reasoning": "explanation"
    },
    "fertilizerFree": {
      "applicable": boolean,
      "hasCertificate": boolean,
      "percentageIncrease": number,
      "amount": number,
      "reasoning": "explanation"
    },
    "pesticideStatus": {
      "applicable": boolean,
      "hasCertificate": boolean,
      "percentageIncrease": number,
      "amount": number,
      "reasoning": "explanation"
    },
    "normalGrowthPeriod": {
      "applicable": boolean,
      "percentageIncrease": number,
      "amount": number,
      "reasoning": "explanation"
    },
    "heavyMetalFree": {
      "applicable": boolean,
      "hasCertificate": boolean,
      "percentageIncrease": number,
      "amount": number,
      "reasoning": "explanation"
    }
  },
  "totalPriceIncrease": number,
  "recommendedPrice": number (in INR),
  "priceRange": {
    "minimum": number,
    "maximum": number
  },
  "marketComparison": "how this price compares to standard market rates",
  "additionalNotes": "any other relevant observations"
}

Respond ONLY with valid JSON. Be precise and realistic with Indian market prices.
`;

    contents.push({ text: prompt });

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    const responseText = response.candidates[0].content.parts[0].text;

    // Extract JSON from response (remove markdown code blocks if present)
    let jsonResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        jsonResponse = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(500).json({
        error: 'Failed to parse AI response',
        rawResponse: responseText
      });
    }

    res.status(200).json({
      success: true,
      data: jsonResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating price prediction:', error);
    res.status(500).json({
      error: 'Failed to process produce price prediction',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'CropWise Backend API',
    geminiConfigured: Boolean(ai),
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`✨ Server is running on http://localhost:${port}`);
  console.log('📊 Crop grading API ready');
  console.log('🔍 POST /api/grade - Single image grading');
  console.log('🧺 POST /api/batch-grade - Batch grading');
  console.log('🐛 POST /api/pest-diagnosis - Pest & disease diagnosis');
  console.log('🧪 POST /api/evaluations - Log evaluations');
  console.log('📈 GET  /api/evaluations/metrics - Metrics');
  console.log('❤️  GET /health - Health check');

  // Auto-start Python ML comparison service
  startMLService();
});
