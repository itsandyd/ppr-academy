"use client";

import React, { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ArtistProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Redirect from /artist/[slug] to /[slug] for unified slug route
 * This maintains backward compatibility for old artist profile URLs
 */
export default function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = use(params);
  const router = useRouter();
  
  // Redirect to unified /[slug] route
  useEffect(() => {
    router.replace(`/${slug}`);
  }, [slug, router]);
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4 md:p-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
