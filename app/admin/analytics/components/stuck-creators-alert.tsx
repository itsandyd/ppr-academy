/**
 * Stuck Creators Alert - Shows creators who need outreach assistance
 * Highlights creators stuck in drafting or without first sale
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, Mail, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StuckCreatorsAlert() {
  const stuckCreators = useQuery(api.analytics.creatorPipeline.getStuckCreators, {});

  if (!stuckCreators) {
    return <StuckCreatorsAlertSkeleton />;
  }

  if (stuckCreators.length === 0) {
    return (
      <Card className="bg-white dark:bg-black">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-green-900 dark:text-green-300">All creators on track!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No creators currently need outreach
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-black border-orange-200 dark:border-orange-800">
      <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg font-semibold text-orange-900 dark:text-orange-300">
              Creators Need Help
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            {stuckCreators.length} stuck
          </Badge>
        </div>
        <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
          Creators who haven't progressed in 3+ days
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {stuckCreators.slice(0, 5).map((creator) => (
            <StuckCreatorItem key={creator._id} creator={creator} />
          ))}

          {stuckCreators.length > 5 && (
            <Button variant="outline" size="sm" className="w-full">
              View all {stuckCreators.length} creators
              <ChevronRight className="w-4 h-4 ml-2" />
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
    <div className="flex items-start justify-between p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm">{creator.userName}</p>
          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30">
            {creator.stage}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{creator.userEmail}</p>
        
        <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-400 mb-2">
          <Clock className="w-3 h-3" />
          <span>Stuck for {creator.daysSinceStep} days</span>
        </div>

        <p className="text-xs text-muted-foreground">
          → {creator.recommendedAction}
        </p>
      </div>

      <div className="flex gap-1 ml-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Mail className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MessageSquare className="w-4 h-4" />
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
        <Skeleton className="h-4 w-64 mt-2" />
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

