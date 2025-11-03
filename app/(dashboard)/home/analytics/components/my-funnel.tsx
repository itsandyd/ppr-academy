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
        <p className="text-sm text-muted-foreground">
          How visitors convert to paying students
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <FunnelStep
              key={step.name}
              step={step}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Overall Conversion</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {steps[steps.length - 1]?.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              From visit to return
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Drop-off</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(100 - steps[steps.length - 1]?.conversionRate).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Visitors who didn't return
            </p>
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
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
            <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>

          {/* Step Info */}
          <div>
            <h4 className="font-semibold">{step.name}</h4>
            <p className="text-sm text-muted-foreground">{step.count} users</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {step.conversionRate.toFixed(1)}%
          </div>
          {!isFirst && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <TrendingDown className="w-3 h-3 text-orange-500" />
              {step.dropOff.toFixed(1)}% drop-off
            </div>
          )}
        </div>
      </div>

      {/* Connector Arrow */}
      {!isLast && (
        <div className="flex items-center justify-center my-2">
          <div className="w-0.5 h-6 bg-gradient-to-b from-purple-300 to-purple-500 dark:from-purple-700 dark:to-purple-500" />
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
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
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

