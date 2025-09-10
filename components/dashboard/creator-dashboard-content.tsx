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

  // Fetch user's stores using Convex user ID
  const stores = useQuery(
    api.stores.getStoresByUser,
    convexUserId ? { userId: convexUserId } : "skip"
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

  // Debug logging
  React.useEffect(() => {
    console.log("🔍 Dashboard Debug Info:", {
      clerkUserId: user?.id,
      convexUser: convexUser,
      convexUserId: convexUserId,
      stores: stores?.length,
      storeId,
      allCourses: allCourses?.length,
      userCourses: userCourses?.length,
      digitalProducts: digitalProducts?.length,
    });
  }, [user, convexUser, convexUserId, stores, allCourses, userCourses, digitalProducts, storeId]);

  // Combine products for unified display
  const products = useMemo(() => {
    // Use userCourses if available, otherwise show all courses for testing
    const coursesToUse = userCourses || allCourses || [];
    const digitalProductsToUse = digitalProducts || [];
    
    console.log("🎯 Products Debug:", {
      coursesToUse: coursesToUse.length,
      digitalProductsToUse: digitalProductsToUse.length
    });
    
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
      }
    ];
  }, [storeId]);

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

  return (
    <div className="space-y-8">
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

      {/* Metrics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Releases</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalReleases}</p>
                <p className="text-xs text-muted-foreground">3 live</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalDownloads}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-foreground">${metrics.totalRevenue}</p>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">{metrics.avgRating}</p>
                <p className="text-xs text-muted-foreground">0 reviews</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Summary for Verification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📊 Live Convex Data</h3>
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
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to share your music?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start by uploading your first sample pack, preset collection, or creating a music production course.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href={`/store/${storeId || 'setup'}/products`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Product
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/store/${storeId || 'setup'}/course/create`}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Course
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
