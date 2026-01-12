"use client";

import { cn } from "@/lib/utils";

interface ViralityBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ViralityBadge({
  score,
  size = "md",
  showLabel = false,
}: ViralityBadgeProps) {
  // Determine color based on score
  const getColor = () => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 6) return "bg-yellow-500 text-white";
    if (score >= 4) return "bg-orange-500 text-white";
    return "bg-red-500 text-white";
  };

  const getLabel = () => {
    if (score >= 9) return "Viral potential";
    if (score >= 7) return "High performing";
    if (score >= 5) return "Average";
    if (score >= 3) return "Below average";
    return "Low potential";
  };

  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-7 w-7 text-sm",
    lg: "h-9 w-9 text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold",
          getColor(),
          sizeClasses[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">{getLabel()}</span>
      )}
    </div>
  );
}

interface ViralityBarProps {
  engagementPotential: number;
  educationalValue: number;
  trendAlignment: number;
}

export function ViralityBreakdown({
  engagementPotential,
  educationalValue,
  trendAlignment,
}: ViralityBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Engagement</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full"
              style={{ width: `${engagementPotential * 10}%` }}
            />
          </div>
          <span className="font-medium w-4">{engagementPotential}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Educational</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${educationalValue * 10}%` }}
            />
          </div>
          <span className="font-medium w-4">{educationalValue}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Trend</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${trendAlignment * 10}%` }}
            />
          </div>
          <span className="font-medium w-4">{trendAlignment}</span>
        </div>
      </div>
    </div>
  );
}
