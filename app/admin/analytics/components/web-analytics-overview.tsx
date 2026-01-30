/**
 * Web Analytics Overview - Vercel Analytics Drain data visualization
 * Shows platform-wide traffic data from Vercel Web Analytics
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

interface CountryData {
  country: string;
  visits: number;
}

export function WebAnalyticsOverview() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");

  const days = timeWindow === "7d" ? 7 : 28;

  // Fetch all analytics data
  const pageViews = useQuery(api.webAnalytics.getPageViews, { days });
  const uniqueVisitors = useQuery(api.webAnalytics.getUniqueVisitors, { days });
  const topPages = useQuery(api.webAnalytics.getTopPages, { days, limit: 5 });
  const topReferrers = useQuery(api.webAnalytics.getTopReferrers, { days, limit: 5 });
  const deviceBreakdown = useQuery(api.webAnalytics.getDeviceBreakdown, { days });
  const countryBreakdown = useQuery(api.webAnalytics.getCountryBreakdown, { days, limit: 5 });
  const trafficOverTime = useQuery(api.webAnalytics.getTrafficOverTime, { days });

  const isLoading =
    !pageViews ||
    !uniqueVisitors ||
    !topPages ||
    !topReferrers ||
    !deviceBreakdown ||
    !countryBreakdown ||
    !trafficOverTime;

  if (isLoading) {
    return <WebAnalyticsOverviewSkeleton />;
  }

  const timeWindowLabels = {
    "7d": "Last 7 Days",
    "28d": "Last 28 Days",
  };

  // Calculate views per visitor
  const viewsPerVisitor =
    uniqueVisitors.total > 0 ? (pageViews.total / uniqueVisitors.total).toFixed(1) : "0";

  // Device icons
  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Monitor className="h-4 w-4" />,
    mobile: <Smartphone className="h-4 w-4" />,
    tablet: <Tablet className="h-4 w-4" />,
    unknown: <Globe className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Web Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Traffic data from Vercel Web Analytics
          </p>
        </div>
        <div className="flex gap-2">
          {(["7d", "28d"] as TimeWindow[]).map((window) => (
            <Button
              key={window}
              variant={timeWindow === window ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeWindow(window)}
              className={
                timeWindow === window ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
              }
            >
              {timeWindowLabels[window]}
            </Button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Page Views
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pageViews.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total pageviews</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVisitors.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Views/Visitor
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viewsPerVisitor}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg pages per session</p>
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
            <div className="text-2xl font-bold">
              {countryBreakdown[0]?.country || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {countryBreakdown[0]?.visits.toLocaleString() || 0} visits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle className="text-lg">Traffic Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {trafficOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trafficOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    name="Page Views"
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
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                No traffic data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle className="text-lg">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceBreakdown.some((d: DeviceData) => d.count > 0) ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceBreakdown.filter((d: DeviceData) => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {deviceBreakdown.map((entry: DeviceData, index: number) => (
                        <Cell key={entry.device} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {deviceBreakdown
                    .filter((d: DeviceData) => d.count > 0)
                    .map((device: DeviceData, index: number) => (
                      <div key={device.device} className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex items-center gap-2">
                          {deviceIcons[device.device]}
                          <span className="capitalize">{device.device}</span>
                        </div>
                        <span className="text-muted-foreground ml-auto">
                          {device.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No device data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle className="text-lg">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((page: PageData, index: number) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-sm">
                        {index + 1}
                      </span>
                      <span className="truncate max-w-[200px] font-medium">{page.path}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {page.views.toLocaleString()} views
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                No page data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle className="text-lg">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            {topReferrers.length > 0 ? (
              <div className="space-y-3">
                {topReferrers.map((ref: ReferrerData, index: number) => (
                  <div
                    key={ref.referrer}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-sm">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[180px] font-medium">
                          {ref.referrer}
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground">
                      {ref.visits.toLocaleString()} visits
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[150px] items-center justify-center text-muted-foreground">
                No referrer data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Country Breakdown */}
      <Card className="bg-white dark:bg-black">
        <CardHeader>
          <CardTitle className="text-lg">Geographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {countryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={countryBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="country"
                  tick={{ fontSize: 11 }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="visits" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No geographic data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WebAnalyticsOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full" />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
