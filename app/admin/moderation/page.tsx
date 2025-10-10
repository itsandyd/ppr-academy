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
  const reports = useQuery(api.reports.getReportsByStatus, { status: activeTab }) || [];
  const stats = useQuery(api.reports.getReportStats) || {
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
    try {
      await markAsResolved({
        reportId,
        reviewedBy: user?.id || "admin",
        resolution: "Content removed by admin",
      });
      toast.success("Report approved and content removed");
    } catch (error) {
      toast.error("Failed to approve report");
    }
  };

  const handleDismiss = async (reportId: Id<"reports">) => {
    try {
      await markAsDismissed({
        reportId,
        reviewedBy: user?.id || "admin",
        resolution: "Report dismissed - no action needed",
      });
      toast.info("Report dismissed");
    } catch (error) {
      toast.error("Failed to dismiss report");
    }
  };

  const handleReview = async (reportId: Id<"reports">) => {
    try {
      await markAsReviewed({
        reportId,
        reviewedBy: user?.id || "admin",
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and manage reported content and user behavior
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.reviewed}</div>
                <div className="text-sm text-muted-foreground">Under Review</div>
              </div>
              <Clock className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-600">{stats.dismissed}</div>
                <div className="text-sm text-muted-foreground">Dismissed</div>
              </div>
              <XCircle className="w-8 h-8 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewing ({stats.reviewed})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({stats.resolved})
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed ({stats.dismissed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Reports ({filteredReports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div
                      key={report._id}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getReportTypeIcon(report.type)}
                            <h3 className="font-semibold">{report.contentTitle}</h3>
                            <Badge variant="outline" className="text-xs">
                              {report.type}
                            </Badge>
                            {getStatusBadge(report.status)}
                          </div>

                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-red-600">Reason:</span> {report.reason}
                          </p>

                          <p className="text-sm text-muted-foreground italic line-clamp-2">
                            "{report.contentPreview}"
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Reported by: <span className="font-medium">{report.reporterName}</span>
                            </span>
                            {report.reportedUserName && (
                              <span>
                                Reported user: <span className="font-medium">{report.reportedUserName}</span>
                              </span>
                            )}
                            <span>{formatTimeAgo(report.reportedAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {report.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReview(report._id)}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleApprove(report._id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(report._id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                            </>
                          )}
                          {report.status === "reviewed" && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleApprove(report._id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(report._id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No {activeTab} reports found</p>
                    <p className="text-sm">
                      {searchQuery
                        ? "Try adjusting your search"
                        : `All ${activeTab} reports will appear here`}
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

