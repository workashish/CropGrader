import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Images, IndianRupee, Bug, BarChart3, Leaf, ArrowRight, CheckCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { fetchUserStats, fetchRecentGradingResults } from '@/lib/database';
import { GradeBadge } from '@/components/grading/GradeBadge';
import { RecentGradingResult } from '@/types/grading';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const features = [
  {
    icon: Camera,
    title: 'Single Crop Analysis',
    description: 'Precision grading for individual produce with detailed defect mapping.',
    path: '/grader',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100'
  },
  {
    icon: Images,
    title: 'Batch Processing',
    description: 'High-throughput grading for bulk shipments with variance reporting.',
    path: '/batch',
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  {
    icon: Bug,
    title: 'Pest & Disease Scan',
    description: 'Photo-based detection with treatment and prevention guidance.',
    path: '/pest',
    color: 'text-lime-700',
    bg: 'bg-lime-100'
  },
  {
    icon: IndianRupee,
    title: 'Market Pricing',
    description: 'Price estimation linked to quality grades and certifications.',
    path: '/price',
    color: 'text-amber-600',
    bg: 'bg-amber-100'
  }
];

interface UserStats {
  totalSingleAnalyses: number;
  totalBatchAnalyses: number;
  totalSamplesAnalyzed: number;
  averageConfidence: number;
  priceEstimationsCount: number;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentResults, setRecentResults] = useState<RecentGradingResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      // Simulate loading for premium feel, or actual fetch
      if (!user) return;
      try {
        const [statsData, recentData] = await Promise.all([
          fetchUserStats(user.id),
          fetchRecentGradingResults(user.id, 3),
        ]);
        setStats(statsData);
        setRecentResults(recentData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user]);

  const formatCropLabel = (crop: string) => (
    crop === 'unknown' ? 'Produce' : `${crop.charAt(0).toUpperCase()}${crop.slice(1)}`
  );

  const coverageValue = '12+';

  const displayStats = [
    { label: 'Total Analyses', value: stats?.totalSamplesAnalyzed || 0, icon: BarChart3 },
    { label: 'Avg Confidence', value: `${stats?.averageConfidence || 0}%`, icon: CheckCircle },
    { label: 'AI Coverage', value: coverageValue, icon: Leaf },
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-xl overflow-hidden relative bg-gradient-to-r from-primary to-emerald-900 text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
          <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight">
                Intelligent Grading for Modern Agriculture
              </h1>
              <p className="text-emerald-100 text-lg leading-relaxed">
                Empower your supply chain with AI-driven quality assessment.
                Objective grading, transparent pricing, and instant certification verification.
              </p>
              <div className="flex gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold shadow-lg">
                  <Link to="/grader">
                    Start Grading
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/history">
                    View History
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Operations Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map((feature) => (
          <motion.div key={feature.path} variants={item}>
            <Link to={feature.path} className="group block">
              <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Performance Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {displayStats.map((stat, idx) => (
              <Card key={idx} className="border shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Capabilities List */}
          <Card className="shadow-sm border-0 bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-lg">System Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered grading with automated crop identification and confidence scoring.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'AI Vision Grading',
                  'Auto Crop Identification',
                  'Confidence Scoring',
                  'Pest & Disease Detection',
                  'Batch Analytics',
                  'Exportable Reports',
                  'Cloud Grading History'
                ].map((cap) => (
                  <div key={cap} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">{cap}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Accuracy depends on clear, well‑lit images.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Side Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Recent Activity</h2>
          <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-emerald-900">Latest Grading</CardTitle>
                <History className="w-5 h-5 text-emerald-600" />
              </div>
              <CardDescription>Real analyses from your account</CardDescription>
            </CardHeader>
            <CardContent>
              {recentResults.length === 0 ? (
                <div className="text-sm text-muted-foreground bg-white rounded-lg p-4 border border-emerald-50">
                  No grading activity yet. Run a single or batch analysis to populate this feed.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-emerald-50">
                      <div>
                        <p className="font-medium text-sm">{formatCropLabel(result.cropType)}</p>
                        <p className="text-xs text-muted-foreground">{result.timestamp.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <GradeBadge grade={result.grade} size="sm" />
                        <span className="text-sm font-semibold text-emerald-700">{result.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild variant="ghost" className="w-full mt-4 text-emerald-900 hover:text-emerald-700 hover:bg-emerald-100">
                <Link to="/history">View Full History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
