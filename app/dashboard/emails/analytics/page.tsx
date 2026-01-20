"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Send,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Users,
  Workflow,
  Activity,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  FileDown,
} from "lucide-react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Simple bar chart component
function SimpleBarChart({
  data,
  dataKey,
  color = "bg-primary",
  maxValue,
}: {
  data: Array<{ date: string; [key: string]: number | string }>;
  dataKey: string;
  color?: string;
  maxValue?: number;
}) {
  const max = maxValue || Math.max(...data.map((d) => (d[dataKey] as number) || 0), 1);

  return (
    <div className="flex h-32 items-end gap-1">
      {data.slice(-14).map((item, idx) => {
        const value = (item[dataKey] as number) || 0;
        const height = (value / max) * 100;
        return (
          <div
            key={idx}
            className="group relative flex-1"
            title={`${item.date}: ${value}`}
          >
            <div
              className={cn(
                "w-full rounded-t transition-all hover:opacity-80",
                color
              )}
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Metric card component
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "text-primary",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-lg bg-muted p-2", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span
              className={cn(
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Engagement segment component
function EngagementSegment({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Engagement Heatmap component
function EngagementHeatmap({
  data,
}: {
  data: Array<{ hour: number; dayOfWeek: number; openRate: number; totalOpens: number }>;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Create a map for quick lookup
  const heatmapData = new Map<string, { openRate: number; totalOpens: number }>();
  let maxRate = 0;

  for (const item of data) {
    const key = `${item.dayOfWeek}-${item.hour}`;
    heatmapData.set(key, { openRate: item.openRate, totalOpens: item.totalOpens });
    if (item.openRate > maxRate) maxRate = item.openRate;
  }

  const getColor = (rate: number) => {
    if (rate === 0 || maxRate === 0) return "bg-muted";
    const intensity = rate / maxRate;
    if (intensity >= 0.8) return "bg-purple-600";
    if (intensity >= 0.6) return "bg-purple-500";
    if (intensity >= 0.4) return "bg-purple-400";
    if (intensity >= 0.2) return "bg-purple-300";
    return "bg-purple-200";
  };

  return (
    <div className="space-y-2">
      {/* Hour labels */}
      <div className="flex gap-[2px] pl-10">
        {hours.filter((_, i) => i % 3 === 0).map((hour) => (
          <div
            key={hour}
            className="flex-1 text-center text-[10px] text-muted-foreground"
            style={{ minWidth: "24px" }}
          >
            {hour}:00
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      {days.map((day, dayIndex) => (
        <div key={day} className="flex items-center gap-1">
          <div className="w-8 text-xs text-muted-foreground">{day}</div>
          <div className="flex flex-1 gap-[2px]">
            {hours.map((hour) => {
              const key = `${dayIndex}-${hour}`;
              const cellData = heatmapData.get(key);
              const rate = cellData?.openRate || 0;
              const opens = cellData?.totalOpens || 0;

              return (
                <div
                  key={hour}
                  className={cn(
                    "group relative h-6 flex-1 rounded-sm transition-all hover:ring-2 hover:ring-primary/50",
                    getColor(rate)
                  )}
                  title={`${day} ${hour}:00 - ${rate}% open rate (${opens} opens)`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                    <p className="font-medium">{day} {hour}:00</p>
                    <p>{rate}% rate • {opens} opens</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <span className="text-xs text-muted-foreground">Low</span>
        <div className="flex gap-[2px]">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <div className="h-3 w-3 rounded-sm bg-purple-200" />
          <div className="h-3 w-3 rounded-sm bg-purple-300" />
          <div className="h-3 w-3 rounded-sm bg-purple-400" />
          <div className="h-3 w-3 rounded-sm bg-purple-500" />
          <div className="h-3 w-3 rounded-sm bg-purple-600" />
        </div>
        <span className="text-xs text-muted-foreground">High</span>
      </div>
    </div>
  );
}

export default function EmailAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const [dateRange, setDateRange] = useState("30");

  const storeId = user?.id || "";
  const days = parseInt(dateRange);

  // Queries
  const metrics = useQuery(
    api.emailCreatorAnalytics.getCreatorEmailMetrics,
    storeId ? { storeId, days } : "skip"
  );

  const workflowAnalytics = useQuery(
    api.emailCreatorAnalytics.getWorkflowAnalytics,
    storeId ? { storeId } : "skip"
  );

  const dailyActivity = useQuery(
    api.emailCreatorAnalytics.getDailyEmailActivity,
    storeId ? { storeId, days } : "skip"
  );

  const topEmails = useQuery(
    api.emailCreatorAnalytics.getTopPerformingEmails,
    storeId ? { storeId, limit: 5 } : "skip"
  );

  const engagementBreakdown = useQuery(
    api.emailCreatorAnalytics.getEngagementBreakdown,
    storeId ? { storeId } : "skip"
  );

  const recentActivity = useQuery(
    api.emailCreatorAnalytics.getRecentActivity,
    storeId ? { storeId, limit: 10 } : "skip"
  );

  const bestSendTimes = useQuery(
    api.emailCreatorAnalytics.getBestSendTimes,
    storeId ? { storeId } : "skip"
  );

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const isLoading =
    metrics === undefined ||
    workflowAnalytics === undefined ||
    dailyActivity === undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "email_sent":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "email_opened":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "email_clicked":
        return <MousePointerClick className="h-4 w-4 text-cyan-600" />;
      case "subscribed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "unsubscribed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Find best send hour
  const bestHour = bestSendTimes?.[0];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Export analytics to CSV
  const exportAnalyticsToCSV = () => {
    if (!metrics || !dailyActivity) return;

    const headers = ["Metric", "Value"];
    const metricsData = [
      ["Total Emails Sent", metrics.totalSent],
      ["Total Delivered", metrics.totalDelivered],
      ["Total Opened", metrics.totalOpened],
      ["Total Clicked", metrics.totalClicked],
      ["Open Rate", `${((metrics.openRate || 0) * 100).toFixed(1)}%`],
      ["Click Rate", `${((metrics.clickRate || 0) * 100).toFixed(1)}%`],
      ["Bounce Rate", `${((metrics.bounceRate || 0) * 100).toFixed(1)}%`],
      ["Unsubscribe Rate", `${((metrics.unsubscribeRate || 0) * 100).toFixed(1)}%`],
    ];

    // Add daily activity
    const dailyHeaders = ["Date", "Sent", "Opened", "Clicked"];
    const dailyData = dailyActivity.map((day) => [
      day.date,
      day.sent,
      day.opened,
      day.clicked,
    ]);

    const csvContent = [
      "=== Email Performance Summary ===",
      headers.join(","),
      ...metricsData.map((row) => row.join(",")),
      "",
      "=== Daily Activity ===",
      dailyHeaders.join(","),
      ...dailyData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `email-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/emails?mode=create")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Email Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Track your email performance and engagement
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAnalyticsToCSV}
              disabled={!metrics || !dailyActivity}
              className="gap-1"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Sent"
            value={metrics?.totalSent.toLocaleString() || "0"}
            subtitle={`${days} day period`}
            icon={Send}
            color="text-blue-600"
          />
          <MetricCard
            title="Open Rate"
            value={`${metrics?.openRate || 0}%`}
            subtitle={`${metrics?.totalOpened.toLocaleString() || 0} opens`}
            icon={Eye}
            trend={metrics && metrics.openRate > 20 ? "up" : "neutral"}
            trendValue={metrics && metrics.openRate > 20 ? "Above average" : "Industry avg: 20%"}
            color="text-purple-600"
          />
          <MetricCard
            title="Click Rate"
            value={`${metrics?.clickRate || 0}%`}
            subtitle={`${metrics?.totalClicked.toLocaleString() || 0} clicks`}
            icon={MousePointerClick}
            trend={metrics && metrics.clickRate > 2.5 ? "up" : "neutral"}
            trendValue={metrics && metrics.clickRate > 2.5 ? "Above average" : "Industry avg: 2.5%"}
            color="text-cyan-600"
          />
          <MetricCard
            title="Bounce Rate"
            value={`${metrics?.bounceRate || 0}%`}
            subtitle={`${metrics?.totalBounced || 0} bounced`}
            icon={AlertCircle}
            trend={metrics && metrics.bounceRate > 2 ? "down" : "up"}
            trendValue={metrics && metrics.bounceRate > 2 ? "Above 2% threshold" : "Healthy"}
            color="text-amber-600"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2">
              <Users className="h-4 w-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Daily Activity Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Email Activity</CardTitle>
                  <CardDescription>
                    Daily emails sent, opened, and clicked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyActivity && dailyActivity.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-blue-500" />
                            Sent
                          </span>
                          <span className="text-muted-foreground">
                            {dailyActivity.reduce((sum, d) => sum + d.sent, 0)} total
                          </span>
                        </div>
                        <SimpleBarChart
                          data={dailyActivity}
                          dataKey="sent"
                          color="bg-blue-500"
                        />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-purple-500" />
                            Opened
                          </span>
                          <span className="text-muted-foreground">
                            {dailyActivity.reduce((sum, d) => sum + d.opened, 0)} total
                          </span>
                        </div>
                        <SimpleBarChart
                          data={dailyActivity}
                          dataKey="opened"
                          color="bg-purple-500"
                        />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-cyan-500" />
                            Clicked
                          </span>
                          <span className="text-muted-foreground">
                            {dailyActivity.reduce((sum, d) => sum + d.clicked, 0)} total
                          </span>
                        </div>
                        <SimpleBarChart
                          data={dailyActivity}
                          dataKey="clicked"
                          color="bg-cyan-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-muted-foreground">
                      No activity data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Best Send Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Best Send Time
                  </CardTitle>
                  <CardDescription>
                    When your audience is most engaged
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bestHour ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-primary/10 p-4 text-center">
                        <p className="text-3xl font-bold text-primary">
                          {bestHour.hour.toString().padStart(2, "0")}:00
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {dayNames[bestHour.dayOfWeek]}s
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Open rate</span>
                          <span className="font-medium">{bestHour.openRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Click rate</span>
                          <span className="font-medium">{bestHour.clickRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total opens</span>
                          <span className="font-medium">{bestHour.totalOpens}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      Not enough data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Emails */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Performing Emails</CardTitle>
                <CardDescription>
                  Emails with the highest engagement rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topEmails && topEmails.length > 0 ? (
                  <div className="space-y-4">
                    {topEmails.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{email.emailSubject}</p>
                          {email.workflowName && (
                            <p className="text-sm text-muted-foreground">
                              {email.workflowName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{email.sent}</p>
                            <p className="text-xs text-muted-foreground">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-purple-600">
                              {email.openRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">Opens</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-cyan-600">
                              {email.clickRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">Clicks</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    No email data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5" />
                  Engagement Heatmap
                </CardTitle>
                <CardDescription>
                  When your audience opens emails by day and hour
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bestSendTimes && bestSendTimes.length > 0 ? (
                  <EngagementHeatmap data={bestSendTimes} />
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Not enough data to show heatmap yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow Performance</CardTitle>
                <CardDescription>
                  How your automation workflows are performing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflowAnalytics && workflowAnalytics.length > 0 ? (
                  <div className="space-y-4">
                    {workflowAnalytics.map((workflow) => (
                      <div
                        key={workflow.workflowId}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{workflow.workflowName}</h3>
                              <Badge
                                variant={workflow.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {workflow.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {workflow.totalEnrolled} contacts enrolled
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/emails/workflows?mode=create&id=${workflow.workflowId}`
                              )
                            }
                          >
                            View
                          </Button>
                        </div>
                        <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
                          <div>
                            <p className="text-2xl font-bold">
                              {workflow.totalEnrolled}
                            </p>
                            <p className="text-xs text-muted-foreground">Enrolled</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {workflow.totalActive}
                            </p>
                            <p className="text-xs text-muted-foreground">Active</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {workflow.totalCompleted}
                            </p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">
                              {workflow.completionRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Completion
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Workflow className="h-12 w-12 opacity-50" />
                    <div className="text-center">
                      <p>No workflows yet</p>
                      <Button
                        variant="link"
                        onClick={() =>
                          router.push("/dashboard/emails/workflows?mode=create")
                        }
                      >
                        Create your first workflow
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Engagement Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Engagement</CardTitle>
                  <CardDescription>
                    How engaged your contacts are with your emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {engagementBreakdown ? (
                    <>
                      <EngagementSegment
                        label="Highly Engaged"
                        count={engagementBreakdown.highlyEngaged}
                        total={engagementBreakdown.total}
                        color="bg-green-500"
                      />
                      <EngagementSegment
                        label="Engaged"
                        count={engagementBreakdown.engaged}
                        total={engagementBreakdown.total}
                        color="bg-blue-500"
                      />
                      <EngagementSegment
                        label="Low Engagement"
                        count={engagementBreakdown.lowEngagement}
                        total={engagementBreakdown.total}
                        color="bg-amber-500"
                      />
                      <EngagementSegment
                        label="Inactive"
                        count={engagementBreakdown.inactive}
                        total={engagementBreakdown.total}
                        color="bg-zinc-400"
                      />
                      <div className="border-t pt-4 text-sm text-muted-foreground">
                        Total contacts: {engagementBreakdown.total}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-48 items-center justify-center text-muted-foreground">
                      No engagement data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unsubscribe Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">List Health</CardTitle>
                  <CardDescription>Monitor your email list quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {engagementBreakdown?.total || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Subscribers
                      </p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-3xl font-bold text-red-600">
                        {metrics?.totalUnsubscribed || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Unsubscribed</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600">
                        {metrics?.totalBounced || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Bounced</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-3xl font-bold">
                        {metrics?.unsubscribeRate || 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Unsubscribe Rate
                      </p>
                    </div>
                  </div>
                  {metrics && metrics.bounceRate > 2 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            High Bounce Rate
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            Your bounce rate is above 2%. Consider cleaning your
                            list to improve deliverability.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Latest email events from your contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 rounded-lg border p-4"
                      >
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">
                                {activity.contactName || activity.contactEmail}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatActivityType(activity.type)}
                              </p>
                              {activity.metadata?.emailSubject && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Email: {activity.metadata.emailSubject}
                                </p>
                              )}
                            </div>
                            <p className="shrink-0 text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Activity className="h-12 w-12 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
