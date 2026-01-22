"use client";

import { useReleaseCreation } from "../context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Link2,
  Music,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// Platform configurations
const platforms = [
  {
    id: "spotify",
    name: "Spotify",
    icon: "🟢",
    color: "bg-[#1DB954]/10 border-[#1DB954]/30 hover:border-[#1DB954]",
    activeColor: "bg-[#1DB954]/20 border-[#1DB954]",
    placeholder: "spotify:album:xxxxx or https://open.spotify.com/...",
    field: "spotifyUri",
    priority: 1,
    description: "Primary streaming platform",
  },
  {
    id: "appleMusic",
    name: "Apple Music",
    icon: "🍎",
    color: "bg-[#FC3C44]/10 border-[#FC3C44]/30 hover:border-[#FC3C44]",
    activeColor: "bg-[#FC3C44]/20 border-[#FC3C44]",
    placeholder: "https://music.apple.com/...",
    field: "appleMusicUrl",
    priority: 2,
    description: "Apple ecosystem",
  },
  {
    id: "youtube",
    name: "YouTube Music",
    icon: "▶️",
    color: "bg-[#FF0000]/10 border-[#FF0000]/30 hover:border-[#FF0000]",
    activeColor: "bg-[#FF0000]/20 border-[#FF0000]",
    placeholder: "https://music.youtube.com/...",
    field: "youtubeUrl",
    priority: 3,
    description: "YouTube Music & videos",
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    icon: "☁️",
    color: "bg-[#FF5500]/10 border-[#FF5500]/30 hover:border-[#FF5500]",
    activeColor: "bg-[#FF5500]/20 border-[#FF5500]",
    placeholder: "https://soundcloud.com/...",
    field: "soundcloudUrl",
    priority: 4,
    description: "Independent artists",
  },
  {
    id: "tidal",
    name: "TIDAL",
    icon: "🌊",
    color: "bg-[#000000]/10 border-[#000000]/30 hover:border-[#000000]",
    activeColor: "bg-[#000000]/20 border-[#000000]",
    placeholder: "https://tidal.com/...",
    field: "tidalUrl",
    priority: 5,
    description: "High-fidelity streaming",
  },
  {
    id: "deezer",
    name: "Deezer",
    icon: "🎧",
    color: "bg-[#FEAA2D]/10 border-[#FEAA2D]/30 hover:border-[#FEAA2D]",
    activeColor: "bg-[#FEAA2D]/20 border-[#FEAA2D]",
    placeholder: "https://deezer.com/...",
    field: "deezerUrl",
    priority: 6,
    description: "Global streaming",
  },
  {
    id: "amazonMusic",
    name: "Amazon Music",
    icon: "📦",
    color: "bg-[#FF9900]/10 border-[#FF9900]/30 hover:border-[#FF9900]",
    activeColor: "bg-[#FF9900]/20 border-[#FF9900]",
    placeholder: "https://music.amazon.com/...",
    field: "amazonMusicUrl",
    priority: 7,
    description: "Amazon ecosystem",
  },
  {
    id: "bandcamp",
    name: "Bandcamp",
    icon: "🎸",
    color: "bg-[#629AA9]/10 border-[#629AA9]/30 hover:border-[#629AA9]",
    activeColor: "bg-[#629AA9]/20 border-[#629AA9]",
    placeholder: "https://yourname.bandcamp.com/...",
    field: "bandcampUrl",
    priority: 8,
    description: "Direct fan support",
  },
];

export function ReleasePlatformsForm() {
  const { state, updateData } = useReleaseCreation();

  const getPlatformValue = (field: string): string => {
    return (state.data as Record<string, any>)[field] || "";
  };

  const handlePlatformChange = (field: string, value: string) => {
    updateData("platforms", { [field]: value });
  };

  // Count connected platforms
  const connectedPlatforms = platforms.filter(
    (p) => getPlatformValue(p.field).trim() !== ""
  ).length;

  // Check if at least one major platform is connected
  const hasMajorPlatform =
    getPlatformValue("spotifyUri").trim() !== "" ||
    getPlatformValue("appleMusicUrl").trim() !== "";

  return (
    <div className="space-y-6">
      {/* Smart Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Smart Link (Optional)
          </CardTitle>
          <CardDescription>
            A single link that redirects fans to their preferred platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smartLink">Smart Link URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="smartLink"
                placeholder="https://linktr.ee/yourartist or https://ffm.to/yourtrack"
                className="pl-10"
                value={state.data.smartLinkUrl || ""}
                onChange={(e) => updateData("platforms", { smartLinkUrl: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Services like Linkfire, Feature.fm, Linktr.ee, or ToneDen
            </p>
          </div>

          {state.data.smartLinkUrl && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Smart link detected! Fans will be redirected to their preferred platform automatically.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Platform Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-blue-500" />
            Streaming Platforms
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Add links to where fans can stream your release</span>
            <Badge variant={hasMajorPlatform ? "default" : "secondary"}>
              {connectedPlatforms} connected
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasMajorPlatform && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Add at least one major platform (Spotify or Apple Music) or a Smart Link to continue.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {platforms.map((platform) => {
              const value = getPlatformValue(platform.field);
              const isActive = value.trim() !== "";

              return (
                <div
                  key={platform.id}
                  className={cn(
                    "rounded-lg border-2 p-4 transition-all",
                    isActive ? platform.activeColor : platform.color
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{platform.icon}</span>
                      <div>
                        <span className="font-medium">{platform.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {platform.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <Input
                    placeholder={platform.placeholder}
                    value={value}
                    onChange={(e) => handlePlatformChange(platform.field, e.target.value)}
                    className="bg-background"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pre-save Specific Info */}
      {(state.data.spotifyUri || state.data.appleMusicUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-purple-500" />
              Pre-Save Configuration
            </CardTitle>
            <CardDescription>
              Additional IDs for automatic pre-save functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state.data.spotifyUri && (
              <div className="space-y-2">
                <Label htmlFor="spotifyAlbumId">Spotify Album/Track ID</Label>
                <Input
                  id="spotifyAlbumId"
                  placeholder="Extract from Spotify URI (e.g., 4cOdK2wGLETKBW3PvgPWqT)"
                  value={state.data.spotifyAlbumId || ""}
                  onChange={(e) =>
                    updateData("platforms", { spotifyAlbumId: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Found in your Spotify for Artists dashboard or the share URL
                </p>
              </div>
            )}

            {state.data.appleMusicUrl && (
              <div className="space-y-2">
                <Label htmlFor="appleMusicAlbumId">Apple Music Album ID</Label>
                <Input
                  id="appleMusicAlbumId"
                  placeholder="e.g., 1234567890"
                  value={state.data.appleMusicAlbumId || ""}
                  onChange={(e) =>
                    updateData("platforms", { appleMusicAlbumId: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Found in your Apple Music for Artists dashboard
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Pro Tips
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Spotify and Apple Music are the most important platforms for pre-saves</li>
            <li>• Get your links from your distributor (DistroKid, TuneCore, etc.) before release</li>
            <li>• A smart link is great for social media bios and printed materials</li>
            <li>• Add platform links as they become available - you can update anytime</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
