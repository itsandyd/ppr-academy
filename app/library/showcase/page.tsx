"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Music, Play, Share2, Edit, Plus, ExternalLink, Instagram, Twitter, Sparkles } from "lucide-react";
import Link from "next/link";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";

export default function ShowcasePage() {
  const { user } = useUser();
  
  const tracks = useQuery(
    api.tracks.getUserTracks,
    user?.id ? { userId: user.id } : "skip"
  );

  const publicTracks = tracks?.filter(t => t.isPublic) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Profile */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="w-24 h-24 border-4 border-white/20">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-2xl bg-white/20">
                {user?.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {user?.firstName || user?.fullName || "My Showcase"}
              </h1>
              <p className="text-white/80 mb-4">
                Music Producer • {publicTracks.length} {publicTracks.length === 1 ? 'Track' : 'Tracks'}
              </p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" className="gap-2 border-white/40 text-white hover:bg-white/10">
                  <Share2 className="w-4 h-4" />
                  Share Showcase
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{publicTracks.length}</div>
              <div className="text-sm text-white/80">Tracks</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {publicTracks.reduce((sum, t) => sum + (t.plays || 0), 0)}
              </div>
              <div className="text-sm text-white/80">Total Plays</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-white/80">Followers</div>
            </div>
          </div>
        </div>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
        </div>
      </div>

      {/* Tracks Grid */}
      {publicTracks.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Tracks</h2>
            <Button asChild>
              <Link href="/library/share">
                <Plus className="w-4 h-4 mr-2" />
                Add Track
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicTracks.map((track) => (
              <Card key={track._id} className="group hover:shadow-lg transition-all">
                <CardContent className="p-4 space-y-3">
                  {/* Cover/Thumbnail */}
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-16 h-16 text-purple-400" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button size="lg" className="rounded-full">
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div>
                    <h3 className="font-semibold line-clamp-1">{track.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
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
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <EmptyStateEnhanced
          icon={Music}
          title="No tracks yet"
          description="Start building your showcase by sharing your first track. Your music deserves to be heard!"
          actions={[
            {
              label: "Share Your First Track",
              href: "/library/share",
              icon: Plus
            }
          ]}
          tips={[
            {
              icon: Music,
              title: "Start with Your Best",
              description: "Share your most polished track first to make a great first impression"
            },
            {
              icon: Sparkles,
              title: "Use AI to Promote",
              description: "Generate professional pitch emails to send to labels and curators"
            },
            {
              icon: ExternalLink,
              title: "Share Everywhere",
              description: "Add your showcase link to Instagram, TikTok, and other social bios"
            }
          ]}
        />
      )}

      {/* Social Links */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Connect Your Socials</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </Button>
            <Button variant="outline" className="gap-2">
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            <Button variant="outline" className="gap-2">
              <Music className="w-4 h-4" />
              SoundCloud
            </Button>
            <Button variant="outline" className="gap-2">
              <Music className="w-4 h-4" />
              Spotify
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

