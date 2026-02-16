"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Play,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoAnalyticsProps {
  userId: string;
  className?: string;
}

interface ChapterData {
  chapterId: string;
  chapterTitle: string;
  courseTitle: string;
  totalWatchTime: number;
  avgPercentWatched: number;
  viewCount: number;
  completionCount: number;
  completionRate: number;
  avgDropOffPoint: number;
  rewatchCount: number;
}

interface DropOffHotspot {
  chapterId: string;
  chapterTitle: string;
  courseTitle: string;
  dropOffRate: number;
  avgDropOffPoint: number;
}

const CHART_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

function formatWatchTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function VideoAnalytics({ userId, className }: VideoAnalyticsProps) {
  const videoData = useQuery(api.analytics.getCreatorVideoAnalytics, {
    userId,
  });

  if (videoData === undefined) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-rose-500" />
            Video Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (videoData.totalViews === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-rose-500" />
            Video Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No video views yet</p>
            <p className="text-sm">Analytics will appear here once students watch your videos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = videoData.chapters.slice(0, 6).map((chapter: ChapterData) => ({
    name:
      chapter.chapterTitle.length > 15
        ? chapter.chapterTitle.substring(0, 15) + "..."
        : chapter.chapterTitle,
    views: chapter.viewCount,
    completion: chapter.completionRate,
    fullName: chapter.chapterTitle,
    course: chapter.courseTitle,
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-rose-500" />
          Video Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Watch Time</p>
              <p className="font-semibold">{formatWatchTime(videoData.totalWatchTime)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <Eye className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Views</p>
              <p className="font-semibold">{videoData.totalViews.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Completion</p>
              <p className="font-semibold">{videoData.avgCompletionRate}%</p>
            </div>
          </div>
        </div>

        {/* Views Chart */}
        {chartData.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Views by Chapter</p>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[350px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "views") return [value, "Views"];
                    if (name === "completion") return [`${value}%`, "Completion"];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.fullName} (${data.course})`;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="views" name="views" radius={[0, 4, 4, 0]}>
                  {chartData.map((_: { name: string; views: number; completion: number; fullName: string; course: string }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Drop-off Hotspots */}
        {videoData.dropOffHotspots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium">Drop-off Hotspots</p>
            </div>
            <div className="space-y-2">
              {videoData.dropOffHotspots.map((hotspot: DropOffHotspot) => (
                <div
                  key={hotspot.chapterId}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {hotspot.chapterTitle}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {hotspot.courseTitle}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-amber-600">
                      {hotspot.dropOffRate}% drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      at ~{hotspot.avgDropOffPoint}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High Rewatch Chapters */}
        {videoData.chapters.filter((c: ChapterData) => c.rewatchCount > 3).length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-medium">Frequently Rewatched</p>
              <span className="text-xs text-muted-foreground">(may indicate difficulty)</span>
            </div>
            <div className="space-y-2">
              {videoData.chapters
                .filter((c: ChapterData) => c.rewatchCount > 3)
                .sort((a: ChapterData, b: ChapterData) => b.rewatchCount - a.rewatchCount)
                .slice(0, 3)
                .map((chapter: ChapterData) => (
                  <div
                    key={chapter.chapterId}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {chapter.chapterTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {chapter.courseTitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-blue-600">
                        {chapter.rewatchCount} rewatches
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
