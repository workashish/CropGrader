import { CropType } from '@/types/grading';

export const SUPPORTED_CROPS: { value: CropType; label: string; emoji: string }[] = [
  { value: 'mango', label: 'Mango', emoji: '🥭' },
  { value: 'tomato', label: 'Tomato', emoji: '🍅' },
  { value: 'apple', label: 'Apple', emoji: '🍎' },
  { value: 'banana', label: 'Banana', emoji: '🍌' },
  { value: 'orange', label: 'Orange', emoji: '🍊' },
  { value: 'potato', label: 'Potato', emoji: '🥔' },
  { value: 'onion', label: 'Onion', emoji: '🧅' },
  { value: 'carrot', label: 'Carrot', emoji: '🥕' },
];

export const INDIAN_REGIONS = [
  { value: 'delhi', label: 'Delhi NCR' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'kolkata', label: 'Kolkata' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'pune', label: 'Pune' },
  { value: 'ahmedabad', label: 'Ahmedabad' },
];

// Base market prices in ₹/kg (simulated average prices)
export const BASE_PRICES: Record<CropType, number> = {
  unknown: 0,
  mango: 80,
  tomato: 40,
  apple: 150,
  banana: 50,
  orange: 70,
  potato: 30,
  onion: 35,
  carrot: 45,
};

// Grade multipliers for price adjustment
export const GRADE_MULTIPLIERS: Record<string, number> = {
  A: 1.25,
  B: 1.0,
  C: 0.75,
  D: 0.5,
};

// Certification premiums (percentage increase)
export const CERTIFICATION_PREMIUMS = {
  organic: 10,
  pesticideFree: 10,
  selfDeclaration: 5,
};

// Grade color mapping for consistent UI
export const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  B: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  C: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
  D: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
};

// Score thresholds for grade assignment
export const GRADE_THRESHOLDS = {
  A: 90,
  B: 75,
  C: 55,
  D: 0,
};

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/grader', label: 'Single Crop Grader', icon: 'Camera' },
  { path: '/batch', label: 'Batch Grading', icon: 'Images' },
  { path: '/price', label: 'Price Estimator', icon: 'IndianRupee' },
  { path: '/pest', label: 'Pest & Disease', icon: 'Bug' },
  { path: '/accuracy', label: 'Accuracy Dashboard', icon: 'BarChart3' },
  { path: '/history', label: 'Grading History', icon: 'History' },
];
