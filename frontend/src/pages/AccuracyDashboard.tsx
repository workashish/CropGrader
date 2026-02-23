import { useState, useEffect } from 'react';
import { BarChart3, Target, TrendingUp, AlertCircle, IndianRupee, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAccuracyMetrics } from '@/lib/gradingService';
import { Grade, AccuracyMetrics } from '@/types/grading';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

// Using CSS variable colors for chart
const GRADE_COLORS: Record<Grade, string> = {
  A: 'hsl(152, 69%, 31%)',
  B: 'hsl(217, 91%, 60%)',
  C: 'hsl(45, 93%, 47%)',
  D: 'hsl(0, 84%, 60%)',
};

export default function AccuracyDashboard() {
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getAccuracyMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch accuracy metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center">
              <Info className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Accuracy Data Available</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Accuracy metrics will be available once the system has processed enough grading samples 
                and compared them against expert evaluations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1 text-foreground">Data Collection</h4>
                  <p className="text-sm text-muted-foreground">
                    System is actively collecting grading results from AI analysis
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1 text-foreground">Expert Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Results will be compared against expert agricultural assessments
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1 text-foreground">Coming Soon</h4>
                  <p className="text-sm text-muted-foreground">
                    Full accuracy dashboard with confusion matrix and metrics
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Methodology Preview */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <AlertCircle className="w-5 h-5" />
              Planned Evaluation Methodology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-foreground">Dataset Description</h4>
                <p className="text-sm text-muted-foreground">
                  The evaluation dataset will be built from real crop images captured across
                  multiple produce types. Images will be collected under varied lighting
                  conditions to reflect real-world usage.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-foreground">Ground Truth Labeling</h4>
                <p className="text-sm text-muted-foreground">
                  Ground truth labels will be assigned by human graders using AGMARK standards
                  or documented rule-based rubrics.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-foreground">Comparison Approach</h4>
                <p className="text-sm text-muted-foreground">
                  AI predictions will be compared against the labeled grades. Metrics will include
                  accuracy, precision/recall, and confusion matrices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classMetricsData = metrics.classMetrics.map(m => ({
    grade: `Grade ${m.grade}`,
    precision: m.precision,
    recall: m.recall,
    f1: m.f1Score,
    color: GRADE_COLORS[m.grade],
  }));

  const confidenceData = metrics.confidenceDistribution.map(d => ({
    name: d.range,
    value: d.count,
  }));

  const CONFIDENCE_COLORS = ['hsl(152, 69%, 31%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-grade-a-muted rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-grade-a" />
              </div>
              <div>
                <p className="text-3xl font-semibold font-mono tabular-nums">{metrics.overallAccuracy}%</p>
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-grade-b-muted rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-grade-b" />
              </div>
              <div>
                <p className="text-3xl font-semibold font-mono tabular-nums">{metrics.totalSamples.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Samples</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-grade-c-muted rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-grade-c" />
              </div>
              <div>
                <p className="text-3xl font-semibold font-mono tabular-nums">
                  {metrics.priceMetrics.meanAbsoluteError === null ? 'N/A' : `₹${metrics.priceMetrics.meanAbsoluteError}`}
                </p>
                <p className="text-sm text-muted-foreground">Price MAE</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-semibold font-mono tabular-nums">
                  {metrics.priceMetrics.percentageDeviation === null ? 'N/A' : `${metrics.priceMetrics.percentageDeviation}%`}
                </p>
                <p className="text-sm text-muted-foreground">Price Deviation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Confusion Matrix</CardTitle>
            <CardDescription>
              Predicted vs Actual grade classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border border-border bg-muted text-xs font-medium">Actual ↓ / Pred →</th>
                    {(['A', 'B', 'C', 'D'] as Grade[]).map(g => (
                      <th key={g} className="p-2 border border-border bg-muted text-center font-semibold">
                        <span className={`text-grade-${g.toLowerCase()}`}>{g}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(['A', 'B', 'C', 'D'] as Grade[]).map((actualGrade, i) => (
                    <tr key={actualGrade}>
                      <td className="p-2 border border-border bg-muted text-center font-semibold">
                        <span className={`text-grade-${actualGrade.toLowerCase()}`}>{actualGrade}</span>
                      </td>
                      {metrics.confusionMatrix[i].map((value, j) => {
                        const isDiagonal = i === j;
                        return (
                          <td 
                            key={j}
                            className={`p-2 border border-border text-center font-mono tabular-nums ${
                              isDiagonal ? 'bg-grade-a-muted font-semibold' : ''
                            }`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Diagonal values (highlighted) represent correct predictions
            </p>
          </CardContent>
        </Card>

        {/* Class Metrics */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Performance by Grade</CardTitle>
            <CardDescription>
              Precision, Recall, and F1-Score per class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="grade" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                  />
                  <Legend />
                  <Bar dataKey="precision" name="Precision" fill="hsl(152, 69%, 31%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="recall" name="Recall" fill="hsl(217, 91%, 60%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="f1" name="F1 Score" fill="hsl(45, 93%, 47%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Confidence Distribution</CardTitle>
            <CardDescription>
              Distribution of prediction confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {confidenceData.map((_, index) => (
                      <Cell 
                        key={index} 
                        fill={CONFIDENCE_COLORS[index]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium">Detailed Class Metrics</CardTitle>
            <CardDescription>
              Full performance breakdown per grade class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-2 border border-border bg-muted text-left font-medium">Grade</th>
                    <th className="p-2 border border-border bg-muted text-right font-medium">Precision</th>
                    <th className="p-2 border border-border bg-muted text-right font-medium">Recall</th>
                    <th className="p-2 border border-border bg-muted text-right font-medium">F1-Score</th>
                    <th className="p-2 border border-border bg-muted text-right font-medium">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.classMetrics.map((m) => (
                    <tr key={m.grade}>
                      <td className="p-2 border border-border font-semibold">
                        <span className={`text-grade-${m.grade.toLowerCase()}`}>Grade {m.grade}</span>
                      </td>
                      <td className="p-2 border border-border text-right font-mono tabular-nums">{m.precision}%</td>
                      <td className="p-2 border border-border text-right font-mono tabular-nums">{m.recall}%</td>
                      <td className="p-2 border border-border text-right font-mono tabular-nums">{m.f1Score}%</td>
                      <td className="p-2 border border-border text-right font-mono tabular-nums">{m.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methodology */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <AlertCircle className="w-5 h-5" />
            Evaluation Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-foreground">Dataset Description</h4>
              <p className="text-sm text-muted-foreground">
                The evaluation dataset currently includes {metrics.totalSamples.toLocaleString()} labeled
                samples captured across multiple produce types.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-foreground">Ground Truth Labeling</h4>
              <p className="text-sm text-muted-foreground">
                Ground truth grades are provided by human reviewers following AGMARK or defined
                grading rubrics.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-foreground">Comparison Approach</h4>
              <p className="text-sm text-muted-foreground">
                AI predictions are compared against ground-truth labels to compute accuracy,
                precision/recall, and confusion matrices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
