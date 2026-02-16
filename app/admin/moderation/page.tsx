"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Trash2,
  Clock,
  User,
  MessageSquare,
  FileText,
  Shield,
  Music,
  Ban,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { AdminLoading } from "../components/admin-loading";
import { AdminPagination, usePagination } from "../components/admin-pagination";

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed" | "counter_notice";
type ReportType = "course" | "comment" | "user" | "product" | "sample" | "copyright";

export default function ContentModerationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ReportStatus>("pending");
  const [typeFilter, setTypeFilter] = useState<"all" | "copyright" | "general">("all");
  const { user } = useUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reports =
    useQuery(
      (api as any).reports.getReportsByStatus,
      user?.id ? { status: activeTab } : "skip"
    ) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = useQuery(
    (api as any).reports.getReportStats,
    user?.id ? {} : "skip"
  ) || {
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
    counter_notice: 0,
    total: 0,
  };

  // Mutations
  const markAsReviewed = useMutation(api.reports.markAsReviewed);
  const markAsResolved = useMutation(api.reports.markAsResolved);
  const markAsDismissed = useMutation(api.reports.markAsDismissed);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issueCopyrightStrike = useMutation((api as any).copyright.issueCopyrightStrike);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const takedownContent = useMutation((api as any).copyright.takedownContent);

  // Loading state
  const isLoading = !reports || stats.total === undefined;

  const filteredReports = reports.filter((report: any) => {
    const matchesSearch =
      report.contentTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporterName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "copyright" && report.type === "copyright") ||
      (typeFilter === "general" && report.type !== "copyright");

    return matchesSearch && matchesType;
  });

  // Pagination
  const reportsPagination = usePagination(filteredReports, 10);

  // Export reports to CSV
  const exportReportsToCSV = () => {
    const headers = ["Date", "Type", "Status", "Content Title", "Reason", "Reporter", "Reported User"];
    const rows = filteredReports.map((report: any) => [
      new Date(report.reportedAt).toLocaleDateString(),
      report.type,
      report.status,
      report.contentTitle,
      report.reason,
      report.reporterName,
      report.reportedUserName || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `moderation-reports-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading) {
    return <AdminLoading variant="dashboard" />;
  }

  const handleApprove = async (reportId: Id<"reports">) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await markAsResolved({
        reportId,
        resolution: "Content removed by admin",
      });
      toast.success("Report approved and content removed");
    } catch (error) {
      toast.error("Failed to approve report");
    }
  };

  const handleDismiss = async (reportId: Id<"reports">) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await markAsDismissed({
        reportId,
        resolution: "Report dismissed - no action needed",
      });
      toast.info("Report dismissed");
    } catch (error) {
      toast.error("Failed to dismiss report");
    }
  };

  const handleReview = async (reportId: Id<"reports">) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await markAsReviewed({
        reportId,
      });
      toast.info("Report marked as under review");
    } catch (error) {
      toast.error("Failed to mark as reviewed");
    }
  };

  const handleTakedown = async (reportId: Id<"reports">, report: any) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    if (
      !confirm(
        `Take down "${report.contentTitle}"? This will remove the content from the platform.`
      )
    ) {
      return;
    }

    try {
      await takedownContent({
        reportId,
        adminId: user.id,
        reason: "Copyright infringement - DMCA takedown",
      });
      toast.success("Content taken down successfully");
    } catch (error) {
      toast.error("Failed to take down content");
    }
  };

  const handleIssueStrike = async (report: any) => {
    if (!user?.id || !report.storeId) {
      toast.error("Missing required information");
      return;
    }

    if (
      !confirm(`Issue a copyright strike to this creator? 3 strikes result in account suspension.`)
    ) {
      return;
    }

    try {
      const result = await issueCopyrightStrike({
        storeId: report.storeId as Id<"stores">,
        reportId: report._id,
        adminId: user.id,
        reason: `Copyright claim: ${report.contentTitle}`,
      });

      if (result.suspended) {
        toast.warning(
          `Strike issued. Creator has been suspended (${result.totalStrikes} strikes).`
        );
      } else {
        toast.success(`Strike issued. Creator now has ${result.totalStrikes} strike(s).`);
      }
    } catch (error) {
      toast.error("Failed to issue strike");
    }
  };

  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case "course":
        return <FileText className="h-4 w-4" />;
      case "comment":
        return <MessageSquare className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "product":
        return <FileText className="h-4 w-4" />;
      case "sample":
        return <Music className="h-4 w-4" />;
      case "copyright":
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="destructive">Pending</Badge>;
      case "reviewed":
        return <Badge variant="secondary">Under Review</Badge>;
      case "resolved":
        return <Badge className="bg-green-600">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="outline">Dismissed</Badge>;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Content Moderation</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Review and manage reported content and user behavior
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportReportsToCSV}
            disabled={filteredReports.length === 0}
            className="gap-1"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Badge variant="outline" className="px-3 py-1.5">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            {stats.pending} pending
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold tracking-tight text-red-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">requires attention</p>
              </div>
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                <p className="text-3xl font-bold tracking-tight text-orange-600">
                  {stats.reviewed}
                </p>
                <p className="text-xs text-muted-foreground">being processed</p>
              </div>
              <div className="rounded-full bg-orange-500/10 p-3">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold tracking-tight text-green-600">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">action taken</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dismissed</p>
                <p className="text-3xl font-bold tracking-tight">{stats.dismissed}</p>
                <p className="text-xs text-muted-foreground">no action needed</p>
              </div>
              <div className="rounded-full bg-gray-500/10 p-3">
                <XCircle className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search by title, reason, or reporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 text-base"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v: "all" | "copyright" | "general") => setTypeFilter(v)}
        >
          <SelectTrigger className="h-12 w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-black">
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="copyright">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                Copyright Claims
              </div>
            </SelectItem>
            <SelectItem value="general">General Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ReportStatus)}
        className="space-y-6"
      >
        <TabsList className="grid h-12 w-full grid-cols-4 p-1">
          <TabsTrigger value="pending" className="gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2 text-base">
            <Clock className="h-4 w-4" />
            Reviewing ({stats.reviewed})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2 text-base">
            <CheckCircle className="h-4 w-4" />
            Resolved ({stats.resolved})
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="gap-2 text-base">
            <XCircle className="h-4 w-4" />
            Dismissed ({stats.dismissed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Reports
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          <Card className="border-2">
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredReports.length > 0 ? (
                  reportsPagination.paginatedItems.map((report: any) => (
                    <div key={report._id} className="p-6 transition-colors hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-lg bg-muted p-2">
                              {getReportTypeIcon(report.type)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-bold">{report.contentTitle}</h3>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {report.type}
                                </Badge>
                                {getStatusBadge(report.status)}
                              </div>

                              {/* Reason */}
                              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                                <Flag className="mt-0.5 h-4 w-4 text-red-600" />
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                                    Report Reason
                                  </p>
                                  <p className="text-sm text-red-600 dark:text-red-400">
                                    {report.reason}
                                  </p>
                                </div>
                              </div>

                              {/* Content Preview */}
                              {report.contentPreview && (
                                <div className="rounded-lg border bg-muted/50 p-3">
                                  <p className="line-clamp-2 text-sm italic text-muted-foreground">
                                    "{report.contentPreview}"
                                  </p>
                                </div>
                              )}

                              {/* Meta Info */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" />
                                  <span>Reported by:</span>
                                  <span className="font-semibold text-foreground">
                                    {report.reporterName}
                                  </span>
                                </div>
                                {report.reportedUserName && (
                                  <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>Reported user:</span>
                                    <span className="font-semibold text-foreground">
                                      {report.reportedUserName}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTimeAgo(report.reportedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex min-w-[140px] flex-col gap-2">
                          <Button variant="outline" size="default" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          {report.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => handleReview(report._id)}
                                className="gap-2"
                              >
                                <Clock className="h-4 w-4" />
                                Review
                              </Button>
                              {report.type === "copyright" ? (
                                <>
                                  <Button
                                    variant="destructive"
                                    size="default"
                                    onClick={() => handleTakedown(report._id, report)}
                                    className="gap-2"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Take Down
                                  </Button>
                                  {report.storeId && (
                                    <Button
                                      variant="outline"
                                      size="default"
                                      onClick={() => handleIssueStrike(report)}
                                      className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                                    >
                                      <Shield className="h-4 w-4" />
                                      Issue Strike
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="default"
                                  onClick={() => handleApprove(report._id)}
                                  className="gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="default"
                                onClick={() => handleDismiss(report._id)}
                                className="gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Dismiss
                              </Button>
                            </>
                          )}
                          {report.status === "reviewed" && (
                            <>
                              {report.type === "copyright" ? (
                                <>
                                  <Button
                                    variant="destructive"
                                    size="default"
                                    onClick={() => handleTakedown(report._id, report)}
                                    className="gap-2"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Take Down
                                  </Button>
                                  {report.storeId && (
                                    <Button
                                      variant="outline"
                                      size="default"
                                      onClick={() => handleIssueStrike(report)}
                                      className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                                    >
                                      <Shield className="h-4 w-4" />
                                      Issue Strike
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="default"
                                  onClick={() => handleApprove(report._id)}
                                  className="gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="default"
                                onClick={() => handleDismiss(report._id)}
                                className="gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Flag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">No {activeTab} reports</h3>
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search terms to find what you're looking for"
                        : `All ${activeTab} reports will appear here when available`}
                    </p>
                  </div>
                )}
              </div>
              {filteredReports.length > 10 && (
                <div className="border-t p-4">
                  <AdminPagination
                    currentPage={reportsPagination.currentPage}
                    totalPages={reportsPagination.totalPages}
                    totalItems={reportsPagination.totalItems}
                    itemsPerPage={reportsPagination.itemsPerPage}
                    onPageChange={reportsPagination.handlePageChange}
                    onItemsPerPageChange={reportsPagination.handleItemsPerPageChange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
