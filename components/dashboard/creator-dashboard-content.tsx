"use client";

import React, { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StoreSetupWizard } from "./store-setup-wizard";
import { StoreSetupWizardEnhanced } from "./store-setup-wizard-enhanced";
import { PostSetupGuidance } from "./post-setup-guidance";
import { GettingStartedModal } from "@/components/onboarding/getting-started-modal";
import { DiscordConnectionCard } from "@/components/discord/DiscordConnectionCard";
import { DiscordStatsWidget } from "@/components/discord/discord-stats-widget";
import { discordConfig } from "@/lib/discord-config";
import { NoProductsEmptyState } from "@/components/ui/empty-state-enhanced";
import { OnboardingHints, creatorOnboardingHints } from "@/components/onboarding/onboarding-hints";
import { MetricCardEnhanced } from "@/components/ui/metric-card-enhanced";
import { AchievementCard, creatorAchievements } from "@/components/gamification/achievement-system";
import { 
  Music, 
  TrendingUp, 
  Download, 
  DollarSign, 
  Star,
  Plus,
  BarChart3,
  Users,
  Package,
  Headphones,
  Play,
  Eye,
  Edit,
  MoreVertical
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CreatorDashboardContent() {
  const { user } = useUser();
  const router = useRouter();

  // First, get the Convex user record from Clerk ID
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Use the Convex user ID for all queries
  const convexUserId = convexUser?._id;

  // Fetch user's stores using Clerk ID (stores are indexed by Clerk ID)
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  
  // Get the first store ID (or use a fallback)
  const storeId = stores?.[0]?._id;

  // Fetch data using Convex user ID
  const allCourses = useQuery(api.courses.getCourses, {});
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByUser,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  // Combine products for unified display
  const products = useMemo(() => {
    // Use userCourses if available, otherwise show all courses for testing
    const coursesToUse = userCourses || allCourses || [];
    const digitalProductsToUse = digitalProducts || [];

    const courseProducts = coursesToUse.map((course: any) => ({
      ...course,
      type: 'course' as const,
      price: course.price || 0,
      downloadCount: 0,
      category: course.category || 'Music Production'
    }));

    const digitalProductItems = digitalProductsToUse.map((product: any) => ({
      ...product,
      type: 'digital' as const,
      downloadCount: (product as any).downloadCount || 0,
      category: (product as any).category || 'Sample Pack'
    }));

    return [...courseProducts, ...digitalProductItems];
  }, [userCourses, allCourses, digitalProducts]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalReleases = products.length;
    const totalDownloads = products.reduce((sum: number, p: any) => sum + (p.downloadCount || 0), 0);
    const totalRevenue = products.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.downloadCount || 0)), 0);
    const avgRating = 4.5; // Mock data for now

    return {
      totalReleases,
      totalDownloads, 
      totalRevenue,
      avgRating
    };
  }, [products]);

  // Quick actions for music creators
  const quickActions = useMemo(() => {
    const baseStoreId = storeId || 'setup';
    return [
      {
        title: "Upload Sample Pack",
        description: "Share your beats and loops",
        icon: Music,
        color: "from-purple-500 to-pink-500",
        href: `/store/${baseStoreId}/products`
      },
      {
        title: "Create Preset",
        description: "Upload synth presets",
        icon: Package,
        color: "from-blue-500 to-cyan-500", 
        href: `/store/${baseStoreId}/products`
      },
      {
        title: "New Course",
        description: "Teach production skills",
        icon: Play,
        color: "from-green-500 to-emerald-500",
        href: `/store/${baseStoreId}/course/create`
      },
      {
        title: "Offer Coaching",
        description: "1-on-1 mentoring",
        icon: Headphones,
        color: "from-orange-500 to-red-500",
        href: `/store/${baseStoreId}/products/coaching-call/create`
      },
      {
        title: "View Analytics",
        description: "Track your performance",
        icon: BarChart3,
        color: "from-indigo-500 to-purple-500",
        href: "/home/analytics"
      }
    ];
  }, [storeId]);

  // Show loading state
  if (!user) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  // Show enhanced store setup wizard if user has no stores
  if (user?.id && stores !== undefined && stores.length === 0) {
    return (
      <StoreSetupWizardEnhanced 
        onStoreCreated={(storeId) => {
          // Navigate to new store's products page
          window.location.href = `/store/${storeId}/products`;
        }} 
      />
    );
  }

  // Show loading state while data is being fetched
  if (user?.id && stores === undefined) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Getting Started Modal for Brand New Users */}
      <GettingStartedModal
        userType="creator"
        onComplete={() => {}}
      />

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0]}! 🎵
            </h1>
            <p className="text-muted-foreground">
              Ready to create some amazing music content today?
            </p>
          </div>
        </div>
      </motion.div>

      {/* Post-Setup Guidance (for new stores) */}
      {products.length === 0 && storeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
        >
          <PostSetupGuidance storeId={storeId} />
        </motion.div>
      )}

      {/* Custom Domain Promotion (if not set up) */}
      {stores?.[0] && !(stores[0] as any).customDomain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <Card className="border-chart-1/20 bg-gradient-to-r from-chart-1/10 via-chart-2/10 to-chart-3/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-chart-1 text-primary-foreground">Pro Feature</Badge>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Use Your Own Domain</h3>
                  <p className="text-muted-foreground mb-4">
                    Point your domain (like beatsbymike.com) to your storefront and build your brand.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-chart-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span>Professional branding</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-chart-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span>SEO benefits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-chart-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span>Full control</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/store/${storeId}/settings/domain`}>
                      <Button className="bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90">
                        Connect Your Domain
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => {
                      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ppr-academy.com';
                      const domain = appUrl.replace('https://', '').replace('http://', '');
                      navigator.clipboard.writeText(`${appUrl}/${stores?.[0]?.slug}`);
                      toast.success(`Copied: ${domain}/${stores?.[0]?.slug}`);
                    }}>
                      Copy Shareable Link
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-3/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-chart-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Custom Domain Active Status (if set up) */}
      {(stores?.[0] as any)?.customDomain && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <Card className="border-chart-2/20 bg-chart-2/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-chart-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <p className="font-medium">Custom Domain Active</p>
                    <p className="text-sm text-muted-foreground">{(stores?.[0] as any)?.customDomain}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${(stores?.[0] as any)?.customDomain}`, '_blank')}
                  >
                    Visit Site
                  </Button>
                  <Link href={`/store/${storeId}/settings/domain`}>
                    <Button variant="ghost" size="sm">
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Onboarding Hints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <OnboardingHints 
          hints={creatorOnboardingHints}
          storageKey="creator-dashboard-hints"
          autoRotate={true}
          rotateInterval={15000}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card 
              key={action.title}
              className="group cursor-pointer hover:shadow-md transition-all duration-200 border-border"
            >
              <Link href={action.href}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm text-foreground group-hover:text-purple-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Metrics Overview - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCardEnhanced
          title="Total Releases"
          value={metrics.totalReleases}
          subtitle={`${metrics.totalReleases} live`}
          icon={Music}
          variant="purple"
          trend={{
            value: 12,
            label: "vs last month",
            direction: "up"
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
            direction: "up"
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
            direction: "up"
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
            direction: "neutral"
          }}
        />
      </motion.div>

      {/* Data Summary for Verification - Only shown in development */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📊 Live Convex Data (Dev Only)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">User ID:</span>
                  <span className="ml-1 font-mono">{convexUserId ? "✅" : "❌"}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Stores:</span>
                  <span className="ml-1 font-mono">{stores?.length || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">My Courses:</span>
                  <span className="ml-1 font-mono">{userCourses?.length || 0}</span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Digital Products:</span>
                  <span className="ml-1 font-mono">{digitalProducts?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Content Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-4">Content Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Music className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Sample Packs</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Presets</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{userCourses?.length || allCourses?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Headphones className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Coaching</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.33 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Achievements</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/achievements">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatorAchievements.slice(0, 3).map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={{
                ...achievement,
                unlocked: achievement.id === 'first-product' // Demo: First achievement unlocked
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Discord Community with Live Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h2 className="text-lg font-semibold mb-4">Community</h2>
        <DiscordStatsWidget inviteUrl={discordConfig.inviteUrl} />
      </motion.div>

      {/* Recent Products */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Releases</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/store/${storeId || 'setup'}/products`}>View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {products.slice(0, 3).map((product: any) => (
              <Card key={product._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.type === 'course' ? (
                        <Play className="w-6 h-6 text-white" />
                      ) : (
                        <Music className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {product.type === 'course' ? 'Course' : 'Digital Product'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ${product.price || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {product.downloadCount || 0} downloads
                      </span>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <NoProductsEmptyState storeId={storeId} />
        </motion.div>
      )}
    </div>
  );
}
