'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, Instagram, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardSocialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  
  const mode = searchParams.get('mode');

  // Redirect if not in create mode
  useEffect(() => {
    if (isLoaded && mode !== 'create') {
      router.replace('/dashboard?mode=learn');
    }
  }, [mode, isLoaded, router]);

  // Get user's stores
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : 'skip'
  );

  // Get the first store (same pattern as CreateModeContent)
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
  if (mode !== 'create') {
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
          <h1 className="text-3xl font-bold mb-2">Social Media</h1>
          <p className="text-muted-foreground">
            Schedule posts and automate Instagram DMs to grow your audience
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
                  Social media features require a creator store. Set up your store to start automating your Instagram DMs and scheduling posts.
                </p>
                <Button asChild>
                  <Link href="/dashboard?mode=create">
                    Set Up Your Store
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Instagram className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Why Use Social Media Automation?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Turn your Instagram followers into customers with automated DM responses and scheduled content.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
                <div className="bg-white dark:bg-black border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    🎵
                  </div>
                  <h4 className="font-semibold mb-2">Sample Pack Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    Comment "STEMS" → Auto-send download link via DM
                  </p>
                </div>

                <div className="bg-white dark:bg-black border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    🎓
                  </div>
                  <h4 className="font-semibold mb-2">Course Enrollment</h4>
                  <p className="text-sm text-muted-foreground">
                    DM "LEARN" → Smart AI guides them to checkout
                  </p>
                </div>

                <div className="bg-white dark:bg-black border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                    💎
                  </div>
                  <h4 className="font-semibold mb-2">Coaching Upsell</h4>
                  <p className="text-sm text-muted-foreground">
                    Comment "FEEDBACK" → Offer 1-on-1 booking
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show social media management UI
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media</h1>
        <p className="text-muted-foreground">
          Schedule posts and automate Instagram DMs to grow your audience
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <Wrench className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Social Media Features Coming Soon</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We're rebuilding the social media automation features. Check back soon for Instagram DM automation, post scheduling, and more.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard?mode=create">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

