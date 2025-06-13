"use client";

import { useUser, useClerk, useAuth as useClerkAuth } from "@clerk/nextjs";

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const { userId } = useClerkAuth();

  return {
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    } : undefined,
    userId,
    logout: () => signOut({ redirectUrl: "/" }),
  };
} 