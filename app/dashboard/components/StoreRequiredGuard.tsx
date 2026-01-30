'use client';

import { ReactNode, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { QuickCreatorSetup } from '@/components/dashboard/quick-creator-setup';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Music, Upload, BookOpen, Video, ArrowRight } from 'lucide-react';

interface StoreRequiredGuardProps {
  children: ReactNode;
  mode: 'learn' | 'create';
}

export function StoreRequiredGuard({ children, mode }: StoreRequiredGuardProps) {
  const { user } = useUser();
  const [showSetup, setShowSetup] = useState(false);

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
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <Music className="h-8 w-8 text-white" />
          </div>

          {/* Headline */}
          <h2 className="mb-3 text-2xl font-bold">
            Share your sounds
          </h2>
          <p className="mb-8 text-muted-foreground">
            Get your own producer page in 10 seconds. Upload beats, packs, or courses later.
          </p>

          {/* What you can do */}
          <div className="mb-8 grid grid-cols-2 gap-3 text-left">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <Upload className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Sample packs</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <Music className="h-4 w-4 text-pink-500" />
              <span className="text-sm">Beats & loops</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Courses</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <Video className="h-4 w-4 text-teal-500" />
              <span className="text-sm">Coaching</span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => setShowSetup(true)}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            Claim your producer name
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            Free to start. No credit card required.
          </p>
        </div>

        {/* Quick setup modal */}
        <QuickCreatorSetup
          open={showSetup}
          onOpenChange={setShowSetup}
          onComplete={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // User has store, show content
  return <>{children}</>;
}
