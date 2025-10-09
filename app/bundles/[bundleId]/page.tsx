"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Package, TrendingDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BundleDetailsPage() {
  const params = useParams();
  const bundleId = params.bundleId as Id<"bundles">;

  const bundleDetails = useQuery(api.bundles.getBundleDetails, { bundleId });

  if (!bundleDetails) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p>Loading bundle...</p>
      </div>
    );
  }

  const { courses, products, ...bundle } = bundleDetails;

  return (
    <div className="container mx-auto py-16 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Package className="w-3 h-3 mr-1" />
              Bundle Deal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">{bundle.name}</h1>
            <p className="text-xl text-muted-foreground">{bundle.description}</p>
          </div>

          {bundle.imageUrl && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={bundle.imageUrl}
                alt={bundle.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Included Courses */}
          {courses && courses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📚 Included Courses</h2>
              <div className="space-y-4">
                {courses.map((course: any) => (
                  <Card key={course._id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{course.title}</span>
                        <Badge variant="outline">
                          ${((course.price || 0) / 100).toFixed(2)}
                        </Badge>
                      </CardTitle>
                      {course.description && (
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Included Products */}
          {products && products.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🎁 Included Products</h2>
              <div className="space-y-4">
                {products.map((product: any) => (
                  <Card key={product._id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{product.name}</span>
                        <Badge variant="outline">
                          ${((product.price || 0) / 100).toFixed(2)}
                        </Badge>
                      </CardTitle>
                      {product.description && (
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* What's Included */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle>✨ What You'll Get</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Instant access to all {courses?.length || 0} courses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>All {products?.length || 0} digital products included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Save ${(bundle.savings / 100).toFixed(2)} compared to buying separately</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Lifetime access to all content</span>
                </li>
                {bundle.maxPurchases && (
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Limited to {bundle.maxPurchases} purchases - {bundle.totalPurchases} sold</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Purchase Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Bundle Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    ${(bundle.bundlePrice / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground line-through">
                  <span>${(bundle.originalPrice / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <TrendingDown className="w-4 h-4" />
                  <span>Save ${(bundle.savings / 100).toFixed(2)} ({bundle.discountPercentage}%)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  Buy Bundle Now
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  30-day money-back guarantee
                </p>
              </div>

              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courses:</span>
                  <span className="font-medium">{courses?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-medium">{products?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-medium">${(bundle.originalPrice / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-green-600">
                  <span>You Save:</span>
                  <span>${(bundle.savings / 100).toFixed(2)}</span>
                </div>
              </div>

              {bundle.totalPurchases > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-center text-muted-foreground">
                    {bundle.totalPurchases} {bundle.totalPurchases === 1 ? "person has" : "people have"} purchased this bundle
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}





