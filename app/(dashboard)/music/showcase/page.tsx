"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArtistShowcase } from '@/components/music/artist-showcase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Plus, Settings, ExternalLink, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function MusicShowcasePage() {
  const { user } = useUser();
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
        displayName: user.fullName,
        profileImage: user.imageUrl,
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
          <p className="text-muted-foreground">You need to be signed in to view your music showcase.</p>
        </div>
      </div>
    );
  }

  // Show create profile option if no profile exists
  if (artistProfile === null) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Your Music Showcase</CardTitle>
            <CardDescription>
              Set up your professional music profile to showcase your tracks and connect with your audience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Add Tracks</h3>
                <p className="text-xs text-muted-foreground">Paste URLs from Spotify, SoundCloud, YouTube</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <ExternalLink className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Share Profile</h3>
                <p className="text-xs text-muted-foreground">Get a custom URL to share your showcase</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Plus className="h-6 w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-sm">Promote Courses</h3>
                <p className="text-xs text-muted-foreground">Link tracks to your production courses</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button onClick={handleCreateProfile} size="lg">
                <Music className="mr-2 h-4 w-4" />
                Create Music Profile
              </Button>
            </div>
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
          <p className="text-muted-foreground">Loading your music showcase...</p>
        </div>
      </div>
    );
  }

  // Show the artist showcase
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Music Showcase</h1>
          <p className="text-muted-foreground">
            Manage your artist profile and track collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/music/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Track
            </Link>
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button asChild>
            <Link href={`/artist/${artistProfile.slug || artistProfile._id}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Public Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Artist Showcase Component */}
      <ArtistShowcase 
        artistProfileId={user.id} 
        isOwner={true}
      />
    </div>
  );
}
