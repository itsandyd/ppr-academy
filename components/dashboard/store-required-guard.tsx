"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, ArrowLeft, Sparkles, Loader2, Check, Rocket } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface StoreRequiredGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  // If true, auto-creates store instead of blocking
  autoCreate?: boolean;
}

export function StoreRequiredGuard({
  children,
  redirectTo = "/home",
  autoCreate = true, // Default to auto-create for frictionless experience
}: StoreRequiredGuardProps) {
  const { user } = useUser();
  const router = useRouter();
  const createStoreFromProfile = useMutation(api.stores.createStoreFromProfile);

  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [createdStore, setCreatedStore] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  // Fetch user's stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  // Auto-create store when user has none
  useEffect(() => {
    const autoCreateStore = async () => {
      if (
        autoCreate &&
        stores !== undefined &&
        stores.length === 0 &&
        user?.id &&
        !isCreating &&
        !justCreated
      ) {
        setIsCreating(true);

        try {
          const result = await createStoreFromProfile({
            userId: user.id,
          });

          setCreatedStore({
            name: result.storeName,
            slug: result.storeSlug,
          });
          setJustCreated(true);

          // Celebration!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#a855f7", "#ec4899", "#f97316", "#22c55e"],
          });

          // Auto-dismiss celebration after 2 seconds
          setTimeout(() => {
            setJustCreated(false);
          }, 2000);
        } catch (error) {
          console.error("Failed to auto-create store:", error);
          // Fall back to redirect if auto-creation fails
          router.push(redirectTo);
        } finally {
          setIsCreating(false);
        }
      }
    };

    autoCreateStore();
  }, [stores, user?.id, autoCreate, isCreating, justCreated, createStoreFromProfile, router, redirectTo]);

  // Redirect if auto-create is disabled
  useEffect(() => {
    if (!autoCreate && stores !== undefined && stores.length === 0) {
      router.push(redirectTo);
    }
  }, [stores, router, redirectTo, autoCreate]);

  // Loading state
  if (!user || stores === undefined) {
    return (
      <div className="space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Auto-creating store
  if (isCreating) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <CardTitle>Setting up your store...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We're creating your creator profile automatically. Just a moment!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Just created - celebration state
  if (justCreated && createdStore) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-1">
            <div className="rounded-t-lg bg-white p-6 text-center dark:bg-gray-900">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                <Check className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="mb-2 text-xl">You're a creator now!</CardTitle>
              <p className="mb-4 text-muted-foreground">
                Your store <span className="font-semibold text-purple-600">{createdStore.name}</span> is ready
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span>Loading your dashboard...</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // No stores and auto-create disabled - show message while redirecting
  if (stores.length === 0 && !autoCreate) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Ready to create?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Set up your creator store to start selling courses, samples, presets, and more.
            </p>
            <div className="space-y-2">
              <Link href={redirectTo}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Store className="mr-2 h-4 w-4" />
                  Set Up My Store
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Library
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Store exists - render children
  return <>{children}</>;
}
