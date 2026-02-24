"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureUtmParams } from "@/lib/utm";

/**
 * Captures UTM parameters from the URL on mount and stores them in a cookie.
 * Add this component to the root layout so every landing page is covered.
 *
 * Uses useSearchParams() so it re-runs when the URL query string changes
 * (e.g., client-side navigation to a new UTM-tagged link).
 */
export function UtmCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUtmParams();
  }, [searchParams]);

  return null;
}
