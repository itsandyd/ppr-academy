"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Crown, Check, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";
import { useState } from "react";

/**
 * MembershipCard - Subscription tiers with monthly/yearly toggle
 * Shows benefits, included content, and trial options
 */
export function MembershipCard({ product, onClick }: ProductCardProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const monthlyPrice = product.priceMonthly || product.price || 0;
  const yearlyPrice = product.priceYearly || monthlyPrice * 10; // Default to 10 months if no yearly price
  const currentPrice = billingPeriod === "monthly" ? monthlyPrice : yearlyPrice;
  const savings = billingPeriod === "yearly" ? Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100) : 0;

  const benefits = product.benefits || [];
  const hasTrialDays = (product.trialDays || 0) > 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Premium ribbon */}
      <div className="absolute -right-8 top-6 z-10 rotate-45 bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-1 text-xs font-bold text-white shadow-lg">
        PREMIUM
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 pb-4">
        {/* Crown icon */}
        <div className="flex items-center justify-center mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <Crown className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Tier name */}
        <h3 className="text-center text-xl font-bold text-amber-600 dark:text-amber-400">
          {product.tierName || product.title || "Premium Membership"}
        </h3>

        {/* Billing toggle */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBillingPeriod("monthly");
            }}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-all",
              billingPeriod === "monthly"
                ? "bg-amber-500 text-white"
                : "text-muted-foreground hover:bg-amber-500/10"
            )}
          >
            Monthly
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setBillingPeriod("yearly");
            }}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-all flex items-center gap-1",
              billingPeriod === "yearly"
                ? "bg-amber-500 text-white"
                : "text-muted-foreground hover:bg-amber-500/10"
            )}
          >
            Yearly
            {savings > 0 && (
              <span className="ml-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white">
                -{savings}%
              </span>
            )}
          </button>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Price display */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                ${currentPrice}
              </span>
              <span className="text-sm text-muted-foreground">
                /{billingPeriod === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {hasTrialDays && (
              <Badge className="mt-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                <Sparkles className="mr-1 h-3 w-3" />
                {product.trialDays} day free trial
              </Badge>
            )}
          </div>

          {/* Benefits list */}
          {benefits.length > 0 && (
            <ul className="space-y-2">
              {benefits.slice(0, 5).map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
              {benefits.length > 5 && (
                <li className="text-xs text-muted-foreground text-center">
                  + {benefits.length - 5} more benefits
                </li>
              )}
            </ul>
          )}

          {/* Description fallback */}
          {benefits.length === 0 && product.description && (
            <p className="text-sm text-muted-foreground text-center line-clamp-3">
              {product.description}
            </p>
          )}

          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            size="lg"
          >
            <Star className="mr-2 h-4 w-4 fill-current" />
            {hasTrialDays ? "Start Free Trial" : "Subscribe Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
