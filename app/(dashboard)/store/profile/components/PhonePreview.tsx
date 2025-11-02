"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { GlobalPhonePreview } from "@/components/shared/GlobalPhonePreview";

interface PhonePreviewProps {
  className?: string;
}

export function PhonePreview({ className }: PhonePreviewProps) {
  const { user: clerkUser } = useUser();
  
  // Get updated user data from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Get store data
  const stores = useQuery(
    api.stores.getStoresByUser,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );
  const store = stores?.[0];

  // Fetch connected social accounts
  const socialAccounts = useQuery(
    api.socialMedia?.getSocialAccounts as any,
    store ? { storeId: store._id } : "skip"
  );

  // Show loading state while fetching user data
  if (!clerkUser || convexUser === undefined || !store) {
    return (
      <GlobalPhonePreview
        className={className}
        showPreviewLabel={true}
      />
    );
  }

  // Prioritize saved name over Clerk's firstName + lastName
  const displayName = convexUser?.name || 
    (clerkUser.firstName && clerkUser.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName || clerkUser.lastName || "User");

  // Use saved avatar or fallback to Clerk image
  const avatarUrl = convexUser?.imageUrl || clerkUser.imageUrl || "";

  return (
    <GlobalPhonePreview
      className={className}
      storeName={store.name || displayName}
      displayName={displayName}
      slug={store.slug}
      avatarUrl={avatarUrl}
      bio={convexUser?.bio}
      socialAccounts={socialAccounts || []}
      showPreviewLabel={true}
    />
  );
}
