import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ScoreBarProps {
  label: string;
  score: number;
  explanation?: string;
  showValue?: boolean;
}

const getScoreClasses = (score: number) => {
  if (score >= 90) return 'bg-grade-a';
  if (score >= 75) return 'bg-grade-b';
  if (score >= 55) return 'bg-grade-c';
  return 'bg-grade-d';
};

export function ScoreBar({ label, score, explanation, showValue = true }: ScoreBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {explanation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{explanation}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {showValue && (
          <span className="text-sm font-mono font-semibold tabular-nums">{score}%</span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500 rounded-full", getScoreClasses(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      {explanation && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {explanation}
        </p>
      )}
    </div>
  );
}
