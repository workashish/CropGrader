import { useState } from 'react';
import { Loader2, AlertTriangle, Lightbulb, Eye, CheckCircle2, ScanLine, XCircle, Target, Cpu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/grading/ImageUploader';
import { GradeBadge } from '@/components/grading/GradeBadge';
import { ScoreBar } from '@/components/grading/ScoreBar';
import { ConfidenceGauge } from '@/components/grading/ConfidenceGauge';
import { MLComparisonChart } from '@/components/grading/MLComparisonChart';
import { gradeCrop, logEvaluation } from '@/lib/gradingService';
import { saveGradingResult } from '@/lib/database';
import { GradingResult, Grade } from '@/types/grading';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SingleGrader() {
  const [selectedImage, setSelectedImage] = useState<string>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [groundTruthGrade, setGroundTruthGrade] = useState<Grade | ''>('');
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { language } = useLanguage();

  const formatCropLabel = (crop: string) => (
    crop === 'unknown' ? 'produce' : `${crop.charAt(0).toUpperCase()}${crop.slice(1)}`
  );

  const handleAnalyze = async () => {
    if (!selectedImage || !user) return;

    setIsAnalyzing(true);
    setResult(null); // Clear previous results
    setGroundTruthGrade('');

    try {
      // Add artificial delay for "Scanning" effect if API is too fast
      const [gradingResult] = await Promise.all([
        gradeCrop(selectedImage, undefined, language),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      setResult(gradingResult);
      await saveGradingResult(gradingResult, user.id);

      const cropLabel = formatCropLabel(gradingResult.cropType);
      toast({
        title: "Analysis Complete",
        description: `Your ${cropLabel} received Grade ${gradingResult.grade} with ${gradingResult.confidence}% confidence.`,
      });
    } catch (error) {
      console.error('Grading failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the crop image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(undefined);
    setResult(null);
    setGroundTruthGrade('');
  };

  const handleLogEvaluation = async () => {
    if (!result || !groundTruthGrade) return;

    setIsLogging(true);
    try {
      await logEvaluation({
        predictedGrade: result.grade,
        predictedScore: result.overallScore,
        confidence: result.confidence,
        groundTruthGrade,
        produceType: result.cropType === 'unknown' ? undefined : result.cropType,
      });

      toast({
        title: 'Evaluation Logged',
        description: `Saved ground truth Grade ${groundTruthGrade} for accuracy metrics.`,
      });
      
      // Clear the ground truth selection after successful logging
      setGroundTruthGrade('');
    } catch (error) {
      console.error('Evaluation logging failed:', error);
      toast({
        title: 'Logging Failed',
        description: error instanceof Error ? error.message : 'Failed to log evaluation.',
        variant: 'destructive',
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-1">
      {/* Left Column - Hero Upload Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-border/50">
          <div className="h-2 bg-gradient-to-r from-primary to-emerald-400" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ScanLine className="w-6 h-6 text-primary" />
              Visual Inspection Station
            </CardTitle>
            <CardDescription className="text-base">
              Upload a high-resolution image for AI-driven quality assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`transition-all duration-300 ${isAnalyzing ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <ImageUploader
                selectedImage={selectedImage}
                onImageSelect={setSelectedImage}
                onClear={handleClear}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Crop type is auto-detected by AI from the image.
              </p>
              <Button
                className="w-full h-11 text-base font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
                onClick={handleAnalyze}
                disabled={!selectedImage || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips / Info */}
        <AnimatePresence>
          {!result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Card className="shadow-sm border-dashed border-2 bg-transparent">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Optimization Guidelines</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ensure consistent lighting</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Capture full produce</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Neutral background</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-red-400" /> Avoid blur/shadows</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ML Comparison Chart - shown below upload when results exist */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <MLComparisonChart scores={result.scores} mlComparison={result.mlComparison} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evaluation Logging - shown in left column after chart */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Evaluation Logging
                  </CardTitle>
                  <CardDescription>
                    Provide the actual ground-truth grade to train the Accuracy Dashboard. This helps track AI prediction performance over time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-semibold text-foreground">Ground Truth Grade</label>
                    <Select value={groundTruthGrade} onValueChange={(v) => setGroundTruthGrade(v as Grade)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select actual grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {(['A', 'B', 'C', 'D'] as Grade[]).map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="h-11 px-6"
                    onClick={handleLogEvaluation}
                    disabled={!groundTruthGrade || isLogging}
                  >
                    {isLogging ? 'Saving...' : 'Log Evaluation'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Column - Results Display */}
      <div className="space-y-6 relative min-h-[500px]">
        <AnimatePresence mode='wait'>
          {isAnalyzing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/20 shadow-inner z-10"
            >
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <ScanLine className="absolute inset-0 m-auto text-primary w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Running Diagnostics...</h3>
              <p className="text-muted-foreground mt-2">Checking surface defects and texture anomalies</p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Grade Card - Glassmorphism */}
              <Card className="border-0 shadow-xl overflow-hidden relative bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-900 dark:to-emerald-900/20">
                <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Analysis Report</CardTitle>
                      <CardDescription>
                        Pipeline: {result.algorithm || 'Rule-based CV scoring'} • Reasoning: {result.explanationSource === 'ai' ? 'Multimodal LLM (zero-shot visual analysis)' : 'Rule-based heuristics'}
                      </CardDescription>
                    </div>
                    <div className="px-3 py-1 bg-white/60 dark:bg-black/20 rounded-full text-xs font-mono border border-border/50 text-muted-foreground">
                      ID: {result.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
                    <div className="text-center relative">
                      <GradeBadge grade={result.grade} size="xl" showLabel />
                      <div className="absolute -inset-4 bg-grade-a/10 blur-xl rounded-full -z-10" />
                    </div>
                    <div className="w-px h-20 bg-border hidden sm:block" />
                    <div className="scale-110">
                      <ConfidenceGauge confidence={result.confidence} size="lg" />
                    </div>
                  </div>

                  {result.requiresHumanVerification && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3"
                    >
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">Low Confidence Flag</p>
                        <p className="text-sm text-amber-700/80 mt-1">
                          The AI model detected ambiguous features. Manual verification recommended.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quality Scores */}
                <Card className="shadow-md border-0 bg-white/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-2">
                    {[
                      { l: 'Color', s: result.scores.colorQuality, e: result.explanation.colorQuality },
                      { l: 'Surface', s: result.scores.surfaceQuality, e: result.explanation.surfaceQuality },
                      { l: 'Ripeness', s: result.scores.ripeness, e: result.explanation.ripeness },
                    ].map((item) => (
                      <ScoreBar key={item.l} label={item.l} score={item.s} explanation={item.e} />
                    ))}
                  </CardContent>
                </Card>

                {/* Physical Scores */}
                <Card className="shadow-md border-0 bg-white/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Physical Traits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-2">
                    {[
                      { l: 'Size & Shape', s: result.scores.sizeShape, e: result.explanation.sizeShape },
                      { l: 'Defects', s: result.scores.diseasePest, e: result.explanation.diseasePest },
                      { l: 'Overall', s: result.scores.overallAppeal, e: result.explanation.overallAppeal },
                    ].map((item) => (
                      <ScoreBar key={item.l} label={item.l} score={item.s} explanation={item.e} />
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights — Research-grade technical details */}
              <Card className="shadow-md bg-gradient-to-b from-white to-secondary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Model Insights
                  </CardTitle>
                  <CardDescription>
                    Technical details of the grading pipeline for research documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {/* Classification Approach */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200/50 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3" />
                      Classification Approach &amp; Technical Stack
                    </h4>
                    <div className="space-y-2 text-xs text-blue-900/80">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        <div><span className="font-semibold">Model Provider:</span> Google DeepMind</div>
                        <div><span className="font-semibold">Model:</span> {result.model?.version || 'gemini-flash-lite-latest'}</div>
                        <div><span className="font-semibold">Model Type:</span> Multimodal Large Language Model (MLLM)</div>
                        <div><span className="font-semibold">Architecture:</span> Transformer-based (Mixture of Experts)</div>
                        <div><span className="font-semibold">Inference Method:</span> Zero-shot visual classification via prompt engineering</div>
                        <div><span className="font-semibold">Input Modality:</span> Image (JPEG/PNG) + Text prompt</div>
                        <div><span className="font-semibold">Output Format:</span> Structured JSON with constrained schema</div>
                        <div><span className="font-semibold">Temperature:</span> 0.2 (low randomness for consistency)</div>
                        <div><span className="font-semibold">Top-P Sampling:</span> 0.9</div>
                        <div><span className="font-semibold">Max Tokens:</span> 512</div>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Details */}
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200/50 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">End-to-End Pipeline</h4>
                    <div className="text-xs text-indigo-900/80 space-y-1.5">
                      <div><span className="font-semibold">Step 1 — Image Ingestion:</span> Client uploads image → Express.js backend receives via Multer (in-memory buffer)</div>
                      <div><span className="font-semibold">Step 2 — Preprocessing:</span> Image converted to Base64, MIME type validated (JPEG/PNG/WebP supported)</div>
                      <div><span className="font-semibold">Step 3 — Prompt Construction:</span> Structured grading rubric (A/B/C/D) injected as system prompt with produce type &amp; language</div>
                      <div><span className="font-semibold">Step 4 — MLLM Inference:</span> Google Generative AI SDK sends image + prompt to Gemini model via API</div>
                      <div><span className="font-semibold">Step 5 — Response Parsing:</span> Raw LLM text → JSON extraction via regex → Schema validation &amp; normalization</div>
                      <div><span className="font-semibold">Step 6 — Score Normalization:</span> All 6 quality sub-scores clamped to [0, 100], grade validated against rubric thresholds</div>
                      <div><span className="font-semibold">Step 7 — Confidence Calibration:</span> Confidence from LLM output normalized; low confidence (&lt;70%) triggers human verification flag</div>
                    </div>
                  </div>

                  {/* Scoring Factors */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/50 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Quality Scoring Factors (6 Dimensions)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-emerald-900/80">
                      <div><span className="font-semibold">Color Quality ({result.scores.colorQuality}%):</span> HSV saturation &amp; brightness uniformity</div>
                      <div><span className="font-semibold">Size &amp; Shape ({result.scores.sizeShape}%):</span> Aspect ratio, solidity, contour regularity</div>
                      <div><span className="font-semibold">Surface Quality ({result.scores.surfaceQuality}%):</span> Texture smoothness, edge density, blemish detection</div>
                      <div><span className="font-semibold">Disease/Pest ({result.scores.diseasePest}%):</span> Defect density, dark spot ratio, lesion coverage</div>
                      <div><span className="font-semibold">Ripeness ({result.scores.ripeness}%):</span> Color-stage classification, saturation-driven index</div>
                      <div><span className="font-semibold">Overall Appeal ({result.scores.overallAppeal}%):</span> Composite weighted score + image quality factor</div>
                    </div>
                  </div>

                  {/* Backend Stack */}
                  <div className="p-3 bg-gray-50/80 border border-gray-200/50 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">Backend Technology Stack</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
                      <div><span className="font-semibold">Runtime:</span> Node.js (Express.js)</div>
                      <div><span className="font-semibold">AI SDK:</span> @google/genai (Google Generative AI)</div>
                      <div><span className="font-semibold">File Handling:</span> Multer (in-memory storage)</div>
                      <div><span className="font-semibold">Translation:</span> MyMemory Translation API</div>
                      <div><span className="font-semibold">Evaluation Store:</span> JSONL (append-only file)</div>
                      <div><span className="font-semibold">Frontend:</span> React + TypeScript + Vite + Tailwind CSS</div>
                      <div><span className="font-semibold">Database:</span> Supabase (PostgreSQL)</div>
                      <div><span className="font-semibold">Grading Rubric:</span> A (≥90) / B (≥75) / C (≥55) / D (&lt;55)</div>
                    </div>
                  </div>

                  {/* Observations */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Observations</h4>
                    <ul className="space-y-2">
                      {result.explanation.observations.map((obs, i) => {
                        const isAiObservation = result.explanationSource === 'ai' && i === 0;
                        return (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-sm flex gap-2 items-start p-2 rounded-lg bg-secondary/50"
                        >
                          <span className="text-primary mt-0.5">•</span>
                          <span data-no-translate={isAiObservation ? 'true' : undefined}>{obs}</span>
                        </motion.li>
                        );
                      })}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-white/40"
            >
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground/40">
                <ScanLine className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Waiting for Input</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Select an image from the left panel to begin the automated grading process.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
