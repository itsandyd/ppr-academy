"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponManager } from "@/components/monetization/CouponManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Package, TrendingUp } from "lucide-react";

export default function MonetizationPage() {
  const params = useParams();
  const { user } = useUser();
  const storeId = params.storeId as Id<"stores">;

  const store = useQuery(api.stores.getStoreById, { storeId });
  const coupons = useQuery(api.coupons.getCouponsByStore, { storeId });
  const affiliates = useQuery(api.affiliates.getAffiliatesByStore, { storeId, status: "active" });
  const bundles = useQuery(api.bundles.getBundlesByStore, { storeId, includeUnpublished: true });

  if (!user || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div>
        <h1 className="mb-2 text-4xl font-bold">💰 Monetization</h1>
        <p className="text-muted-foreground">
          Manage coupons, affiliates, bundles, and more to grow your revenue
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons?.filter((c: any) => c.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {coupons?.reduce((sum: number, c: any) => sum + c.currentUses, 0) || 0} total uses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliates?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {affiliates?.reduce((sum: number, a: any) => sum + a.totalSales, 0) || 0} total sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bundles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {bundles?.filter((b: any) => b.isPublished).length || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(
                (affiliates?.reduce((sum: number, a: any) => sum + a.totalRevenue, 0) || 0) / 100
              ).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Generated via affiliates</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different features */}
      <Tabs defaultValue="coupons" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          <CouponManager storeId={storeId} creatorId={user.id} />
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Program</CardTitle>
              <CardDescription>
                Manage affiliates who promote your courses and products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {affiliates && affiliates.length > 0 ? (
                <div className="space-y-4">
                  {affiliates.map((affiliate: any) => (
                    <div
                      key={affiliate._id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">Affiliate Code: {affiliate.affiliateCode}</p>
                        <p className="text-sm text-muted-foreground">
                          {affiliate.totalSales} sales • {affiliate.commissionRate}% commission
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ${((affiliate.totalCommissionEarned || 0) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No active affiliates yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Affiliates will appear here once approved
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course & Product Bundles</CardTitle>
              <CardDescription>
                Package multiple items together at a discounted price
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bundles && bundles.length > 0 ? (
                <div className="space-y-4">
                  {bundles.map((bundle: any) => (
                    <div
                      key={bundle._id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {bundle.courseIds.length} courses • {bundle.productIds.length} products
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(bundle.bundlePrice / 100).toFixed(2)}</p>
                        <p className="text-xs text-green-600">
                          Save ${(bundle.savings / 100).toFixed(2)} ({bundle.discountPercentage}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No bundles created yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create bundles to increase average order value
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>
                Configure your payout schedule and view payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Payout system ready</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect Stripe to enable automated payouts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
