"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Hook to track creator profile views for conversion nudges
 * Triggers "Start your store" banner after 3+ views
 */
export function useCreatorProfileViewTracking(creatorId?: string, storeId?: Id<"stores">) {
  const { userId, isSignedIn } = useAuth();
  const trackView = useMutation(api.conversionNudges.trackCreatorProfileView);
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track if user is signed in, we have a creator ID, and haven't tracked yet
    if (isSignedIn && userId && creatorId && !hasTracked.current) {
      // Don't track if viewing own profile
      if (creatorId === userId) return;

      hasTracked.current = true;
      trackView({
        userId,
        creatorId,
        storeId,
      }).catch(console.error);
    }
  }, [isSignedIn, userId, creatorId, storeId, trackView]);
}

/**
 * Hook to track leaderboard page visits for conversion nudges
 * Triggers "Join Top Creators" CTA on leaderboard page
 */
export function useLeaderboardVisitTracking(leaderboardType?: string) {
  const { userId, isSignedIn } = useAuth();
  const trackVisit = useMutation(api.conversionNudges.trackLeaderboardVisit);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (isSignedIn && userId && !hasTracked.current) {
      hasTracked.current = true;
      trackVisit({
        userId,
        leaderboardType,
      }).catch(console.error);
    }
  }, [isSignedIn, userId, leaderboardType, trackVisit]);
}

/**
 * Hook to get the priority nudge for display
 */
export function usePriorityNudge() {
  const { userId } = useAuth();
  return useQuery(
    api.conversionNudges.getPriorityNudge,
    userId ? { userId } : "skip"
  );
}

/**
 * Hook to get creator profile view nudge specifically (3+ views threshold)
 */
export function useCreatorProfileViewNudge() {
  const { userId } = useAuth();
  return useQuery(
    api.conversionNudges.getCreatorProfileViewNudge,
    userId ? { userId } : "skip"
  );
}

/**
 * Hook to dismiss and mark nudges
 */
export function useNudgeActions() {
  const { userId } = useAuth();
  const dismissNudge = useMutation(api.conversionNudges.dismissNudge);
  const markShown = useMutation(api.conversionNudges.markNudgeShown);
  const markConverted = useMutation(api.conversionNudges.markNudgeConverted);

  return {
    dismissNudge: (nudgeId: Id<"userNudges">) => {
      if (!userId) return;
      return dismissNudge({ nudgeId, userId });
    },
    markShown: (nudgeId: Id<"userNudges">) => {
      if (!userId) return;
      return markShown({ nudgeId, userId });
    },
    markConverted: (nudgeContext: string) => {
      if (!userId) return;
      return markConverted({ userId, nudgeContext });
    },
  };
}
