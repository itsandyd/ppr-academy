"use client";

import { useState, useRef, useEffect } from "react";
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
  Play,
  Pause,
  Music2,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  X,
  Clock,
  ShoppingCart,
  Disc3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const dynamic = "force-dynamic";

const GENRES = [
  "All Genres",
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "Drill",
  "Lo-Fi",
  "Afrobeat",
  "Dancehall",
  "Reggaeton",
  "Electronic",
];

const BPM_RANGES = [
  { value: "all", label: "Any BPM" },
  { value: "60-90", label: "60-90 BPM" },
  { value: "90-120", label: "90-120 BPM" },
  { value: "120-140", label: "120-140 BPM" },
  { value: "140-160", label: "140-160 BPM" },
  { value: "160+", label: "160+ BPM" },
];

const LICENSE_TYPES = [
  { value: "all", label: "All Licenses" },
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "exclusive", label: "Exclusive" },
];

export default function BeatsMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(undefined);
  const [selectedBpmRange, setSelectedBpmRange] = useState<string | undefined>(undefined);
  const [selectedLicense, setSelectedLicense] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<
    "free" | "under-50" | "50-100" | "over-100" | undefined
  >(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [playingBeat, setPlayingBeat] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // @ts-ignore TS2589 - Type instantiation is excessively deep (pre-existing Convex API type issue)
  const allProducts: any = useQuery(api.digitalProducts.getAllPublishedProducts) || [];

  const beats = allProducts.filter(
    (p: any) => p.productCategory === "beat-lease" || p.productType === "beat-lease"
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGenre, selectedBpmRange, selectedLicense, priceRange, sortBy]);

  let filteredBeats = beats;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredBeats = filteredBeats.filter(
      (beat: any) =>
        beat.title?.toLowerCase().includes(term) ||
        beat.description?.toLowerCase().includes(term) ||
        beat.creatorName?.toLowerCase().includes(term)
    );
  }

  if (selectedGenre && selectedGenre !== "All Genres") {
    filteredBeats = filteredBeats.filter(
      (beat: any) => beat.genres?.includes(selectedGenre) || beat.genre?.includes(selectedGenre)
    );
  }

  if (priceRange) {
    filteredBeats = filteredBeats.filter((beat: any) => {
      const price = beat.price || 0;
      switch (priceRange) {
        case "free":
          return price === 0;
        case "under-50":
          return price > 0 && price < 5000;
        case "50-100":
          return price >= 5000 && price <= 10000;
        case "over-100":
          return price > 10000;
        default:
          return true;
      }
    });
  }

  const total = filteredBeats.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginatedBeats = filteredBeats.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePlayPause = (beat: any) => {
    const audioUrl = beat.previewUrl || beat.audioUrl || beat.downloadUrl;
    if (!audioUrl) return;

    if (playingBeat?._id === beat._id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingBeat(beat);
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const activeFiltersCount = [
    selectedGenre && selectedGenre !== "All Genres",
    selectedBpmRange && selectedBpmRange !== "all",
    selectedLicense && selectedLicense !== "all",
    priceRange,
    searchTerm,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGenre(undefined);
    setSelectedBpmRange(undefined);
    setSelectedLicense(undefined);
    setPriceRange(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      <audio ref={audioRef} />

      <section className="border-b border-border bg-gradient-to-b from-orange-500/5 to-background pt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Disc3 className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">Beat Leases</span>
            </motion.div>
            <motion.h1
              className="mb-4 text-4xl font-bold md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Find Your Sound
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              License professional beats from top producers. From trap to lo-fi, find the perfect
              instrumental for your next track.
            </motion.p>
          </div>

          <motion.div
            className="relative mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search beats, producers, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedGenre || "All Genres"}
              onValueChange={(v) => setSelectedGenre(v === "All Genres" ? undefined : v)}
            >
              <SelectTrigger className="w-[160px] bg-white dark:bg-black">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedBpmRange || "all"}
              onValueChange={(v) => setSelectedBpmRange(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[140px] bg-white dark:bg-black">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="BPM" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {BPM_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedLicense || "all"}
              onValueChange={(v) => setSelectedLicense(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-black">
                <SelectValue placeholder="License" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {LICENSE_TYPES.map((license) => (
                  <SelectItem key={license.value} value={license.value}>
                    {license.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priceRange || "all"}
              onValueChange={(v) => setPriceRange(v === "all" ? undefined : (v as any))}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-black">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="under-50">Under $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="over-100">Over $100</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-black">
                <TrendingUp className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

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
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "beat" : "beats"} found
          </p>
        </div>

        {paginatedBeats.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {paginatedBeats.map((beat: any, index: number) => (
                <BeatCard
                  key={beat._id}
                  beat={beat}
                  index={index}
                  viewMode={viewMode}
                  isPlaying={playingBeat?._id === beat._id && isPlaying}
                  onPlayPause={() => handlePlayPause(beat)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <Disc3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No beats found</h3>
            <p className="mb-6 text-muted-foreground">
              Try adjusting your filters or check back soon for new beats
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={clearFilters}>Clear All Filters</Button>
              <Link href="/marketplace/creators">
                <Button variant="outline">Browse Producers</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function BeatCard({
  beat,
  index,
  viewMode,
  isPlaying,
  onPlayPause,
}: {
  beat: any;
  index: number;
  viewMode: "grid" | "list";
  isPlaying: boolean;
  onPlayPause: () => void;
}) {
  if (viewMode === "list") {
    return (
      <Link href={`/marketplace/beats/${beat.slug || beat._id}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex items-center">
              <div className="relative h-20 w-20 flex-shrink-0">
                {beat.imageUrl ? (
                  <Image
                    src={beat.imageUrl}
                    alt={beat.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    <Music2 className="h-6 w-6 text-orange-500" />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant={isPlaying ? "default" : "outline"}
                    className="h-10 w-10 rounded-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPlayPause();
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div>
                    <h3 className="font-semibold">{beat.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {beat.creatorName || "Producer"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {beat.bpm && <Badge variant="outline">{beat.bpm} BPM</Badge>}
                  {beat.genres?.[0] && <Badge variant="secondary">{beat.genres[0]}</Badge>}
                  <span className="text-lg font-bold text-orange-500">
                    {beat.price === 0 ? "Free" : `$${(beat.price / 100).toFixed(2)}`}
                  </span>
                  <Button size="sm">View Details</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/marketplace/beats/${beat.slug || beat._id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card className="group overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-square">
            {beat.imageUrl ? (
              <Image
                src={beat.imageUrl}
                alt={beat.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Music2 className="h-16 w-16 text-orange-500" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-white/90 text-black hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPlayPause();
                }}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
            </div>
            {beat.bpm && (
              <Badge className="absolute right-3 top-3 bg-black/70 text-white">
                {beat.bpm} BPM
              </Badge>
            )}
            {beat.price === 0 && <Badge className="absolute left-3 top-3 bg-green-500">Free</Badge>}
          </div>

          <CardContent className="p-4">
            <h3 className="mb-1 line-clamp-1 font-semibold transition-colors group-hover:text-orange-500">
              {beat.title}
            </h3>

            {beat.genres && beat.genres.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {beat.genres.slice(0, 2).map((genre: string) => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mb-3 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={beat.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-xs text-white">
                  {beat.creatorName?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {beat.creatorName || "Producer"}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xl font-bold text-orange-500">
                {beat.price === 0 ? "Free" : `$${(beat.price / 100).toFixed(2)}`}
              </span>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
