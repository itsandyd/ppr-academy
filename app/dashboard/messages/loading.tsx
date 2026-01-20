"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 p-6">
      {/* Conversation List */}
      <Card className="w-80 flex-shrink-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-10 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Message View */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-4 space-y-4 overflow-hidden">
          {/* Messages */}
          <div className="flex justify-start">
            <Skeleton className="h-16 w-64 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-48 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-20 w-72 rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-40 rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-14 w-56 rounded-2xl" />
          </div>
        </CardContent>
        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </Card>
    </div>
  );
}
