"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  List,
  Grid3x3,
  List as ListIcon,
  Music,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const GENRE_OPTIONS = [
  { value: "all", label: "All Genres" },
  { value: "Electronic", label: "Electronic" },
  { value: "Hip-Hop", label: "Hip-Hop" },
  { value: "House", label: "House" },
  { value: "Techno", label: "Techno" },
  { value: "Trap", label: "Trap" },
  { value: "Lo-Fi", label: "Lo-Fi" },
  { value: "Ambient", label: "Ambient" },
  { value: "Pop", label: "Pop" },
  { value: "R&B", label: "R&B" },
];

export default function PlaylistsMarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();

  const playlists =
    useQuery(api.playlists.getPlaylistsAcceptingSubmissions, {
      genre: selectedGenre && selectedGenre !== "all" ? selectedGenre : undefined,
      limit: 50,
    }) || [];

  // Filter by search term
  const filteredPlaylists = playlists.filter((playlist: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      playlist.name.toLowerCase().includes(search) ||
      (playlist.description || "").toLowerCase().includes(search) ||
      (playlist.creatorName || "").toLowerCase().includes(search)
    );
  });

  const activeFiltersCount = [selectedGenre && selectedGenre !== "all", searchTerm].filter(
    Boolean
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <List className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">Playlist Curation</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Submit Your Music
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Get your tracks featured on curated playlists. Connect with curators and grow your
              audience.
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search playlists by name, genre, or curator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 border-2 border-border bg-background/80 pl-12 pr-4 text-base backdrop-blur-sm transition-all focus:border-purple-500"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-4 border-border bg-card">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedGenre(undefined);
                      }}
                      className="text-xs"
                    >
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Genre Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <Select
                    value={selectedGenre || "all"}
                    onValueChange={(v) => setSelectedGenre(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {GENRE_OPTIONS.map((genre) => (
                        <SelectItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="text-2xl font-bold">{filteredPlaylists.length}</div>
                  <div className="text-sm text-muted-foreground">
                    playlists accepting submissions
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Playlists</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Playlists Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredPlaylists.map((playlist: any, index: number) => (
                  <PlaylistCard key={playlist._id} playlist={playlist} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPlaylists.map((playlist: any, index: number) => (
                  <PlaylistListItem key={playlist._id} playlist={playlist} index={index} />
                ))}
              </div>
            )}

            {filteredPlaylists.length === 0 && (
              <Card className="p-12 text-center">
                <List className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No playlists found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Playlist Card Component
function PlaylistCard({ playlist, index }: { playlist: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/playlists/${playlist.customSlug || playlist._id}`}>
        <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl">
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            {playlist.coverUrl ? (
              <Image
                src={playlist.coverUrl}
                alt={playlist.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <List className="h-16 w-16 text-purple-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badges */}
            <div className="absolute left-3 top-3 flex gap-2">
              {playlist.submissionPricing?.isFree ? (
                <Badge className="bg-green-500 text-white">Free</Badge>
              ) : (
                <Badge className="bg-purple-500 text-white">
                  ${playlist.submissionPricing?.price || 10}
                </Badge>
              )}
            </div>

            {/* Track Count */}
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="gap-1">
                <Music className="h-3 w-3" />
                {playlist.trackCount || 0} tracks
              </Badge>
            </div>
          </div>

          <CardContent className="space-y-4 p-5">
            {/* Title */}
            <div>
              <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-purple-600">
                {playlist.name}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{playlist.description}</p>
            </div>

            {/* Genres */}
            {playlist.genres && playlist.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {playlist.genres.slice(0, 3).map((genre: string) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {playlist.genres.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{playlist.genres.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Creator & Stats */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={playlist.creatorAvatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white">
                    {playlist.creatorName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{playlist.creatorName}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{playlist.submissionSLA || 7}d review</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// Playlist List Item
function PlaylistListItem({ playlist, index }: { playlist: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link href={`/playlists/${playlist.customSlug || playlist._id}`}>
        <Card className="cursor-pointer border-border transition-colors hover:bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                {playlist.coverUrl ? (
                  <Image
                    src={playlist.coverUrl}
                    alt={playlist.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <List className="h-8 w-8 text-purple-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{playlist.name}</div>
                <div className="text-sm text-muted-foreground">
                  by {playlist.creatorName} • {playlist.trackCount || 0} tracks
                </div>
              </div>
              <div className="flex items-center gap-2">
                {playlist.submissionPricing?.isFree ? (
                  <Badge className="bg-green-500 text-xs text-white">Free</Badge>
                ) : (
                  <Badge className="bg-purple-500 text-xs text-white">
                    ${playlist.submissionPricing?.price || 10}
                  </Badge>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {playlist.submissionSLA || 7}d review
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
