import { useState, useEffect } from 'react';
import { History, Download, FileText, Trash2, Calendar, Eye, Loader2, Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { GradeBadge } from '@/components/grading/GradeBadge';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  fetchGradingResults, 
  fetchBatchGradingResults, 
  fetchPriceEstimations,
  fetchPestDiagnoses,
  fetchUserStats,
  clearUserData 
} from '@/lib/database';
import { GradingResult, BatchGradingResult, PriceEstimation, PestDiagnosisRecord } from '@/types/grading';
import { 
  exportSingleResultsToCSV, 
  exportBatchResultsToCSV, 
  exportPriceEstimationsToCSV,
  downloadCSV,
  generatePDFContent,
  openPDFPreview 
} from '@/lib/exportUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function GradingHistory() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [singleResults, setSingleResults] = useState<GradingResult[]>([]);
  const [batchResults, setBatchResults] = useState<BatchGradingResult[]>([]);
  const [priceEstimations, setPriceEstimations] = useState<PriceEstimation[]>([]);
  const [pestDiagnoses, setPestDiagnoses] = useState<PestDiagnosisRecord[]>([]);
  const [stats, setStats] = useState<{
    totalSingleAnalyses: number;
    totalBatchAnalyses: number;
    totalSamplesAnalyzed: number;
    averageConfidence: number;
    priceEstimationsCount: number;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [single, batch, prices, pests, userStats] = await Promise.all([
          fetchGradingResults(user.id),
          fetchBatchGradingResults(user.id),
          fetchPriceEstimations(user.id),
          fetchPestDiagnoses(user.id),
          fetchUserStats(user.id),
        ]);
        setSingleResults(single);
        setBatchResults(batch);
        setPriceEstimations(prices);
        setPestDiagnoses(pests);
        setStats(userStats);
      } catch (error) {
        console.error('Failed to load history:', error);
        toast({ title: 'Error', description: 'Failed to load history data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, toast]);

  const handleExportCSV = (type: 'single' | 'batch' | 'price') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (type) {
      case 'single':
        if (singleResults.length === 0) {
          toast({ title: 'No data', description: 'No single grading results to export.', variant: 'destructive' });
          return;
        }
        downloadCSV(exportSingleResultsToCSV(singleResults), `agrigrade-single-results-${timestamp}.csv`);
        break;
      case 'batch':
        if (batchResults.length === 0) {
          toast({ title: 'No data', description: 'No batch results to export.', variant: 'destructive' });
          return;
        }
        downloadCSV(exportBatchResultsToCSV(batchResults), `agrigrade-batch-results-${timestamp}.csv`);
        break;
      case 'price':
        if (priceEstimations.length === 0) {
          toast({ title: 'No data', description: 'No price estimations to export.', variant: 'destructive' });
          return;
        }
        downloadCSV(exportPriceEstimationsToCSV(priceEstimations), `agrigrade-price-estimates-${timestamp}.csv`);
        break;
    }
    
    toast({ title: 'Export successful', description: 'CSV file has been downloaded.' });
  };

  const handleExportPDF = () => {
    if (singleResults.length === 0 && batchResults.length === 0 && priceEstimations.length === 0) {
      toast({ title: 'No data', description: 'No data to export.', variant: 'destructive' });
      return;
    }
    const pdfContent = generatePDFContent(singleResults, batchResults, priceEstimations);
    openPDFPreview(pdfContent);
    toast({ title: 'PDF ready', description: 'Print dialog opened for PDF export.' });
  };

  const handleClearData = async () => {
    if (!user) return;
    try {
      await clearUserData(user.id);
      setSingleResults([]);
      setBatchResults([]);
      setPriceEstimations([]);
      setPestDiagnoses([]);
      setStats({ totalSingleAnalyses: 0, totalBatchAnalyses: 0, totalSamplesAnalyzed: 0, averageConfidence: 0, priceEstimationsCount: 0 });
      toast({ title: 'Data cleared', description: 'All your grading history has been deleted.' });
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast({ title: 'Error', description: 'Failed to clear data', variant: 'destructive' });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Summary */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <History className="w-5 h-5" />
                Your Grading History
              </CardTitle>
              <CardDescription>
                All your grading data is securely stored in the cloud
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all your data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all grading results, batch analyses, and price estimations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-semibold font-mono tabular-nums">{stats?.totalSingleAnalyses || 0}</p>
              <p className="text-sm text-muted-foreground">Single Analyses</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-semibold font-mono tabular-nums">{stats?.totalBatchAnalyses || 0}</p>
              <p className="text-sm text-muted-foreground">Batch Analyses</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-semibold font-mono tabular-nums">{stats?.totalSamplesAnalyzed || 0}</p>
              <p className="text-sm text-muted-foreground">Total Samples</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-semibold font-mono tabular-nums">{stats?.averageConfidence || 0}%</p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed History View */}
      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="single">
            Single Grading ({singleResults.length})
          </TabsTrigger>
          <TabsTrigger value="batch">
            Batch Grading ({batchResults.length})
          </TabsTrigger>
          <TabsTrigger value="price">
            Price Estimates ({priceEstimations.length})
          </TabsTrigger>
          <TabsTrigger value="pest">
            Pest & Disease ({pestDiagnoses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExportCSV('single')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          {singleResults.length > 0 ? (
            <div className="grid gap-3">
              {singleResults.map((result) => (
                <Card key={result.id} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GradeBadge grade={result.grade} size="md" />
                        <div>
                          <p className="font-medium capitalize text-foreground">{result.cropType}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(result.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold font-mono tabular-nums">{result.overallScore}%</p>
                        <p className="text-sm text-muted-foreground">{result.confidence}% confidence</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No single grading results yet</p>
                <p className="text-sm mt-1">Analyze crop images to see results here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExportCSV('batch')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          {batchResults.length > 0 ? (
            <div className="grid gap-3">
              {batchResults.map((batch) => (
                <Card key={batch.id} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GradeBadge grade={batch.averageGrade} size="md" />
                        <div>
                          <p className="font-medium text-foreground">{batch.results.length || 'Multiple'} images analyzed</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(batch.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold font-mono tabular-nums">{batch.averageScore}%</p>
                        <p className="text-sm text-muted-foreground">{batch.consistencyScore}% consistency</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No batch grading results yet</p>
                <p className="text-sm mt-1">Upload multiple images for batch analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="price" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExportCSV('price')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          {priceEstimations.length > 0 ? (
            <div className="grid gap-3">
              {priceEstimations.map((estimation, index) => (
                <Card key={index} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GradeBadge grade={estimation.grade} size="md" />
                        <div>
                          <p className="font-medium capitalize text-foreground">{estimation.cropType}</p>
                          <p className="text-sm text-muted-foreground">
                            {estimation.quantity} kg • {estimation.region}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold font-mono tabular-nums">₹{estimation.totalPrice.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">₹{estimation.finalPricePerKg}/kg</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No price estimations yet</p>
                <p className="text-sm mt-1">Use the Price Estimator to calculate prices</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pest" className="space-y-4">
          {pestDiagnoses.length > 0 ? (
            <div className="grid gap-3">
              {pestDiagnoses.map((diagnosis) => (
                <Card key={diagnosis.id} className="shadow-sm">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Bug className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-no-translate="true">{diagnosis.issueName}</p>
                          <p className="text-sm text-muted-foreground">
                            <span data-no-translate="true">{diagnosis.produceIdentified}</span> • {diagnosis.severity} severity • {diagnosis.imageCount} image(s)
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(diagnosis.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold font-mono tabular-nums">{diagnosis.confidencePercent}%</p>
                        <p className="text-sm text-muted-foreground">confidence</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No pest diagnoses yet</p>
                <p className="text-sm mt-1">Run a pest scan to see results here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
