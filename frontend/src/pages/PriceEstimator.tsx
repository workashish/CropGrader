import { useState, useMemo } from 'react';
import { IndianRupee, Calculator, Award, Leaf, ShieldCheck, FileCheck, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GradeBadge } from '@/components/grading/GradeBadge';
import { SUPPORTED_CROPS, INDIAN_REGIONS, BASE_PRICES } from '@/lib/constants';
import { estimatePrice } from '@/lib/gradingService';
import { savePriceEstimation } from '@/lib/database';
import { CropType, Grade, PriceEstimation } from '@/types/grading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function PriceEstimator() {
  const [cropType, setCropType] = useState<CropType>('mango');
  const [grade, setGrade] = useState<Grade>('B');
  const [quantity, setQuantity] = useState<number>(10);
  const [region, setRegion] = useState<string>('delhi');
  const [organic, setOrganic] = useState(false);
  const [pesticideFree, setPesticideFree] = useState(false);
  const [selfDeclaration, setSelfDeclaration] = useState(false);

  const [estimation, setEstimation] = useState<PriceEstimation | null>(null);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const handleCalculate = async () => {
    if (!user) return;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const result = estimatePrice(cropType, grade, quantity, region, {
      organic,
      pesticideFree,
      selfDeclaration,
    });
    setEstimation(result);

    // Save to database
    try {
      await savePriceEstimation(result, user.id);
      toast({
        title: "Estimation Generated",
        description: `Market value calculation completed for ${quantity}kg ${cropType}`,
      });
    } catch (error) {
      console.error('Failed to save price estimation:', error);
    }
  };

  const chartData = useMemo(() => {
    if (!estimation) return [];
    return estimation.priceBreakdown.map(item => ({
      name: item.label,
      value: Math.abs(item.value),
      isNegative: item.value < 0,
    }));
  }, [estimation]);

  const gradeButtonClasses = (g: Grade, isActive: boolean) => {
    if (!isActive) return 'border-border hover:bg-accent hover:text-accent-foreground';
    switch (g) {
      case 'A': return 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200';
      case 'B': return 'bg-lime-600 text-white border-lime-600 shadow-md ring-2 ring-lime-200';
      case 'C': return 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-200';
      case 'D': return 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-200';
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-1">
      {/* Left Column - Inputs */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm ring-1 ring-border/50">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="w-6 h-6 text-emerald-600" />
              Price Calculator
            </CardTitle>
            <CardDescription>
              Input crop parameters to generate fair market value estimation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Crop Type</Label>
                <Select value={cropType} onValueChange={(v) => setCropType(v as CropType)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CROPS.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        <span className="flex items-center gap-2">
                          <span>{crop.label}</span>
                          <span className="text-muted-foreground ml-auto text-xs">
                            (₹{BASE_PRICES[crop.value]}/kg)
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Market Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grade Selection */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Quality Grade</Label>
              <div className="flex gap-2">
                {(['A', 'B', 'C', 'D'] as Grade[]).map((g) => (
                  <Button
                    key={g}
                    variant="outline"
                    className={`flex-1 h-12 text-lg font-bold transition-all ${gradeButtonClasses(g, grade === g)}`}
                    onClick={() => setGrade(g)}
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Quantity (KG)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="h-12 text-lg font-mono pl-4"
                />
                <div className="absolute right-4 top-3 text-muted-foreground text-sm font-medium">KG</div>
              </div>
            </div>

            {/* Certificates */}
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Premium Certifications</Label>

              <div className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${organic ? 'bg-emerald-50 border-emerald-200' : 'bg-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${organic ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}>
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Organic Certified</p>
                    <p className="text-xs text-muted-foreground">Applies 10% premium</p>
                  </div>
                </div>
                <Switch checked={organic} onCheckedChange={setOrganic} />
              </div>

              <div className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${pesticideFree ? 'bg-lime-50 border-lime-200' : 'bg-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pesticideFree ? 'bg-lime-100 text-lime-700' : 'bg-secondary text-muted-foreground'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Pesticide-Free</p>
                    <p className="text-xs text-muted-foreground">Applies 10% premium</p>
                  </div>
                </div>
                <Switch checked={pesticideFree} onCheckedChange={setPesticideFree} />
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/10" onClick={handleCalculate}>
              Calculate Market Value
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Column - Results */}
      <div className="space-y-4">
        <AnimatePresence mode='wait'>
          {estimation ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Final Price Card */}
              <Card className="shadow-2xl border-0 overflow-hidden relative bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <CardContent className="pt-8 pb-8 text-center relative z-10">
                  <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-2">Estimated Total Value</p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <IndianRupee className="w-8 h-8 opacity-80" />
                    <span className="text-6xl font-bold tracking-tight">{estimation.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md border border-white/10">
                    <Calculator className="w-3 h-3" />
                    {quantity}kg {estimation.cropType} @ ₹{estimation.finalPricePerKg}/kg
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      Price Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={index} fill={index === 0 ? '#059669' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Detailed Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {estimation.priceBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{item.label}</span>
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-medium ${item.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {item.value >= 0 ? '+' : ''}₹{item.value.toFixed(2)}
                          </span>
                          {item.percentage !== undefined && (
                            <span className="text-[10px] text-muted-foreground">
                              {item.percentage > 0 ? '+' : ''}{item.percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="text-center text-xs text-muted-foreground animate-pulse">
                * Market prices are estimates based on regional aggregations
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-white/40"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Calculator className="w-10 h-10 text-emerald-200" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Estimate Market Value</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Configure crop parameters on the left to generate a real-time price estimation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
