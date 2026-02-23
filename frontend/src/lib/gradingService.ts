import {
  CropType,
  Grade,
  GradingResult,
  QualityScores,
  XAIExplanation,
  BatchGradingResult,
  PriceEstimation,
  AccuracyMetrics,
  PestDiagnosis
} from '@/types/grading';
import { BASE_PRICES, GRADE_MULTIPLIERS, CERTIFICATION_PREMIUMS, GRADE_THRESHOLDS } from './constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Convert image file/blob to base64
export const imageToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return imageToBase64(blob);
};

// Main grading function - Calls Node.js Backend which orchestrates Python CV + Gemini
const buildExplanation = (
  scores: QualityScores,
  explanationText: string | undefined,
  warnings: string[]
): XAIExplanation => {
  const observations = [
    explanationText,
    ...warnings.map(warning => `Note: ${warning}`),
  ].filter(Boolean) as string[];

  const recommendations = warnings.length > 0
    ? warnings.map(warning => warning)
    : ['Capture images with even lighting and minimal background clutter.'];

  return {
    observations,
    recommendations,
    colorQuality: `HSV color saturation + brightness score (${scores.colorQuality}%).`,
    sizeShape: `Aspect ratio, solidity, and contour extent (${scores.sizeShape}%).`,
    surfaceQuality: `Texture smoothness and edge density (${scores.surfaceQuality}%).`,
    diseasePest: `Defect density and dark spot ratio (${scores.diseasePest}%).`,
    ripeness: `Saturation-driven ripeness index (${scores.ripeness}%).`,
    overallAppeal: `Image quality + composite weighting (${scores.overallAppeal}%).`,
  };
};

const mapApiScores = (apiScores: Record<string, number> | undefined): QualityScores => ({
  colorQuality: Math.round(apiScores?.colorQuality ?? 0),
  sizeShape: Math.round(apiScores?.sizeShape ?? 0),
  surfaceQuality: Math.round(apiScores?.surfaceQuality ?? 0),
  diseasePest: Math.round(apiScores?.diseaseDamage ?? apiScores?.diseasePest ?? 0),
  ripeness: Math.round(apiScores?.ripeness ?? 0),
  overallAppeal: Math.round(apiScores?.imageQuality ?? apiScores?.overallAppeal ?? 0),
});

const inferCropType = (identified?: string): CropType | null => {
  if (!identified) return null;
  const value = identified.toLowerCase();
  if (value.includes('apple')) return 'apple';
  if (value.includes('mango')) return 'mango';
  if (value.includes('tomato')) return 'tomato';
  if (value.includes('banana')) return 'banana';
  if (value.includes('orange')) return 'orange';
  if (value.includes('potato')) return 'potato';
  if (value.includes('onion')) return 'onion';
  if (value.includes('carrot')) return 'carrot';
  return null;
};

interface ApiGradingData {
  confidencePercent?: number;
  confidence?: number;
  scores?: Record<string, number>;
  overallScore?: number;
  explanation?: string;
  warnings?: string[];
  algorithm?: string;
  model?: { type?: string; version?: string; cvEngineUrl?: string; provider?: string; pipeline?: string };
  produceIdentified?: string;
  grade?: Grade;
  explanationSource?: 'rules' | 'ai';
  mlComparison?: {
    models: Record<string, Record<string, number>>;
    featuresExtracted: number;
    featureValues?: Record<string, number>;
    inferenceTimeMs: number;
  } | null;
}

const buildGradingResult = (
  imageUrl: string,
  cropType: CropType | undefined,
  apiData: ApiGradingData
): GradingResult => {
  const confidenceRaw = Number(apiData?.confidencePercent ?? (apiData?.confidence ?? 0) * 100);
  const confidence = Number.isFinite(confidenceRaw) ? Math.round(confidenceRaw) : 0;
  const scores = mapApiScores(apiData?.scores);
  const overallScore = Math.round(apiData?.overallScore ?? 0);
  if (overallScore > 0) {
    scores.overallAppeal = overallScore;
  }
  const explanationText = apiData?.explanation as string | undefined;
  const warnings = (apiData?.warnings as string[]) || [];
  const algorithm = apiData?.algorithm || apiData?.model?.type || 'Rule-based CV scoring';
  const inferredCrop = inferCropType(apiData?.produceIdentified);
  const resolvedCrop = inferredCrop ?? cropType ?? 'unknown';

  return {
    id: crypto.randomUUID(),
    imageUrl,
    cropType: resolvedCrop,
    grade: (apiData?.grade as Grade) || 'C',
    confidence,
    scores,
    explanation: buildExplanation(scores, explanationText, warnings),
    overallScore,
    timestamp: new Date(),
    requiresHumanVerification: confidence < 70 || warnings.length > 0,
    algorithm,
    explanationSource: apiData?.explanationSource,
    warnings,
    model: apiData?.model,
    mlComparison: apiData?.mlComparison ? {
      models: Object.fromEntries(
        Object.entries(apiData.mlComparison.models).map(([name, scores]) => [
          name,
          {
            colorQuality: Math.round(scores.colorQuality ?? 0),
            sizeShape: Math.round(scores.sizeShape ?? 0),
            surfaceQuality: Math.round(scores.surfaceQuality ?? 0),
            diseasePest: Math.round(scores.diseasePest ?? scores.diseaseDamage ?? 0),
            ripeness: Math.round(scores.ripeness ?? 0),
            overallAppeal: Math.round(scores.overallAppeal ?? 0),
          },
        ])
      ),
      featuresExtracted: apiData.mlComparison.featuresExtracted,
      featureValues: apiData.mlComparison.featureValues,
      inferenceTimeMs: apiData.mlComparison.inferenceTimeMs,
    } : null,
  };
};

// Main grading function - Calls Node.js Backend for CV scoring
export const gradeCrop = async (
  imageUrl: string,
  cropType?: CropType,
  language: string = 'en'
): Promise<GradingResult> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image', blob, 'image.jpg');
    if (cropType) {
      formData.append('produceType', cropType);
    }
    formData.append('language', language);

    const apiResponse = await fetch(`${API_BASE_URL}/api/grade`, {
      method: 'POST',
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      try {
        const parsed = JSON.parse(errorText);
        const message = parsed?.action
          ? `${parsed.error} ${parsed.action}`
          : parsed?.error || errorText;
        throw new Error(message);
      } catch {
        throw new Error(`Analysis API failed: ${errorText}`);
      }
    }

    const json = await apiResponse.json();
    const data = json.data;

    return buildGradingResult(imageUrl, cropType, data);
  } catch (error) {
    console.error('Grading error:', error);
    throw error;
  }
};

export const detectPestDisease = async (
  files: File[],
  language: string = 'en'
): Promise<PestDiagnosis> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file, file.name || 'image.jpg');
    });
    formData.append('language', language);

    const apiResponse = await fetch(`${API_BASE_URL}/api/pest-diagnosis`, {
      method: 'POST',
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      try {
        const parsed = JSON.parse(errorText);
        throw new Error(parsed?.error || errorText);
      } catch {
        throw new Error(`Pest diagnosis API failed: ${errorText}`);
      }
    }

    const json = await apiResponse.json();
    return json.data as PestDiagnosis;
  } catch (error) {
    console.error('Pest diagnosis error:', error);
    throw error;
  }
};


// Batch grading function
export const gradeBatch = async (
  images: { url: string; file: File; cropType: CropType }[],
  language: string = 'en'
): Promise<BatchGradingResult> => {
  if (images.length === 0) {
    throw new Error('No images provided for batch grading');
  }

  const formData = new FormData();
  images.forEach((image) => {
    formData.append('images', image.file, image.file.name || 'image.jpg');
  });
  formData.append('produceType', images[0].cropType);
  formData.append('language', language);

  const apiResponse = await fetch(`${API_BASE_URL}/api/batch-grade`, {
    method: 'POST',
    body: formData,
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    try {
      const parsed = JSON.parse(errorText);
      const message = parsed?.action
        ? `${parsed.error} ${parsed.action}`
        : parsed?.error || errorText;
      throw new Error(message);
    } catch {
      throw new Error(`Batch API failed: ${errorText}`);
    }
  }

  const json = await apiResponse.json();
  const data = json.data;
  const items = data.items || [];

  const results: GradingResult[] = items.map((item: ApiGradingData & { index: number }) => {
    const imageUrl = images[item.index]?.url || images[0]?.url || '';
    return buildGradingResult(imageUrl, images[0].cropType, item);
  });

  if (results.length === 0) {
    throw new Error('No images were successfully graded');
  }

  const idMap = new Map<number, string>();
  results.forEach((result, idx) => {
    idMap.set(items[idx]?.index ?? idx, result.id);
  });

  const outliers = (data.batchSummary?.outliers || [])
    .map((outlier: { index: number }) => idMap.get(outlier.index))
    .filter(Boolean) as string[];

  const scores = results.map(r => r.overallScore);
  const gradeDistribution: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0 };
  results.forEach(r => gradeDistribution[r.grade]++);

  const averageScore = data.batchSummary?.averageScore ?? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const averageConfidenceRaw = data.batchSummary?.averageConfidence ?? (results.reduce((sum, r) => sum + r.confidence, 0) / results.length);
  const averageConfidence = averageConfidenceRaw <= 1
    ? Math.round(averageConfidenceRaw * 100)
    : Math.round(averageConfidenceRaw);

  return {
    id: crypto.randomUUID(),
    results,
    averageGrade: data.batchSummary?.grade || getGradeFromScore(averageScore),
    averageScore: Math.round(averageScore),
    variance: Number(data.batchSummary?.variance ?? 0),
    standardDeviation: Number(data.batchSummary?.stdDev ?? 0),
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    consistencyScore: Math.round(data.batchSummary?.consistencyScore ?? 0),
    averageConfidence,
    outliers,
    gradeDistribution,
    batchRecommendation: getBatchRecommendation(averageScore, data.batchSummary?.consistencyScore ?? 0, outliers.length),
    timestamp: new Date(),
  };
};

const getGradeFromScore = (score: number): Grade => {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
};

const getBatchRecommendation = (avgScore: number, consistency: number, outlierCount: number): string => {
  if (avgScore >= 85 && consistency >= 80) {
    return 'Excellent batch quality. Suitable for premium export markets with minimal sorting required.';
  }
  if (avgScore >= 75 && consistency >= 70) {
    return 'Good batch quality. Recommended for standard retail with light quality sorting.';
  }
  if (avgScore >= 60) {
    return `Moderate batch quality. Consider sorting to separate ${outlierCount > 0 ? 'outliers and ' : ''}lower-grade specimens.`;
  }
  return 'Below-average batch quality. Recommended for processing or local wholesale markets. Extensive sorting advised.';
};

export const estimatePrice = (
  cropType: CropType,
  grade: Grade,
  quantity: number,
  region: string,
  certifications: {
    organic: boolean;
    pesticideFree: boolean;
    selfDeclaration: boolean;
  }
): PriceEstimation => {
  const basePrice = BASE_PRICES[cropType];
  const gradeMultiplier = GRADE_MULTIPLIERS[grade];
  const gradeAdjustedPrice = basePrice * gradeMultiplier;

  let totalPremiumPercentage = 0;
  const organicPremium = certifications.organic ? CERTIFICATION_PREMIUMS.organic : 0;
  const pesticideFreePremium = certifications.pesticideFree ? CERTIFICATION_PREMIUMS.pesticideFree : 0;
  const selfDeclarationPremium = certifications.selfDeclaration && !certifications.organic && !certifications.pesticideFree
    ? CERTIFICATION_PREMIUMS.selfDeclaration : 0;

  totalPremiumPercentage = organicPremium + pesticideFreePremium + selfDeclarationPremium;

  const premiumAmount = gradeAdjustedPrice * (totalPremiumPercentage / 100);
  const finalPricePerKg = gradeAdjustedPrice + premiumAmount;
  const totalPrice = finalPricePerKg * quantity;

  const priceBreakdown = [
    { label: 'Base Market Price', value: basePrice, percentage: undefined },
    { label: `Grade ${grade} Adjustment`, value: gradeAdjustedPrice - basePrice, percentage: (gradeMultiplier - 1) * 100 },
  ];

  if (organicPremium > 0) {
    priceBreakdown.push({ label: 'Organic Certification', value: basePrice * gradeMultiplier * organicPremium / 100, percentage: organicPremium });
  }
  if (pesticideFreePremium > 0) {
    priceBreakdown.push({ label: 'Pesticide-Free Certificate', value: basePrice * gradeMultiplier * pesticideFreePremium / 100, percentage: pesticideFreePremium });
  }
  if (selfDeclarationPremium > 0) {
    priceBreakdown.push({ label: 'Self-Declaration Bonus', value: basePrice * gradeMultiplier * selfDeclarationPremium / 100, percentage: selfDeclarationPremium });
  }

  return {
    cropType,
    grade,
    quantity,
    region,
    basePrice,
    gradeAdjustment: gradeAdjustedPrice - basePrice,
    organicPremium,
    pesticideFreePremium,
    selfDeclarationPremium,
    totalPremiumPercentage,
    finalPricePerKg: Math.round(finalPricePerKg * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    priceBreakdown,
  };
};

export const getAccuracyMetrics = async (): Promise<AccuracyMetrics | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/evaluations/metrics`);
    if (!response.ok) {
      return null;
    }
    const json = await response.json();
    const data = json.data;

    const grades: Grade[] = ['A', 'B', 'C', 'D'];
    const confusionMatrix = grades.map((actual) =>
      grades.map((predicted) => Number(data?.confusionMatrix?.[actual]?.[predicted] ?? 0))
    );

    const classMetrics = grades.map((grade) => {
      const stats = data?.perClass?.[grade] || { precision: 0, recall: 0, f1: 0 };
      const support = confusionMatrix[grades.indexOf(grade)].reduce((sum, value) => sum + value, 0);

      return {
        grade,
        precision: Math.round((stats.precision || 0) * 1000) / 10,
        recall: Math.round((stats.recall || 0) * 1000) / 10,
        f1Score: Math.round((stats.f1 || 0) * 1000) / 10,
        support,
      };
    });

    const confidenceDistribution = (data?.confidenceDistribution || [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ]).map((item: { range: string; count: number }) => ({
      range: item.range,
      count: item.count,
    }));

    return {
      overallAccuracy: Math.round((data?.accuracy || 0) * 100),
      totalSamples: Number(data?.totalSamples || 0),
      confusionMatrix,
      classMetrics,
      priceMetrics: {
        meanAbsoluteError: Number.isFinite(data?.meanAbsoluteError) ? Number(data?.meanAbsoluteError) : null,
        percentageDeviation: null,
      },
      confidenceDistribution,
    };
  } catch (error) {
    console.error('Accuracy metrics error:', error);
    return null;
  }
};

export const logEvaluation = async (payload: {
  predictedGrade: Grade;
  predictedScore?: number;
  confidence?: number;
  groundTruthGrade?: Grade;
  groundTruthScore?: number;
  produceType?: CropType;
  notes?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evaluation log failed: ${errorText}`);
  }

  const json = await response.json();
  return json.data;
};
