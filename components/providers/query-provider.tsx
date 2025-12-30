/**
 * Legacy React Query Provider
 *
 * NOTE: This project now uses Convex for real-time data fetching.
 * This file is kept for compatibility but is now a passthrough component.
 * Convex handles all real-time data via ConvexProvider in build-providers.tsx
 *
 * @deprecated This provider is no longer needed. Convex provides real-time data.
 */

"use client";

import React from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Passthrough provider - Convex handles all data fetching now
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Simply render children - Convex handles data fetching
  return <>{children}</>;
}

/**
 * @deprecated Use Convex hooks instead
 */
export function useCacheManager() {
  return {
    clearUserCache: () => {},
    invalidateProducts: () => {},
    prefetchFeaturedProducts: () => {},
    getCacheStats: () => ({
      totalQueries: 0,
      activeQueries: 0,
      staleQueries: 0,
    }),
  };
}
