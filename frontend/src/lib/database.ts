import { supabase } from '@/integrations/supabase/client';
import { GradingResult, BatchGradingResult, PriceEstimation, Grade, CropType, RecentGradingResult, PestDiagnosis, PestDiagnosisRecord } from '@/types/grading';

// Save single grading result to database
export const saveGradingResult = async (result: GradingResult, userId: string) => {
  const { error } = await supabase.from('grading_results').insert({
    id: result.id,
    user_id: userId,
    image_url: result.imageUrl,
    crop_type: result.cropType,
    grade: result.grade,
    confidence: result.confidence,
    overall_score: result.overallScore,
    color_quality: result.scores.colorQuality,
    size_shape: result.scores.sizeShape,
    surface_quality: result.scores.surfaceQuality,
    disease_pest: result.scores.diseasePest,
    ripeness: result.scores.ripeness,
    overall_appeal: result.scores.overallAppeal,
    explanation_color: result.explanation.colorQuality,
    explanation_size: result.explanation.sizeShape,
    explanation_surface: result.explanation.surfaceQuality,
    explanation_disease: result.explanation.diseasePest,
    explanation_ripeness: result.explanation.ripeness,
    explanation_appeal: result.explanation.overallAppeal,
    recommendations: result.explanation.recommendations,
    observations: result.explanation.observations,
    requires_human_verification: result.requiresHumanVerification,
  });
  
  if (error) {
    console.error('Failed to save grading result:', error);
    throw error;
  }
};

// Save batch grading result to database
export const saveBatchGradingResult = async (result: BatchGradingResult, userId: string) => {
  const { error } = await supabase.from('batch_grading_results').insert({
    id: result.id,
    user_id: userId,
    average_grade: result.averageGrade,
    average_score: result.averageScore,
    min_score: result.minScore,
    max_score: result.maxScore,
    variance: result.variance,
    standard_deviation: result.standardDeviation,
    consistency_score: result.consistencyScore,
    grade_distribution: result.gradeDistribution,
    batch_recommendation: result.batchRecommendation,
    outlier_count: result.outliers.length,
    image_count: result.results.length,
  });
  
  if (error) {
    console.error('Failed to save batch result:', error);
    throw error;
  }
};

// Save price estimation to database
export const savePriceEstimation = async (estimation: PriceEstimation, userId: string) => {
  const { error } = await supabase.from('price_estimations').insert({
    user_id: userId,
    crop_type: estimation.cropType,
    grade: estimation.grade,
    quantity: estimation.quantity,
    region: estimation.region,
    base_price: estimation.basePrice,
    grade_adjustment: estimation.gradeAdjustment,
    organic_premium: estimation.organicPremium,
    pesticide_free_premium: estimation.pesticideFreePremium,
    self_declaration_premium: estimation.selfDeclarationPremium,
    total_premium_percentage: estimation.totalPremiumPercentage,
    final_price_per_kg: estimation.finalPricePerKg,
    total_price: estimation.totalPrice,
  });
  
  if (error) {
    console.error('Failed to save price estimation:', error);
    throw error;
  }
};

// Save pest or disease diagnosis to database
export const savePestDiagnosis = async (diagnosis: PestDiagnosis, userId: string, imageCount: number) => {
  const { error } = await supabase.from('pest_diagnostics').insert({
    user_id: userId,
    produce_identified: diagnosis.produceIdentified,
    issue_type: diagnosis.issueType,
    issue_name: diagnosis.issueName,
    confidence_percent: diagnosis.confidencePercent,
    severity: diagnosis.severity,
    symptoms: diagnosis.symptoms,
    likely_causes: diagnosis.likelyCauses,
    current_solution: diagnosis.currentSolution,
    future_precautions: diagnosis.futurePrecautions,
    monitoring: diagnosis.monitoring,
    when_to_escalate: diagnosis.whenToEscalate,
    disclaimer: diagnosis.disclaimer,
    image_count: imageCount,
  });

  if (error) {
    // Handle case where table doesn't exist (PGRST205 error)
    if (error.code === 'PGRST205' || error.message?.includes('could not find')) {
      console.warn('Pest diagnostics table not available. Feature disabled.');
      return; // Silently skip saving
    }
    console.error('Failed to save pest diagnosis:', error);
    throw error;
  }
};

// Fetch user's grading results
export const fetchGradingResults = async (userId: string): Promise<GradingResult[]> => {
  const { data, error } = await supabase
    .from('grading_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch grading results:', error);
    throw error;
  }
  
  return (data || []).map(row => ({
    id: row.id,
    imageUrl: row.image_url || '',
    cropType: row.crop_type as CropType,
    grade: row.grade as Grade,
    confidence: Number(row.confidence),
    overallScore: Number(row.overall_score),
    scores: {
      colorQuality: Number(row.color_quality),
      sizeShape: Number(row.size_shape),
      surfaceQuality: Number(row.surface_quality),
      diseasePest: Number(row.disease_pest),
      ripeness: Number(row.ripeness),
      overallAppeal: Number(row.overall_appeal),
    },
    explanation: {
      colorQuality: row.explanation_color || '',
      sizeShape: row.explanation_size || '',
      surfaceQuality: row.explanation_surface || '',
      diseasePest: row.explanation_disease || '',
      ripeness: row.explanation_ripeness || '',
      overallAppeal: row.explanation_appeal || '',
      recommendations: row.recommendations || [],
      observations: row.observations || [],
    },
    timestamp: new Date(row.created_at),
    requiresHumanVerification: row.requires_human_verification || false,
  }));
};

// Fetch recent grading results for dashboard
export const fetchRecentGradingResults = async (userId: string, limit = 3): Promise<RecentGradingResult[]> => {
  const { data, error } = await supabase
    .from('grading_results')
    .select('id, crop_type, grade, confidence, overall_score, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent grading results:', error);
    throw error;
  }

  return (data || []).map(row => ({
    id: row.id,
    cropType: (row.crop_type || 'unknown') as CropType,
    grade: row.grade as Grade,
    confidence: Number(row.confidence),
    overallScore: Number(row.overall_score),
    timestamp: new Date(row.created_at),
  }));
};

// Fetch user's batch grading results
export const fetchBatchGradingResults = async (userId: string): Promise<BatchGradingResult[]> => {
  const { data, error } = await supabase
    .from('batch_grading_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch batch results:', error);
    throw error;
  }
  
  return (data || []).map(row => ({
    id: row.id,
    results: [],
    averageGrade: row.average_grade as Grade,
    averageScore: Number(row.average_score),
    variance: Number(row.variance),
    standardDeviation: Number(row.standard_deviation),
    minScore: Number(row.min_score),
    maxScore: Number(row.max_score),
    consistencyScore: Number(row.consistency_score),
    outliers: [],
    gradeDistribution: row.grade_distribution as Record<Grade, number>,
    batchRecommendation: row.batch_recommendation || '',
    timestamp: new Date(row.created_at),
  }));
};

// Fetch user's price estimations
export const fetchPriceEstimations = async (userId: string): Promise<PriceEstimation[]> => {
  const { data, error } = await supabase
    .from('price_estimations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch price estimations:', error);
    throw error;
  }
  
  return (data || []).map(row => ({
    cropType: row.crop_type as CropType,
    grade: row.grade as Grade,
    quantity: Number(row.quantity),
    region: row.region,
    basePrice: Number(row.base_price),
    gradeAdjustment: Number(row.grade_adjustment),
    organicPremium: Number(row.organic_premium),
    pesticideFreePremium: Number(row.pesticide_free_premium),
    selfDeclarationPremium: Number(row.self_declaration_premium),
    totalPremiumPercentage: Number(row.total_premium_percentage),
    finalPricePerKg: Number(row.final_price_per_kg),
    totalPrice: Number(row.total_price),
    priceBreakdown: [],
  }));
};

// Fetch user's pest diagnoses
export const fetchPestDiagnoses = async (userId: string): Promise<PestDiagnosisRecord[]> => {
  const { data, error } = await supabase
    .from('pest_diagnostics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    // Handle case where table does not exist (PGRST205 error)
    if (error.code === 'PGRST205' || error.message?.includes('could not find')) {
      console.warn('Pest diagnostics table not available:', error.message);
      return [];
    }
    console.error('Failed to fetch pest diagnoses:', error);
    throw error;
  }

  return (data || []).map(row => ({
    id: row.id,
    produceIdentified: row.produce_identified || 'unknown',
    issueType: row.issue_type,
    issueName: row.issue_name,
    confidencePercent: Number(row.confidence_percent),
    severity: row.severity,
    symptoms: row.symptoms || [],
    likelyCauses: row.likely_causes || [],
    currentSolution: row.current_solution || [],
    futurePrecautions: row.future_precautions || [],
    monitoring: row.monitoring || [],
    whenToEscalate: row.when_to_escalate || '',
    disclaimer: row.disclaimer || '',
    imageCount: Number(row.image_count || 1),
    timestamp: new Date(row.created_at),
  }));
};

// Get user statistics from database
export const fetchUserStats = async (userId: string) => {
  const [gradingResults, batchResults, priceEstimations] = await Promise.all([
    supabase.from('grading_results').select('confidence').eq('user_id', userId),
    supabase.from('batch_grading_results').select('image_count').eq('user_id', userId),
    supabase.from('price_estimations').select('id').eq('user_id', userId),
  ]);
  
  const singleCount = gradingResults.data?.length || 0;
  const batchImageCount = (batchResults.data || []).reduce((sum, b) => sum + (b.image_count || 0), 0);
  const totalSamples = singleCount + batchImageCount;
  
  const confidences = (gradingResults.data || []).map(r => Number(r.confidence));
  const avgConfidence = confidences.length > 0 
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10) / 10 
    : 0;
  
  return {
    totalSingleAnalyses: singleCount,
    totalBatchAnalyses: batchResults.data?.length || 0,
    totalSamplesAnalyzed: totalSamples,
    averageConfidence: avgConfidence,
    priceEstimationsCount: priceEstimations.data?.length || 0,
  };
};

// Delete all user data
export const clearUserData = async (userId: string) => {
  const deleteOperations = [
    supabase.from('grading_results').delete().eq('user_id', userId),
    supabase.from('batch_grading_results').delete().eq('user_id', userId),
    supabase.from('price_estimations').delete().eq('user_id', userId),
  ];
  
  // Try to delete pest diagnostics, but don't fail if table doesn't exist
  try {
    await supabase.from('pest_diagnostics').delete().eq('user_id', userId);
  } catch (error: unknown) {
    const dbError = error as { code?: string };
    if (dbError?.code !== 'PGRST205') {
      console.warn('Could not delete pest diagnostics:', error);
    }
  }
  
  await Promise.all(deleteOperations);
};
