/**
 * My KPIs Grid - Enhanced KPI cards with time window toggle
 * Shows creator's revenue, students, conversion rate, and traffic sources
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  Instagram,
  Music,
  Mail,
  Globe,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MyKPIsGridProps {
  storeId: string;
}

type TimeWindow = "today" | "7d" | "28d";

export function MyKPIsGrid({ storeId }: MyKPIsGridProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");

  // Memoize the time range to prevent infinite re-renders
  const { start, end } = React.useMemo(() => {
    const now = Date.now();
    switch (timeWindow) {
      case "today":
        return { start: new Date().setHours(0, 0, 0, 0), end: now };
      case "7d":
        return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
      case "28d":
        return { start: now - 28 * 24 * 60 * 60 * 1000, end: now };
    }
  }, [timeWindow]);

  const kpis = useQuery(api.analytics.kpis.getKPIs, {
    startTime: start,
    endTime: end,
    storeId,
  });

  if (!kpis) {
    return <MyKPIsGridSkeleton />;
  }

  const timeWindowLabels = {
    today: "Today",
    "7d": "Last 7 Days",
    "28d": "Last 28 Days",
  };

  return (
    <div className="space-y-4">
      {/* Time Window Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Performance</h2>
        <div className="flex gap-2">
          {(["today", "7d", "28d"] as TimeWindow[]).map((window) => (
            <Button
              key={window}
              variant={timeWindow === window ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeWindow(window)}
              className={
                timeWindow === window
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              }
            >
              {timeWindowLabels[window]}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {kpis.newSignups} new students
            </p>
          </CardContent>
        </Card>

        {/* New Students */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Students
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.newSignups}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.learnerActivationRate.toFixed(1)}% enrolled
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.learnerActivationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Visitors to students
            </p>
          </CardContent>
        </Card>

        {/* Total Traffic */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Traffic
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.traffic.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Page views</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources Breakdown */}
      <Card className="bg-white dark:bg-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Traffic Sources</CardTitle>
          <p className="text-sm text-muted-foreground">Where your visitors come from</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TrafficSource
              label="Instagram"
              count={kpis.traffic.instagram}
              icon={Instagram}
              color="text-pink-600"
            />
            <TrafficSource
              label="TikTok"
              count={kpis.traffic.tiktok}
              icon={Music}
              color="text-purple-600"
            />
            <TrafficSource
              label="Email"
              count={kpis.traffic.email}
              icon={Mail}
              color="text-blue-600"
            />
            <TrafficSource
              label="Direct"
              count={kpis.traffic.direct}
              icon={Globe}
              color="text-green-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Health */}
      {kpis.emailHealth.sent > 0 && (
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Email Health</CardTitle>
            <p className="text-sm text-muted-foreground">
              Campaign performance last {timeWindowLabels[timeWindow].toLowerCase()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EmailStat
                label="Sent"
                count={kpis.emailHealth.sent}
                icon={Mail}
                color="text-blue-600"
              />
              <EmailStat
                label="Delivered"
                count={kpis.emailHealth.delivered}
                icon={CheckCircle}
                color="text-green-600"
              />
              <EmailStat
                label="Bounced"
                count={kpis.emailHealth.bounced}
                icon={XCircle}
                color="text-red-600"
              />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bounce Rate</p>
                <p
                  className={`text-2xl font-bold ${
                    kpis.emailHealth.bounceRate < 2
                      ? "text-green-600"
                      : kpis.emailHealth.bounceRate < 5
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                >
                  {kpis.emailHealth.bounceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {kpis.emailHealth.bounceRate < 2 ? "Healthy" : "Needs attention"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TrafficSourceProps {
  label: string;
  count: number;
  icon: React.ComponentType<any>;
  color: string;
}

function TrafficSource({ label, count, icon: Icon, color }: TrafficSourceProps) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50">
      <Icon className={`w-6 h-6 mb-2 ${color}`} />
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

interface EmailStatProps {
  label: string;
  count: number;
  icon: React.ComponentType<any>;
  color: string;
}

function EmailStat({ label, count, icon: Icon, color }: EmailStatProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  );
}

function MyKPIsGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white dark:bg-black">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

