"use client";

import React, { use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArtistShowcase } from '@/components/music/artist-showcase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ArtistProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = use(params);
  
  // Get artist profile by slug
  const artistProfile = useQuery(api.musicShowcase.getArtistProfileBySlug, { slug });

  // Show loading state
  if (artistProfile === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading artist profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show 404 if profile not found
  if (artistProfile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="pt-12 pb-8">
                <Music className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
                <p className="text-muted-foreground mb-6">
                  The artist profile you're looking for doesn't exist or has been removed.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Home
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/sign-up">
                      Create Your Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show the artist profile
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to PPR Academy
                </Link>
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-semibold">{artistProfile.displayName || artistProfile.artistName}</h1>
                <p className="text-sm text-muted-foreground">Music Showcase</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Share Profile
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">
                  Create Your Own
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <ArtistShowcase 
          artistProfileId={artistProfile.userId} 
          isOwner={false}
        />
      </div>

      {/* Footer CTA */}
      <div className="border-t bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-2">Create Your Own Music Showcase</h2>
            <p className="text-muted-foreground mb-6">
              Join PPR Academy and build your professional music profile with course integration.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/">
                  Learn More
                </Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">
                  <Music className="mr-2 h-4 w-4" />
                  Get Started Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
