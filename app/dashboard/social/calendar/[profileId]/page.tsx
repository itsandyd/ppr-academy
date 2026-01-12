"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { CalendarWeekView } from "@/components/social-media/calendar/CalendarWeekView";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const profileId = params.profileId as Id<"socialAccountProfiles">;
  const mode = searchParams.get("mode");

  // Redirect if not in create mode
  useEffect(() => {
    if (isLoaded && mode !== "create") {
      router.replace("/dashboard?mode=learn");
    }
  }, [mode, isLoaded, router]);

  // Get user's stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get the profile
  const profile = useQuery(
    api.socialAccountProfiles.getAccountProfileById,
    profileId ? { profileId } : "skip"
  );

  // Get the first store
  const storeId = stores?.[0]?._id;

  // Loading state
  if (!isLoaded || !user || stores === undefined || profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Redirect if not create mode
  if (mode !== "create") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Show error if no stores
  if (!storeId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Calendar</h1>
          <p className="text-muted-foreground">
            Schedule your content for the week
          </p>
        </div>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Store Required</h3>
                <p className="text-muted-foreground mb-4">
                  Content Calendar requires a creator store.
                </p>
                <Button asChild>
                  <Link href="/dashboard?mode=create">Set Up Your Store</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if profile not found
  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/social/profiles?mode=create")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Content Calendar</h1>
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </div>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The account profile you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button asChild>
                  <Link href="/dashboard/social/profiles?mode=create">
                    View Profiles
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/social/profiles?mode=create")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <Badge variant="outline" className="capitalize">
                {profile.platform}
              </Badge>
            </div>
            <p className="text-muted-foreground">{profile.description}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/social/library?account=${profileId}&mode=create`)
          }
        >
          <FileText className="mr-2 h-4 w-4" />
          View Scripts
        </Button>
      </div>

      <CalendarWeekView
        accountProfileId={profileId}
        storeId={storeId}
        userId={user.id}
      />
    </div>
  );
}
