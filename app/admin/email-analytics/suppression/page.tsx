"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Trash2,
  Download,
  Loader2,
  ShieldBan,
  AlertTriangle,
  ShieldAlert,
  Ban,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

export default function SuppressionPage() {
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [addEmail, setAddEmail] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const suppressionList = useQuery(api.emailAnalytics.getSuppressionList, {
    search: search || undefined,
    reasonFilter: reasonFilter !== "all" ? reasonFilter : undefined,
  });
  const unsubStats = useQuery(api.emailUnsubscribe.getUnsubscribeStats);

  const removeSuppression = useMutation(api.emailAnalytics.removeSuppression);
  const addSuppression = useMutation(api.emailAnalytics.addSuppression);

  const handleRemove = async (prefId: Id<"resendPreferences">) => {
    setRemoving(prefId);
    try {
      await removeSuppression({ prefId });
    } finally {
      setRemoving(null);
    }
  };

  const handleAdd = async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      await addSuppression({
        email: addEmail.trim(),
        reason: addReason || "Manual suppression",
      });
      setAddEmail("");
      setAddReason("");
      setAddDialogOpen(false);
    } finally {
      setAdding(false);
    }
  };

  const handleExportCSV = () => {
    if (!suppressionList) return;
    const headers = ["Email", "Reason", "Date Suppressed"];
    const rows = suppressionList.map((item: any) => [
      item.email,
      item.reason,
      new Date(item.suppressedAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suppression-list-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reasonIcon = (reason: string) => {
    const lower = reason.toLowerCase();
    if (lower.includes("bounce")) return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    if (lower.includes("spam") || lower.includes("complaint")) return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />;
    if (lower.includes("unsubscrib")) return <UserX className="h-3.5 w-3.5 text-blue-500" />;
    return <Ban className="h-3.5 w-3.5 text-gray-500" />;
  };

  const reasonBadge = (reason: string) => {
    const lower = reason.toLowerCase();
    if (lower.includes("bounce")) return "bounced";
    if (lower.includes("spam") || lower.includes("complaint")) return "complained";
    if (lower.includes("unsubscrib") && !lower.includes("bounce") && !lower.includes("spam")) return "unsubscribed";
    return "manual";
  };

  if (!suppressionList) {
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
      {unsubStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <UserX className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{unsubStats.totalUnsubscribed}</p>
                <p className="text-xs text-muted-foreground">Total Suppressed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{unsubStats.totalBounced}</p>
                <p className="text-xs text-muted-foreground">Unique Bounced</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-4">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{unsubStats.totalComplained}</p>
                <p className="text-xs text-muted-foreground">Complained</p>
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
            placeholder="Search email addresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="complained">Complained</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Suppression List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  placeholder="user@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason (optional)</label>
                <Input
                  placeholder="Manual suppression"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAdd} disabled={adding || !addEmail.trim()}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-1 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {suppressionList.length} suppressed address{suppressionList.length !== 1 ? "es" : ""}
      </p>

      {/* List */}
      <div className="rounded-lg border border-border">
        {suppressionList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <ShieldBan className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matching suppressed emails" : "Suppression list is empty"}
            </p>
          </div>
        ) : (
          suppressionList.map((item: any) => (
            <div
              key={item._id}
              className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                {reasonIcon(item.reason)}
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{item.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">
                      {reasonBadge(item.reason)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {item.reason}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.suppressedAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={removing === item._id}
                  onClick={() => handleRemove(item._id)}
                  title="Remove from suppression list"
                >
                  {removing === item._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
