"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  DollarSign,
  Percent,
  ArrowRight,
  ArrowDown,
  Activity,
  Tag,
  Clock,
  Mail,
  RefreshCw,
  Target,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const FUNNEL_COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

export default function AdminConversionsPage() {
  const { user } = useUser();

  // Fetch conversion data
  const purchaseFunnel = useQuery(
    api.adminConversion.getPurchaseFunnel,
    user?.id ? { clerkId: user.id, days: 30 } : "skip"
  );
  const conversionMetrics = useQuery(
    api.adminConversion.getConversionMetrics,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const abandonedCarts = useQuery(
    api.adminConversion.getAbandonedCarts,
    user?.id ? { clerkId: user.id, days: 30 } : "skip"
  );
  const couponPerformance = useQuery(
    api.adminConversion.getCouponPerformance,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const conversionBySource = useQuery(
    api.adminConversion.getConversionBySource,
    user?.id ? { clerkId: user.id, days: 30 } : "skip"
  );

  if (!purchaseFunnel || !conversionMetrics || !abandonedCarts || !couponPerformance) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Loading conversion data...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Conversion Optimization</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Track funnels, recover abandoned carts, and optimize conversions
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{conversionMetrics.overallConversion.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Overall Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{formatCurrency(conversionMetrics.averageOrderValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <ShoppingCart className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{conversionMetrics.cartAbandonmentRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Cart Abandonment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <RefreshCw className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{conversionMetrics.repeatPurchaseRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Repeat Purchase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Funnel */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="h-5 w-5" />
            Purchase Funnel (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            {purchaseFunnel.steps.map((step, index) => (
              <div key={step.name} className="flex flex-1 items-center">
                {/* Step */}
                <div className="flex-1">
                  <div
                    className="relative mx-auto flex flex-col items-center"
                    style={{ maxWidth: "150px" }}
                  >
                    <div
                      className={cn(
                        "flex h-20 w-full items-center justify-center rounded-lg text-white",
                        index === 0
                          ? "bg-purple-600"
                          : index === 1
                            ? "bg-purple-500"
                            : index === 2
                              ? "bg-purple-400"
                              : index === 3
                                ? "bg-purple-300 text-purple-900"
                                : "bg-purple-200 text-purple-900"
                      )}
                      style={{
                        clipPath: "polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)",
                      }}
                    >
                      <div className="text-center">
                        <p className="text-2xl font-bold">{step.count.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-sm font-medium">{step.name}</p>
                    <p className="text-center text-xs text-muted-foreground">
                      {step.conversionRate.toFixed(1)}% rate
                    </p>
                  </div>
                </div>

                {/* Arrow with drop-off */}
                {index < purchaseFunnel.steps.length - 1 && (
                  <div className="flex flex-col items-center px-2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-red-500">
                      -{purchaseFunnel.steps[index + 1].dropOffRate.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overall Funnel Conversion</p>
                <p className="text-2xl font-bold text-purple-600">
                  {purchaseFunnel.overallConversion.toFixed(2)}%
                </p>
              </div>
              <Badge variant="outline" className="text-lg">
                {purchaseFunnel.steps[0]?.count || 0} → {purchaseFunnel.steps[purchaseFunnel.steps.length - 1]?.count || 0}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="abandoned" className="space-y-6">
        <TabsList className="grid h-12 w-full grid-cols-3 p-1">
          <TabsTrigger value="abandoned" className="gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Abandoned Carts
            {abandonedCarts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {abandonedCarts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2 text-base">
            <Tag className="h-4 w-4" />
            Coupon Performance
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2 text-base">
            <PieChart className="h-4 w-4" />
            Traffic Sources
          </TabsTrigger>
        </TabsList>

        {/* Abandoned Carts Tab */}
        <TabsContent value="abandoned">
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-orange-900 dark:text-orange-300">
                  <ShoppingCart className="h-5 w-5" />
                  Abandoned Carts & Failed Purchases
                </CardTitle>
                <Badge variant="secondary">{abandonedCarts.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {abandonedCarts.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="font-semibold">No abandoned carts!</p>
                  <p className="text-sm text-muted-foreground">All recent checkouts completed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {abandonedCarts.slice(0, 10).map((cart, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{cart.userName || "Anonymous"}</p>
                          <Badge variant="outline" className="text-xs">
                            {cart.productType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{cart.userEmail || "No email"}</p>
                        <p className="mt-1 text-sm">{cart.productName}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(cart.amount)}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {cart.daysSinceAbandoned}d ago
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Mail className="h-4 w-4" />
                          Recover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Coupon Stats */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Coupon Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold">{couponPerformance.totalCoupons}</p>
                    <p className="text-sm text-muted-foreground">Total Coupons</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold text-green-600">{couponPerformance.activeCoupons}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold">{couponPerformance.totalUsages}</p>
                    <p className="text-sm text-muted-foreground">Total Uses</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(couponPerformance.totalDiscountGiven)}
                    </p>
                    <p className="text-sm text-muted-foreground">Discounts Given</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="mb-3 font-semibold">Top Performing Coupons</h4>
                  <div className="space-y-2">
                    {couponPerformance.topCoupons.slice(0, 5).map((coupon) => (
                      <div
                        key={coupon.code}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={coupon.isActive ? "default" : "secondary"}>
                            {coupon.code}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {coupon.usageCount} uses
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(coupon.discountGiven)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Coupon Usage */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Recent Coupon Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {couponPerformance.recentUsages.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No recent coupon usage</p>
                  ) : (
                    couponPerformance.recentUsages.map((usage, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{usage.code}</Badge>
                            <span className="text-sm">{usage.userName || "Anonymous"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(usage.usedAt)}</p>
                        </div>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(usage.discountApplied)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Sources Tab */}
        <TabsContent value="sources">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Conversion by Traffic Source</CardTitle>
            </CardHeader>
            <CardContent>
              {!conversionBySource || conversionBySource.length === 0 ? (
                <div className="py-8 text-center">
                  <PieChart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="font-semibold">No traffic source data</p>
                  <p className="text-sm text-muted-foreground">
                    Analytics events with UTM parameters will appear here
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionBySource}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === "revenue" ? formatCurrency(value) : value
                        }
                      />
                      <Bar dataKey="visitors" fill="#8b5cf6" name="Visitors" />
                      <Bar dataKey="purchases" fill="#10b981" name="Purchases" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-2">
                    {conversionBySource.map((source) => (
                      <div
                        key={source.source}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{source.source}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.visitors} visitors → {source.purchases} purchases
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(source.revenue)}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.conversionRate.toFixed(1)}% conv
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
