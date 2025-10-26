"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface NotificationHintCardProps {
  courseId: Id<"courses">;
  storeId: string;
  hasChanges?: boolean;
  changeCount?: {
    newModules: number;
    newLessons: number;
    newChapters: number;
  };
}

export function NotificationHintCard({ 
  courseId, 
  storeId, 
  hasChanges = false,
  changeCount 
}: NotificationHintCardProps) {
  if (!hasChanges) return null;

  const totalChanges = (changeCount?.newModules || 0) + 
                       (changeCount?.newLessons || 0) + 
                       (changeCount?.newChapters || 0);

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                New Content Added!
              </h3>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              You've added {totalChanges} new {totalChanges === 1 ? 'item' : 'items'} to this course. 
              Notify your students with AI-generated update messages!
            </p>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Link href={`/store/${storeId}/course/${courseId}/notifications`}>
                  <Bell className="mr-2 h-3 w-3" />
                  Send Update Notification
                </Link>
              </Button>
              {changeCount && (
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    +{changeCount.newModules}m +{changeCount.newLessons}l +{changeCount.newChapters}c
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

