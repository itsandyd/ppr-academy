"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Music,
  Play,
  Share2,
  Edit,
  Plus,
  ExternalLink,
  Instagram,
  Twitter,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";
import { useToast } from "@/hooks/use-toast";

export default function ShowcasePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showSocialDialog, setShowSocialDialog] = useState(false);
  const [selectedSocial, setSelectedSocial] = useState<
    "instagram" | "twitter" | "soundcloud" | "spotify" | null
  >(null);
  const [socialUrl, setSocialUrl] = useState("");

  const tracks = useQuery(api.tracks.getUserTracks, user?.id ? { userId: user.id } : "skip");

  const publicTracks = tracks?.filter((t: any) => t.isPublic) || [];

  const handleConnectSocial = (platform: "instagram" | "twitter" | "soundcloud" | "spotify") => {
    setSelectedSocial(platform);
    setShowSocialDialog(true);
  };

  const handleSaveSocial = () => {
    // TODO: Save to showcase profile
    toast({
      title: "Social Link Saved!",
      description: `Your ${selectedSocial} profile has been connected`,
      className: "bg-white dark:bg-black",
    });
    setShowSocialDialog(false);
    setSocialUrl("");
    setSelectedSocial(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header with Profile */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 text-white">
        <div className="relative z-10">
          <div className="mb-6 flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-white/20">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="bg-white/20 text-2xl">
                {user?.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold">
                {user?.firstName || user?.fullName || "My Showcase"}
              </h1>
              <p className="mb-4 text-white/80">
                Music Producer • {publicTracks.length}{" "}
                {publicTracks.length === 1 ? "Track" : "Tracks"}
              </p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-white/40 text-white hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" />
                  Share Showcase
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{publicTracks.length}</div>
              <div className="text-sm text-white/80">Tracks</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">
                {publicTracks.reduce((sum: number, t: any) => sum + (t.plays || 0), 0)}
              </div>
              <div className="text-sm text-white/80">Total Plays</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-white/80">Followers</div>
            </div>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-32 translate-x-32 rounded-full bg-white"></div>
          <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-24 translate-y-24 rounded-full bg-white"></div>
        </div>
      </div>

      {/* Tracks Grid */}
      {publicTracks.length > 0 ? (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Tracks</h2>
            <Button asChild>
              <Link href="/library/share">
                <Plus className="mr-2 h-4 w-4" />
                Add Track
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicTracks.map((track: any) => (
              <Card key={track._id} className="group transition-all hover:shadow-lg">
                <CardContent className="space-y-3 p-4">
                  {/* Cover/Thumbnail */}
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                    {track.coverUrl ? (
                      <Image
                        src={track.coverUrl}
                        alt={track.title}
                        width={400}
                        height={400}
                        className="h-full w-full object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <Music className="h-16 w-16 text-purple-400" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-colors group-hover:bg-black/20 group-hover:opacity-100">
                      <Button size="lg" className="rounded-full">
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div>
                    <h3 className="line-clamp-1 font-semibold">{track.title}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {track.artist || "Unknown Artist"}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2">
                    {track.genre && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {track.genre}
                      </Badge>
                    )}
                    {track.mood && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {track.mood}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{track.plays || 0} plays</span>
                    <span>{track.likes || 0} likes</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="mr-1 h-3 w-3" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <EmptyStateEnhanced
            icon={Music}
            title="No tracks yet"
            description="Start building your showcase by sharing your first track. Your music deserves to be heard!"
            actions={[
              {
                label: "Share Your First Track",
                href: "/library/share",
                icon: Plus,
              },
              {
                label: "Copy Showcase Link",
                onClick: () => {
                  const showcaseUrl = `${window.location.origin}/showcase/${user?.id}`;
                  navigator.clipboard.writeText(showcaseUrl);
                  toast({
                    title: "Link Copied!",
                    description: "Share this link on your social media",
                    className: "bg-white dark:bg-black",
                  });
                },
                icon: Share2,
                variant: "outline",
              },
            ]}
            tips={[
              {
                icon: Music,
                title: "Start with Your Best",
                description:
                  "Share your most polished track first to make a great first impression",
              },
              {
                icon: Sparkles,
                title: "Use AI to Promote",
                description: "Generate professional pitch emails to send to labels and curators",
              },
              {
                icon: ExternalLink,
                title: "Share Everywhere",
                description: "Add your showcase link to Instagram, TikTok, and other social bios",
              },
            ]}
          />

          {/* Connect Socials Section - Always Visible */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                Connect Your Socials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Link your social profiles to your showcase so fans can follow you everywhere
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleConnectSocial("instagram")}
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleConnectSocial("twitter")}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleConnectSocial("soundcloud")}
                >
                  <Music className="h-4 w-4" />
                  SoundCloud
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleConnectSocial("spotify")}
                >
                  <Music className="h-4 w-4" />
                  Spotify
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Social Links - Only show when user has tracks */}
      {publicTracks.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Connect Your Socials</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleConnectSocial("instagram")}
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleConnectSocial("twitter")}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleConnectSocial("soundcloud")}
              >
                <Music className="h-4 w-4" />
                SoundCloud
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleConnectSocial("spotify")}
              >
                <Music className="h-4 w-4" />
                Spotify
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Connection Dialog */}
      <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              {selectedSocial === "instagram" && <Instagram className="h-5 w-5" />}
              {selectedSocial === "twitter" && <Twitter className="h-5 w-5" />}
              {selectedSocial === "soundcloud" && <Music className="h-5 w-5" />}
              {selectedSocial === "spotify" && <Music className="h-5 w-5" />}
              Connect {selectedSocial}
            </DialogTitle>
            <DialogDescription>
              Enter your {selectedSocial} profile URL or username
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="social-url">
                {selectedSocial === "instagram" && "Instagram URL"}
                {selectedSocial === "twitter" && "Twitter URL"}
                {selectedSocial === "soundcloud" && "SoundCloud URL"}
                {selectedSocial === "spotify" && "Spotify Artist URL"}
              </Label>
              <Input
                id="social-url"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder={
                  selectedSocial === "instagram"
                    ? "https://instagram.com/yourusername"
                    : selectedSocial === "twitter"
                      ? "https://twitter.com/yourusername"
                      : selectedSocial === "soundcloud"
                        ? "https://soundcloud.com/yourusername"
                        : "https://open.spotify.com/artist/..."
                }
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This will appear on your public showcase profile
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSocialDialog(false);
                  setSocialUrl("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSocial} disabled={!socialUrl.trim()} className="flex-1">
                Save Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
