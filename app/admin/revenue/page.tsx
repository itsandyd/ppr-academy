"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Target,
  UserMinus,
  Wallet,
  PieChart,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

export default function AdminRevenuePage() {
  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);

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
    user?.id ? { clerkId: user.id, limit: 10 } : "skip"
  );
  const topCreators = useQuery(
    api.adminAnalytics.getTopCreators,
    user?.id ? { clerkId: user.id, limit: 10 } : "skip"
  );
  const advancedMetrics = useQuery(
    api.adminAnalytics.getAdvancedRevenueMetrics,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const exportData = useQuery(
    api.adminAnalytics.getRevenueExportData,
    user?.id ? { clerkId: user.id } : "skip"
  );

  if (!overview || !revenueData || !topCourses || !topCreators || !advancedMetrics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  // Calculate some metrics
  const totalRevenue = overview.totalRevenue;
  const avgRevenuePerDay =
    revenueData.length > 0
      ? revenueData.reduce((sum: number, d: any) => sum + d.revenue, 0) / revenueData.length
      : 0;
  const lastWeekRevenue = revenueData.slice(-7).reduce((sum: number, d: any) => sum + d.revenue, 0);
  const prevWeekRevenue = revenueData
    .slice(-14, -7)
    .reduce((sum: number, d: any) => sum + d.revenue, 0);
  const weeklyGrowth =
    prevWeekRevenue > 0
      ? (((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100).toFixed(1)
      : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleExportCSV = async () => {
    if (!exportData) return;
    setIsExporting(true);

    try {
      // Create CSV content
      const headers = ["Date", "Transaction ID", "Type", "Product", "Amount", "Customer Email", "Status"];
      const rows = exportData.map((row) => [
        new Date(row.date).toLocaleDateString(),
        row.transactionId,
        row.type,
        row.productName,
        row.amount.toFixed(2),
        row.customerEmail || "N/A",
        row.status,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Revenue Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Track platform revenue, MRR, LTV, and path to $1M
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCSV}
            disabled={isExporting || !exportData}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Badge variant="outline" className="px-3 py-1.5">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Last 30 days
          </Badge>
        </div>
      </div>

      {/* Revenue Goal Progress */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Road to $1 Million</h3>
                <p className="text-sm text-muted-foreground">
                  {advancedMetrics.monthsToGoal > 0 && advancedMetrics.monthsToGoal < 999
                    ? `~${advancedMetrics.monthsToGoal} months at current pace`
                    : "Keep pushing!"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(advancedMetrics.currentRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">
                of {formatCurrency(advancedMetrics.revenueGoal)} goal
              </p>
            </div>
          </div>
          <Progress value={advancedMetrics.goalProgress} className="h-4" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{advancedMetrics.goalProgress.toFixed(2)}% complete</span>
            <span>{formatCurrency(advancedMetrics.revenueGoal - advancedMetrics.currentRevenue)} to go</span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Row 1 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-purple-500/10 p-3">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                  advancedMetrics.mrrGrowth >= 0
                    ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                    : "bg-red-50 text-red-600 dark:bg-red-900/20"
                }`}
              >
                {advancedMetrics.mrrGrowth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(advancedMetrics.mrrGrowth).toFixed(1)}%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{formatCurrency(advancedMetrics.mrr)}</p>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue (MRR)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs">Lifetime</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(advancedMetrics.averageLtv)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Avg Customer LTV</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-orange-500/10 p-3">
                <UserMinus className="h-6 w-6 text-orange-500" />
              </div>
              {advancedMetrics.churnRate > 10 ? (
                <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/20">
                  <AlertTriangle className="h-3 w-3" />
                  High
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-900/20">
                  Healthy
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{advancedMetrics.churnRate.toFixed(1)}%</p>
              <p className="text-sm font-medium text-muted-foreground">Churn Rate (90d)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-900/20">
                <ArrowUpRight className="h-3 w-3" />
                Active
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {advancedMetrics.activeCustomers.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Active Customers (30d)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Row 2 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-purple-500/10 p-3">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-900/20">
                <ArrowUpRight className="h-3 w-3" />+{weeklyGrowth}%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(avgRevenuePerDay)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Avg. Daily Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-blue-500/10 p-3">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {overview.totalEnrollments.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-cyan-500/10 p-3">
                <CreditCard className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(advancedMetrics.highestLtv)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Highest Customer LTV</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Trend - Takes 2 columns */}
        <Card className="border-2 lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Revenue Trend</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  7 Days
                </Button>
                <Button variant="outline" size="sm">
                  30 Days
                </Button>
                <Button variant="default" size="sm">
                  90 Days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="Daily Revenue"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Type - Takes 1 column */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={advancedMetrics.revenueByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="revenue"
                  nameKey="type"
                  label={({ name, percent }) =>
                    `${name}: ${((Number(percent) || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {advancedMetrics.revenueByType.map((entry, index) => (
                    <Cell key={entry.type} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {advancedMetrics.revenueByType.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.type}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid h-12 w-full grid-cols-2 p-1">
          <TabsTrigger value="courses" className="gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Top Courses by Revenue
          </TabsTrigger>
          <TabsTrigger value="creators" className="gap-2 text-base">
            <Users className="h-4 w-4" />
            Top Creators by Earnings
          </TabsTrigger>
        </TabsList>

        {/* Top Courses Tab */}
        <TabsContent value="courses">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topCourses.map((course: any, index: number) => (
                  <div
                    key={course.courseId}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-lg font-bold text-purple-600">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold">{course.title}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{course.enrollments} sales</span>
                        <span>•</span>
                        <span>{course.views} views</span>
                        <span>•</span>
                        <span>⭐ {course.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(course.revenue)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(course.revenue / (course.enrollments || 1))} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Creators Tab */}
        <TabsContent value="creators">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Top Earning Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={topCreators} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={150} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar
                    dataKey="totalRevenue"
                    fill="#8b5cf6"
                    name="Total Revenue"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
