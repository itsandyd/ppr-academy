"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HeartPulse,
  Users,
  UserX,
  AlertTriangle,
  ShieldAlert,
  Flag,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "hsl(var(--chart-2))", // active - green
  "hsl(var(--chart-1))", // unsubscribed - blue
  "hsl(var(--chart-4))", // bounced - amber
  "hsl(var(--chart-5))", // complained - red
];

export default function HealthPage() {
  const health = useQuery(api.emailAnalytics.getListHealth);

  if (!health) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const pieData = [
    { name: "Active", value: health.active },
    { name: "Unsubscribed", value: health.unsubscribed },
    { name: "Bounced", value: health.bounced },
    { name: "Complained", value: health.complained },
  ].filter((d) => d.value > 0);

  const statusCards = [
    {
      label: "Total Contacts",
      value: health.total,
      icon: Users,
      color: "text-foreground",
    },
    {
      label: "Active",
      value: health.active,
      icon: HeartPulse,
      color: "text-green-500",
    },
    {
      label: "Unsubscribed",
      value: health.unsubscribed,
      icon: UserX,
      color: "text-blue-500",
    },
    {
      label: "Bounced",
      value: health.bounced,
      icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      label: "Complained",
      value: health.complained,
      icon: ShieldAlert,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Health Score */}
      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
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
                strokeDasharray={`${health.healthScore}, 100`}
                className={cn(
                  health.healthScore >= 80
                    ? "text-green-500"
                    : health.healthScore >= 60
                      ? "text-amber-500"
                      : "text-red-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{health.healthScore}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">List Health Score</h3>
            <p className="text-sm text-muted-foreground">
              {health.healthScore >= 80
                ? "Your list is healthy. Keep monitoring for any changes."
                : health.healthScore >= 60
                  ? "Some cleanup needed. Consider removing inactive or bounced contacts."
                  : "Action required. High suppression rate is affecting deliverability."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statusCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-3 pt-4">
              <card.icon className={cn("h-5 w-5 shrink-0", card.color)} />
              <div>
                <p className="text-xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Contact Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `${value} (${health.total > 0 ? Math.round((value / health.total) * 100) : 0}%)`,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px" }}
                      formatter={(value) => (
                        <span className="text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No contact data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacts Added Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Contacts Added Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {health.monthlyGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={health.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => {
                        const [y, m] = val.split("-");
                        return `${m}/${y.slice(2)}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(val) => {
                        const [y, m] = val.split("-");
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return `${monthNames[parseInt(m) - 1]} ${y}`;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                      name="Contacts Added"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No growth data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unsubscribe Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Unsubscribe Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {health.unsubTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={health.unsubTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => {
                      const [y, m] = val.split("-");
                      return `${m}/${y.slice(2)}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={(val) => {
                      const [y, m] = val.split("-");
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      return `${monthNames[parseInt(m) - 1]} ${y}`;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-5))", r: 3 }}
                    name="Unsubscribes"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No unsubscribe data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flagged Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Flagged Contacts
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {health.flaggedContacts.length} flagged
          </Badge>
        </CardHeader>
        <CardContent>
          {health.flaggedContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No contacts with multiple bounces detected.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Contacts with 2+ bounce events. Consider removing these from your list.
              </p>
              <div className="rounded-lg border border-border">
                {health.flaggedContacts.map((contact: any) => (
                  <div
                    key={contact.email}
                    className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-mono text-sm">{contact.email}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {contact.bounceCount} bounces
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
