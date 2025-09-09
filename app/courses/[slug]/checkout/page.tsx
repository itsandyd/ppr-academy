"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseCheckout } from "./components/CourseCheckout";
import { Loader2, Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CourseCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseSlug = params.slug as string;
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to sign-in with return URL
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch course by slug
  const course = useQuery(
    api.courses.getCourseBySlug,
    courseSlug ? { slug: courseSlug } : "skip"
  );

  // Fetch store data
  const store = useQuery(
    api.stores.getStoreById,
    course ? { storeId: course.storeId as any } : "skip"
  );

  // Fetch creator data
  const creator = useQuery(
    api.users.getUserFromClerk,
    course ? { clerkId: course.userId } : "skip"
  );

  // Show loading while auth is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Show sign-in required message if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to purchase this course.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`}>
                  Sign In to Continue
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-up">
                  Create Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state for data
  if (course === undefined || store === undefined || creator === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading checkout...</span>
        </div>
      </div>
    );
  }

  // Course not found or not published
  if (course === null || !course.isPublished) {
    notFound();
  }

  // Store not found
  if (store === null) {
    notFound();
  }

  return (
    <CourseCheckout 
      course={course}
      store={store}
      creator={creator}
      user={user} // Pass user data to auto-populate form
    />
  );
}
