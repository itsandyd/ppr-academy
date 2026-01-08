"use client";

import { useEffect } from "react";

interface ReferralCaptureProps {
  code: string;
}

/**
 * Client component that captures the referral code and stores it in localStorage
 * This will be applied after the user completes signup
 */
export function ReferralCapture({ code }: ReferralCaptureProps) {
  useEffect(() => {
    if (code) {
      // Store the referral code with expiration (7 days)
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        "ppr_referral",
        JSON.stringify({ code, expiresAt })
      );
    }
  }, [code]);

  return null;
}
