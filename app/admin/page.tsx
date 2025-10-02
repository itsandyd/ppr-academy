"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  
  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Check admin status and redirect if not admin
  useEffect(() => {
    if (!clerkLoaded) return;
    
    if (!clerkUser) {
      router.push("/");
      return;
    }

    // Wait for Convex user to load
    if (convexUser === undefined) return;
    
    if (!convexUser || !convexUser.admin) {
      console.log("❌ User is not an admin, redirecting to /home");
      router.push("/home");
    }
  }, [clerkUser, clerkLoaded, convexUser, router]);

  // Show loading state
  if (!clerkLoaded || convexUser === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Loading admin dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not admin, don't render (redirect will happen in useEffect)
  if (!convexUser || !convexUser.admin) {
    return null;
  }

  // Render admin dashboard
  // Note: The props here are placeholders - you'll need to fetch this data from Convex
  // Transform Convex user to match AdminDashboard expected format
  const transformedUser = {
    id: convexUser._id,
    name: convexUser.name || null,
    email: convexUser.email || null,
    emailVerified: convexUser.emailVerified ? new Date(convexUser.emailVerified) : null,
    image: convexUser.imageUrl || null,
    hashedPassword: null,
    agencyId: null,
    role: convexUser.role || "SUBACCOUNT_USER",
    admin: convexUser.admin || false,
    bio: convexUser.bio || null,
    instagram: convexUser.instagram || null,
    tiktok: convexUser.tiktok || null,
    twitter: convexUser.twitter || null,
    youtube: convexUser.youtube || null,
    website: convexUser.website || null,
    firstName: convexUser.firstName || null,
    lastName: convexUser.lastName || null,
    stripeConnectAccountId: convexUser.stripeConnectAccountId || null,
    stripeAccountStatus: convexUser.stripeAccountStatus || null,
    stripeOnboardingComplete: convexUser.stripeOnboardingComplete || false,
    createdAt: new Date(convexUser._creationTime),
    updatedAt: new Date(convexUser._creationTime),
  } as any;

  return (
    <AdminDashboard
      user={transformedUser}
      adminStats={{
        totalUsers: 0,
        totalCourses: 0,
        totalRevenue: 0,
        pendingCourses: 0,
      }}
      allUsers={[]}
      pendingCourses={[]}
      allCourses={[]}
      recentReviews={[]}
      coachApplications={[]}
    />
  );
} 