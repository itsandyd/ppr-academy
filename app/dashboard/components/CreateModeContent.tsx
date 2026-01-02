"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCardEnhanced } from "@/components/ui/metric-card-enhanced";
import { PostSetupGuidance } from "@/components/dashboard/post-setup-guidance";
import { OnboardingHints, creatorOnboardingHints } from "@/components/onboarding/onboarding-hints";
import { AchievementCard, creatorAchievements } from "@/components/gamification/achievement-system";
import { DiscordStatsWidget } from "@/components/discord/discord-stats-widget";
import { discordConfig } from "@/lib/discord-config";
import { NoProductsEmptyState } from "@/components/ui/empty-state-enhanced";
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
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

export function CreateModeContent() {
  const { user } = useUser();
  const router = useRouter();

  // Get Convex user
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // Get user's stores
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const storeId = stores?.[0]?._id;

  // Fetch created courses (using clerkId)
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch digital products (using storeId)
  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : "skip"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const copyrightClaims = useQuery(
    (api as any).copyright.getStoreCopyrightClaims,
    storeId ? { storeId } : "skip"
  ) as Array<{ status: string }> | undefined;

  const pendingClaimsCount = copyrightClaims?.filter((c) => c.status === "pending").length || 0;

  // Combine products for unified display
  const products = useMemo(() => {
    const coursesToUse = userCourses || [];
    const digitalProductsToUse = digitalProducts || [];

    const courseProducts = coursesToUse.map((course: any) => ({
      ...course,
      type: "course" as const,
      price: course.price || 0,
      downloadCount: 0,
      category: course.category || "Music Production",
    }));

    const digitalProductItems = digitalProductsToUse.map((product: any) => ({
      ...product,
      type: "digital" as const,
      downloadCount: (product as any).downloadCount || 0,
      category: (product as any).category || "Sample Pack",
    }));

    return [...courseProducts, ...digitalProductItems];
  }, [userCourses, digitalProducts]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalReleases = products.length;
    const totalDownloads = products.reduce(
      (sum: number, p: any) => sum + (p.downloadCount || 0),
      0
    );
    const totalRevenue = products.reduce(
      (sum: number, p: any) => sum + (p.price || 0) * (p.downloadCount || 0),
      0
    );
    const avgRating = 4.5;

    return {
      totalReleases,
      totalDownloads,
      totalRevenue,
      avgRating,
    };
  }, [products]);

  // Quick actions for music creators
  const quickActions = useMemo(() => {
    const baseStoreId = storeId || "setup";
    return [
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
      {
        title: "View Analytics",
        description: "Track your performance",
        icon: BarChart3,
        color: "from-indigo-500 to-purple-500",
        href: `/store/${baseStoreId}/analytics`,
      },
      {
        title: "Lead Magnet Ideas",
        description: "Generate visual ideas",
        icon: Star,
        color: "from-amber-500 to-yellow-500",
        href: `/dashboard/lead-magnet-ideas`,
      },
    ];
  }, [storeId]);

  const isLoading = !user || convexUser === undefined || stores === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  // Show store setup wizard if user has no stores
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
          onStoreCreated={(storeId) => {
            // Refresh the page to show the new store
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const allProducts = products;
  const publishedCount = allProducts.filter((p: any) => p.isPublished).length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back,{" "}
              {user.firstName || user.primaryEmailAddress?.emailAddress?.split("@")[0]}! 🎵
            </h1>
            <p className="text-muted-foreground">
              Ready to create some amazing music content today?
            </p>
          </div>
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
              You have {pendingClaimsCount} pending copyright claim
              {pendingClaimsCount > 1 ? "s" : ""} that require{pendingClaimsCount === 1 ? "s" : ""}{" "}
              your attention.
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="ml-4 border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/40"
            >
              <Link href="/dashboard/copyright">Review Claims</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Post-Setup Guidance (for new stores) */}
      {products.length === 0 && storeId && <PostSetupGuidance storeId={storeId} />}

      {/* Custom Domain Promotion (if not set up) */}
      {stores?.[0] && !(stores[0] as any).customDomain && (
        <Card className="border-chart-1/20 bg-gradient-to-r from-chart-1/10 via-chart-2/10 to-chart-3/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="bg-chart-1 text-primary-foreground">Pro Feature</Badge>
                </div>
                <h3 className="mb-2 text-lg font-bold">Use Your Own Domain</h3>
                <p className="mb-4 text-muted-foreground">
                  Point your domain (like beatsbymike.com) to your storefront and build your brand.
                </p>
                <div className="flex gap-3">
                  <Link href={`/store/${storeId}/settings/domain`}>
                    <Button className="bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90">
                      Connect Your Domain
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppr-academy.com";
                      const domain = appUrl.replace("https://", "").replace("http://", "");
                      navigator.clipboard.writeText(`${appUrl}/${stores?.[0]?.slug}`);
                      toast.success(`Copied: ${domain}/${stores?.[0]?.slug}`);
                    }}
                  >
                    Copy Shareable Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Hints */}
      <OnboardingHints
        hints={creatorOnboardingHints}
        storageKey="creator-dashboard-hints"
        autoRotate={true}
        rotateInterval={15000}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="group cursor-pointer border-border transition-all duration-200 hover:shadow-md"
            >
              <Link href={action.href}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg bg-gradient-to-r ${action.color} flex flex-shrink-0 items-center justify-center`}
                    >
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-purple-600">
                        {action.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Metrics Overview - Enhanced */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardEnhanced
          title="Total Releases"
          value={metrics.totalReleases}
          subtitle={`${publishedCount} live`}
          icon={Music}
          variant="purple"
          trend={{
            value: 12,
            label: "vs last month",
            direction: "up",
          }}
          sparklineData={[2, 3, 3, 5, 6, 8, 10]}
        />

        <MetricCardEnhanced
          title="Total Downloads"
          value={metrics.totalDownloads}
          subtitle="All time"
          icon={Download}
          variant="blue"
          trend={{
            value: 8,
            label: "vs last month",
            direction: "up",
          }}
          sparklineData={[10, 15, 12, 20, 25, 30, 35]}
        />

        <MetricCardEnhanced
          title="Revenue"
          value={`$${metrics.totalRevenue}`}
          subtitle="Lifetime earnings"
          icon={DollarSign}
          variant="green"
          trend={{
            value: 15,
            label: "vs last month",
            direction: "up",
          }}
          sparklineData={[100, 150, 120, 200, 250, 300, 350]}
        />

        <MetricCardEnhanced
          title="Avg Rating"
          value={metrics.avgRating}
          subtitle="0 reviews"
          icon={Star}
          variant="orange"
          trend={{
            value: 0,
            label: "No change",
            direction: "neutral",
          }}
        />
      </div>

      {/* Content Breakdown */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Content Breakdown</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Music className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {digitalProducts?.filter((p: any) => p.productCategory === "sample-pack").length ||
                  0}
              </p>
              <p className="text-sm text-muted-foreground">Sample Packs</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {digitalProducts?.filter((p: any) => p.productCategory === "preset-pack").length ||
                  0}
              </p>
              <p className="text-sm text-muted-foreground">Presets</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{userCourses?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Headphones className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {digitalProducts?.filter((p: any) => p.productCategory === "coaching").length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Coaching</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Achievements</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/achievements">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creatorAchievements.slice(0, 3).map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={{
                ...achievement,
                unlocked: achievement.id === "first-product",
              }}
            />
          ))}
        </div>
      </div>

      {/* Discord Community */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Community</h2>
        <DiscordStatsWidget inviteUrl={discordConfig.inviteUrl} />
      </div>

      {/* Recent Products */}
      {products.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Releases</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/store/${storeId || "setup"}/products`}>View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {products.slice(0, 3).map((product: any) => (
              <Card key={product._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      {product.type === "course" ? (
                        <Play className="h-6 w-6 text-white" />
                      ) : (
                        <Music className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground">{product.title}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {product.type === "course" ? "Course" : "Digital Product"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">${product.price || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {product.downloadCount || 0} downloads
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && <NoProductsEmptyState storeId={storeId} />}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
