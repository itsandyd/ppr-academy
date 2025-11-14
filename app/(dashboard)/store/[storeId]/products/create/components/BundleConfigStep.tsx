"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, Percent, X, Info } from "lucide-react";
import { BundleConfig } from "../types";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge as CategoryBadge } from "@/components/ui/badge";

interface BundleConfigStepProps {
  config?: BundleConfig;
  onConfigChange: (config: BundleConfig) => void;
  onContinue: () => void;
  onBack: () => void;
  storeId: string;
  userId: string;
}

export function BundleConfigStep({
  config,
  onConfigChange,
  onContinue,
  onBack,
  storeId,
  userId,
}: BundleConfigStepProps) {
  // Get user's existing digital products
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const digitalProducts: any = useQuery(api.digitalProducts.getProductsByStore, { storeId });
  
  // Get store's courses (courses are stored by storeId)
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storeCourses: any = useQuery(api.courses.getCoursesByStore, { storeId });
  
  // Combine all products
  const allProducts = [
    ...(digitalProducts || []).filter((p: any) => p.productCategory !== "bundle"), // Don't bundle bundles
    ...(storeCourses || []).map((c: any) => ({
      ...c,
      _id: c._id,
      title: c.title,
      productCategory: "course",
      imageUrl: c.imageUrl,
      price: c.price || 0,
    })),
  ].filter(p => p.isPublished !== false); // Only show published products or drafts

  const handleUpdate = (field: keyof BundleConfig, value: any) => {
    onConfigChange({
      includedProductIds: config?.includedProductIds || [],
      ...config,
      [field]: value,
    });
  };

  const toggleProduct = (productId: string) => {
    const currentIds = config?.includedProductIds || [];
    if (currentIds.includes(productId)) {
      handleUpdate("includedProductIds", currentIds.filter(id => id !== productId));
    } else {
      handleUpdate("includedProductIds", [...currentIds, productId]);
    }
  };

  const selectedProducts = allProducts?.filter((p: any) => 
    config?.includedProductIds?.includes(p._id)
  ) || [];

  const totalValue = selectedProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
  const bundlePrice = config?.bundleDiscount 
    ? totalValue * (1 - config.bundleDiscount / 100)
    : totalValue;

  const canProceed = (config?.includedProductIds?.length || 0) >= 2;
  
  const loading = digitalProducts === undefined || storeCourses === undefined;
  
  // Debug: log what we have
  if (!loading && allProducts) {
    console.log("Bundle: Available products to bundle:", allProducts.length);
    console.log("Bundle: Digital products:", digitalProducts?.length || 0);
    console.log("Bundle: Courses:", storeCourses?.length || 0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bundle Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Combine any products into a discounted bundle (courses, packs, coaching sessions, etc.)
        </p>
      </div>

      {/* Bundle Ideas */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <p className="font-medium text-purple-900 dark:text-purple-100 mb-2">
            💡 Popular Bundle Ideas:
          </p>
          <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
            <li>• <strong>Starter Kit:</strong> Course + Sample Pack + Preset Pack</li>
            <li>• <strong>Production Bundle:</strong> Multiple sample/preset packs together</li>
            <li>• <strong>VIP Package:</strong> Course + 1:1 Coaching Session</li>
            <li>• <strong>Complete Package:</strong> Mix any products for maximum value</li>
          </ul>
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Products to Bundle (minimum 2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading your products...
            </div>
          ) : !allProducts || allProducts.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You need to create at least 2 products before you can create a bundle. 
                Try creating courses, sample packs, coaching sessions, or other products first!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allProducts.map((product: any) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={product._id}
                    checked={config?.includedProductIds?.includes(product._id)}
                    onCheckedChange={() => toggleProduct(product._id)}
                  />
                  <label
                    htmlFor={product._id}
                    className="flex-1 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground capitalize">
                            {product.productCategory?.replace("-", " ")}
                          </p>
                          {product.productCategory === "course" && (
                            <CategoryBadge variant="secondary" className="text-xs">Course</CategoryBadge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">${product.price || 0}</Badge>
                  </label>
                </div>
              ))}
            </div>
          )}

          {selectedProducts.length >= 2 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium">${totalValue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bundle Pricing */}
      {selectedProducts.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Bundle Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Bundle Discount (%)</Label>
              <div className="flex gap-2 items-center">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="10"
                  value={config?.bundleDiscount || ""}
                  onChange={(e) => handleUpdate("bundleDiscount", parseFloat(e.target.value))}
                  className="bg-background"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: 10-20% discount for bundles
              </p>
            </div>

            {config?.bundleDiscount && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Bundle Price
                    </p>
                    <p className="text-xs text-green-800 dark:text-green-200">
                      {config.bundleDiscount}% off • Save ${(totalValue - bundlePrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${bundlePrice.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bundleDescription">What's Included (Optional)</Label>
              <Textarea
                id="bundleDescription"
                placeholder="Describe what's in this bundle and why it's a great deal..."
                value={config?.bundleDescription || ""}
                onChange={(e) => handleUpdate("bundleDescription", e.target.value)}
                className="min-h-[100px] bg-background"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onContinue} disabled={!canProceed}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

