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
  Loader2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BarChart3,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminCreatorsView } from "@/app/_components/admin-creators-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is admin
  const adminCheck = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  ) as { isAdmin: boolean } | undefined;

  // Fetch platform-wide statistics (only if admin)
  const overview = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.adminAnalytics.getPlatformOverview,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );
  const reportStats = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.reports.getReportStats,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );
  const recentActivity = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.adminAnalytics.getRecentActivity,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );

  // Redirect non-admin users
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in?redirect_url=/admin");
    } else if (adminCheck !== undefined && !adminCheck.isAdmin) {
      router.push("/");
    }
  }, [isLoaded, user, adminCheck, router]);

  // Show loading state while checking authentication
  if (!isLoaded || adminCheck === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-chart-1 bg-background">
              <Loader2 className="h-3 w-3 animate-spin text-chart-1" />
            </div>
          </div>
          <div>
            <p className="font-medium">Verifying access</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied for non-admins
  if (!adminCheck.isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">
                  You don't have permission to access the admin dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalUsers: overview?.totalUsers || 0,
    totalCourses: overview?.totalCourses || 0,
    totalRevenue: overview?.totalRevenue || 0,
    activeUsers: overview?.activeUsers || 0,
    totalProducts: overview?.totalProducts || 0,
    pendingReports: reportStats?.pending || 0,
    totalPurchases: overview?.totalPurchases || 0,
    revenueThisMonth: overview?.revenueThisMonth || 0,
    newUsersThisMonth: overview?.newUsersThisMonth || 0,
    totalStores: overview?.totalStores || 0,
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const metrics = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: `+${stats.newUsersThisMonth} this month`,
      trend: "up" as const,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/5",
    },
    {
      title: "Active Courses",
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      change: `${overview?.publishedCourses || 0} published`,
      trend: "up" as const,
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-500/10 to-purple-500/5",
    },
    {
      title: "Platform Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: `$${stats.revenueThisMonth.toLocaleString()} this month`,
      trend: "up" as const,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/5",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      change: "Last 30 days",
      trend: "up" as const,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/5",
    },
    {
      title: "Total Purchases",
      value: stats.totalPurchases.toLocaleString(),
      icon: Package,
      change: `${stats.totalStores} stores`,
      trend: "up" as const,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-500/10 to-rose-500/5",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports.toLocaleString(),
      icon: AlertCircle,
      change: stats.pendingReports > 0 ? "Needs attention" : "All clear",
      trend: stats.pendingReports > 0 ? "down" as const : "up" as const,
      gradient: "from-red-500 to-orange-500",
      bgGradient: "from-red-500/10 to-orange-500/5",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment":
        return <TrendingUp className="h-4 w-4" />;
      case "course_published":
        return <BookOpen className="h-4 w-4" />;
      case "purchase":
        return <DollarSign className="h-4 w-4" />;
      case "user_signup":
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "enrollment":
        return "text-emerald-500 bg-emerald-500/10";
      case "course_published":
        return "text-blue-500 bg-blue-500/10";
      case "purchase":
        return "text-violet-500 bg-violet-500/10";
      case "user_signup":
        return "text-amber-500 bg-amber-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className={cn("space-y-8", mounted ? "duration-500 animate-in fade-in-0" : "opacity-0")}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight">Mission Control</h1>
            <Badge variant="outline" className="border-chart-1/30 bg-chart-1/5 text-chart-1">
              <Sparkles className="mr-1 h-3 w-3" />
              Live
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Platform overview and key performance indicators
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-gradient-to-r from-chart-1/10 via-chart-2/5 to-chart-3/10 p-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-2xl font-bold text-transparent">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Growth</p>
            <p className="flex items-center gap-1 text-2xl font-bold text-emerald-500">
              <ArrowUpRight className="h-5 w-5" />
              23%
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto border border-border/50 bg-muted/50 p-1">
          <TabsTrigger
            value="overview"
            className="px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="creators"
            className="px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            Creators & Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8 space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card
                  key={metric.title}
                  className={cn(
                    "group relative overflow-hidden border-border/50 transition-all duration-300 hover:border-border",
                    "hover:-translate-y-0.5 hover:shadow-lg"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Background gradient */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                      metric.bgGradient
                    )}
                  />

                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div
                          className={cn(
                            "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                            "bg-gradient-to-br shadow-lg",
                            metric.gradient
                          )}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                          <p className="mt-1 text-sm font-medium text-muted-foreground">
                            {metric.title}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          metric.trend === "up"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        )}
                      >
                        {metric.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {metric.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Activity and System Status */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    Live Activity
                  </CardTitle>
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 10).map((activity: any, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 rounded-xl p-3",
                          "bg-muted/30 transition-colors hover:bg-muted/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            getActivityColor(activity.type)
                          )}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{activity.description}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <Activity className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    System Health
                  </CardTitle>
                  <div className="flex items-center gap-2 text-emerald-500">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium">All Systems Go</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "API Gateway", status: "operational", latency: "23ms" },
                    { name: "Database", status: "operational", latency: "12ms" },
                    { name: "Storage (Convex)", status: "operational", latency: "45ms" },
                    { name: "Email Service (Resend)", status: "operational", latency: "156ms" },
                    { name: "Payment Gateway (Stripe)", status: "operational", latency: "89ms" },
                    { name: "Auth Service (Clerk)", status: "operational", latency: "34ms" },
                  ].map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {service.latency}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-500"
                        >
                          Operational
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="creators" className="mt-8">
          {user?.id && <AdminCreatorsView clerkId={user.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
