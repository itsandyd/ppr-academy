"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { StoreSetupWizard } from "@/components/dashboard/store-setup-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export default function SetupCatchAllPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const path = params.path as string[];
  
  // Check if user already has stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  // If user already has stores, redirect to their first store with the same path
  useEffect(() => {
    if (stores && stores.length > 0) {
      const firstStoreId = stores[0]._id;
      const targetPath = path ? path.join('/') : 'products';
      router.replace(`/store/${firstStoreId}/${targetPath}`);
    }
  }, [stores, router, path]);

  // Show loading while checking stores
  if (!user || stores === undefined) {
    return (
      <div className="space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If user has stores, show loading while redirecting
  if (stores && stores.length > 0) {
    return (
      <div className="space-y-8 p-8">
        <div className="text-center">
          <p className="text-muted-foreground">
            Redirecting to your store...
          </p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Show store setup wizard if no stores exist
  return (
    <StoreSetupWizard 
      onStoreCreated={() => {
        // After store creation, redirect to the intended path
        const targetPath = path ? path.join('/') : 'products';
        window.location.href = `/store/setup/${targetPath}`;
      }} 
    />
  );
}
