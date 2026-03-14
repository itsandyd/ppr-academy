"use client";

import { ArtistShowcase } from "@/components/music/artist-showcase";

interface ArtistProfileViewProps {
  displayName: string;
  userId: string;
}

export function ArtistProfileView({ displayName, userId }: ArtistProfileViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold">{displayName}</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">Music Showcase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Showcase Content */}
      <div className="container mx-auto px-4 py-8">
        <ArtistShowcase artistProfileId={userId} isOwner={false} />
      </div>
    </div>
  );
}
