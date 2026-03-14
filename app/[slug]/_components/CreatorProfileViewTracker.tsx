"use client";

import { useCreatorProfileViewTracking } from "@/hooks/useConversionTracking";
import { Id } from "@/convex/_generated/dataModel";

export function CreatorProfileViewTracker({
  userId,
  storeId,
}: {
  userId?: string;
  storeId?: Id<"stores">;
}) {
  useCreatorProfileViewTracking(userId, storeId);
  return null;
}
