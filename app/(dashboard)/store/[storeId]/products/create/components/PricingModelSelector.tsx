"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingModel, ProductCategory } from "../types";
import { Gift, DollarSign, Check } from "lucide-react";

interface PricingModelSelectorProps {
  productCategory: ProductCategory;
  pricingModel: PricingModel;
  price: number;
  onPricingModelChange: (model: PricingModel) => void;
  onPriceChange: (price: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PricingModelSelector({
  productCategory,
  pricingModel,
  price,
  onPricingModelChange,
  onPriceChange,
  onContinue,
  onBack,
}: PricingModelSelectorProps) {
  // Some product types can't be free with gate
  const canBeFree = !["coaching", "course", "workshop", "mixing-service", "mastering-service"].includes(productCategory);
  
  // Tip jars are special - they're "pay what you want"
  const isTipJar = productCategory === "tip-jar" || productCategory === "donation";

  const handlePricingChange = (value: string) => {
    const model = value as PricingModel;
    onPricingModelChange(model);
    
    // Auto-set price based on model
    if (model === "free_with_gate") {
      onPriceChange(0);
    } else if (price === 0) {
      onPriceChange(10); // Default paid price
    }
  };

  const isValid = pricingModel === "free_with_gate" ? price === 0 : price > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Pricing Model</h2>
        <p className="text-muted-foreground mt-1">
          How do you want to offer this {productCategory}?
        </p>
      </div>

      <div className="grid gap-4">
        {/* Free with Download Gate */}
        <Card
          className={`cursor-pointer transition-all ${
            pricingModel === "free_with_gate"
              ? "ring-2 ring-primary bg-primary/5"
              : canBeFree
              ? "hover:shadow-md"
              : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => canBeFree && handlePricingChange("free_with_gate")}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-purple-500" />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Free with Download Gate
                    {!canBeFree && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (Not available for this type)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Grow your audience - require follows to unlock
                  </CardDescription>
                </div>
              </div>
              {pricingModel === "free_with_gate" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Email collection
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Instagram, TikTok, YouTube, Spotify follows
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Flexible requirements (e.g., "Follow 2 out of 4")
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Build your email list & social following
                </div>
              </div>
            </CardContent>
          </Card>

        {/* Paid */}
        <Card
          className={`cursor-pointer transition-all ${
            pricingModel === "paid"
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:shadow-md"
          }`}
          onClick={() => handlePricingChange("paid")}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-green-500" />
                <div>
                  <CardTitle>Paid Product</CardTitle>
                  <CardDescription>
                    Direct purchase with instant payment
                  </CardDescription>
                </div>
              </div>
              {pricingModel === "paid" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4" />
                    Set your own price
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4" />
                    Stripe checkout integration
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4" />
                    Automatic delivery
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4" />
                    Order bumps & upsells
                  </div>
                </div>

                {pricingModel === "paid" && (
                  <div className="pt-2">
                    <Label htmlFor="price">
                      {isTipJar ? "Suggested Amount (USD)" : "Price (USD)"}
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="1"
                        value={price}
                        onChange={(e) => onPriceChange(Number(e.target.value))}
                        className="pl-7"
                        placeholder={isTipJar ? "5" : "10"}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isTipJar 
                        ? "This is the default suggested amount. Users can pay more or less."
                        : `Recommended: ${productCategory === "playlist-curation" ? "$3-$10" : "$5-$50"}`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onContinue} disabled={!isValid} size="lg">
          Continue →
        </Button>
      </div>
    </div>
  );
}

