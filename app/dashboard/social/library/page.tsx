"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ScriptLibrary } from "@/components/social-media/script-library/ScriptLibrary";

export const dynamic = "force-dynamic";

export default function ScriptLibraryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

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

  // Get the first store
  const storeId = stores?.[0]?._id;

  // Loading state
  if (!isLoaded || !user || stores === undefined) {
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
          <h1 className="text-3xl font-bold mb-2">Script Library</h1>
          <p className="text-muted-foreground">
            Pre-generated scripts from your course content
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
                  Script Library requires a creator store. Set up your store to
                  start generating scripts.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/social?mode=create")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Script Library</h1>
          <p className="text-muted-foreground">
            Pre-generated scripts from your course content
          </p>
        </div>
      </div>

      <ScriptLibrary storeId={storeId} userId={user.id} />
    </div>
  );
}
