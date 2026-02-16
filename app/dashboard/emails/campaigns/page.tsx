"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ChevronLeft,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Id } from "@/convex/_generated/dataModel";

type SortField = "date" | "bounceRate" | "complaintRate" | "name";
type SortOrder = "asc" | "desc";

export default function CreatorCampaignsPage() {
  const { user } = useUser();
  const storeId = user?.id;
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedCampaign, setSelectedCampaign] = useState<Id<"resendCampaigns"> | null>(null);

  const campaigns = useQuery(
    api.emailAnalytics.getCreatorCampaignAnalytics,
    storeId ? { storeId, sortBy, sortOrder } : "skip"
  );

  const campaignDetail = useQuery(
    api.emailAnalytics.getCreatorCampaignDetail,
    selectedCampaign && storeId ? { campaignId: selectedCampaign, storeId } : "skip"
  );

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (!campaigns) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  // Campaign detail view
  if (selectedCampaign && campaignDetail) {
    const funnelData = [
      { name: "Sent", value: campaignDetail.sentCount },
      { name: "Delivered", value: campaignDetail.deliveredCount },
      { name: "Opened", value: campaignDetail.openedCount },
      { name: "Clicked", value: campaignDetail.clickedCount },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCampaign(null)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{campaignDetail.name}</h2>
            <p className="text-sm text-muted-foreground">
              {campaignDetail.subject}
            </p>
          </div>
          <Badge
            variant={
              campaignDetail.status === "sent"
                ? "default"
                : campaignDetail.status === "sending"
                  ? "secondary"
                  : "outline"
            }
          >
            {campaignDetail.status}
          </Badge>
        </div>

        {/* Alerts */}
        {campaignDetail.alerts && campaignDetail.alerts.length > 0 && (
          <div className="space-y-2">
            {campaignDetail.alerts
              .filter((a: any) => a.isActive)
              .map((alert: any) => (
                <div
                  key={alert._id}
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    alert.severity === "critical"
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-amber-500/50 bg-amber-500/5"
                  )}
                >
                  <p className="font-medium">{alert.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alert.recommendation}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Sent", value: campaignDetail.sentCount, icon: Send, color: "text-blue-500" },
            { label: "Delivered", value: campaignDetail.deliveredCount, icon: CheckCircle2, color: "text-green-500" },
            { label: "Opened", value: campaignDetail.openedCount, icon: Eye, color: "text-purple-500" },
            { label: "Clicked", value: campaignDetail.clickedCount, icon: MousePointerClick, color: "text-cyan-500" },
            { label: "Bounced", value: campaignDetail.bouncedCount, icon: AlertTriangle, color: "text-amber-500" },
            { label: "Complaints", value: campaignDetail.complainedCount, icon: ShieldAlert, color: "text-red-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="mt-1 text-xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rates */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Delivery Rate</p>
              <p className="text-2xl font-bold">{campaignDetail.deliveryRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Bounce Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{campaignDetail.bounceRate}%</p>
                {campaignDetail.bounceRate > 2 && (
                  <Badge variant="destructive" className="text-xs">High</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Complaint Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{campaignDetail.complaintRate}%</p>
                {campaignDetail.complaintRate > 0.1 && (
                  <Badge variant="destructive" className="text-xs">High</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Delivery Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bounced Addresses */}
        {campaignDetail.bouncedAddresses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Bounced Addresses ({campaignDetail.bouncedAddresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaignDetail.bouncedAddresses.map((b: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs">{b.email}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{b.reason}</span>
                      <span>{new Date(b.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Campaign list
  const statusColor: Record<string, string> = {
    sent: "bg-green-500/10 text-green-700 dark:text-green-400",
    sending: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    scheduled: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    failed: "bg-red-500/10 text-red-700 dark:text-red-400",
    paused: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    partial: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{campaigns.length} campaigns</span>
      </div>

      {/* Desktop Table */}
      <div className="hidden rounded-lg border border-border md:block">
        <div className="grid grid-cols-[2fr_1fr_80px_80px_80px_80px_80px] items-center gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <button
            className="flex items-center gap-1 text-left"
            onClick={() => toggleSort("name")}
          >
            Campaign
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            className="flex items-center gap-1"
            onClick={() => toggleSort("date")}
          >
            Date
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <span>Sent</span>
          <span>Delivered</span>
          <span>Bounced</span>
          <button
            className="flex items-center gap-1"
            onClick={() => toggleSort("bounceRate")}
          >
            B.Rate
            <ArrowUpDown className="h-3 w-3" />
          </button>
          <button
            className="flex items-center gap-1"
            onClick={() => toggleSort("complaintRate")}
          >
            C.Rate
            <ArrowUpDown className="h-3 w-3" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No campaigns sent"
            description="Create your first email campaign to reach your audience."
            action={{ label: "Create Campaign", href: "/dashboard/emails/campaigns" }}
            compact
          />
        ) : (
          campaigns.map((c: any) => (
            <button
              key={c._id}
              className="grid w-full grid-cols-[2fr_1fr_80px_80px_80px_80px_80px] items-center gap-2 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-muted/30"
              onClick={() => setSelectedCampaign(c._id)}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px]", statusColor[c.status])}
                >
                  {c.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {c.sentAt
                  ? new Date(c.sentAt).toLocaleDateString()
                  : new Date(c.createdAt).toLocaleDateString()}
              </span>
              <span className="tabular-nums">{c.sentCount}</span>
              <span className="tabular-nums">{c.deliveredCount}</span>
              <span className="tabular-nums">{c.bouncedCount}</span>
              <span
                className={cn(
                  "tabular-nums",
                  c.bounceRate > 2 && "font-medium text-red-500"
                )}
              >
                {c.bounceRate}%
              </span>
              <span
                className={cn(
                  "tabular-nums",
                  c.complaintRate > 0.1 && "font-medium text-red-500"
                )}
              >
                {c.complaintRate}%
              </span>
            </button>
          ))
        )}
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No campaigns yet
          </div>
        ) : (
          campaigns.map((c: any) => (
            <Card
              key={c._id}
              className="cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => setSelectedCampaign(c._id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.sentAt
                        ? new Date(c.sentAt).toLocaleDateString()
                        : new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", statusColor[c.status])}
                  >
                    {c.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="font-medium">{c.sentCount}</p>
                    <p className="text-muted-foreground">Sent</p>
                  </div>
                  <div>
                    <p className="font-medium">{c.deliveredCount}</p>
                    <p className="text-muted-foreground">Delivered</p>
                  </div>
                  <div>
                    <p className={cn("font-medium", c.bounceRate > 2 && "text-red-500")}>
                      {c.bounceRate}%
                    </p>
                    <p className="text-muted-foreground">Bounce</p>
                  </div>
                  <div>
                    <p className={cn("font-medium", c.complaintRate > 0.1 && "text-red-500")}>
                      {c.complaintRate}%
                    </p>
                    <p className="text-muted-foreground">Complaint</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
