"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="w-10 h-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Chart Area */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${20 + Math.random() * 80}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            {/* Heatmap skeleton */}
            <div className="grid grid-cols-8 gap-1">
              <div></div>
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
              {Array.from({ length: 24 }).map((_, hour) => (
                <>
                  <Skeleton key={`h-${hour}`} className="h-5 w-8" />
                  {Array.from({ length: 7 }).map((_, day) => (
                    <Skeleton key={`${hour}-${day}`} className="h-5 w-full rounded" />
                  ))}
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
