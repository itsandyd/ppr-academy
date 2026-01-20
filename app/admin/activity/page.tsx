"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Activity,
  Users,
  FileEdit,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Clock,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminLoading } from "../components/admin-loading";
import { AdminPagination, usePagination } from "../components/admin-pagination";

// Action type icons
const actionTypeIcons: Record<string, React.ReactNode> = {
  create: <FileEdit className="h-4 w-4 text-green-600" />,
  update: <FileEdit className="h-4 w-4 text-blue-600" />,
  delete: <Trash2 className="h-4 w-4 text-red-600" />,
  approve: <CheckCircle className="h-4 w-4 text-green-600" />,
  reject: <XCircle className="h-4 w-4 text-orange-600" />,
  export: <Download className="h-4 w-4 text-purple-600" />,
  view: <Eye className="h-4 w-4 text-gray-600" />,
};

// Action type colors
const actionTypeColors: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  approve: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  reject: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  export: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  view: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function AdminActivityPage() {
  const { user } = useUser();
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch activity data
  const recentActivity = useQuery(
    api.adminActivityLogs.getRecentActivity,
    user?.id
      ? {
          clerkId: user.id,
          limit: 50,
          ...(actionTypeFilter !== "all" ? { actionType: actionTypeFilter as any } : {}),
          ...(resourceTypeFilter !== "all" ? { resourceType: resourceTypeFilter } : {}),
        }
      : "skip"
  );

  const activitySummary = useQuery(
    api.adminActivityLogs.getActivitySummary,
    user?.id ? { clerkId: user.id, days: 30 } : "skip"
  );

  if (!recentActivity || !activitySummary) {
    return <AdminLoading variant="dashboard" />;
  }

  // Filter by search query
  const filteredActivity = searchQuery
    ? recentActivity.filter(
        (activity) =>
          activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.adminName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentActivity;

  // Pagination for activity feed
  const activityPagination = usePagination(filteredActivity, 15);

  // Get unique resource types for filter
  const resourceTypes = Array.from(
    new Set(recentActivity.map((a) => a.resourceType))
  );

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export activity to CSV
  const exportActivityToCSV = () => {
    const headers = ["Date", "Time", "Admin", "Action Type", "Action", "Resource Type", "Resource Name", "Details"];
    const rows = filteredActivity.map((activity) => {
      const date = new Date(activity.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        activity.adminName || "Admin",
        activity.actionType,
        activity.action,
        activity.resourceType,
        activity.resourceName || "",
        activity.details || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `admin-activity-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Activity</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Monitor admin actions and maintain an audit trail
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{activitySummary.totalActions}</p>
                <p className="text-sm text-muted-foreground">Total Actions (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <FileEdit className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {activitySummary.byActionType.find((a) => a.type === "create")?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Creates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {activitySummary.byActionType.find((a) => a.type === "approve")?.count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{activitySummary.byAdmin.length}</p>
                <p className="text-sm text-muted-foreground">Active Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1 sm:grid sm:h-12 sm:grid-cols-3">
          <TabsTrigger value="feed" className="flex-1 gap-1 text-xs sm:gap-2 sm:text-base">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            Activity Feed
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex-1 gap-1 text-xs sm:gap-2 sm:text-base">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            Breakdown
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex-1 gap-1 text-xs sm:gap-2 sm:text-base">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            By Admin
          </TabsTrigger>
        </TabsList>

        {/* Activity Feed Tab */}
        <TabsContent value="feed">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-40 pl-9"
                    />
                  </div>
                  <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                    <SelectTrigger className="w-32">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Resource" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {resourceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportActivityToCSV}
                    disabled={filteredActivity.length === 0}
                    className="gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredActivity.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold">No activity found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || actionTypeFilter !== "all" || resourceTypeFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Admin activity will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityPagination.paginatedItems.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      {/* Icon */}
                      <div className="mt-1 flex-shrink-0">
                        {actionTypeIcons[activity.actionType] || (
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {activity.adminName || "Admin"}
                          </span>
                          <Badge
                            className={cn(
                              "text-xs",
                              actionTypeColors[activity.actionType]
                            )}
                          >
                            {activity.actionType}
                          </Badge>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm">{activity.action}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {activity.resourceType}
                          </Badge>
                          {activity.resourceName && (
                            <span className="truncate">{activity.resourceName}</span>
                          )}
                        </div>
                        {activity.details && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {activity.details}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">
                          {activity.timeAgo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredActivity.length > 15 && (
                    <AdminPagination
                      currentPage={activityPagination.currentPage}
                      totalPages={activityPagination.totalPages}
                      totalItems={activityPagination.totalItems}
                      itemsPerPage={activityPagination.itemsPerPage}
                      onPageChange={activityPagination.handlePageChange}
                      onItemsPerPageChange={activityPagination.handleItemsPerPageChange}
                      itemsPerPageOptions={[15, 25, 50]}
                      className="mt-4 border-t pt-4"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Action Type */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">By Action Type</CardTitle>
                <CardDescription>Distribution of admin actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activitySummary.byActionType.map((item) => {
                    const percentage =
                      activitySummary.totalActions > 0
                        ? (item.count / activitySummary.totalActions) * 100
                        : 0;
                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {actionTypeIcons[item.type]}
                            <span className="capitalize">{item.type}</span>
                          </div>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              item.type === "create"
                                ? "bg-green-500"
                                : item.type === "update"
                                  ? "bg-blue-500"
                                  : item.type === "delete"
                                    ? "bg-red-500"
                                    : item.type === "approve"
                                      ? "bg-green-500"
                                      : item.type === "reject"
                                        ? "bg-orange-500"
                                        : "bg-purple-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By Resource Type */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">By Resource Type</CardTitle>
                <CardDescription>Actions grouped by resource</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activitySummary.byResourceType.map((item) => {
                    const percentage =
                      activitySummary.totalActions > 0
                        ? (item.count / activitySummary.totalActions) * 100
                        : 0;
                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{item.type}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {activitySummary.byResourceType.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">
                      No resource data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Activity Chart */}
            <Card className="border-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Daily Activity (Last 14 Days)</CardTitle>
                <CardDescription>Admin actions over time</CardDescription>
              </CardHeader>
              <CardContent>
                {activitySummary.recentActivity.length > 0 ? (
                  <div className="flex h-48 items-end gap-2">
                    {activitySummary.recentActivity.map((day) => {
                      const maxCount = Math.max(
                        ...activitySummary.recentActivity.map((d) => d.count),
                        1
                      );
                      const height = (day.count / maxCount) * 100;
                      return (
                        <div
                          key={day.date}
                          className="group relative flex-1"
                          title={`${day.date}: ${day.count} actions`}
                        >
                          <div
                            className="w-full rounded-t bg-purple-500 transition-all hover:bg-purple-600"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <p className="mt-1 text-center text-[10px] text-muted-foreground">
                            {new Date(day.date).getDate()}
                          </p>
                          <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                            {day.count} actions
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    No activity data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Admin Tab */}
        <TabsContent value="admins">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Activity by Admin</CardTitle>
              <CardDescription>See which admins have been most active</CardDescription>
            </CardHeader>
            <CardContent>
              {activitySummary.byAdmin.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold">No admin activity yet</p>
                  <p className="text-sm text-muted-foreground">
                    Admin actions will be tracked here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activitySummary.byAdmin.map((admin, index) => {
                    const percentage =
                      activitySummary.totalActions > 0
                        ? (admin.count / activitySummary.totalActions) * 100
                        : 0;
                    return (
                      <div
                        key={admin.adminId}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        {/* Rank */}
                        <div
                          className={cn(
                            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold",
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </div>

                        {/* Admin Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{admin.adminName || "Admin"}</p>
                          <p className="text-sm text-muted-foreground">
                            {admin.count} actions • {percentage.toFixed(1)}% of total
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="w-32">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-purple-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <p className="text-2xl font-bold">{admin.count}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
