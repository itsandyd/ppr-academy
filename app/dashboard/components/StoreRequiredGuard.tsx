'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StoreSetupWizardEnhanced } from '@/components/dashboard/store-setup-wizard-enhanced';
import { Skeleton } from '@/components/ui/skeleton';

interface StoreRequiredGuardProps {
  children: ReactNode;
  mode: 'learn' | 'create';
}

export function StoreRequiredGuard({ children, mode }: StoreRequiredGuardProps) {
  const { user } = useUser();
  
  // Check if user has stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : 'skip'
  );

  // Learn mode doesn't require stores
  if (mode === 'learn') {
    return <>{children}</>;
  }

  // Loading state
  if (!user || stores === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  // Create mode requires a store
  if (mode === 'create' && stores.length === 0) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to Creator Mode! 🎨</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            To start creating and selling your music content, you'll need to set up your creator store.
            This only takes a minute and gives you your own branded storefront.
          </p>
        </div>
        <StoreSetupWizardEnhanced 
          onStoreCreated={(storeId) => {
            // Refresh to show creator dashboard with store
            window.location.reload();
          }} 
        />
      </div>
    );
  }

  // User has store, show content
  return <>{children}</>;
}
