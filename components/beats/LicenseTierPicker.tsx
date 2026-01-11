"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Music,
  FileAudio,
  Layers,
  Crown,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LicenseTier {
  type: "basic" | "premium" | "exclusive" | "unlimited";
  name: string;
  price: number;
  distributionLimit?: number;
  streamingLimit?: number;
  commercialUse: boolean;
  musicVideoUse: boolean;
  radioBroadcasting: boolean;
  stemsIncluded: boolean;
  creditRequired: boolean;
  includedFiles: string[];
}

interface LicenseTierPickerProps {
  beatId: string;
  beatTitle: string;
  tiers: LicenseTier[];
  storeId: string;
  creatorStripeAccountId?: string;
  userOwnedTiers?: string[];
  isExclusivelySold?: boolean;
  className?: string;
}

const TIER_ICONS = {
  basic: FileAudio,
  premium: Layers,
  exclusive: Crown,
  unlimited: Crown,
};

const TIER_COLORS = {
  basic: "border-gray-200 hover:border-gray-400",
  premium: "border-blue-200 hover:border-blue-400",
  exclusive: "border-amber-200 hover:border-amber-400",
  unlimited: "border-purple-200 hover:border-purple-400",
};

const TIER_SELECTED = {
  basic: "border-gray-500 bg-gray-50 ring-2 ring-gray-200",
  premium: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  exclusive: "border-amber-500 bg-amber-50 ring-2 ring-amber-200",
  unlimited: "border-purple-500 bg-purple-50 ring-2 ring-purple-200",
};

export function LicenseTierPicker({
  beatId,
  beatTitle,
  tiers,
  storeId,
  creatorStripeAccountId,
  userOwnedTiers = [],
  isExclusivelySold = false,
  className,
}: LicenseTierPickerProps) {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTierSelect = (tierType: string) => {
    if (userOwnedTiers.includes(tierType)) {
      toast.info("You already own this license tier");
      return;
    }
    setSelectedTier(tierType === selectedTier ? null : tierType);
  };

  const handlePurchase = async () => {
    if (!selectedTier) {
      toast.error("Please select a license tier");
      return;
    }

    if (!isSignedIn || !user) {
      toast.error("Please sign in to purchase");
      router.push(`/sign-in?redirect=/marketplace/beats/${beatId}`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/beats/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beatId,
          tierType: selectedTier,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "",
          userId: user.id,
          storeId,
          creatorStripeAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setIsLoading(false);
    }
  };

  if (isExclusivelySold) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-700">
              <Crown className="h-5 w-5" />
              <span className="font-medium">This beat has been sold exclusively</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No license tiers available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">Select License</h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {tiers.map((tier) => {
          const TierIcon = TIER_ICONS[tier.type];
          const isSelected = selectedTier === tier.type;
          const isOwned = userOwnedTiers.includes(tier.type);

          return (
            <Card
              key={tier.type}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                isOwned
                  ? "border-green-200 bg-green-50 opacity-75"
                  : isSelected
                    ? TIER_SELECTED[tier.type]
                    : TIER_COLORS[tier.type]
              )}
              onClick={() => !isOwned && handleTierSelect(tier.type)}
            >
              {isOwned && (
                <Badge className="absolute -top-2 left-4 bg-green-500">Owned</Badge>
              )}
              {tier.type === "exclusive" && !isOwned && (
                <Badge className="absolute -top-2 right-4 bg-amber-500">Best Value</Badge>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TierIcon className="h-5 w-5" />
                    <CardTitle className="text-base">{tier.name}</CardTitle>
                  </div>
                  <span className="text-xl font-bold">
                    ${tier.price.toFixed(2)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Included Files */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Files Included
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tier.includedFiles.map((file) => (
                      <Badge key={file} variant="secondary" className="text-xs">
                        {file.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Distribution Limits */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Distribution: </span>
                  <span className="font-medium">
                    {tier.distributionLimit
                      ? tier.distributionLimit.toLocaleString()
                      : "Unlimited"}
                  </span>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <Feature enabled={tier.commercialUse} label="Commercial Use" />
                  <Feature enabled={tier.musicVideoUse} label="Music Videos" />
                  <Feature enabled={tier.radioBroadcasting} label="Radio/TV" />
                  <Feature enabled={tier.stemsIncluded} label="Stems" />
                </div>

                {tier.creditRequired && (
                  <p className="text-xs text-muted-foreground">
                    * Credit required in track title
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Purchase Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!selectedTier || isLoading}
        onClick={handlePurchase}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : selectedTier ? (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase{" "}
            {tiers.find((t) => t.type === selectedTier)?.name} License - $
            {tiers.find((t) => t.type === selectedTier)?.price.toFixed(2)}
          </>
        ) : (
          <>
            <Music className="mr-2 h-4 w-4" />
            Select a License Tier
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Secure checkout powered by Stripe. License agreement included with purchase.
      </p>
    </div>
  );
}

function Feature({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {enabled ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-red-400" />
      )}
      <span className={cn(enabled ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}
