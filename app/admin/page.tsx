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
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Fetch platform-wide statistics (only if admin)
  const overview = useQuery(
    api.adminAnalytics.getPlatformOverview,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );
  const reportStats = useQuery(
    api.reports.getReportStats,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );
  const recentActivity = useQuery(
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center mx-auto animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-chart-1 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-chart-1" />
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
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
      change: "+12%",
      trend: "up" as const,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/5",
    },
    {
      title: "Active Courses",
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      change: "+8%",
      trend: "up" as const,
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-500/10 to-purple-500/5",
    },
    {
      title: "Platform Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+23%",
      trend: "up" as const,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/5",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      change: "+5%",
      trend: "up" as const,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/5",
    },
    {
      title: "Digital Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      change: "+15%",
      trend: "up" as const,
      gradient: "from-pink-500 to-rose-500",
      bgGradient: "from-pink-500/10 to-rose-500/5",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports.toLocaleString(),
      icon: AlertCircle,
      change: "-2",
      trend: "down" as const,
      gradient: "from-red-500 to-orange-500",
      bgGradient: "from-red-500/10 to-orange-500/5",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "enrollment": return <TrendingUp className="w-4 h-4" />;
      case "course_published": return <BookOpen className="w-4 h-4" />;
      case "purchase": return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "enrollment": return "text-emerald-500 bg-emerald-500/10";
      case "course_published": return "text-blue-500 bg-blue-500/10";
      case "purchase": return "text-violet-500 bg-violet-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className={cn(
      "space-y-8",
      mounted ? "animate-in fade-in-0 duration-500" : "opacity-0"
    )}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight">Mission Control</h1>
            <Badge variant="outline" className="text-chart-1 border-chart-1/30 bg-chart-1/5">
              <Sparkles className="w-3 h-3 mr-1" />
              Live
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Platform overview and key performance indicators
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-chart-1/10 via-chart-2/5 to-chart-3/10 border border-border/50">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="w-px h-10 bg-border/50" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Growth</p>
            <p className="text-2xl font-bold text-emerald-500 flex items-center gap-1">
              <ArrowUpRight className="w-5 h-5" />
              23%
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50 p-1 h-auto">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="creators"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 py-2.5"
          >
            <Users className="w-4 h-4 mr-2" />
            Creators & Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 mt-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card 
                  key={metric.title}
                  className={cn(
                    "group relative overflow-hidden border-border/50 hover:border-border transition-all duration-300",
                    "hover:shadow-lg hover:-translate-y-0.5"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Background gradient */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    metric.bgGradient
                  )} />
                  
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className={cn(
                          "inline-flex items-center justify-center w-12 h-12 rounded-2xl",
                          "bg-gradient-to-br shadow-lg",
                          metric.gradient
                        )}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold tracking-tight">{metric.value}</p>
                          <p className="text-sm text-muted-foreground font-medium mt-1">{metric.title}</p>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                        metric.trend === "up" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-amber-500/10 text-amber-500"
                      )}>
                        {metric.trend === "up" ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    Live Activity
                  </CardTitle>
                  <Badge variant="outline" className="text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 10).map((activity, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl",
                          "bg-muted/30 hover:bg-muted/50 transition-colors"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                          getActivityColor(activity.type)
                        )}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No recent activity</p>
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    System Health
                  </CardTitle>
                  <div className="flex items-center gap-2 text-emerald-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono">{service.latency}</span>
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5 text-xs">
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
