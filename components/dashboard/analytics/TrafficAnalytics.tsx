/**
 * Traffic Analytics - Creator dashboard traffic overview
 * Shows store-specific traffic data from Vercel Web Analytics
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Eye,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  TrendingUp,
  Loader2,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type TimeWindow = "7d" | "28d";

// Type definitions for query results
interface DeviceData {
  device: string;
  count: number;
}

interface PageData {
  path: string;
  views: number;
}

interface ReferrerData {
  referrer: string;
  visits: number;
}

interface TrafficAnalyticsProps {
  storeSlug: string;
  plan?: string; // Store's current plan
}

// Plans that have access to advanced traffic analytics
const ADVANCED_ANALYTICS_PLANS = ["creator", "creator_pro", "pro", "business", "early_access"];

export function TrafficAnalytics({ storeSlug, plan = "free" }: TrafficAnalyticsProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");

  const days = timeWindow === "7d" ? 7 : 28;

  // Check if user has access to advanced analytics
  const hasAdvancedAnalytics = ADVANCED_ANALYTICS_PLANS.includes(plan);

  // Only fetch data if user has access (saves API calls for free/starter users)
  const traffic = useQuery(
    api.webAnalytics.getStoreTraffic,
    hasAdvancedAnalytics ? { storeSlug, days } : "skip"
  );
  const topPages = useQuery(
    api.webAnalytics.getStoreTopPages,
    hasAdvancedAnalytics ? { storeSlug, days, limit: 5 } : "skip"
  );
  const referrers = useQuery(
    api.webAnalytics.getStoreReferrers,
    hasAdvancedAnalytics ? { storeSlug, days, limit: 5 } : "skip"
  );
  const devices = useQuery(
    api.webAnalytics.getStoreDevices,
    hasAdvancedAnalytics ? { storeSlug, days } : "skip"
  );
  const trafficOverTime = useQuery(
    api.webAnalytics.getStoreTrafficOverTime,
    hasAdvancedAnalytics ? { storeSlug, days } : "skip"
  );
  const countries = useQuery(
    api.webAnalytics.getStoreCountries,
    hasAdvancedAnalytics ? { storeSlug, days, limit: 5 } : "skip"
  );

  // Show gated view for Free/Starter users
  if (!hasAdvancedAnalytics) {
    return (
      <Card className="bg-white dark:bg-black overflow-hidden">
        <CardContent className="p-0">
          {/* Blurred preview background */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10" />
            <div className="p-6 filter blur-sm opacity-50 pointer-events-none">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
              <div className="h-48 rounded-lg bg-muted animate-pulse" />
            </div>

            {/* Upgrade CTA overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center space-y-4 p-6 max-w-md">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Traffic Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    See where your visitors come from, what devices they use, and which pages they view most.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span>Available on Creator plan and above</span>
                  </div>
                  <Link href="/dashboard/pricing">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                      Upgrade to Creator
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLoading =
    !traffic || !topPages || !referrers || !devices || !trafficOverTime || !countries;

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-black">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const timeWindowLabels = {
    "7d": "7 Days",
    "28d": "28 Days",
  };

  // Calculate views per visitor
  const viewsPerVisitor =
    traffic.visitors > 0 ? (traffic.pageviews / traffic.visitors).toFixed(1) : "0";

  // Device icons
  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    unknown: <Globe className="h-4 w-4" />,
  };

  const hasData = traffic.pageviews > 0 || traffic.visitors > 0;

  return (
    <div className="space-y-6">
      {/* Header with Time Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Traffic Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Visitors to your store and products
          </p>
        </div>
        <div className="flex gap-1">
          {(["7d", "28d"] as TimeWindow[]).map((window) => (
            <Button
              key={window}
              variant={timeWindow === window ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeWindow(window)}
            >
              {timeWindowLabels[window]}
            </Button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <Card className="bg-white dark:bg-black">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Eye className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No traffic data yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Traffic data will appear here once visitors start viewing your store.
              Share your store link to start getting visitors!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-black">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Page Views
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{traffic.pageviews.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Visitors
                </CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{traffic.visitors.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pages/Visit
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{viewsPerVisitor}</div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Country
                </CardTitle>
                <Globe className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">
                  {countries[0]?.country || "N/A"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Traffic Over Time */}
          {trafficOverTime.length > 0 && (
            <Card className="bg-white dark:bg-black">
              <CardHeader>
                <CardTitle className="text-base">Traffic Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[400px]">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trafficOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                      name="Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                      name="Visitors"
                    />
                  </LineChart>
                </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card className="bg-white dark:bg-black">
              <CardHeader>
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {topPages.length > 0 ? (
                  <div className="space-y-2">
                    {topPages.map((page: PageData, index: number) => (
                      <div
                        key={page.path}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground text-xs font-mono">
                            {index + 1}
                          </span>
                          <span className="truncate text-sm">{page.path}</span>
                        </div>
                        <span className="text-sm text-muted-foreground ml-2 shrink-0">
                          {page.views}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No page data
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top Referrers */}
            <Card className="bg-white dark:bg-black">
              <CardHeader>
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {referrers.length > 0 ? (
                  <div className="space-y-2">
                    {referrers.map((ref: ReferrerData, index: number) => (
                      <div
                        key={ref.referrer}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground text-xs font-mono">
                            {index + 1}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-sm">{ref.referrer}</span>
                        </div>
                        <span className="text-sm text-muted-foreground ml-2 shrink-0">
                          {ref.visits}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No referrer data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device Breakdown */}
          {devices.some((d: DeviceData) => d.count > 0) && (
            <Card className="bg-white dark:bg-black">
              <CardHeader>
                <CardTitle className="text-base">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                  <div className="w-[150px] h-[150px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devices.filter((d: DeviceData) => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {devices.map((entry: DeviceData, index: number) => (
                          <Cell key={entry.device} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {devices
                      .filter((d: DeviceData) => d.count > 0)
                      .map((device: DeviceData, index: number) => (
                        <div key={device.device} className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex items-center gap-1.5">
                            {deviceIcons[device.device]}
                            <span className="text-sm capitalize">{device.device}</span>
                          </div>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {device.count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
