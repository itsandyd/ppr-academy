"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Smart Dashboard Redirect
 * 
 * Routes users to the appropriate dashboard based on their role:
 * - Creators (with store) → /home
 * - Students → /library
 * - Unauthenticated → /
 */
export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Check if user has a store
  const userStore = useQuery(
    api.stores.getUserStore,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  useEffect(() => {
    // Wait for Clerk to load
    if (!isLoaded) return;

    // Not signed in → redirect to homepage
    if (!user) {
      router.push("/");
      return;
    }

    // Wait for Convex user to load
    if (convexUser === undefined) return;

    // User doesn't exist in Convex yet (rare edge case)
    if (convexUser === null) {
      console.warn("User not found in Convex, redirecting to library");
      router.push("/library");
      return;
    }

    // Wait for store check to complete
    if (userStore === undefined) return;

    // User has a store → redirect to creator dashboard
    if (userStore) {
      console.log("✅ Creator detected, redirecting to /home");
      router.push("/home");
      return;
    }

    // User doesn't have a store → redirect to student library
    console.log("✅ Student detected, redirecting to /library");
    router.push("/library");
  }, [isLoaded, user, convexUser, userStore, router]);

  // Show loading state while determining route
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <div>
          <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">
            {!isLoaded && "Checking authentication..."}
            {isLoaded && !user && "Redirecting to homepage..."}
            {isLoaded && user && convexUser === undefined && "Loading your profile..."}
            {isLoaded && user && convexUser !== undefined && userStore === undefined && "Checking your account type..."}
            {isLoaded && user && convexUser && userStore !== undefined && "Redirecting..."}
          </p>
        </div>
      </div>
    </div>
  );
}

