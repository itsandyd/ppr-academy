"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StoreRequiredGuard } from "@/components/dashboard/store-required-guard";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Download,
  Star,
  BarChart3,
  PieChart,
  Calendar,
  ArrowLeft,
  Filter,
  RefreshCw,
  Eye,
  Play,
  Heart,
  Share,
  MessageSquare,
  Award,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
// NEW: Import enhanced analytics components
import { MyFunnel } from "./components/my-funnel";
import { MyKPIsGrid } from "./components/my-kpis-grid";
import { MyCampaigns } from "./components/my-campaigns";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ComponentType<any>;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function CreatorAnalyticsPage() {
  const { user } = useUser();
  const { track } = useAnalytics();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Track analytics page view
  React.useEffect(() => {
    track({
      eventType: "page_view",
      metadata: {
        page: "/home/analytics",
      },
    });
  }, [track]);

  // Fetch user data from Convex
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // NEW: Fetch user's store for scoped analytics
  // Use user.id (Clerk ID) directly instead of convexUser.clerkId to avoid infinite loop
  const userStore = useQuery(api.stores.getUserStore, user?.id ? { userId: user.id } : "skip");

  // Fetch analytics data
  const analyticsData = useQuery(
    api.analytics.getCreatorAnalytics,
    user?.id
      ? {
          userId: user.id, // Clerk ID
          timeRange: timeRange as "7d" | "30d" | "90d" | "1y",
        }
      : "skip"
  );

  const productAnalytics = useQuery(
    api.analytics.getProductAnalytics,
    user?.id ? { userId: user.id } : "skip" // Clerk ID
  );

  // Transform analytics data for UI
  const transformedAnalyticsData = useMemo(() => {
    if (!analyticsData) {
      return {
        overview: {
          totalRevenue: 0,
          totalSales: 0,
          totalViews: 0,
          conversionRate: 0,
          totalProducts: 0,
          publishedProducts: 0,
          totalStudents: 0,
          avgRating: 0,
        },
        revenueData: [],
        productPerformance: [],
        topProducts: [],
        audienceInsights: {
          topCountries: [],
          ageGroups: [],
          deviceTypes: [],
        },
      };
    }

    return {
      overview: analyticsData.overview,
      revenueData: analyticsData.revenueData.map((item: any) => ({
        name: item.period,
        value: item.revenue,
        color: "#8b5cf6",
      })),
      productPerformance: (analyticsData as any)?.productPerformance || [
        { name: "Courses", value: 100, color: "#3b82f6" },
        { name: "Sample Packs", value: 0, color: "#10b981" },
        { name: "Coaching", value: 0, color: "#f59e0b" },
      ],
      topProducts: analyticsData.topProducts.map((product: any) => ({
        id: product._id,
        title: product.title,
        type: product.type,
        revenue: product.revenue,
        sales: product.sales,
        views: product.views,
        rating: product.rating,
        trend: ((product as any).revenueChange || 0) >= 0 ? "up" : "down",
      })),
      audienceInsights: {
        topCountries: analyticsData.audienceInsights.topCountries.map((country: any) => ({
          name: country.country,
          percentage: country.percentage,
          flag:
            country.country === "United States"
              ? "🇺🇸"
              : country.country === "United Kingdom"
                ? "🇬🇧"
                : country.country === "Canada"
                  ? "🇨🇦"
                  : country.country === "Germany"
                    ? "🇩🇪"
                    : country.country === "Australia"
                      ? "🇦🇺"
                      : "🌍",
        })),
        ageGroups: analyticsData.audienceInsights.ageGroups,
        deviceTypes: analyticsData.audienceInsights.deviceTypes,
      },
    };
  }, [analyticsData]);

  const metrics: AnalyticsMetric[] = [
    {
      label: "Total Revenue",
      value: `$${transformedAnalyticsData.overview.totalRevenue.toLocaleString()}`,
      change: (analyticsData as any)?.overview?.revenueChange || 0,
      changeType:
        ((analyticsData as any)?.overview?.revenueChange || 0) >= 0 ? "increase" : "decrease",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Total Sales",
      value: transformedAnalyticsData.overview.totalSales,
      change: (analyticsData as any)?.overview?.salesChange || 0,
      changeType:
        ((analyticsData as any)?.overview?.salesChange || 0) >= 0 ? "increase" : "decrease",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "Total Views",
      value: transformedAnalyticsData.overview.totalViews.toLocaleString(),
      change: (analyticsData as any)?.overview?.viewsChange || 0,
      changeType:
        ((analyticsData as any)?.overview?.viewsChange || 0) >= 0 ? "increase" : "decrease",
      icon: Eye,
      color: "text-purple-600",
    },
    {
      label: "Conversion Rate",
      value: `${transformedAnalyticsData.overview.conversionRate.toFixed(1)}%`,
      change: (analyticsData as any)?.overview?.conversionChange || 0,
      changeType:
        ((analyticsData as any)?.overview?.conversionChange || 0) >= 0 ? "increase" : "decrease",
      icon: Target,
      color: "text-orange-600",
    },
    {
      label: "Total Students",
      value: transformedAnalyticsData.overview.totalStudents,
      change: (analyticsData as any)?.overview?.studentsChange || 0,
      changeType:
        ((analyticsData as any)?.overview?.studentsChange || 0) >= 0 ? "increase" : "decrease",
      icon: Users,
      color: "text-indigo-600",
    },
    {
      label: "Average Rating",
      value: Number(transformedAnalyticsData.overview.avgRating).toFixed(1),
      change: (analyticsData as any)?.overview?.ratingChange || 0,
      changeType:
        ((analyticsData as any)?.overview?.ratingChange || 0) >= 0 ? "increase" : "decrease",
      icon: Star,
      color: "text-yellow-600",
    },
  ];

  // Show loading state while data is being fetched
  if (!user || !convexUser || analyticsData === undefined) {
    return (
      <StoreRequiredGuard redirectTo="/home">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                  Track your performance and grow your music business
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>

          {/* Loading metrics */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="mb-1 h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Skeleton className="h-96 w-full" />
        </div>
      </StoreRequiredGuard>
    );
  }

  return (
    <StoreRequiredGuard redirectTo="/home">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Track your performance and grow your music business
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>
        </div>

        {/* NEW: Enhanced Analytics Section */}
        {userStore && (
          <div className="space-y-6">
            {/* My KPIs Grid with Time Window Toggle */}
            <MyKPIsGrid storeId={userStore._id} />

            {/* Grid: My Funnel + My Campaigns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <MyFunnel
                storeId={userStore._id}
                startTime={Date.now() - 7 * 24 * 60 * 60 * 1000}
                endTime={Date.now()}
              />
              {user?.id && <MyCampaigns userId={user.id} />}
            </div>
          </div>
        )}

        {/* Original Key Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`rounded-lg bg-gray-100 p-2 dark:bg-gray-800`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      {metric.changeType === "increase" ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : metric.changeType === "decrease" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span
                        className={
                          metric.changeType === "increase"
                            ? "text-green-500"
                            : metric.changeType === "decrease"
                              ? "text-red-500"
                              : "text-gray-500"
                        }
                      >
                        {metric.change > 0 ? "+" : ""}
                        {metric.change}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transformedAnalyticsData.revenueData.length > 0 ? (
                      transformedAnalyticsData.revenueData.map((item: any, index: number) => {
                        const maxValue = Math.max(
                          ...transformedAnalyticsData.revenueData.map((d: any) => d.value)
                        );
                        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                        return (
                          <div key={item.name} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 flex-shrink-0 text-sm font-medium">
                              {item.name}
                            </span>
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="h-2 min-w-[80px] flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="whitespace-nowrap text-sm font-semibold">
                                ${item.value.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No revenue data available</p>
                        <p className="text-sm">
                          Revenue trends will appear here once you start selling
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Product Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transformedAnalyticsData.productPerformance.map((item: any) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transformedAnalyticsData.topProducts.length > 0 ? (
                    transformedAnalyticsData.topProducts.map((product: any, index: number) => (
                      <div
                        key={product.id}
                        className="flex flex-col justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-sm font-bold text-white">
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-semibold">{product.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {product.type}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {Number(product.rating).toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold">${product.revenue.toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                            <span className="whitespace-nowrap">{product.sales} sales</span>
                            <span className="whitespace-nowrap">{product.views} views</span>
                            {product.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Award className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>No products to display yet</p>
                      <p className="text-sm">Create your first product to see performance data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Courses</span>
                      <Badge>{transformedAnalyticsData.overview.totalProducts}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Digital Products</span>
                      <Badge>0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sample Packs</span>
                      <Badge>0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publishing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Published</span>
                      <Badge variant="default">
                        {transformedAnalyticsData.overview.publishedProducts}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Draft</span>
                      <Badge variant="secondary">0</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Under Review</span>
                      <Badge variant="outline">0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Top Countries */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transformedAnalyticsData.audienceInsights.topCountries.map((country: any) => (
                      <div key={country.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-sm">{country.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{country.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Age Groups */}
              <Card>
                <CardHeader>
                  <CardTitle>Age Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transformedAnalyticsData.audienceInsights.ageGroups.map((group: any) => (
                      <div key={group.range} className="flex items-center justify-between">
                        <span className="text-sm">{group.range}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${group.percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-sm font-semibold">{group.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transformedAnalyticsData.audienceInsights.deviceTypes.map((device: any) => (
                      <div key={device.type} className="flex items-center justify-between">
                        <span className="text-sm">{device.type}</span>
                        <span className="text-sm font-semibold">{device.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Gross Revenue</span>
                      <span className="font-semibold">
                        ${transformedAnalyticsData.overview.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Platform Fee (10%)</span>
                      <span className="text-red-500">
                        -${(transformedAnalyticsData.overview.totalRevenue * 0.1).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment Processing</span>
                      <span className="text-red-500">
                        -$
                        {(transformedAnalyticsData.overview.totalRevenue * 0.029).toLocaleString()}
                      </span>
                    </div>
                    <hr />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Net Revenue</span>
                      <span className="text-green-600">
                        ${(transformedAnalyticsData.overview.totalRevenue * 0.871).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payout Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Next Payout</span>
                      <Badge>Dec 15, 2024</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pending Amount</span>
                      <span className="font-semibold">$2,450.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payout Method</span>
                      <span className="text-sm">Bank Transfer</span>
                    </div>
                    <Button className="mt-4 w-full">View Payout History</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StoreRequiredGuard>
  );
}
