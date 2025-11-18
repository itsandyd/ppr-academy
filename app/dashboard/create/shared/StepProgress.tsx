'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  color?: string;
  estimatedTime?: string;
  conditional?: boolean;
}

interface StepProgressProps {
  steps: Step[];
  currentStepId: string;
  completedSteps?: string[];
  onStepClick?: (stepId: string) => void;
  variant?: 'full' | 'compact';
}

export function StepProgress({
  steps,
  currentStepId,
  completedSteps = [],
  onStepClick,
  variant = 'full',
}: StepProgressProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStepId;
          const isPast = index < currentIndex;
          const Icon = step.icon || Circle;
          const isClickable = onStepClick && (isPast || isCurrent);

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap',
                isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                !isCurrent && isPast && 'bg-muted text-foreground hover:bg-muted/80',
                !isCurrent && !isPast && 'text-muted-foreground',
                isClickable && !isCurrent && 'cursor-pointer',
                !isClickable && 'cursor-not-allowed opacity-50'
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{index + 1}</span>
              {step.estimatedTime && isCurrent && (
                <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                  <Clock className="w-3 h-3 mr-1" />
                  {step.estimatedTime}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

