"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Heart,
  X,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

export default function EmailAnalyticsOverview() {
  const { user } = useUser();
  const stats = useQuery(api.emailAnalytics.getOverviewStats);
  const trendData = useQuery(api.emailAnalytics.getTrendData, { days: 30 });
  const activeAlerts = useQuery(api.emailAnalytics.getActiveAlerts);
  const acknowledgeAlert = useMutation(api.emailAnalytics.acknowledgeAlert);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismissAlert = async (alertId: Id<"emailAlerts">) => {
    if (!user?.id) return;
    setDismissing(alertId);
    try {
      await acknowledgeAlert({ alertId, clerkId: user.id });
    } finally {
      setDismissing(null);
    }
  };

  if (!stats || !trendData) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const metricCards = [
    {
      title: "Emails Sent",
      allTime: stats.allTime.sent,
      last7: stats.last7Days.sent,
      last30: stats.last30Days.sent,
      icon: Send,
      color: "text-blue-500",
    },
    {
      title: "Delivered",
      allTime: stats.allTime.delivered,
      last7: stats.last7Days.delivered,
      last30: stats.last30Days.delivered,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "Bounced",
      allTime: stats.allTime.bounced,
      last7: stats.last7Days.bounced,
      last30: stats.last30Days.bounced,
      icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      title: "Complaints",
      allTime: stats.allTime.complained,
      last7: stats.last7Days.complained,
      last30: stats.last30Days.complained,
      icon: ShieldAlert,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {activeAlerts && activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert: any) => (
            <div
              key={alert._id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-lg border p-4",
                alert.severity === "critical"
                  ? "border-red-500/50 bg-red-500/5 dark:bg-red-500/10"
                  : "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    alert.severity === "critical" ? "text-red-500" : "text-amber-500"
                  )}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <Badge
                      variant={alert.severity === "critical" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alert.recommendation}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={dismissing === alert._id}
                onClick={() => handleDismissAlert(alert._id)}
              >
                {dismissing === alert._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Bounce/Complaint rate warnings */}
      {stats.bounceRate > 2 && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/5 p-4 dark:bg-red-500/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium">
              Bounce rate is {stats.bounceRate}% (threshold: 2%). Clean your email
              list to improve deliverability.
            </p>
          </div>
        </div>
      )}
      {stats.complaintRate > 0.1 && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/5 p-4 dark:bg-red-500/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium">
              Complaint rate is {stats.complaintRate}% (threshold: 0.1%). Review
              targeting and content quality.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.allTime.toLocaleString()}</div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>7d: {card.last7.toLocaleString()}</span>
                <span className="text-border">|</span>
                <span>30d: {card.last30.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rate Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivery Rate (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.deliveryRate}%</span>
              {stats.deliveryRate >= 95 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.deliveryRate >= 95 ? "Healthy" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bounce Rate (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.bounceRate}%</span>
              <Badge variant={stats.bounceRate <= 2 ? "secondary" : "destructive"}>
                {stats.bounceRate <= 2 ? "OK" : "High"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Threshold: &lt;2%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Complaint Rate (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.complaintRate}%</span>
              <Badge variant={stats.complaintRate <= 0.1 ? "secondary" : "destructive"}>
                {stats.complaintRate <= 0.1 ? "OK" : "High"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Threshold: &lt;0.1%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">List Health Score</CardTitle>
          <Heart className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${stats.healthScore}, 100`}
                  className={cn(
                    stats.healthScore >= 80
                      ? "text-green-500"
                      : stats.healthScore >= 60
                        ? "text-amber-500"
                        : "text-red-500"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{stats.healthScore}%</span>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">{stats.activeContacts}</span>{" "}
                <span className="text-muted-foreground">active contacts</span>
              </p>
              <p>
                <span className="font-medium">{stats.suppressedContacts}</span>{" "}
                <span className="text-muted-foreground">suppressed</span>
              </p>
              <p>
                <span className="font-medium">{stats.totalContacts}</span>{" "}
                <span className="text-muted-foreground">total</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Email Events (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                  name="Delivered"
                />
                <Area
                  type="monotone"
                  dataKey="bounced"
                  stackId="2"
                  stroke="hsl(var(--chart-4))"
                  fill="hsl(var(--chart-4))"
                  fillOpacity={0.3}
                  name="Bounced"
                />
                <Area
                  type="monotone"
                  dataKey="complained"
                  stackId="3"
                  stroke="hsl(var(--chart-5))"
                  fill="hsl(var(--chart-5))"
                  fillOpacity={0.3}
                  name="Complaints"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
