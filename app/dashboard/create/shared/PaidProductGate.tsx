"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";

interface PaidProductGateProps {
  children: React.ReactNode;
  /** Content to show when user can't charge money (optional - uses default if not provided) */
  lockedContent?: React.ReactNode;
}

/**
 * Component that gates paid product creation based on plan
 * Free tier users can only create free products (price = $0)
 * Shows an upgrade prompt if they try to set a price
 */
export function PaidProductGate({ children, lockedContent }: PaidProductGateProps) {
  const { user } = useUser();

  // Get user's store
  const userStores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const store = userStores?.[0];
  const storeId = store?._id;

  // Check feature access for paid products
  const { hasAccess, isLoading } = useFeatureAccess(storeId, "paid_products");

  // Loading state - show children (optimistic)
  if (!user || userStores === undefined || isLoading) {
    return <>{children}</>;
  }

  // User can charge money - show children
  if (hasAccess) {
    return <>{children}</>;
  }

  // User cannot charge money - show locked content or default upgrade prompt
  if (lockedContent) {
    return <>{lockedContent}</>;
  }

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-orange-500/10">
            <Lock className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">Upgrade to Sell Paid Products</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Free plan users can create unlimited free products to build their audience.
                Upgrade to Starter ($12/mo) to start charging for your products.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="gap-2">
                <Link href="/dashboard/pricing">
                  <Sparkles className="w-4 h-4" />
                  Upgrade Now
                </Link>
              </Button>
              <span className="text-xs text-muted-foreground">
                Starting at $12/month
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to check if user can create paid products
 */
export function useCanChargeMoney() {
  const { user } = useUser();

  const userStores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const store = userStores?.[0];
  const storeId = store?._id;

  const { hasAccess, isLoading } = useFeatureAccess(storeId, "paid_products");

  return {
    canChargeMoney: hasAccess,
    isLoading: !user || userStores === undefined || isLoading,
    storeId,
  };
}
