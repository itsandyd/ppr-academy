/**
 * Stuck Creators Alert - Shows creators who need outreach assistance
 * Highlights creators stuck in drafting or without first sale
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, Mail, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StuckCreatorsAlert() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const stuckCreators = useQuery(api.analytics.creatorPipeline.getStuckCreators, {});

  if (!stuckCreators && !timedOut) {
    return <StuckCreatorsAlertSkeleton />;
  }

  if (!stuckCreators) {
    return null;
  }

  if (stuckCreators.length === 0) {
    return (
      <Card className="bg-white dark:bg-black">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold text-green-900 dark:text-green-300">
              All creators on track!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No creators currently need outreach
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-white dark:border-orange-800 dark:bg-black">
      <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg font-semibold text-orange-900 dark:text-orange-300">
              Creators Need Help
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
          >
            {stuckCreators.length} stuck
          </Badge>
        </div>
        <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
          Creators who haven't progressed in 3+ days
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {stuckCreators.slice(0, 5).map((creator: any) => (
            <StuckCreatorItem key={creator._id} creator={creator} />
          ))}

          {stuckCreators.length > 5 && (
            <Button variant="outline" size="sm" className="w-full">
              View all {stuckCreators.length} creators
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StuckCreatorItemProps {
  creator: any;
}

function StuckCreatorItem({ creator }: StuckCreatorItemProps) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-orange-100 bg-orange-50/50 p-3 dark:border-orange-900/30 dark:bg-orange-900/10">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-semibold">{creator.userName}</p>
          <Badge
            variant="secondary"
            className="bg-orange-100 text-xs text-orange-800 dark:bg-orange-900/30"
          >
            {creator.stage}
          </Badge>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{creator.userEmail}</p>

        <div className="mb-2 flex items-center gap-1 text-xs text-orange-700 dark:text-orange-400">
          <Clock className="h-3 w-3" />
          <span>Stuck for {creator.daysSinceStep} days</span>
        </div>

        <p className="text-xs text-muted-foreground">→ {creator.recommendedAction}</p>
      </div>

      <div className="ml-3 flex gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Mail className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StuckCreatorsAlertSkeleton() {
  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
