"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DollarSign,
  UserPlus,
  GraduationCap,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveActivityFeedProps {
  userId: string;
  limit?: number;
  className?: string;
}

interface ActivityData {
  id: string;
  type: "purchase" | "enrollment" | "completion";
  title: string;
  description: string;
  amount?: number;
  timestamp: number;
  userInfo?: {
    name?: string;
    email?: string;
  };
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getActivityIcon(type: "purchase" | "enrollment" | "completion") {
  switch (type) {
    case "purchase":
      return <DollarSign className="h-4 w-4 text-emerald-500" />;
    case "enrollment":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "completion":
      return <GraduationCap className="h-4 w-4 text-purple-500" />;
  }
}

function getActivityColor(type: "purchase" | "enrollment" | "completion") {
  switch (type) {
    case "purchase":
      return "bg-emerald-100 dark:bg-emerald-900/20";
    case "enrollment":
      return "bg-blue-100 dark:bg-blue-900/20";
    case "completion":
      return "bg-purple-100 dark:bg-purple-900/20";
  }
}

export function LiveActivityFeed({
  userId,
  limit = 10,
  className,
}: LiveActivityFeedProps) {
  // This query auto-updates in real-time via Convex
  const activities = useQuery(api.analytics.getCreatorRecentActivity, {
    userId,
    limit,
  });

  if (activities === undefined) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Live Activity
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here in real-time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Live Activity
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activities.map((activity: ActivityData) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                  getActivityColor(activity.type)
                )}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">
                    {activity.userInfo?.name ||
                      activity.userInfo?.email?.split("@")[0] ||
                      "Someone"}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {activity.title}
                </p>
              </div>

              {/* Amount (for purchases) */}
              {activity.amount && activity.amount > 0 && (
                <div className="text-right shrink-0">
                  <span className="font-semibold text-emerald-600">
                    +${activity.amount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
