"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Package,
  Store,
  UserCheck,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function AdminAnalyticsPage() {
  const { user } = useUser();

  // Fetch analytics data
  const overview = useQuery(
    api.adminAnalytics.getPlatformOverview,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const revenueData = useQuery(
    api.adminAnalytics.getRevenueOverTime,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const topCourses = useQuery(
    api.adminAnalytics.getTopCourses,
    user?.id ? { clerkId: user.id, limit: 5 } : "skip"
  );
  const topCreators = useQuery(
    api.adminAnalytics.getTopCreators,
    user?.id ? { clerkId: user.id, limit: 5 } : "skip"
  );
  const userGrowth = useQuery(
    api.adminAnalytics.getUserGrowth,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const categoryDist = useQuery(
    api.adminAnalytics.getCategoryDistribution,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const recentActivity = useQuery(
    api.adminAnalytics.getRecentActivity,
    user?.id ? { clerkId: user.id } : "skip"
  );

  if (!overview || !revenueData || !topCourses || !topCreators || !userGrowth || !categoryDist || !recentActivity) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Users",
      value: overview.totalUsers.toLocaleString(),
      icon: Users,
      change: "+12.5%",
      changeType: "positive" as const,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Active Users (30d)",
      value: overview.activeUsers.toLocaleString(),
      icon: UserCheck,
      change: "+8.3%",
      changeType: "positive" as const,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Total Revenue",
      value: `$${overview.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+23.1%",
      changeType: "positive" as const,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Total Courses",
      value: overview.totalCourses.toLocaleString(),
      icon: BookOpen,
      change: "+15.2%",
      changeType: "positive" as const,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Published Courses",
      value: overview.publishedCourses.toLocaleString(),
      icon: GraduationCap,
      change: "+9.7%",
      changeType: "positive" as const,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      title: "Total Enrollments",
      value: overview.totalEnrollments.toLocaleString(),
      icon: TrendingUp,
      change: "+18.4%",
      changeType: "positive" as const,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      title: "Digital Products",
      value: overview.totalProducts.toLocaleString(),
      icon: Package,
      change: "+6.9%",
      changeType: "positive" as const,
      color: "text-teal-600",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
    },
    {
      title: "Active Stores",
      value: overview.totalStores.toLocaleString(),
      icon: Store,
      change: "+4.2%",
      changeType: "positive" as const,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
  ];

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
          <h1 className="text-4xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Comprehensive insights into platform performance and user behavior
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-600">
              ${overview.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`rounded-full p-3 ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  <ArrowUp className="w-3 h-3" />
                  {metric.change}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">User Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="newUsers" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="New Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalUsers" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Course Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Top Performing Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCourses.map((course, index) => (
                <div key={course.courseId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-600 text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.enrollments} enrollments · {course.views} views
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      ${course.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ⭐ {course.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creators */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Top Creators by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCreators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#8b5cf6" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div 
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      activity.type === "enrollment" ? "bg-green-500" :
                      activity.type === "course_published" ? "bg-blue-500" :
                      "bg-gray-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

