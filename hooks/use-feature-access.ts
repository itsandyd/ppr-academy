"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface UseFeatureAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  currentUsage?: number;
  limit?: number;
  requiresPlan?: "creator" | "creator_pro";
  showUpgradePrompt: () => void;
  UpgradePromptComponent: React.ComponentType;
}

/**
 * Hook to check if a store has access to a feature
 * and provide an upgrade prompt if not
 */
export function useFeatureAccess(
  storeId: Id<"stores"> | undefined,
  feature: string
): UseFeatureAccessResult {
  const [showPrompt, setShowPrompt] = useState(false);

  const access = useQuery(
    api.creatorPlans.checkFeatureAccess,
    storeId ? { storeId, feature } : "skip"
  );

  const UpgradePromptComponent = () => {
    if (!access || !access.requiresPlan) return null;

    // Dynamically import the UpgradePrompt to avoid circular dependencies
    const { UpgradePrompt } = require("@/components/creator/upgrade-prompt");
    
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

