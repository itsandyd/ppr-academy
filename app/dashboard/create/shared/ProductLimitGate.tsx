"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { UpgradeBanner } from "@/components/creator/upgrade-prompt";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProductLimitGateProps {
  children: React.ReactNode;
  featureType: "products" | "courses";
}

/**
 * Component that gates content based on product/course limits
 * Shows an upgrade banner if the user has reached their plan limit
 */
export function ProductLimitGate({ children, featureType }: ProductLimitGateProps) {
  const { user } = useUser();

  // Get user's store
  const userStores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const store = userStores?.[0];
  const storeId = store?._id;

  // Check feature access
  const { hasAccess, isLoading, currentUsage, limit, requiresPlan } = useFeatureAccess(
    storeId,
    featureType
  );

  // Loading state
  if (!user || userStores === undefined || isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Checking your plan limits...</p>
        </div>
      </div>
    );
  }

  // No store found
  if (!store) {
    return (
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Please set up your store first before creating products.
          </p>
        </CardContent>
      </Card>
    );
  }

  // User has reached their limit
  if (!hasAccess && requiresPlan) {
    return (
      <div className="space-y-6">
        <UpgradeBanner
          feature={featureType}
          requiredPlan={requiresPlan}
          storeId={storeId}
        />
        {limit && limit > 0 && (
          <Card className="border-muted">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Current usage: {currentUsage} / {limit} {featureType}
                </span>
                <span className="font-medium text-orange-600">Limit reached</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // User has access - render children
  return <>{children}</>;
}

/**
 * Hook to get the current store ID for the logged-in user
 */
export function useCurrentStoreId(): Id<"stores"> | undefined {
  const { user } = useUser();
  const userStores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  return userStores?.[0]?._id;
}
