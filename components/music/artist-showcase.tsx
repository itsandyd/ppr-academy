"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Play, Heart, Share2, ExternalLink, MapPin, Globe, Users, Eye } from "lucide-react";
import { getPlatformConfig, getPlatformDisplayName } from "@/lib/music-url-parser";

interface ArtistShowcaseProps {
  artistProfileId: string; // Clerk user ID, not Convex artistProfile ID
  isOwner?: boolean;
}

interface TrackCardProps {
  track: any;
  onPlay?: () => void;
  onLike?: () => void;
  onShare?: () => void;
}

function TrackCard({ track, onPlay, onLike, onShare }: TrackCardProps) {
  const platformConfig = getPlatformConfig(track.platform);

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Artwork */}
          <div className="relative">
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={`${track.title} artwork`}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                <Music className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="absolute inset-0 border-none bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              onClick={onPlay}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>

          {/* Track Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: platformConfig.color + "20",
                  color: platformConfig.color,
                }}
              >
                {platformConfig.icon} {getPlatformDisplayName(track.platform)}
              </Badge>
              <a
                href={track.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <h3 className="mb-1 truncate text-sm font-semibold">{track.title}</h3>
            <p className="mb-2 truncate text-xs text-gray-600">{track.artist}</p>

            {track.customGenre && (
              <Badge variant="outline" className="mb-2 text-xs">
                {track.customGenre}
              </Badge>
            )}

            {track.customDescription && (
              <p className="mb-2 line-clamp-2 text-xs text-gray-500">{track.customDescription}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {track.viewCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {track.likeCount || 0}
              </span>
              {track.duration && (
                <span>
                  {Math.floor(track.duration / 60)}:
                  {(track.duration % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="ghost" onClick={onLike}>
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Embed Player (shown on play) */}
        {track.embedUrl && (
          <div className="mt-4 hidden group-hover:block">
            <iframe
              src={track.embedUrl}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ArtistShowcase({ artistProfileId, isOwner = false }: ArtistShowcaseProps) {
  const artistProfile = useQuery(api.musicShowcase.getArtistProfile, {
    userId: artistProfileId,
  });

  const tracks = useQuery(
    api.musicShowcase.getArtistTracks,
    artistProfile
      ? {
          artistProfileId: artistProfile._id,
          publicOnly: !isOwner,
          limit: 20,
        }
      : "skip"
  );

  if (!artistProfile) {
    return (
      <div className="py-12 text-center">
        <Music className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h2 className="mb-2 text-xl font-semibold text-gray-600">No Artist Profile Found</h2>
        <p className="text-gray-500">This artist hasn't set up their music showcase yet.</p>
      </div>
    );
  }

  const handlePlayTrack = (_track: any) => {
    // POST-LAUNCH: Record play event in analytics table for artist stats
  };

  const handleLikeTrack = (_track: any) => {
    // POST-LAUNCH: Persist like to user favorites and increment track like count
  };

  const handleShareTrack = (track: any) => {
    // Handle share functionality
    if (navigator.share) {
      navigator.share({
        title: `${track.title} by ${track.artist}`,
        url: track.originalUrl,
      });
    } else {
      navigator.clipboard.writeText(track.originalUrl);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Artist Header */}
      <div className="relative">
        {/* Banner Image */}
        {artistProfile.bannerImage && (
          <div className="mb-6 h-48 overflow-hidden rounded-xl">
            <img
              src={artistProfile.bannerImage}
              alt="Artist banner"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Profile Info */}
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={artistProfile.profileImage} alt={artistProfile.artistName} />
            <AvatarFallback className="text-2xl">
              {artistProfile.artistName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold">
              {artistProfile.displayName || artistProfile.artistName}
            </h1>

            {artistProfile.location && (
              <p className="mb-2 flex items-center gap-1 text-gray-600">
                <MapPin className="h-4 w-4" />
                {artistProfile.location}
              </p>
            )}

            {artistProfile.bio && (
              <p className="mb-4 max-w-2xl text-gray-700">{artistProfile.bio}</p>
            )}

            {/* Stats */}
            <div className="mb-4 flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {artistProfile.totalViews || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {artistProfile.totalLikes || 0} likes
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {artistProfile.totalFollowers || 0} followers
              </span>
            </div>

            {/* Social Links */}
            {artistProfile.socialLinks && (
              <div className="mb-4 flex items-center gap-3">
                {Object.entries(artistProfile.socialLinks).map(([platform, url]) => {
                  if (!url || typeof url !== 'string') return null;
                  const config = getPlatformConfig(platform);
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 transition-colors hover:text-gray-800"
                      title={`${artistProfile.artistName} on ${getPlatformDisplayName(platform)}`}
                    >
                      <span className="text-lg">{config.icon}</span>
                    </a>
                  );
                })}
                {artistProfile.website && (
                  <a
                    href={artistProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 transition-colors hover:text-gray-800"
                    title="Artist website"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Follow
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks Section */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Music</h2>
          {isOwner && (
            <Button variant="outline">
              <Music className="mr-2 h-4 w-4" />
              Add Track
            </Button>
          )}
        </div>

        {tracks && tracks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {tracks.map((track: any) => (
              <TrackCard
                key={track._id}
                track={track}
                onPlay={() => handlePlayTrack(track)}
                onLike={() => handleLikeTrack(track)}
                onShare={() => handleShareTrack(track)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 py-12 text-center">
            <Music className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-600">No Tracks Yet</h3>
            <p className="mb-4 text-gray-500">
              {isOwner
                ? "Start building your showcase by adding your first track!"
                : "This artist hasn't added any tracks to their showcase yet."}
            </p>
            {isOwner && (
              <Button>
                <Music className="mr-2 h-4 w-4" />
                Add Your First Track
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
