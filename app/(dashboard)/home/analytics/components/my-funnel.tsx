/**
 * My Funnel Component - Shows creator's personal conversion funnel
 * Displays how visitors convert through their courses/products
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrendingUp, TrendingDown, Users, UserPlus, BookOpen, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MyFunnelProps {
  storeId: string;
  startTime: number;
  endTime: number;
}

export function MyFunnel({ storeId, startTime, endTime }: MyFunnelProps) {
  const funnelData = useQuery(api.analytics.funnels.getLearnerFunnel, {
    startTime,
    endTime,
    storeId,
  });

  if (!funnelData) {
    return <MyFunnelSkeleton />;
  }

  const steps = funnelData.steps;

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">My Conversion Funnel</CardTitle>
        <p className="text-sm text-muted-foreground">How visitors convert to paying students</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step: any, index: number) => (
            <FunnelStep
              key={step.name}
              step={step}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Overall Conversion</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {steps[steps.length - 1]?.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">From visit to return</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Drop-off</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(100 - steps[steps.length - 1]?.conversionRate).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Visitors who didn't return</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FunnelStepProps {
  step: {
    name: string;
    count: number;
    conversionRate: number;
    dropOff: number;
  };
  isFirst: boolean;
  isLast: boolean;
}

function FunnelStep({ step, isFirst, isLast }: FunnelStepProps) {
  const getStepIcon = (name: string) => {
    switch (name) {
      case "Visit":
        return Users;
      case "Signup":
        return UserPlus;
      case "Enroll":
        return BookOpen;
      case "Return Week 2":
        return TrendingUp;
      default:
        return Users;
    }
  };

  const Icon = getStepIcon(step.name);

  return (
    <div className="relative">
      {/* Step Content */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 sm:p-4 transition-colors hover:bg-muted">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Icon */}
          <div className="rounded-full bg-purple-100 p-2 sm:p-3 dark:bg-purple-900/30 flex-shrink-0">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
          </div>

          {/* Step Info */}
          <div className="min-w-0">
            <h4 className="font-semibold text-sm sm:text-base">{step.name}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{step.count} users</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="text-right flex-shrink-0 ml-2">
          <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {step.conversionRate.toFixed(1)}%
          </div>
          {!isFirst && (
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-orange-500" />
              {step.dropOff.toFixed(1)}% drop-off
            </div>
          )}
        </div>
      </div>

      {/* Connector Arrow */}
      {!isLast && (
        <div className="my-2 flex items-center justify-center">
          <div className="h-6 w-0.5 bg-gradient-to-b from-purple-300 to-purple-500 dark:from-purple-700 dark:to-purple-500" />
        </div>
      )}
    </div>
  );
}

function MyFunnelSkeleton() {
  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="mb-2 h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
