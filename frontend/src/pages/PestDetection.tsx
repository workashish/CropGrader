import { useState, useCallback } from 'react';
import { AlertTriangle, Bug, Eye, Loader2, ShieldCheck, Stethoscope, Leaf, Upload, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { detectPestDisease } from '@/lib/gradingService';
import { savePestDiagnosis } from '@/lib/database';
import { PestDiagnosis } from '@/types/grading';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const severityStyles: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const issueTypeLabel: Record<string, string> = {
  disease: 'Disease',
  pest: 'Pest',
  nutrient: 'Nutrient Issue',
  abiotic: 'Abiotic Stress',
  unknown: 'Unknown',
};

export default function PestDetection() {
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PestDiagnosis | null>(null);
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { language } = useLanguage();
  const maxImages = 4;

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    const newImages = files.slice(0, maxImages - images.length).map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages(prev => [...prev, ...newImages].slice(0, maxImages));
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const newImages = files.slice(0, maxImages - images.length).map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages(prev => [...prev, ...newImages].slice(0, maxImages));
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0 || !user) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const diagnosis = await detectPestDisease(images.map((img) => img.file), language);
      setResult(diagnosis);
      await savePestDiagnosis(diagnosis, user.id, images.length);
      toast({
        title: 'Diagnosis Complete',
        description: `${diagnosis.issueName} detected with ${diagnosis.confidencePercent}% confidence.`,
      });
    } catch (error) {
      console.error('Diagnosis failed:', error);
      toast({
        title: 'Diagnosis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze the image.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setImages([]);
    setResult(null);
  };

  const renderList = (items: string[]) => (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="flex gap-2">
          <span className="text-primary">•</span>
          <span data-no-translate="true">{item}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-1">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-border/50">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-lime-500" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Bug className="w-6 h-6 text-emerald-600" />
              Pest & Disease Scanner
            </CardTitle>
            <CardDescription className="text-base">
              Upload a clear crop photo to detect pests or disease and get treatment guidance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 group
                ${images.length >= maxImages
                  ? 'border-muted bg-muted/20 cursor-not-allowed'
                  : 'border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer'
                } ${isAnalyzing ? 'opacity-50 pointer-events-none grayscale' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={images.length < maxImages ? handleDrop : undefined}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelect}
                className="hidden"
                id="pest-upload"
                disabled={images.length >= maxImages}
              />
              <label htmlFor="pest-upload" className={`cursor-pointer block ${images.length >= maxImages ? 'pointer-events-none' : ''}`}>
                <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="font-semibold text-lg text-foreground mb-1">
                  {images.length >= maxImages ? 'Image Limit Reached' : 'Drag & Drop or Click'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload up to {maxImages} images • {maxImages - images.length} slots remaining
                </p>
              </label>
            </div>

            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Selected Images ({images.length})</span>
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, index) => (
                      <motion.div
                        key={img.url}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                      >
                        <img
                          src={img.url}
                          alt={`Sample ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              className="w-full h-11 text-base font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              onClick={handleAnalyze}
              disabled={images.length === 0 || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  Start Diagnosis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-dashed border-2 bg-transparent">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Capture Tips</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Close-up of affected area</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Good daylight or even lighting</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Show both healthy & affected parts</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Add multiple angles if possible</li>
                  <li className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Avoid motion blur</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-6 relative min-h-[500px]">
        <AnimatePresence mode="wait">
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
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                <Stethoscope className="absolute inset-0 m-auto text-emerald-600 w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Scanning for Pests...</h3>
              <p className="text-muted-foreground mt-2">Evaluating leaf texture, spots, and discoloration</p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-6"
            >
              <Card className="border-0 shadow-xl overflow-hidden relative bg-gradient-to-br from-white to-emerald-50/50">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-xl">Diagnosis Summary</CardTitle>
                      <CardDescription>
                        <span data-no-translate="true">{result.produceIdentified || 'Produce'}</span> • {issueTypeLabel[result.issueType]}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={severityStyles[result.severity] || ''}>
                        Severity: {result.severity}
                      </Badge>
                      <Badge variant="secondary">
                        {result.confidencePercent}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Likely Issue</p>
                      <p className="text-lg font-semibold text-foreground" data-no-translate="true">{result.issueName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Symptoms Observed</CardTitle>
                </CardHeader>
                <CardContent>{renderList(result.symptoms)}</CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Likely Causes</CardTitle>
                </CardHeader>
                <CardContent>{renderList(result.likelyCauses)}</CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Current Solutions</CardTitle>
                </CardHeader>
                <CardContent>{renderList(result.currentSolution)}</CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Future Precautions</CardTitle>
                </CardHeader>
                <CardContent>{renderList(result.futurePrecautions)}</CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monitoring Plan</CardTitle>
                </CardHeader>
                <CardContent>{renderList(result.monitoring)}</CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">When to Escalate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground" data-no-translate="true">{result.whenToEscalate}</p>
                </CardContent>
              </Card>

              <Card className="shadow-md border-0 bg-amber-50/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Safety Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800" data-no-translate="true">{result.disclaimer}</p>
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
                <Bug className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Awaiting Image</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Upload a crop image to receive a pest or disease diagnosis and treatment guidance.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
