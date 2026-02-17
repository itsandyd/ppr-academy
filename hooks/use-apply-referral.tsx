"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

/**
 * Hook that checks for a stored referral code and applies it after signup
 * Should be called in the dashboard or main app layout
 */
export function useApplyReferral() {
  const { user, isLoaded } = useUser();
  const [hasApplied, setHasApplied] = useState(false);
  const applyReferralCode = useMutation(api.monetizationUtils.applyReferralCode);

  useEffect(() => {
    if (!isLoaded || !user || hasApplied) return;

    const applyStoredReferral = async () => {
      try {
        // Check for stored referral code
        const stored = localStorage.getItem("ppr_referral");
        if (!stored) return;

        const { code, expiresAt } = JSON.parse(stored);

        // Check if expired
        if (Date.now() > expiresAt) {
          localStorage.removeItem("ppr_referral");
          return;
        }

        // Check if already applied (prevent duplicate applications)
        const appliedKey = `ppr_referral_applied_${user.id}`;
        if (localStorage.getItem(appliedKey)) {
          localStorage.removeItem("ppr_referral");
          return;
        }

        // Apply the referral code
        const result = await applyReferralCode({
          referralCode: code,
        });

        if (result.success) {
          toast.success(
            `Welcome! You received ${result.reward} credits from your referral!`,
            {
              description: "Start exploring courses and content.",
              duration: 5000,
            }
          );

          // Mark as applied
          localStorage.setItem(appliedKey, "true");
        }

        // Clean up
        localStorage.removeItem("ppr_referral");
        setHasApplied(true);
      } catch (error: any) {
        // Silently fail - the code might already be used or invalid
        console.error("Failed to apply referral:", error);
        localStorage.removeItem("ppr_referral");
      }
    };

    applyStoredReferral();
  }, [isLoaded, user, hasApplied, applyReferralCode]);

  return { hasApplied };
}
