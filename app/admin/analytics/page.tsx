"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Package,
  Store,
  UserCheck,
  GraduationCap,
  ArrowUp,
  ArrowUpRight,
  Activity,
  Loader2,
  BarChart3,
  Sparkles,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PlatformKPIsOverview } from "./components/platform-kpis-overview";
import { PlatformFunnels } from "./components/platform-funnels";
import { CreatorPipelineBoard } from "./components/creator-pipeline-board";
import { StuckCreatorsAlert } from "./components/stuck-creators-alert";
import { SystemHealthMonitor } from "./components/system-health-monitor";
import { WebAnalyticsOverview } from "./components/web-analytics-overview";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

type TimeWindow = "7d" | "28d";

export default function AdminAnalyticsPage() {
  const { user } = useUser();
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate time range
  const getTimeRange = () => {
    const now = Date.now();
    switch (timeWindow) {
      case "7d":
        return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
      case "28d":
        return { start: now - 28 * 24 * 60 * 60 * 1000, end: now };
    }
  };

  const { start, end } = getTimeRange();

  // Fetch analytics data
  const overview = useQuery(
    api.adminAnalytics.getPlatformOverview,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const revenueData = useQuery(
    api.adminAnalytics.getRevenueOverTime,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const topCourses = useQuery(
    api.adminAnalytics.getTopCourses,
    user?.id ? { clerkId: user.id, limit: 5 } : "skip"
  );
  const topCreators = useQuery(
    api.adminAnalytics.getTopCreators,
    user?.id ? { clerkId: user.id, limit: 5 } : "skip"
  );
  const userGrowth = useQuery(
    api.adminAnalytics.getUserGrowth,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const categoryDist = useQuery(
    api.adminAnalytics.getCategoryDistribution,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const recentActivity = useQuery(
    api.adminAnalytics.getRecentActivity,
    user?.id ? { clerkId: user.id } : "skip"
  );

  if (
    !overview ||
    !revenueData ||
    !topCourses ||
    !topCreators ||
    !userGrowth ||
    !categoryDist ||
    !recentActivity
  ) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2" />
            <div className="absolute inset-[2px] flex items-center justify-center rounded-2xl bg-background">
              <BarChart3 className="h-6 w-6 text-chart-1" />
            </div>
          </div>
          <div>
            <p className="font-medium">Loading analytics</p>
            <p className="text-sm text-muted-foreground">Crunching the numbers...</p>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Users",
      value: overview.totalUsers.toLocaleString(),
      icon: Users,
      change: "+12.5%",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/5",
    },
    {
      title: "Active Users (30d)",
      value: overview.activeUsers.toLocaleString(),
      icon: UserCheck,
      change: "+8.3%",
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/5",
    },
    {
      title: "Total Revenue",
      value: `$${overview.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+23.1%",
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-500/10 to-purple-500/5",
    },
    {
      title: "Total Courses",
      value: overview.totalCourses.toLocaleString(),
      icon: BookOpen,
      change: "+15.2%",
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/5",
    },
    {
      title: "Published Courses",
      value: overview.publishedCourses.toLocaleString(),
      icon: GraduationCap,
      change: "+9.7%",
      gradient: "from-indigo-500 to-blue-500",
      bgGradient: "from-indigo-500/10 to-blue-500/5",
    },
    {
      title: "Total Enrollments",
      value: overview.totalEnrollments.toLocaleString(),
      icon: TrendingUp,
      change: "+18.4%",
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-500/10 to-rose-500/5",
    },
    {
      title: "Digital Products",
      value: overview.totalProducts.toLocaleString(),
      icon: Package,
      change: "+6.9%",
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-500/10 to-cyan-500/5",
    },
    {
      title: "Active Stores",
      value: overview.totalStores.toLocaleString(),
      icon: Store,
      change: "+4.2%",
      gradient: "from-cyan-500 to-sky-500",
      bgGradient: "from-cyan-500/10 to-sky-500/5",
    },
  ];

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className={cn("space-y-8", mounted ? "duration-500 animate-in fade-in-0" : "opacity-0")}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Analytics Center</h1>
            <Badge variant="outline" className="border-chart-1/30 bg-chart-1/5 text-chart-1">
              <Sparkles className="mr-1 h-3 w-3" />
              Real-time
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Platform-wide analytics, creator pipeline, and system health monitoring
          </p>
        </div>

        {/* Time window selector */}
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/50 p-1">
          <Button
            variant={timeWindow === "7d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeWindow("7d")}
            className={cn("gap-1.5 rounded-lg", timeWindow === "7d" && "bg-background shadow-sm")}
          >
            <Calendar className="h-3.5 w-3.5" />7 days
          </Button>
          <Button
            variant={timeWindow === "28d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTimeWindow("28d")}
            className={cn("gap-1.5 rounded-lg", timeWindow === "28d" && "bg-background shadow-sm")}
          >
            <Calendar className="h-3.5 w-3.5" />
            28 days
          </Button>
        </div>
      </div>

      {/* Platform KPIs with time window toggle */}
      <PlatformKPIsOverview />

      {/* Web Analytics from Vercel Drain */}
      <WebAnalyticsOverview />

      {/* Platform-Wide Funnels */}
      <PlatformFunnels startTime={start} endTime={end} />

      {/* Creator Pipeline Kanban Board */}
      <CreatorPipelineBoard />

      {/* Alerts & System Health Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StuckCreatorsAlert />
        <SystemHealthMonitor startTime={start} endTime={end} />
      </div>

      {/* Divider */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center">
          <span className="rounded-full border border-border/50 bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
            Historical Analytics
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.title}
              className={cn(
                "group relative overflow-hidden border-border/50 transition-all duration-300 hover:border-border",
                "hover:-translate-y-0.5 hover:shadow-lg"
              )}
            >
              {/* Background gradient on hover */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                  metric.bgGradient
                )}
              />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl",
                        "bg-gradient-to-br shadow-lg",
                        metric.gradient
                      )}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {metric.title}
                      </p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-emerald-500/10 text-[10px] text-emerald-500">
                    <ArrowUpRight className="mr-0.5 h-2.5 w-2.5" />
                    {metric.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Over Time */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              Revenue Trend
              <Badge variant="outline" className="ml-auto font-normal text-muted-foreground">
                Last 30 days
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={false}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              User Growth
              <Badge variant="outline" className="ml-auto font-normal text-muted-foreground">
                Last 30 days
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2.5}
                  dot={false}
                  name="New Users"
                />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2.5}
                  dot={false}
                  name="Total Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              Course Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              Top Performing Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCourses.map((course: any, index: number) => (
                <div
                  key={course.courseId}
                  className="group flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                      index === 0
                        ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white"
                        : index === 1
                          ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                          : index === 2
                            ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold transition-colors group-hover:text-chart-1">
                      {course.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {course.enrollments} enrollments · {course.views} views
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-500">
                      ${course.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">⭐ {course.rating.toFixed(1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Creators */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Users className="h-4 w-4 text-white" />
              </div>
              Top Creators by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topCreators}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="totalRevenue"
                  fill="hsl(var(--chart-1))"
                  name="Revenue ($)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-2">
              {recentActivity.slice(0, 10).map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      activity.type === "enrollment"
                        ? "bg-emerald-500"
                        : activity.type === "course_published"
                          ? "bg-blue-500"
                          : "bg-muted-foreground"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
