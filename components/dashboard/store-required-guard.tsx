"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface StoreRequiredGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function StoreRequiredGuard({ children, redirectTo = "/home" }: StoreRequiredGuardProps) {
  const { user } = useUser();
  const router = useRouter();
  
  // Fetch user's stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  // Redirect to setup if no stores exist
  useEffect(() => {
    if (stores !== undefined && stores.length === 0) {
      router.push(redirectTo);
    }
  }, [stores, router, redirectTo]);

  // Loading state
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

  // No stores - show message while redirecting
  if (stores.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle>Store Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to set up your creator store before accessing this feature.
            </p>
            <div className="space-y-2">
              <Link href={redirectTo}>
                <Button className="w-full">
                  <Store className="w-4 h-4 mr-2" />
                  Set Up Store
                </Button>
              </Link>
              <Link href="/library">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
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
