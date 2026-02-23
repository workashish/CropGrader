-- Create grading_results table for storing single crop analyses
CREATE TABLE public.grading_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  crop_type TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  confidence NUMERIC NOT NULL,
  overall_score NUMERIC NOT NULL,
  color_quality NUMERIC NOT NULL,
  size_shape NUMERIC NOT NULL,
  surface_quality NUMERIC NOT NULL,
  disease_pest NUMERIC NOT NULL,
  ripeness NUMERIC NOT NULL,
  overall_appeal NUMERIC NOT NULL,
  explanation_color TEXT,
  explanation_size TEXT,
  explanation_surface TEXT,
  explanation_disease TEXT,
  explanation_ripeness TEXT,
  explanation_appeal TEXT,
  recommendations TEXT[],
  observations TEXT[],
  requires_human_verification BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create batch_grading_results table
CREATE TABLE public.batch_grading_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  average_grade TEXT NOT NULL CHECK (average_grade IN ('A', 'B', 'C', 'D')),
  average_score NUMERIC NOT NULL,
  min_score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  variance NUMERIC NOT NULL,
  standard_deviation NUMERIC NOT NULL,
  consistency_score NUMERIC NOT NULL,
  grade_distribution JSONB NOT NULL,
  batch_recommendation TEXT,
  outlier_count INTEGER DEFAULT 0,
  image_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create price_estimations table
CREATE TABLE public.price_estimations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  crop_type TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
  quantity NUMERIC NOT NULL,
  region TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  grade_adjustment NUMERIC NOT NULL,
  organic_premium NUMERIC DEFAULT 0,
  pesticide_free_premium NUMERIC DEFAULT 0,
  self_declaration_premium NUMERIC DEFAULT 0,
  total_premium_percentage NUMERIC NOT NULL,
  final_price_per_kg NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.grading_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_grading_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_estimations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grading_results
CREATE POLICY "Users can view their own grading results"
ON public.grading_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grading results"
ON public.grading_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grading results"
ON public.grading_results FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for batch_grading_results
CREATE POLICY "Users can view their own batch results"
ON public.batch_grading_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch results"
ON public.batch_grading_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batch results"
ON public.batch_grading_results FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for price_estimations
CREATE POLICY "Users can view their own price estimations"
ON public.price_estimations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price estimations"
ON public.price_estimations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price estimations"
ON public.price_estimations FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_grading_results_user_id ON public.grading_results(user_id);
CREATE INDEX idx_grading_results_created_at ON public.grading_results(created_at DESC);
CREATE INDEX idx_batch_grading_results_user_id ON public.batch_grading_results(user_id);
CREATE INDEX idx_price_estimations_user_id ON public.price_estimations(user_id);