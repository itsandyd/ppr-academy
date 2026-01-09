"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();

  // Get user's store
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get store stats
  const storeStats = useQuery(
    api.storeStats.getStoreStats,
    store?._id ? { storeId: store._id } : "skip"
  );

  // Get purchase stats with time ranges
  const purchaseStats30d = useQuery(
    api.purchases.getStorePurchaseStats,
    store?._id ? { storeId: store._id, timeRange: "30d" as const } : "skip"
  );

  const purchaseStatsAll = useQuery(
    api.purchases.getStorePurchaseStats,
    store?._id ? { storeId: store._id, timeRange: "all" as const } : "skip"
  );

  // Get recent purchases
  const recentPurchases = useQuery(
    api.purchases.getStorePurchases,
    store?._id ? { storeId: store._id, limit: 10 } : "skip"
  );

  // Loading state
  if (!isLoaded || store === undefined) {
    return (
      <div className="container mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // No store yet
  if (!store) {
    return (
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">Analytics</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">Track your performance and growth</p>
        </div>
        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                Set up your store to start tracking analytics
              </p>
            </div>
          </CardContent>
        </Card>
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

  const stats30d = purchaseStats30d || {
    totalPurchases: 0,
    completedPurchases: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  };

  const statsAll = purchaseStatsAll || {
    totalPurchases: 0,
    completedPurchases: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">Analytics</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">Track your performance and growth</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statsAll.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500">
              ${stats30d.totalRevenue.toFixed(2)} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.followerCount}</div>
            <p className="text-xs text-zinc-500">
              {stats.totalEnrollments} course enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsAll.completedPurchases}</div>
            <p className="text-xs text-zinc-500">
              {stats30d.completedPurchases} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${statsAll.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-zinc-500">
              Across all purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{stats.paidProducts} paid</Badge>
              <Badge variant="outline">{stats.freeProducts} free</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-zinc-500 mt-2">
              {stats.totalEnrollments} total enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-zinc-500 mt-2">
              Digital product purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>
            Your latest sales and enrollments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPurchases && recentPurchases.length > 0 ? (
            <div className="space-y-4">
              {recentPurchases.map((purchase: any) => (
                <div
                  key={purchase._id}
                  className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {purchase.buyerName?.[0]?.toUpperCase() || purchase.buyerEmail?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {purchase.buyerName || purchase.buyerEmail || "Anonymous"}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {purchase.productTitle || "Unknown product"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      +${purchase.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(purchase._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                  No purchases yet. Share your products to start selling!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
