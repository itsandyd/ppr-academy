'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Gift, Sparkles, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { PricingModel, ProductCategory } from '../types';

interface PricingStepProps {
  productCategory?: ProductCategory;
  pricingModel: PricingModel;
  price: number;
  onPricingModelChange: (model: PricingModel) => void;
  onPriceChange: (price: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PricingStep({
  productCategory,
  pricingModel,
  price,
  onPricingModelChange,
  onPriceChange,
  onNext,
  onBack,
}: PricingStepProps) {
  const canProceed =
    pricingModel === 'free_with_gate' ||
    (pricingModel === 'paid' && price > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Pricing Model</h2>
        <p className="text-muted-foreground">
          Decide how you want to distribute this product
        </p>
      </div>

      {/* Pricing model selector */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free with gate */}
        <Card 
          className={`cursor-pointer transition-all ${
            pricingModel === 'free_with_gate' 
              ? 'border-primary shadow-lg ring-2 ring-primary/20' 
              : 'hover:border-primary/50'
          }`}
          onClick={() => onPricingModelChange('free_with_gate')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              {pricingModel === 'free_with_gate' && (
                <Badge className="bg-primary">Selected</Badge>
              )}
            </div>
            <h3 className="text-lg font-bold mb-2">Free with Download Gate</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Grow your audience by requiring email or social follows to unlock
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Build your email list</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Grow social following</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Perfect for lead magnets</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid */}
        <Card 
          className={`cursor-pointer transition-all ${
            pricingModel === 'paid' 
              ? 'border-primary shadow-lg ring-2 ring-primary/20' 
              : 'hover:border-primary/50'
          }`}
          onClick={() => onPricingModelChange('paid')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              {pricingModel === 'paid' && (
                <Badge className="bg-primary">Selected</Badge>
              )}
            </div>
            <h3 className="text-lg font-bold mb-2">Paid Product</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sell directly with Stripe checkout and instant delivery
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Direct revenue</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Instant payouts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Professional sales page</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price input (if paid) */}
      {pricingModel === 'paid' && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="text-lg font-semibold">
                  Set Your Price <span className="text-destructive">*</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a price that reflects the value you're providing
                </p>
              </div>

              <div className="relative max-w-xs">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </div>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onPriceChange(Math.max(0, val));
                  }}
                  className={`pl-8 text-2xl font-bold h-14 ${price < 0 ? "border-red-500" : ""}`}
                  placeholder="29"
                />
                {price < 0 && (
                  <p className="text-sm text-red-600 mt-1">Price cannot be negative</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Suggested pricing: $9 - $99</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Pro Tip</h4>
              <p className="text-sm text-muted-foreground">
                {pricingModel === 'free_with_gate' 
                  ? 'Free products with download gates are perfect for building your email list and social following. You can always create a paid version later!'
                  : 'Research similar products in the marketplace to find the sweet spot for pricing. You can always adjust later based on sales data.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
