"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction?: "up" | "down" | "neutral";
  };
  sparklineData?: number[];
  variant?: "default" | "purple" | "blue" | "green" | "orange" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    trendPositive: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    trendNegative: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    trendNeutral: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20",
  },
  purple: {
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    trendPositive: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    trendNegative: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    trendNeutral: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
  },
  blue: {
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    trendPositive: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    trendNegative: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    trendNeutral: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  },
  green: {
    iconBg: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    trendPositive: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    trendNegative: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    trendNeutral: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
  },
  orange: {
    iconBg: "bg-orange-100 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    trendPositive: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    trendNegative: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    trendNeutral: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
  },
  red: {
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    trendPositive: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    trendNegative: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    trendNeutral: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  },
};

export function MetricCardEnhanced({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  sparklineData,
  variant = "default",
  size = "md",
  className
}: MetricCardProps) {
  const styles = variantStyles[variant];
  
  // Determine trend direction if not specified
  const trendDirection = trend?.direction || (
    trend?.value && trend.value > 0 ? "up" : 
    trend?.value && trend.value < 0 ? "down" : 
    "neutral"
  );

  const TrendIcon = trendDirection === "up" ? TrendingUp : 
                    trendDirection === "down" ? TrendingDown : 
                    Minus;

  const trendStyle = trendDirection === "up" ? styles.trendPositive :
                     trendDirection === "down" ? styles.trendNegative :
                     styles.trendNeutral;

  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group",
      className
    )}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className={cn(
              "font-medium text-muted-foreground",
              size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
            )}>
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className={cn(
                "font-bold text-foreground",
                size === "sm" ? "text-xl" : size === "md" ? "text-2xl" : "text-3xl"
              )}>
                {value}
              </p>
              {trend && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs gap-1", trendStyle)}
                >
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(trend.value)}%
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className={cn(
                "text-muted-foreground mt-1",
                size === "sm" ? "text-xs" : "text-sm"
              )}>
                {subtitle}
              </p>
            )}
            {trend?.label && (
              <p className={cn(
                "text-muted-foreground mt-1",
                size === "sm" ? "text-xs" : "text-sm"
              )}>
                {trend.label}
              </p>
            )}
          </div>
          <div className={cn(
            "rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform",
            styles.iconBg,
            size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-12 h-12"
          )}>
            <Icon className={cn(
              styles.iconColor,
              size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"
            )} />
          </div>
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4">
            <Sparkline data={sparklineData} variant={variant} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple SVG Sparkline Component
function Sparkline({ 
  data, 
  variant = "default" 
}: { 
  data: number[], 
  variant: MetricCardProps["variant"] 
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 200;

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;

  // Create area path
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  const strokeColors = {
    default: "stroke-slate-400",
    purple: "stroke-purple-500",
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    orange: "stroke-orange-500",
    red: "stroke-red-500",
  };

  const fillColors = {
    default: "fill-slate-100 dark:fill-slate-800",
    purple: "fill-purple-100 dark:fill-purple-900/20",
    blue: "fill-blue-100 dark:fill-blue-900/20",
    green: "fill-green-100 dark:fill-green-900/20",
    orange: "fill-orange-100 dark:fill-orange-900/20",
    red: "fill-red-100 dark:fill-red-900/20",
  };

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-10"
      preserveAspectRatio="none"
    >
      {/* Area */}
      <path
        d={areaData}
        className={cn(fillColors[variant || "default"], "opacity-30")}
      />
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        className={cn(strokeColors[variant || "default"], "opacity-80")}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

