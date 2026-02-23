import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { QualityScores, MLComparisonData } from '@/types/grading';
import { TrendingUp, Cpu, Clock, Activity, AlertTriangle } from 'lucide-react';

interface MLComparisonChartProps {
  scores: QualityScores;
  mlComparison?: MLComparisonData | null;
}

const QUALITY_FACTORS = [
  { key: 'colorQuality' as const, label: 'Color Quality' },
  { key: 'sizeShape' as const, label: 'Size & Shape' },
  { key: 'surfaceQuality' as const, label: 'Surface Quality' },
  { key: 'diseasePest' as const, label: 'Disease/Pest' },
  { key: 'ripeness' as const, label: 'Ripeness' },
  { key: 'overallAppeal' as const, label: 'Overall Appeal' },
];

const COLORS: Record<string, string> = {
  'Our Model (Gemini LLM)': '#10b981',
  SVM: '#6366f1',
  KNN: '#f59e0b',
  'Random Forest': '#3b82f6',
  'Decision Tree': '#ef4444',
  'Naïve Bayes': '#a855f7',
};

export function MLComparisonChart({ scores, mlComparison }: MLComparisonChartProps) {
  const hasData = !!(mlComparison?.models && Object.keys(mlComparison.models).length > 0);

  const data = useMemo(() => {
    if (!hasData || !mlComparison?.models) return [];

    return QUALITY_FACTORS.map((factor) => {
      const row: Record<string, string | number> = {
        factor: factor.label,
        'Our Model (Gemini LLM)': scores[factor.key],
      };

      for (const [algo, algoScores] of Object.entries(mlComparison.models)) {
        row[algo] = Math.round((algoScores as Record<string, number>)[factor.key] ?? 0);
      }

      return row;
    });
  }, [scores, mlComparison, hasData]);

  const algorithms = Object.keys(COLORS);

  // No real ML data — show an offline notice instead of fake data
  if (!hasData) {
    return (
      <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Model Comparison — Quality Factor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50/60 border border-amber-200/50 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">ML Comparison Service Offline</p>
              <p className="text-xs mt-1 text-amber-700">
                The Python ML microservice is not running. Start it to see real per-image scores
                from SVM, KNN, Random Forest, Decision Tree, and Naïve Bayes.
              </p>
              <code className="block mt-2 text-[10px] bg-amber-100 rounded px-2 py-1 text-amber-900 font-mono">
                cd backend/ml_service &amp;&amp; python3 -m uvicorn server:app --port 5001
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Model Comparison — Quality Factor Analysis
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            <Activity className="w-3 h-3" /> LIVE
          </span>
        </CardTitle>
        <CardDescription>
          Real-time per-image ML inference — 5 classical algorithms scored this exact image via OpenCV features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="factor"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              label={{
                value: 'Score (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: '#9ca3af' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
            {algorithms.map((algo) => (
              <Line
                key={algo}
                type="monotone"
                dataKey={algo}
                stroke={COLORS[algo]}
                strokeWidth={algo === 'Our Model (Gemini LLM)' ? 3 : 1.5}
                dot={{
                  r: algo === 'Our Model (Gemini LLM)' ? 5 : 3,
                  fill: COLORS[algo],
                  strokeWidth: algo === 'Our Model (Gemini LLM)' ? 2 : 0,
                  stroke: '#fff',
                }}
                activeDot={{ r: 6 }}
                opacity={algo === 'Our Model (Gemini LLM)' ? 1 : 0.7}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Data Source Notice */}
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/50 rounded-lg">
            <p className="text-xs text-emerald-800 font-medium">
              <span className="font-bold">✦ Our Model (green line):</span> Live scores from the current analysis
              using a <span className="font-bold">Multimodal LLM (Google Gemini)</span> with zero-shot visual
              grading — no task-specific training or labeled dataset required.
            </p>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-200/50 rounded-lg flex items-start gap-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-indigo-800">
              <span className="font-bold">Classical ML (live inference):</span>{' '}
              Each algorithm extracted <span className="font-semibold">{mlComparison!.featuresExtracted} OpenCV features</span>{' '}
              (color, texture, shape, defect) from this exact image and scored it independently.
              <span className="flex items-center gap-3 mt-1 text-[10px] text-indigo-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Inference: {mlComparison!.inferenceTimeMs}ms
                </span>
                <span>Features: {mlComparison!.featuresExtracted}</span>
                <span>Models: {Object.keys(mlComparison!.models).length}</span>
              </span>
            </div>
          </div>

          {/* Feature values breakdown */}
          {mlComparison!.featureValues && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 font-medium px-1">
                ▸ View extracted feature values ({Object.keys(mlComparison!.featureValues).length} features)
              </summary>
              <div className="mt-2 p-3 bg-slate-50/80 border border-slate-200/50 rounded-lg">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                  {Object.entries(mlComparison!.featureValues).map(([name, val]) => (
                    <div key={name} className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-500 truncate mr-2">{name}</span>
                      <span className="text-slate-800 font-semibold">{(val as number).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
