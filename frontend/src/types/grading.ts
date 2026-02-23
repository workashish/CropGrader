// Core grading types for the crop assessment system

export type CropType = 
  | 'unknown'
  | 'mango' 
  | 'tomato' 
  | 'apple' 
  | 'banana' 
  | 'orange' 
  | 'potato' 
  | 'onion' 
  | 'carrot';

export type Grade = 'A' | 'B' | 'C' | 'D';

export interface QualityScores {
  colorQuality: number;
  sizeShape: number;
  surfaceQuality: number;
  diseasePest: number;
  ripeness: number;
  overallAppeal: number;
}

export interface XAIExplanation {
  colorQuality: string;
  sizeShape: string;
  surfaceQuality: string;
  diseasePest: string;
  ripeness: string;
  overallAppeal: string;
  recommendations: string[];
  observations: string[];
}

export interface GradingResult {
  id: string;
  imageUrl: string;
  cropType: CropType;
  grade: Grade;
  confidence: number;
  scores: QualityScores;
  explanation: XAIExplanation;
  overallScore: number;
  timestamp: Date;
  requiresHumanVerification: boolean;
  algorithm?: string;
  explanationSource?: 'rules' | 'ai';
  warnings?: string[];
  model?: {
    type?: string;
    version?: string;
    cvEngineUrl?: string;
    provider?: string;
    pipeline?: string;
  };
  mlComparison?: MLComparisonData | null;
}

export interface MLComparisonData {
  models: Record<string, QualityScores>;
  featuresExtracted: number;
  featureValues?: Record<string, number>;
  inferenceTimeMs: number;
}

export interface RecentGradingResult {
  id: string;
  cropType: CropType;
  grade: Grade;
  confidence: number;
  overallScore: number;
  timestamp: Date;
}

export type PestIssueType = 'disease' | 'pest' | 'nutrient' | 'abiotic' | 'unknown';
export type PestSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PestDiagnosis {
  produceIdentified: string;
  issueType: PestIssueType;
  issueName: string;
  confidencePercent: number;
  severity: PestSeverity;
  symptoms: string[];
  likelyCauses: string[];
  currentSolution: string[];
  futurePrecautions: string[];
  monitoring: string[];
  whenToEscalate: string;
  disclaimer: string;
}

export interface PestDiagnosisRecord extends PestDiagnosis {
  id: string;
  imageCount: number;
  timestamp: Date;
}

export interface BatchGradingResult {
  id: string;
  results: GradingResult[];
  averageGrade: Grade;
  averageScore: number;
  variance: number;
  standardDeviation: number;
  minScore: number;
  maxScore: number;
  consistencyScore: number;
  outliers: string[];
  gradeDistribution: Record<Grade, number>;
  batchRecommendation: string;
  timestamp: Date;
  averageConfidence?: number;
}

export interface PriceEstimation {
  cropType: CropType;
  grade: Grade;
  quantity: number;
  region: string;
  basePrice: number;
  gradeAdjustment: number;
  organicPremium: number;
  pesticideFreePremium: number;
  selfDeclarationPremium: number;
  totalPremiumPercentage: number;
  finalPricePerKg: number;
  totalPrice: number;
  priceBreakdown: {
    label: string;
    value: number;
    percentage?: number;
  }[];
}

export interface AccuracyMetrics {
  overallAccuracy: number;
  totalSamples: number;
  confusionMatrix: number[][];
  classMetrics: {
    grade: Grade;
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }[];
  priceMetrics: {
    meanAbsoluteError: number | null;
    percentageDeviation: number | null;
  };
  confidenceDistribution: {
    range: string;
    count: number;
  }[];
}

export interface GradingSession {
  id: string;
  results: GradingResult[];
  batchResults: BatchGradingResult[];
  priceEstimations: PriceEstimation[];
  createdAt: Date;
}
