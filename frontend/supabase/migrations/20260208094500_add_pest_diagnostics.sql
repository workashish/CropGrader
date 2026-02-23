-- Create pest_diagnostics table
CREATE TABLE IF NOT EXISTS public.pest_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  produce_identified TEXT,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('disease', 'pest', 'nutrient', 'abiotic', 'unknown')),
  issue_name TEXT NOT NULL,
  confidence_percent NUMERIC NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  symptoms TEXT[],
  likely_causes TEXT[],
  current_solution TEXT[],
  future_precautions TEXT[],
  monitoring TEXT[],
  when_to_escalate TEXT,
  disclaimer TEXT,
  image_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pest_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pest diagnostics"
ON public.pest_diagnostics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pest diagnostics"
ON public.pest_diagnostics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pest diagnostics"
ON public.pest_diagnostics FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pest_diagnostics_user_id ON public.pest_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_pest_diagnostics_created_at ON public.pest_diagnostics(created_at DESC);
