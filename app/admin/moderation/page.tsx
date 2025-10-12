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
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
type ReportType = "course" | "comment" | "user" | "product";

export default function ContentModerationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ReportStatus>("pending");
  const { user } = useUser();

  // Fetch reports from Convex
  const reports = useQuery(
    api.reports.getReportsByStatus, 
    user?.id ? { status: activeTab, clerkId: user.id } : "skip"
  ) || [];
  const stats = useQuery(
    api.reports.getReportStats,
    user?.id ? { clerkId: user.id } : "skip"
  ) || {
    pending: 0,
    reviewed: 0,
    resolved: 0,
    dismissed: 0,
    total: 0,
  };

  // Mutations
  const markAsReviewed = useMutation(api.reports.markAsReviewed);
  const markAsResolved = useMutation(api.reports.markAsResolved);
  const markAsDismissed = useMutation(api.reports.markAsDismissed);

  const filteredReports = reports.filter(
    (report) =>
      report.contentTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporterName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (reportId: Id<"reports">) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }
    
    try {
      await markAsResolved({
        clerkId: user.id,
        reportId,
        reviewedBy: user.id,
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
        clerkId: user.id,
        reportId,
        reviewedBy: user.id,
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
        clerkId: user.id,
        reportId,
        reviewedBy: user.id,
      });
      toast.info("Report marked as under review");
    } catch (error) {
      toast.error("Failed to mark as reviewed");
    }
  };

  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case "course":
        return <FileText className="w-4 h-4" />;
      case "comment":
        return <MessageSquare className="w-4 h-4" />;
      case "user":
        return <User className="w-4 h-4" />;
      case "product":
        return <FileText className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
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
          <p className="text-muted-foreground mt-2 text-lg">
            Review and manage reported content and user behavior
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            {stats.pending} pending
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold tracking-tight text-red-600">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">requires attention</p>
              </div>
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                <p className="text-3xl font-bold tracking-tight text-orange-600">{stats.reviewed}</p>
                <p className="text-xs text-muted-foreground">being processed</p>
              </div>
              <div className="rounded-full bg-orange-500/10 p-3">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold tracking-tight text-green-600">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">action taken</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dismissed</p>
                <p className="text-3xl font-bold tracking-tight">{stats.dismissed}</p>
                <p className="text-xs text-muted-foreground">no action needed</p>
              </div>
              <div className="rounded-full bg-gray-500/10 p-3">
                <XCircle className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by title, reason, or reporter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 text-base"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 p-1">
          <TabsTrigger value="pending" className="text-base gap-2">
            <AlertTriangle className="w-4 h-4" />
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="text-base gap-2">
            <Clock className="w-4 h-4" />
            Reviewing ({stats.reviewed})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-base gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolved ({stats.resolved})
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="text-base gap-2">
            <XCircle className="w-4 h-4" />
            Dismissed ({stats.dismissed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Reports
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          <Card className="border-2">
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div
                      key={report._id}
                      className="p-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-muted p-2 mt-0.5">
                              {getReportTypeIcon(report.type)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg">{report.contentTitle}</h3>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {report.type}
                                </Badge>
                                {getStatusBadge(report.status)}
                              </div>

                              {/* Reason */}
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <Flag className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
                                    Report Reason
                                  </p>
                                  <p className="text-sm text-red-600 dark:text-red-400">
                                    {report.reason}
                                  </p>
                                </div>
                              </div>

                              {/* Content Preview */}
                              {report.contentPreview && (
                                <div className="p-3 rounded-lg bg-muted/50 border">
                                  <p className="text-sm italic line-clamp-2 text-muted-foreground">
                                    "{report.contentPreview}"
                                  </p>
                                </div>
                              )}

                              {/* Meta Info */}
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" />
                                  <span>Reported by:</span>
                                  <span className="font-semibold text-foreground">{report.reporterName}</span>
                                </div>
                                {report.reportedUserName && (
                                  <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Reported user:</span>
                                    <span className="font-semibold text-foreground">{report.reportedUserName}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatTimeAgo(report.reportedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button variant="outline" size="default" className="gap-2">
                            <Eye className="w-4 h-4" />
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
                                <Clock className="w-4 h-4" />
                                Review
                              </Button>
                              <Button
                                variant="destructive"
                                size="default"
                                onClick={() => handleApprove(report._id)}
                                className="gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </Button>
                              <Button
                                variant="ghost"
                                size="default"
                                onClick={() => handleDismiss(report._id)}
                                className="gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Dismiss
                              </Button>
                            </>
                          )}
                          {report.status === "reviewed" && (
                            <>
                              <Button
                                variant="destructive"
                                size="default"
                                onClick={() => handleApprove(report._id)}
                                className="gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </Button>
                              <Button
                                variant="ghost"
                                size="default"
                                onClick={() => handleDismiss(report._id)}
                                className="gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 px-6">
                    <div className="rounded-full bg-muted w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Flag className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No {activeTab} reports
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      {searchQuery
                        ? "Try adjusting your search terms to find what you're looking for"
                        : `All ${activeTab} reports will appear here when available`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

