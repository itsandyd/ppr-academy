"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AddTrackForm } from '@/components/music/add-track-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

export default function AddTrackPage() {
  const { user } = useUser();
  const router = useRouter();
  const createProfile = useMutation(api.musicShowcase.createArtistProfile);
  
  // Get or create artist profile
  const artistProfile = useQuery(
    api.musicShowcase.getArtistProfile, 
    user?.id ? { userId: user.id } : "skip"
  );

  const handleCreateProfile = async () => {
    if (!user?.id) return;
    
    try {
      await createProfile({
        userId: user.id,
        artistName: user.fullName || user.firstName || 'Unknown Artist',
        displayName: user.fullName ?? undefined,
        profileImage: user.imageUrl ?? undefined,
        slug: user.username || user.id.toLowerCase(),
      });
      
      toast({
        title: "Profile created!",
        description: "Your music showcase profile has been created successfully.",
      });
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast({
        title: "Failed to create profile",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleTrackAdded = () => {
    toast({
      title: "Track added successfully!",
      description: "Your track has been added to your showcase.",
    });
    router.push('/music/showcase');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">You need to be signed in to add tracks.</p>
        </div>
      </div>
    );
  }

  // Show create profile option if no profile exists
  if (artistProfile === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-0 py-8 md:py-12">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/music/showcase">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Music
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Your Music Profile First</CardTitle>
            <CardDescription>
              You need to set up your artist profile before you can add tracks to your showcase.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleCreateProfile} size="lg">
              <Music className="mr-2 h-4 w-4" />
              Create Music Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (artistProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show the add track form
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/music/showcase">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Showcase
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Add Track to Your Showcase</h1>
            <p className="text-muted-foreground">
              Paste a URL from Spotify, SoundCloud, YouTube, Apple Music, or Bandcamp
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                How it works
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                Simply paste any music URL and we'll automatically extract the track information for you.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                  <span>🎵</span> Spotify
                </div>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                  <span>🔊</span> SoundCloud
                </div>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                  <span>📺</span> YouTube
                </div>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                  <span>🍎</span> Apple Music
                </div>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                  <span>🎪</span> Bandcamp
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Track Form */}
      <AddTrackForm 
        artistProfileId={artistProfile._id}
        onSuccess={handleTrackAdded}
      />
    </div>
  );
}
