"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingPageEditor } from "@/components/landing-pages/landing-page-editor";

export default function EditLandingPagePage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const pageId = params.pageId as Id<"landingPages">;

  // Get user's store
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get the landing page
  const page = useQuery(
    api.landingPages.getLandingPage,
    pageId ? { pageId } : "skip"
  );

  // Loading state
  if (!isLoaded || store === undefined || page === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No store or page not found
  if (!store || !page) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-muted-foreground">Page not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/landing-pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landing Pages
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-4 md:px-6 py-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/landing-pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Landing Pages
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <LandingPageEditor pageId={pageId} storeSlug={store.slug} />
      </div>
    </div>
  );
}
