"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StoreSetupWizardEnhanced } from "@/components/dashboard/store-setup-wizard-enhanced";
import {
  Music,
  Package,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  Play,
  BookOpen,
  Headphones,
  Loader2,
  BarChart3,
  Star,
  Eye,
  AlertTriangle,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  Zap,
  Target,
  Mail,
  Share2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

export function CreateModeContent() {
  const { user } = useUser();
  const router = useRouter();

  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const storeId = stores?.[0]?._id;

  const storeStats = useQuery(api.storeStats.getStoreStats, storeId ? { storeId } : "skip");

  const creatorAnalytics = useQuery(
    api.analytics.getCreatorAnalytics,
    convexUser?.clerkId ? { userId: convexUser.clerkId, timeRange: "30d" } : "skip"
  );

  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : "skip"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copyrightClaims = useQuery(
    (api as any).copyright?.getStoreCopyrightClaims,
    storeId ? { storeId } : "skip"
  ) as Array<{ status: string }> | undefined;

  const recentPurchases = useQuery(
    api.purchases.getStorePurchases,
    storeId ? { storeId, limit: 5 } : "skip"
  );

  const pendingClaimsCount = copyrightClaims?.filter((c) => c.status === "pending").length || 0;

  const products = useMemo(() => {
    const coursesToUse = userCourses || [];
    const digitalProductsToUse = digitalProducts || [];

    const courseProducts = coursesToUse.map((course: any) => ({
      ...course,
      type: "course" as const,
      price: course.price || 0,
      downloadCount: 0,
      category: course.category || "Course",
    }));

    const digitalProductItems = digitalProductsToUse.map((product: any) => ({
      ...product,
      type: "digital" as const,
      downloadCount: (product as any).downloadCount || 0,
      category: (product as any).category || (product as any).productCategory || "Digital Product",
    }));

    // Sort by creation time (newest first) to show most recent products
    return [...courseProducts, ...digitalProductItems].sort(
      (a, b) => (b._creationTime || 0) - (a._creationTime || 0)
    );
  }, [userCourses, digitalProducts]);

  const quickActions = useMemo(
    () => [
      {
        title: "Upload Sample Pack",
        description: "Share your beats and loops",
        icon: Music,
        color: "from-purple-500 to-pink-500",
        href: `/dashboard/create/pack?type=sample-pack`,
      },
      {
        title: "Create Preset",
        description: "Upload synth presets",
        icon: Package,
        color: "from-blue-500 to-cyan-500",
        href: `/dashboard/create/pack?type=preset-pack`,
      },
      {
        title: "New Course",
        description: "Teach production skills",
        icon: Play,
        color: "from-green-500 to-emerald-500",
        href: `/dashboard/create/course?category=course`,
      },
      {
        title: "Offer Coaching",
        description: "1-on-1 mentoring",
        icon: Headphones,
        color: "from-orange-500 to-red-500",
        href: `/dashboard/create/coaching?category=coaching`,
      },
    ],
    []
  );

  const isLoading = !user || convexUser === undefined || stores === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  if (user?.id && stores !== undefined && stores.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Welcome to Creator Mode! 🎨</h2>
          <p className="text-muted-foreground">
            Let's set up your creator store to start selling your music content
          </p>
        </div>
        <StoreSetupWizardEnhanced
          onStoreCreated={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const stats = storeStats || {
    totalProducts: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalDownloads: 0,
    totalRevenue: 0,
    averageRating: 0,
    followerCount: 0,
    freeProducts: 0,
    paidProducts: 0,
  };

  const analytics = creatorAnalytics?.overview || {
    totalRevenue: 0,
    totalSales: 0,
    totalViews: 0,
    conversionRate: 0,
    totalProducts: 0,
    publishedProducts: 0,
    totalStudents: 0,
    avgRating: 0,
  };

  const publishedCount = products.filter((p: any) => p.isPublished).length;
  const totalProducts = stats.totalProducts + stats.totalCourses;
  const hasContent = totalProducts > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.firstName || "Creator"}! 🎵
            </h1>
            <p className="text-muted-foreground">
              {hasContent
                ? `You have ${totalProducts} product${totalProducts !== 1 ? "s" : ""} (${publishedCount} live)`
                : "Ready to create something amazing?"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${stores?.[0]?.slug}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Store
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Link>
          </Button>
        </div>
      </div>

      {pendingClaimsCount > 0 && (
        <Alert
          variant="destructive"
          className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Copyright Claim{pendingClaimsCount > 1 ? "s" : ""} Pending</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have {pendingClaimsCount} pending claim{pendingClaimsCount > 1 ? "s" : ""}{" "}
              requiring attention.
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="ml-4 border-red-300 hover:bg-red-100"
            >
              <Link href="/dashboard/copyright">Review Claims</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue || analytics.totalRevenue || 0).toLocaleString()}`}
          subtitle="Lifetime earnings"
          icon={DollarSign}
          trend={analytics.totalRevenue > 0 ? { value: 0, direction: "neutral" } : undefined}
          color="green"
        />
        <StatCard
          title="Total Sales"
          value={stats.totalDownloads + stats.totalEnrollments || analytics.totalSales || 0}
          subtitle={`${stats.totalDownloads} downloads, ${stats.totalEnrollments} enrollments`}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Students"
          value={stats.followerCount || analytics.totalStudents || 0}
          subtitle="Unique customers"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Content"
          value={totalProducts}
          subtitle={`${publishedCount} published`}
          icon={Package}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <Card className="group cursor-pointer border-border transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                      <CardContent className="p-4">
                        <div
                          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${action.color}`}
                        >
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {hasContent && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-purple-500" />
                    Recent Products
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/products?mode=create">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.slice(0, 5).map((product: any) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                          product.type === "course"
                            ? "bg-green-100 dark:bg-green-900/20"
                            : "bg-purple-100 dark:bg-purple-900/20"
                        }`}
                      >
                        {product.type === "course" ? (
                          <Play className="h-5 w-5 text-green-600" />
                        ) : (
                          <Music className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium">{product.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {product.type === "course" ? "Course" : product.category}
                          </Badge>
                          <span>${product.price || 0}</span>
                          {product.isPublished ? (
                            <Badge variant="outline" className="text-xs text-green-600">
                              Live
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={
                            product.type === "course"
                              ? `/dashboard/courses/${product.slug}?mode=create`
                              : `/dashboard/products/${product._id}?mode=create`
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!hasContent && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Create Your First Product</h3>
                <p className="mb-4 max-w-sm text-muted-foreground">
                  Start selling sample packs, presets, courses, or coaching sessions.
                </p>
                <Button asChild>
                  <Link href="/dashboard/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Product
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-500" />
                Store Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conversion Rate</span>
                  <span className="font-medium">{analytics.conversionRate?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(analytics.conversionRate || 0, 100)} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Rating</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {(stats.averageRating || analytics.avgRating || 0).toFixed(1)}
                  </span>
                </div>
                <Progress
                  value={(stats.averageRating || analytics.avgRating || 0) * 20}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{analytics.totalViews?.toLocaleString() || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPurchases && recentPurchases.length > 0 ? (
                <div className="space-y-3">
                  {recentPurchases.slice(0, 4).map((purchase: any) => (
                    <div key={purchase._id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                        <ShoppingCart className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          New {purchase.productType || "purchase"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${purchase.amount || 0} •{" "}
                          {new Date(purchase._creationTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No recent sales yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/analytics?mode=create">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/emails?mode=create">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Campaigns
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/social?mode=create">
                  <Share2 className="mr-2 h-4 w-4" />
                  Social Posts
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/${stores?.[0]?.slug}/settings`}>
                  <Package className="mr-2 h-4 w-4" />
                  Store Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  color: "green" | "blue" | "purple" | "orange";
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  const colorClasses = {
    green: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClasses[color]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          {trend && trend.direction !== "neutral" && (
            <div
              className={`flex items-center text-xs ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
