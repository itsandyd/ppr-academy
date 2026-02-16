'use client';

import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LearnProductsView } from './LearnProductsView';
import { CreateProductsView } from './CreateProductsView';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const mode = searchParams.get('mode') as 'learn' | 'create' | null;

  // Redirect to dashboard if no mode specified
  useEffect(() => {
    if (!mode || (mode !== 'learn' && mode !== 'create')) {
      router.push('/dashboard?mode=create'); // Default to create for products page
    }
  }, [mode, router]);

  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const isLoading = !user || convexUser === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  if (!mode || (mode !== 'learn' && mode !== 'create')) {
    return <LoadingState />;
  }

  return (
    <>
      {mode === 'learn' ? (
        <LearnProductsView convexUser={convexUser} />
      ) : (
        <CreateProductsView convexUser={convexUser} />
      )}
    </>
  );
}

function LoadingState() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}


