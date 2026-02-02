"use client";

import { useBundleCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Sparkles, Package, Gift } from "lucide-react";
import { useEffect } from "react";

export function BundlePricingForm() {
  const { state, updateData, saveBundle, createBundle, canPublish } = useBundleCreation();
  const router = useRouter();

  const originalPrice = parseFloat(state.data.originalPrice || "0");
  const bundlePrice = parseFloat(state.data.price || "0");
  const savings = originalPrice - bundlePrice;
  const discountPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  useEffect(() => {
    if (originalPrice > 0 && !state.data.price) {
      const suggestedPrice = Math.floor(originalPrice * 0.75 * 100) / 100;
      updateData("pricing", { price: suggestedPrice.toString() });
    }
  }, [originalPrice]);

  const handlePriceChange = (value: string) => {
    updateData("pricing", { price: value });
  };

  const applySuggestedDiscount = (percent: number) => {
    const newPrice = Math.floor(originalPrice * (1 - percent / 100) * 100) / 100;
    updateData("pricing", { price: newPrice.toString() });
  };

  const handleBack = () => {
    router.push(
      `/dashboard/create/bundle?step=products${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const handlePublish = async () => {
    await saveBundle();
    const result = await createBundle();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    }
  };

  const handleContinueToFollowGate = async () => {
    await saveBundle();
    router.push(
      `/dashboard/create/bundle?step=followGate${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const makeFree = () => {
    updateData("pricing", { price: "0" });
  };

  const isFreeBundle = bundlePrice === 0;
  const canProceed = isFreeBundle || (bundlePrice > 0 && bundlePrice < originalPrice);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set Bundle Price</h2>
        <p className="mt-1 text-muted-foreground">
          Price your bundle at a discount to incentivize purchases
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bundle Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Products included</span>
              <span className="font-medium">{state.data.products?.length || 0} items</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Combined retail value</span>
              <span className="font-medium">${originalPrice.toFixed(2)}</span>
            </div>
            {state.data.products && state.data.products.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <div className="space-y-1">
                  {state.data.products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{p.title}</span>
                      <span>${p.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bundle Price</CardTitle>
          <CardDescription>
            Set a price lower than the combined value to offer savings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price">Your Bundle Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={state.data.price || ""}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="bg-background pl-7 text-lg font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Quick Discount Options</Label>
            <div className="flex flex-wrap gap-2">
              {[10, 15, 20, 25, 30].map((percent) => (
                <Button
                  key={percent}
                  variant={discountPercentage === percent ? "default" : "outline"}
                  size="sm"
                  onClick={() => applySuggestedDiscount(percent)}
                >
                  {percent}% off
                </Button>
              ))}
              <Button
                variant={isFreeBundle ? "default" : "outline"}
                size="sm"
                onClick={makeFree}
                className="gap-1"
              >
                <Gift className="h-3 w-3" />
                Free
              </Button>
            </div>
          </div>

          {bundlePrice > 0 && (
            <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Customer Savings Preview
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">${savings.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Saved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{discountPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Discount</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">${bundlePrice.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Bundle Price</p>
                </div>
              </div>
            </div>
          )}

          {bundlePrice >= originalPrice && bundlePrice > 0 && (
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Bundle price should be less than the combined value (${originalPrice.toFixed(2)}) to
                offer customers a discount.
              </p>
            </div>
          )}

          {isFreeBundle && (
            <div className="rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 p-4 dark:from-orange-950/20 dark:to-amber-950/20">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-700 dark:text-orange-400">
                  Free Bundle with Download Gate
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Users will need to enter their email (and optionally follow your social accounts)
                to download this bundle. Great for building your audience!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Savings Badge</Label>
              <p className="text-sm text-muted-foreground">
                Display the discount percentage on your bundle
              </p>
            </div>
            <Switch
              checked={state.data.showSavings ?? true}
              onCheckedChange={(checked) => updateData("pricing", { showSavings: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        {isFreeBundle ? (
          <Button
            onClick={handleContinueToFollowGate}
            disabled={!canProceed}
            size="lg"
            className="gap-2"
          >
            Configure Download Gate
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            disabled={!canProceed || !canPublish()}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Publish Bundle
          </Button>
        )}
      </div>
    </div>
  );
}
