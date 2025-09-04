"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Book,
  Download,
  Calendar,
  Search,
  ExternalLink,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function LibraryBundlesPage() {
  const { user } = useUser();
  
  const bundles = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  )?.filter(p => p.productType === "bundle");

  const stats = {
    total: bundles?.length || 0,
    totalValue: bundles?.reduce((sum, b) => sum + b.amount, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Bundles</h1>
        <p className="text-muted-foreground mt-2">
          Access your product bundles and collections
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {bundles?.reduce((sum, b) => sum + (b.productTitle?.split(",").length || 1), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
      </div>

      {/* Bundles List */}
      {bundles && bundles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bundles.map((bundle) => (
            <Card key={bundle._id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bundle.productTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {bundle.storeName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    Bundle
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {bundle.productDescription && (
                  <p className="text-sm text-muted-foreground">
                    {bundle.productDescription}
                  </p>
                )}

                {/* Bundle Contents (placeholder) */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-foreground">Bundle Contents:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2 p-2 bg-background rounded">
                      <Book className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Advanced Music Production Course</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-background rounded">
                      <Download className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Sample Pack Collection (50+ samples)</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-background rounded">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">1-on-1 Coaching Session</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Purchased {formatDistanceToNow(new Date(bundle._creationTime), { addSuffix: true })}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    ${bundle.amount.toFixed(2)}
                  </div>
                </div>

                <Button className="w-full">
                  <Layers className="w-4 h-4 mr-2" />
                  Access Bundle Contents
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No bundles yet</h2>
            <p className="text-muted-foreground mb-6">
              Purchase product bundles to get multiple items at a discounted price
            </p>
            <Button asChild>
              <Link href="/courses">
                <Search className="w-4 h-4 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Better Value</h3>
              <p className="text-sm text-muted-foreground">
                Get multiple products at a discounted price
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Complete Learning</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive packages for complete skill development
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Easy Access</h3>
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
