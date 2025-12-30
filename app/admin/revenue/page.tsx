"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ShoppingCart,
  Users,
  Calendar,
  Download,
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
} from "recharts";

export default function AdminRevenuePage() {
  const { user } = useUser();

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

  if (!overview || !revenueData || !topCourses || !topCreators) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Revenue Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Track platform revenue, transactions, and creator earnings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Badge variant="outline" className="px-3 py-1.5">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Last 30 days
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
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
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-900/20">
                <ArrowUpRight className="h-3 w-3" />
                +12.3%
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
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-900/20">
                <ArrowUpRight className="h-3 w-3" />
                +18.4%
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
              <div className="rounded-full bg-orange-500/10 p-3">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600 dark:bg-green-900/20">
                <ArrowUpRight className="h-3 w-3" />
                +8.7%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(totalRevenue / (overview.totalEnrollments || 1))}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Avg. Transaction Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-2">
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
          <ResponsiveContainer width="100%" height={400}>
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
                        {formatCurrency(course.revenue / course.enrollments)} avg
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
