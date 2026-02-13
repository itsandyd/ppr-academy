"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreatorSubscribersPage() {
  const { user } = useUser();
  const storeId = user?.id;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const subscribers = useQuery(
    api.emailAnalytics.getCreatorSubscribers,
    storeId
      ? {
          storeId,
          search: search || undefined,
          statusFilter: statusFilter !== "all" ? statusFilter : undefined,
        }
      : "skip"
  );
  const stats = useQuery(
    api.emailAnalytics.getCreatorSubscriberStats,
    storeId ? { storeId } : "skip"
  );

  const handleExportCSV = () => {
    if (!subscribers) return;
    const headers = ["Email", "First Name", "Last Name", "Status", "Source", "Emails Sent", "Emails Opened", "Date Added"];
    const rows = subscribers.map((s: any) => [
      s.email,
      s.firstName || "",
      s.lastName || "",
      s.status,
      s.source || "",
      s.emailsSent,
      s.emailsOpened,
      s.createdAt ? new Date(s.createdAt).toISOString() : "",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "subscribed":
        return <UserCheck className="h-3.5 w-3.5 text-green-500" />;
      case "unsubscribed":
        return <UserX className="h-3.5 w-3.5 text-blue-500" />;
      case "bounced":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case "complained":
        return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Users className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "subscribed":
        return "default" as const;
      case "unsubscribed":
        return "secondary" as const;
      case "bounced":
      case "complained":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (!subscribers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <Users className="h-6 w-6 text-foreground" />
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <UserCheck className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-xl font-bold">{stats.subscribed}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <UserX className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{stats.unsubscribed}</p>
                <p className="text-xs text-muted-foreground">Unsubscribed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <div>
                <p className="text-xl font-bold">{stats.bounced}</p>
                <p className="text-xs text-muted-foreground">Bounced</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <ShieldAlert className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-xl font-bold">{stats.complained}</p>
                <p className="text-xs text-muted-foreground">Complained</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <TrendingUp className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-xl font-bold">+{stats.newLast30}</p>
                <p className="text-xs text-muted-foreground">Last 30d</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="subscribed">Subscribed</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="complained">Complained</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-1 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
      </p>

      {/* Subscriber List */}
      <div className="rounded-lg border border-border">
        {/* Desktop header */}
        <div className="hidden grid-cols-[2fr_1fr_80px_80px_80px_1fr] items-center gap-2 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
          <span>Subscriber</span>
          <span>Status</span>
          <span>Sent</span>
          <span>Opened</span>
          <span>Clicked</span>
          <span>Added</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matching subscribers" : "No subscribers yet"}
            </p>
          </div>
        ) : (
          subscribers.map((sub: any) => (
            <div
              key={sub._id}
              className="grid grid-cols-1 gap-2 border-b border-border px-4 py-3 last:border-0 md:grid-cols-[2fr_1fr_80px_80px_80px_1fr] md:items-center"
            >
              <div className="flex items-center gap-3 min-w-0">
                {statusIcon(sub.status)}
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{sub.email}</p>
                  {(sub.firstName || sub.lastName) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {[sub.firstName, sub.lastName].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 md:block">
                <Badge variant={statusBadgeVariant(sub.status)} className="text-xs">
                  {sub.status}
                </Badge>
                {sub.source && (
                  <span className="text-[10px] text-muted-foreground md:mt-0.5 md:block">
                    via {sub.source}
                  </span>
                )}
              </div>
              <span className="hidden tabular-nums text-sm md:block">{sub.emailsSent}</span>
              <span className="hidden tabular-nums text-sm md:block">{sub.emailsOpened}</span>
              <span className="hidden tabular-nums text-sm md:block">{sub.emailsClicked}</span>
              <span className="hidden text-xs text-muted-foreground md:block">
                {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "\u2014"}
              </span>
              {/* Mobile stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground md:hidden">
                <span>Sent: {sub.emailsSent}</span>
                <span>Opened: {sub.emailsOpened}</span>
                <span>Clicked: {sub.emailsClicked}</span>
                {sub.createdAt && (
                  <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
