/**
 * Platform KPIs Overview - Admin dashboard metrics with time window toggle
 * Shows platform-wide data for all creators and users
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Mail,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TimeWindow = "today" | "7d" | "28d";

export function PlatformKPIsOverview() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("7d");

  const getTimeRange = () => {
    const now = Date.now();
    switch (timeWindow) {
      case "today":
        return { start: new Date().setHours(0, 0, 0, 0), end: now };
      case "7d":
        return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
      case "28d":
        return { start: now - 28 * 24 * 60 * 60 * 1000, end: now };
    }
  };

  const { start, end } = getTimeRange();

  // Platform-wide KPIs (no storeId = all creators)
  const kpis = useQuery(api.analytics.kpis.getKPIs, {
    startTime: start,
    endTime: end,
    // No storeId = platform-wide
  });

  if (!kpis) {
    return <PlatformKPIsOverviewSkeleton />;
  }

  const timeWindowLabels = {
    today: "Today",
    "7d": "Last 7 Days",
    "28d": "Last 28 Days",
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform KPIs</h2>
          <p className="text-sm text-muted-foreground">
            Platform-wide performance across all creators
          </p>
        </div>
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
        {/* New Signups */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Signups
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.newSignups}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform-wide registrations
            </p>
          </CardContent>
        </Card>

        {/* New Creator Signups */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Creator Signups
            </CardTitle>
            <UserPlus className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.newCreatorSignups}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Started creator flow
            </p>
          </CardContent>
        </Card>

        {/* Learner Activation Rate */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Learner Activation
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.learnerActivationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Signups who enrolled
            </p>
          </CardContent>
        </Card>

        {/* Creator Activation Rate */}
        <Card className="bg-white dark:bg-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Creator Activation
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.creatorActivationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Creators who published
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Traffic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform Revenue */}
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Platform Revenue</CardTitle>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${kpis.totalRevenue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total revenue across all creators
            </p>
          </CardContent>
        </Card>

        {/* Traffic */}
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Total Traffic</CardTitle>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {kpis.traffic.total.toLocaleString()}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>IG: {kpis.traffic.instagram}</span>
              <span>TT: {kpis.traffic.tiktok}</span>
              <span>Email: {kpis.traffic.email}</span>
              <span>Direct: {kpis.traffic.direct}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Health (Platform-wide) */}
      {kpis.emailHealth.sent > 0 && (
        <Card className="bg-white dark:bg-black">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Email Health</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Platform-wide email deliverability
                </p>
              </div>
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Sent</p>
                </div>
                <p className="text-2xl font-bold">{kpis.emailHealth.sent}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
                <p className="text-2xl font-bold">{kpis.emailHealth.delivered}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-muted-foreground">Bounced</p>
                </div>
                <p className="text-2xl font-bold">{kpis.emailHealth.bounced}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-4 h-4 ${
                    kpis.emailHealth.bounceRate < 2 ? "text-green-600" :
                    kpis.emailHealth.bounceRate < 5 ? "text-orange-600" : "text-red-600"
                  }`} />
                  <p className="text-sm text-muted-foreground">Bounce Rate</p>
                </div>
                <p className={`text-2xl font-bold ${
                  kpis.emailHealth.bounceRate < 2 ? "text-green-600" :
                  kpis.emailHealth.bounceRate < 5 ? "text-orange-600" : "text-red-600"
                }`}>
                  {kpis.emailHealth.bounceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.emailHealth.bounceRate < 2 ? "✓ Healthy" :
                   kpis.emailHealth.bounceRate < 5 ? "⚠ Needs attention" : "⚠ Critical"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlatformKPIsOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
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

