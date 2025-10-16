"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StepProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps?: string[];
  className?: string;
}

export function StepProgressIndicator({
  steps,
  currentStep,
  completedSteps = [],
  className
}: StepProgressIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    isCompleted || isPast
                      ? "bg-green-500 border-green-500"
                      : isCurrent
                      ? "bg-purple-500 border-purple-500 ring-4 ring-purple-100 dark:ring-purple-900/20"
                      : "bg-white dark:bg-black border-slate-300 dark:border-slate-700"
                  )}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : Icon ? (
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isCurrent
                          ? "text-white"
                          : "text-slate-400"
                      )}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isCurrent
                          ? "text-white"
                          : "text-slate-400"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Step Label */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      isCurrent || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && isCurrent && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />
                  <div
                    className={cn(
                      "absolute inset-0 bg-green-500 transition-all duration-500",
                      isPast || isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller screens
export function StepProgressCompact({
  steps,
  currentStep,
  completedSteps = [],
  className
}: StepProgressIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const completedCount = completedSteps.length;

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span>
            {completedCount} completed
          </span>
        </div>
      </div>

      {/* Current Step Info */}
      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
        {steps[currentIndex].icon && (
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            {React.createElement(steps[currentIndex].icon!, {
              className: "w-4 h-4 text-white"
            })}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{steps[currentIndex].title}</p>
          {steps[currentIndex].description && (
            <p className="text-xs text-muted-foreground">
              {steps[currentIndex].description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

