import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-sm' },
  md: { width: 120, strokeWidth: 8, fontSize: 'text-xl' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'text-2xl' },
};

export function ConfidenceGauge({ confidence, size = 'md' }: ConfidenceGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (confidence / 100) * circumference;

  // Using CSS variables through computed style for gauge color
  const getColorClass = (value: number) => {
    if (value >= 90) return 'text-grade-a';
    if (value >= 80) return 'text-grade-b';
    if (value >= 70) return 'text-grade-c';
    return 'text-grade-d';
  };

  const getStrokeClass = (value: number) => {
    if (value >= 90) return 'stroke-grade-a';
    if (value >= 80) return 'stroke-grade-b';
    if (value >= 70) return 'stroke-grade-c';
    return 'stroke-grade-d';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg className="transform -rotate-90" width={config.width} height={config.width}>
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            strokeWidth={config.strokeWidth}
            fill="none"
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={cn("transition-all duration-700 ease-out", getStrokeClass(confidence))}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-mono tabular-nums", config.fontSize, getColorClass(confidence))}>
            {confidence}%
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Confidence
      </span>
    </div>
  );
}
