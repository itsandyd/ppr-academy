"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Book, Download, Calendar, Search, ExternalLink, Layers } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function LibraryBundlesPage() {
  const { user } = useUser();

  const bundles = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  )?.filter((p: any) => p.productType === "bundle");

  const stats = {
    total: bundles?.length || 0,
    totalValue: bundles?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Bundles</h1>
        <p className="mt-2 text-muted-foreground">Access your product bundles and collections</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Bundles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {bundles?.reduce(
                (sum: number, b: any) => sum + (b.productTitle?.split(",").length || 1),
                0
              ) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Bundles List */}
      {bundles && bundles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {bundles.map((bundle: any) => (
            <Card key={bundle._id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bundle.productTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">by {bundle.storeName}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    Bundle
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {bundle.productDescription && (
                  <p className="text-sm text-muted-foreground">{bundle.productDescription}</p>
                )}

                {/* Bundle Contents (placeholder) */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Bundle Contents:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2 rounded bg-background p-2">
                      <Book className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Advanced Music Production Course</span>
                    </div>
                    <div className="flex items-center space-x-2 rounded bg-background p-2">
                      <Download className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Sample Pack Collection (50+ samples)</span>
                    </div>
                    <div className="flex items-center space-x-2 rounded bg-background p-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">1-on-1 Coaching Session</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="text-sm text-muted-foreground">
                    Purchased{" "}
                    {formatDistanceToNow(new Date(bundle._creationTime), { addSuffix: true })}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    ${bundle.amount.toFixed(2)}
                  </div>
                </div>

                <Button className="w-full">
                  <Layers className="mr-2 h-4 w-4" />
                  Access Bundle Contents
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">No bundles yet</h2>
            <p className="mb-6 text-muted-foreground">
              Purchase product bundles to get multiple items at a discounted price
            </p>
            <Button asChild>
              <Link href="/courses">
                <Search className="mr-2 h-4 w-4" />
                Browse Bundles
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bundle Benefits Info */}
      <Card>
        <CardHeader>
          <CardTitle>Why Bundles?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 font-medium text-foreground">Better Value</h3>
              <p className="text-sm text-muted-foreground">
                Get multiple products at a discounted price
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 font-medium text-foreground">Complete Learning</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive packages for complete skill development
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <ExternalLink className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 font-medium text-foreground">Easy Access</h3>
              <p className="text-sm text-muted-foreground">
                All related content in one convenient package
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
