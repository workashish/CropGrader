import { cn } from '@/lib/utils';
import { Grade } from '@/types/grading';

interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const gradeConfig: Record<Grade, { bg: string; label: string }> = {
  A: { bg: 'bg-grade-a text-grade-a-foreground', label: 'Premium' },
  B: { bg: 'bg-grade-b text-grade-b-foreground', label: 'Standard' },
  C: { bg: 'bg-grade-c text-grade-c-foreground', label: 'Economy' },
  D: { bg: 'bg-grade-d text-grade-d-foreground', label: 'Below Grade' },
};

const sizeConfig = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-20 h-20 text-4xl',
};

export function GradeBadge({ grade, size = 'md', showLabel = false }: GradeBadgeProps) {
  const config = gradeConfig[grade];
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={cn(
          "flex items-center justify-center font-bold rounded-lg shadow-md",
          config.bg,
          sizeConfig[size]
        )}
      >
        {grade}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {config.label}
        </span>
      )}
    </div>
  );
}
