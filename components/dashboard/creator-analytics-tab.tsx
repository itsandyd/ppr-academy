"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingCart,
  Users,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  if (seconds < 172800) return "yesterday";
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

const productTypeLabels: Record<string, string> = {
  course: "Course",
  digitalProduct: "Digital Product",
  coaching: "Coaching",
  bundle: "Bundle",
  beatLease: "Beat Lease",
};

interface CreatorAnalyticsTabProps {
  storeId: string;
  storeSlug?: string;
}

export function CreatorAnalyticsTab({
  storeId,
  storeSlug,
}: CreatorAnalyticsTabProps) {
  const analytics = useQuery(api.purchases.getCreatorDashboardAnalytics, {
    storeId,
  });

  if (analytics === undefined) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-1 h-8 w-28" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalSales}
            </div>
            <p className="text-xs text-muted-foreground">Completed purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalEnrollments}
            </div>
            <p className="text-xs text-muted-foreground">
              Course enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue This Month
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(analytics.monthRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current calendar month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.recentSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4 text-right">Amount</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {analytics.recentSales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="border-b last:border-b-0"
                    >
                      <td className="py-3 pr-4">
                        <span className="font-medium">
                          {sale.productTitle}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {productTypeLabels[sale.productType] ||
                          sale.productType}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatRelativeTime(sale._creationTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 font-semibold">No sales yet</h3>
              <p className="text-sm text-muted-foreground">
                Share your storefront to get started.
                {storeSlug && (
                  <>
                    {" "}
                    <Link
                      href={`/${storeSlug}`}
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      View your storefront
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
