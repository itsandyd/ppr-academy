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
  // NOTE: Courses CAN be free now! Only pure services cannot.
  const canBeFree = !["coaching", "mixing-service", "mastering-service"].includes(productCategory);
  
  // Tip jars are special - they're "pay what you want"
  const isTipJar = productCategory === "tip-jar" || productCategory === "donation";

  const handlePricingChange = (value: string) => {
    const model = value as PricingModel;
    onPricingModelChange(model);
    
    // Auto-set price based on model and product type
    if (model === "free_with_gate") {
      onPriceChange(0);
    } else if (price === 0 || !price) {
      // Smart defaults based on product type
      if (productCategory === "course" || productCategory === "workshop" || productCategory === "masterclass") {
        onPriceChange(99); // Courses default to $99
      } else if (productCategory === "coaching" || productCategory === "mixing-service" || productCategory === "mastering-service") {
        onPriceChange(50); // Services default to $50
      } else if (productCategory === "tip-jar" || productCategory === "donation") {
        onPriceChange(5); // Tips default to $5
      } else if (productCategory === "playlist-curation") {
        onPriceChange(5); // Playlist submissions default to $5
      } else {
        onPriceChange(10); // Everything else defaults to $10
      }
    }
  };

  const isValid = pricingModel === "free_with_gate" ? price === 0 : price > 0;

  return (
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Pricing Model</h2>
        <p className="text-muted-foreground mt-1">
          How do you want to offer this {productCategory.replace("-", " ")}?
        </p>
      </div>
      
      <div className="grid gap-6">
        {/* Free with Download Gate */}
        <Card
          className={`cursor-pointer transition-all border-2 ${
            pricingModel === "free_with_gate"
              ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-500"
              : canBeFree
              ? "hover:shadow-lg hover:border-purple-200"
              : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => canBeFree && handlePricingChange("free_with_gate")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg mb-1">
                    Free with Download Gate
                  </CardTitle>
                  <CardDescription className="text-base">
                    Grow your audience - require follows to unlock
                  </CardDescription>
                </div>
              </div>
              {pricingModel === "free_with_gate" && (
                <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white font-bold" />
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
          className={`cursor-pointer transition-all border-2 ${
            pricingModel === "paid"
              ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20 border-green-500"
              : "hover:shadow-lg hover:border-green-200"
          }`}
          onClick={() => handlePricingChange("paid")}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg mb-1">Paid Product</CardTitle>
                  <CardDescription className="text-base">
                    Direct purchase with instant payment
                  </CardDescription>
                </div>
              </div>
              {pricingModel === "paid" && (
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-white font-bold" />
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
                        : productCategory === "course" || productCategory === "workshop" || productCategory === "masterclass"
                        ? "Recommended: $49-$299 (average course: $99)"
                        : productCategory === "coaching" || productCategory === "mixing-service" || productCategory === "mastering-service"
                        ? "Recommended: $30-$150 per session"
                        : productCategory === "playlist-curation"
                        ? "Recommended: $3-$10 per submission"
                        : "Recommended: $5-$50"
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

