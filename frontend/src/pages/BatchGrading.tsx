import { useState, useCallback } from 'react';
import { Loader2, Upload, X, AlertTriangle, TrendingUp, TrendingDown, Layers, FileImage, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { GradeBadge } from '@/components/grading/GradeBadge';
import { SUPPORTED_CROPS } from '@/lib/constants';
import { gradeBatch } from '@/lib/gradingService';
import { saveBatchGradingResult } from '@/lib/database';
import { CropType, BatchGradingResult, Grade } from '@/types/grading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Chart Colors
const GRADE_COLORS: Record<Grade, string> = {
  A: '#059669', // Emerald 600
  B: '#65a30d', // Lime 600
  C: '#d97706', // Amber 600
  D: '#dc2626', // Red 600
};

export default function BatchGrading() {
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropType>('mango');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BatchGradingResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { language } = useLanguage();

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 10 - images.length).map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const newImages = files.slice(0, 10 - images.length).map(file => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length < 2 || !user) return;

    setIsAnalyzing(true);
    setResult(null);
    try {
      const batchResult = await gradeBatch(
        images.map(img => ({ url: img.url, file: img.file, cropType: selectedCrop })),
        language
      );
      setResult(batchResult);
      await saveBatchGradingResult(batchResult, user.id);

      toast({
        title: "Batch Diagnostics Complete",
        description: `Successfully processed ${batchResult.results.length} samples. Metric Average: ${batchResult.averageScore}`,
      });
    } catch (error) {
      console.error('Batch grading failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze batch.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setImages([]);
    setResult(null);
  };

  const chartData = result ? [
    { grade: 'A', count: result.gradeDistribution.A },
    { grade: 'B', count: result.gradeDistribution.B },
    { grade: 'C', count: result.gradeDistribution.C },
    { grade: 'D', count: result.gradeDistribution.D },
  ] : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-1">
      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-border/50">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Layers className="w-6 h-6 text-blue-600" />
              Batch Processor
            </CardTitle>
            <CardDescription className="text-base">
              High-throughput analysis for multiple crop samples (Max 10)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group
                ${images.length >= 10
                  ? 'border-muted bg-muted/20 cursor-not-allowed'
                  : 'border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer'
                }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={images.length < 10 ? handleDrop : undefined}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelect}
                className="hidden"
                id="batch-upload"
                disabled={images.length >= 10}
              />
              <label htmlFor="batch-upload" className={`cursor-pointer block ${images.length >= 10 ? 'pointer-events-none' : ''}`}>
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="font-semibold text-lg text-foreground mb-1">
                  {images.length >= 10 ? 'Batch Full' : 'Drag & Drop or Click'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Support JPEG, PNG • {10 - images.length} slots remaining
                </p>
              </label>
            </div>

            {/* Selected Images Staging */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Staging Area ({images.length})</span>
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {images.map((img, index) => (
                      <motion.div
                        key={img.url}
                        initial={{ opacity: 0, scale: 0.8 }}
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

            {/* Controls */}
            <div className="flex gap-4 items-end pt-2">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-semibold text-foreground">Crop Type</label>
                <Select value={selectedCrop} onValueChange={(v) => setSelectedCrop(v as CropType)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CROPS.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        {crop.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="flex-1 h-11 text-base font-semibold shadow-md bg-blue-600 hover:bg-blue-700"
                onClick={handleAnalyze}
                disabled={images.length < 2 || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <Layers className="w-5 h-5 mr-2" />
                    Analyze Batch
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Results Section */}
      <div className="space-y-6">
        <AnimatePresence mode='wait'>
          {isAnalyzing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20"
            >
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-foreground">Analyzing {images.length} samples...</p>
              <p className="text-sm text-muted-foreground">Aggregating quality metrics</p>
            </motion.div>
          ) : result ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Score', value: result.averageScore, icon: TrendingUp },
                  { label: 'Consistency', value: `${result.consistencyScore}%`, icon: Layers },
                  { label: 'Min Score', value: result.minScore, icon: TrendingDown },
                  { label: 'Max Score', value: result.maxScore, icon: TrendingUp },
                ].map((stat, i) => (
                  <Card key={i} className="bg-white/60 backdrop-blur-sm shadow-sm border-0">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Summary Card */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/50">
                <CardHeader className="pb-2 text-center">
                  <div className="mx-auto mb-2">
                    <GradeBadge grade={result.averageGrade} size="xl" showLabel />
                  </div>
                  <CardTitle>Batch Grade Average</CardTitle>
                  <CardDescription>{result.batchRecommendation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    Algorithm: {result.results[0]?.algorithm || 'Rule-based CV scoring'} • Avg confidence: {result.averageConfidence ?? 0}%
                  </p>
                  {result.outliers.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        <strong>Attention:</strong> {result.outliers.length} samples deviate significantly from the batch norm.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribution Chart */}
              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="grade" axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade as Grade]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Individual Results Grid */}
              <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Sample Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {result.results.map((r, index) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-2 rounded-lg border text-center relative overflow-hidden ${result.outliers.includes(r.id) ? 'border-amber-300 bg-amber-50' : 'border-border/50 bg-white'
                          }`}
                      >
                        <div className="text-[10px] text-muted-foreground mb-1">#{index + 1}</div>
                        <GradeBadge grade={r.grade} size="sm" />
                        <div className="text-xs font-bold mt-1">{r.overallScore}</div>
                        {result.outliers.includes(r.id) && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full m-1" title="Outlier" />
                        )}
                      </motion.div>
                    ))}
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
              <FileImage className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-medium text-foreground">No Data Available</h3>
              <p className="text-muted-foreground mt-2">Upload samples to generate a batch report</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
