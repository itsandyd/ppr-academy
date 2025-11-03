/**
 * Platform-Wide Funnels - Shows learner and creator funnels for entire platform
 * Displayed side-by-side in admin dashboard
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Users, UserPlus, BookOpen, DollarSign, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformFunnelsProps {
  startTime: number;
  endTime: number;
}

export function PlatformFunnels({ startTime, endTime }: PlatformFunnelsProps) {
  const learnerFunnel = useQuery(api.analytics.funnels.getLearnerFunnel, {
    startTime,
    endTime,
    // No storeId = platform-wide
  });

  const creatorFunnel = useQuery(api.analytics.funnels.getCreatorFunnel, {
    startTime,
    endTime,
  });

  if (!learnerFunnel || !creatorFunnel) {
    return <PlatformFunnelsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Learner Funnel */}
      <Card className="bg-white dark:bg-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Learner Funnel (Platform-Wide)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How visitors convert to students across all creators
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {learnerFunnel.steps.map((step, index) => (
              <FunnelStep
                key={step.name}
                step={step}
                isFirst={index === 0}
                isLast={index === learnerFunnel.steps.length - 1}
                color="blue"
              />
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Overall Conversion</p>
                <p className="text-2xl font-bold text-blue-600">
                  {learnerFunnel.steps[learnerFunnel.steps.length - 1]?.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {learnerFunnel.steps[0]?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator Funnel */}
      <Card className="bg-white dark:bg-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Creator Funnel (Platform-Wide)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How visitors become active creators
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creatorFunnel.steps.map((step, index) => (
              <FunnelStep
                key={step.name}
                step={step}
                isFirst={index === 0}
                isLast={index === creatorFunnel.steps.length - 1}
                color="purple"
              />
            ))}
          </div>

          {/* Summary + Stuck Creators Alert */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Overall Conversion</p>
                <p className="text-2xl font-bold text-purple-600">
                  {creatorFunnel.steps[creatorFunnel.steps.length - 1]?.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="text-2xl font-bold">
                  {creatorFunnel.steps.find(s => s.name === "Start Creator Flow")?.count || 0}
                </p>
              </div>
            </div>

            {/* Stuck Creators Count */}
            {creatorFunnel.stuckCreators.length > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                    {creatorFunnel.stuckCreators.length} creators stuck in drafting
                  </p>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                  Need outreach assistance
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
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
  color: "blue" | "purple";
}

function FunnelStep({ step, isFirst, isLast, color }: FunnelStepProps) {
  const getStepIcon = (name: string) => {
    if (name.includes("Visit")) return Users;
    if (name.includes("Signup") || name.includes("Start")) return UserPlus;
    if (name.includes("Enroll") || name.includes("Publish")) return BookOpen;
    if (name.includes("Return") || name.includes("Sale")) return DollarSign;
    return TrendingUp;
  };

  const Icon = getStepIcon(step.name);
  const colorClasses = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      gradient: "from-blue-300 to-blue-500 dark:from-blue-700 dark:to-blue-500",
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      gradient: "from-purple-300 to-purple-500 dark:from-purple-700 dark:to-purple-500",
    },
  };

  return (
    <div className="relative">
      {/* Step Content */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${colorClasses[color].bg}`}>
            <Icon className={`w-4 h-4 ${colorClasses[color].text}`} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{step.name}</h4>
            <p className="text-xs text-muted-foreground">{step.count} users</p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-xl font-bold ${colorClasses[color].text}`}>
            {step.conversionRate.toFixed(1)}%
          </div>
          {!isFirst && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <TrendingDown className="w-3 h-3 text-orange-500" />
              {step.dropOff.toFixed(0)}% drop
            </div>
          )}
        </div>
      </div>

      {/* Connector Arrow */}
      {!isLast && (
        <div className="flex items-center justify-center my-1">
          <div className={`w-0.5 h-4 bg-gradient-to-b ${colorClasses[color].gradient}`} />
        </div>
      )}
    </div>
  );
}

function PlatformFunnelsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Card key={i} className="bg-white dark:bg-black">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

