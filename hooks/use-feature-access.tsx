"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { UpgradePrompt } from "@/components/creator/upgrade-prompt";

interface UseFeatureAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  currentUsage?: number;
  limit?: number;
  requiresPlan?: "starter" | "creator" | "creator_pro";
  isAdmin?: boolean;
  showUpgradePrompt: () => void;
  UpgradePromptComponent: React.ComponentType;
}

/**
 * Hook to check if a store has access to a feature
 * and provide an upgrade prompt if not
 *
 * Admins automatically have access to all features
 */
export function useFeatureAccess(
  storeId: Id<"stores"> | undefined,
  feature: string
): UseFeatureAccessResult {
  const { user } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);

  const access = useQuery(
    api.creatorPlans.checkFeatureAccess,
    storeId ? { storeId, feature, clerkId: user?.id } : "skip"
  );

  const UpgradePromptComponent = () => {
    if (!access || !access.requiresPlan) return null;
    
    return (
      <UpgradePrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        feature={feature}
        requiredPlan={access.requiresPlan}
        storeId={storeId}
      />
    );
  };

  return {
    hasAccess: access?.hasAccess ?? false,
    isLoading: access === undefined,
    currentUsage: access?.currentUsage,
    limit: access?.limit,
    requiresPlan: access?.requiresPlan,
    isAdmin: access?.isAdmin,
    showUpgradePrompt: () => setShowPrompt(true),
    UpgradePromptComponent,
  };
}

/**
 * Hook to get the current plan for a store
 */
export function useStorePlan(storeId: Id<"stores"> | undefined) {
  const planData = useQuery(
    api.creatorPlans.getStorePlan,
    storeId ? { storeId } : "skip"
  );

  return {
    plan: planData?.plan ?? "free",
    limits: planData?.limits,
    pricing: planData?.pricing,
    isActive: planData?.isActive ?? false,
    isLoading: planData === undefined,
  };
}

