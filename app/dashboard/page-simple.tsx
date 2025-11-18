'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DashboardShell } from './components/DashboardShell';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

type DashboardMode = 'learn' | 'create';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const mode = searchParams.get('mode') as DashboardMode | null;

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Get stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : 'skip'
  );

  // Redirect if no mode specified
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!mode || (mode !== 'learn' && mode !== 'create')) {
      // Check for saved preference
      const preference = convexUser?.dashboardPreference as DashboardMode | undefined;
      
      if (preference && (preference === 'learn' || preference === 'create')) {
        router.replace(`/dashboard?mode=${preference}`);
        return;
      }

      // Default based on whether they have stores
      const defaultMode: DashboardMode = stores && stores.length > 0 ? 'create' : 'learn';
      router.replace(`/dashboard?mode=${defaultMode}`);
    }
  }, [mode, convexUser, stores, router, isLoaded]);

  // Loading state
  if (!isLoaded || !user || convexUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // If no valid mode yet, show loading
  if (!mode || (mode !== 'learn' && mode !== 'create')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  return <DashboardShell mode={mode} />;
}


