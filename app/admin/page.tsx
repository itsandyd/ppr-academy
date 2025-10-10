"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  Shield,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboard() {
  // Fetch platform-wide statistics
  const overview = useQuery(api.adminAnalytics.getPlatformOverview);
  const reportStats = useQuery(api.reports.getReportStats);
  const recentActivity = useQuery(api.adminAnalytics.getRecentActivity);
  
  const stats = {
    totalUsers: overview?.totalUsers || 0,
    totalCourses: overview?.totalCourses || 0,
    totalRevenue: overview?.totalRevenue || 0,
    activeUsers: overview?.activeUsers || 0,
    totalProducts: overview?.totalProducts || 0,
    pendingReports: reportStats?.pending || 0,
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const metrics: Array<{
    title: string;
    value: string;
    icon: any;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    color: string;
  }> = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: "+12%",
      changeType: "positive",
      color: "text-blue-600",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      change: "+8%",
      changeType: "positive",
      color: "text-purple-600",
    },
    {
      title: "Platform Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+23%",
      changeType: "positive",
      color: "text-green-600",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      change: "+5%",
      changeType: "positive",
      color: "text-orange-600",
    },
    {
      title: "Digital Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      change: "+15%",
      changeType: "positive",
      color: "text-indigo-600",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports.toLocaleString(),
      icon: AlertCircle,
      change: "-2",
      changeType: "neutral",
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    metric.changeType === "positive"
                      ? "text-green-600"
                      : metric.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold mb-1">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "enrollment" ? "bg-green-500" :
                        activity.type === "course_published" ? "bg-blue-500" :
                        activity.type === "purchase" ? "bg-purple-500" :
                        "bg-orange-500"
                      }`} 
                    />
                    <span className="flex-1">{activity.description}</span>
                    <span className="text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <span className="text-sm text-green-600 font-medium">
                  ● Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-600 font-medium">
                  ● Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <span className="text-sm text-green-600 font-medium">
                  ● Available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <span className="text-sm text-green-600 font-medium">
                  ● Online
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
