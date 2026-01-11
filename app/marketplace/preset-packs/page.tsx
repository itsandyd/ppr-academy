"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Grid3x3,
  List,
  TrendingUp,
  X,
  Settings,
  Package,
  Music,
  Layers,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const dynamic = "force-dynamic";

// Plugin options for filtering
const PLUGINS = [
  { value: "all", label: "All Plugins" },
  { value: "serum", label: "Serum" },
  { value: "vital", label: "Vital" },
  { value: "massive", label: "Massive" },
  { value: "massive-x", label: "Massive X" },
  { value: "omnisphere", label: "Omnisphere" },
  { value: "sylenth1", label: "Sylenth1" },
  { value: "phase-plant", label: "Phase Plant" },
  { value: "pigments", label: "Pigments" },
  { value: "diva", label: "Diva" },
  { value: "ableton-wavetable", label: "Ableton Wavetable" },
  { value: "fl-sytrus", label: "FL Sytrus" },
  { value: "other", label: "Other" },
];

// DAW options for filtering
const DAWS = [
  { value: "all", label: "All DAWs" },
  { value: "ableton", label: "Ableton Live" },
  { value: "fl-studio", label: "FL Studio" },
  { value: "logic", label: "Logic Pro" },
  { value: "bitwig", label: "Bitwig Studio" },
  { value: "studio-one", label: "Studio One" },
  { value: "multi-daw", label: "Multi-DAW" },
];

// Genre options
const GENRES = [
  "All Genres",
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "Electronic",
  "House",
  "Techno",
  "Dubstep",
  "Lo-Fi",
  "Future Bass",
  "Ambient",
  "Cinematic",
];

export default function PresetPacksMarketplacePage() {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<string | undefined>();
  const [selectedDaw, setSelectedDaw] = useState<string | undefined>();
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "newest" | "popular" | "price-low" | "price-high"
  >("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Query preset packs with filters
  const presetPacks =
    useQuery(api.presetPacks.listPublished, {
      limit: 100,
      targetPlugin:
        selectedPlugin && selectedPlugin !== "all" ? selectedPlugin : undefined,
      dawType: selectedDaw && selectedDaw !== "all" ? selectedDaw : undefined,
      priceFilter: showFreeOnly ? "free" : "all",
      searchQuery: searchTerm || undefined,
      genre:
        selectedGenre && selectedGenre !== "All Genres"
          ? selectedGenre
          : undefined,
      sortBy,
    }) || [];

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPlugin, selectedDaw, selectedGenre, showFreeOnly, sortBy]);

  // Pagination
  const total = presetPacks.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginatedPacks = presetPacks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Active filters count
  const activeFiltersCount = [
    selectedPlugin && selectedPlugin !== "all",
    selectedDaw && selectedDaw !== "all",
    selectedGenre && selectedGenre !== "All Genres",
    showFreeOnly,
    searchTerm,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPlugin(undefined);
    setSelectedDaw(undefined);
    setSelectedGenre(undefined);
    setShowFreeOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-purple-500/5 to-background pt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Settings className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-500">
                Preset Packs
              </span>
            </motion.div>
            <motion.h1
              className="mb-4 text-4xl font-bold md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Professional Synth Presets
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Unlock your creativity with professionally designed presets for
              Serum, Vital, Massive, and more. Instant sound design for your
              productions.
            </motion.p>
          </div>

          {/* Search */}
          <motion.div
            className="relative mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search presets, plugins, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </motion.div>
        </div>
      </section>

      {/* Filters & Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Plugin Filter */}
            <Select
              value={selectedPlugin || "all"}
              onValueChange={(v) =>
                setSelectedPlugin(v === "all" ? undefined : v)
              }
            >
              <SelectTrigger className="w-[160px] bg-white dark:bg-black">
                <Settings className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Plugin" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {PLUGINS.map((plugin) => (
                  <SelectItem key={plugin.value} value={plugin.value}>
                    {plugin.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DAW Filter */}
            <Select
              value={selectedDaw || "all"}
              onValueChange={(v) => setSelectedDaw(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-black">
                <Music className="mr-2 h-4 w-4" />
                <SelectValue placeholder="DAW" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {DAWS.map((daw) => (
                  <SelectItem key={daw.value} value={daw.value}>
                    {daw.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Genre Filter */}
            <Select
              value={selectedGenre || "All Genres"}
              onValueChange={(v) =>
                setSelectedGenre(v === "All Genres" ? undefined : v)
              }
            >
              <SelectTrigger className="w-[140px] bg-white dark:bg-black">
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

            {/* Free Toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 dark:bg-black">
              <Switch
                id="free-only"
                checked={showFreeOnly}
                onCheckedChange={setShowFreeOnly}
              />
              <Label htmlFor="free-only" className="text-sm">
                Free Only
              </Label>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
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
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "preset pack" : "preset packs"} found
          </p>
        </div>

        {/* Grid/List of Preset Packs */}
        {paginatedPacks.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-4"
              }
            >
              {paginatedPacks.map((pack: any, index: number) => (
                <PresetPackCard
                  key={pack._id}
                  pack={pack}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Pagination */}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No preset packs found</h3>
            <p className="mb-6 text-muted-foreground">
              Try adjusting your filters or check back soon for new presets
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={clearFilters}>Clear All Filters</Button>
              <Link href="/marketplace">
                <Button variant="outline">Browse Marketplace</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper function to get plugin display name
function getPluginLabel(plugin: string): string {
  const pluginMap: Record<string, string> = {
    serum: "Serum",
    vital: "Vital",
    massive: "Massive",
    "massive-x": "Massive X",
    omnisphere: "Omnisphere",
    sylenth1: "Sylenth1",
    "phase-plant": "Phase Plant",
    pigments: "Pigments",
    diva: "Diva",
    "ana-2": "ANA 2",
    spire: "Spire",
    "ableton-wavetable": "Wavetable",
    "ableton-operator": "Operator",
    "fl-sytrus": "Sytrus",
    "fl-harmor": "Harmor",
    fabfilter: "FabFilter",
    soundtoys: "Soundtoys",
    valhalla: "Valhalla",
    other: "Other",
  };
  return pluginMap[plugin] || plugin;
}

// Preset Pack Card Component
function PresetPackCard({
  pack,
  index,
  viewMode,
}: {
  pack: any;
  index: number;
  viewMode: "grid" | "list";
}) {
  const presetCount = pack.presetCount || 0;

  if (viewMode === "list") {
    return (
      <Link href={`/marketplace/preset-packs/${pack.slug || pack._id}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex">
              <div className="relative h-32 w-32 flex-shrink-0">
                {pack.imageUrl ? (
                  <Image
                    src={pack.imageUrl}
                    alt={pack.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Settings className="h-8 w-8 text-purple-500" />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="mb-1 line-clamp-1 font-semibold">
                    {pack.title}
                  </h3>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {pack.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    {pack.targetPlugin && (
                      <Badge variant="secondary">
                        {getPluginLabel(pack.targetPlugin)}
                      </Badge>
                    )}
                    {presetCount > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Layers className="h-3 w-3" />
                        {presetCount} presets
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-purple-500">
                    {pack.price === 0 ? "Free" : `$${pack.price.toFixed(2)}`}
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
    <Link href={`/marketplace/preset-packs/${pack.slug || pack._id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card className="group overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-square">
            {pack.imageUrl ? (
              <Image
                src={pack.imageUrl}
                alt={pack.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Settings className="h-16 w-16 text-purple-500" />
              </div>
            )}
            {pack.price === 0 && (
              <Badge className="absolute left-3 top-3 bg-green-500">Free</Badge>
            )}
            {pack.targetPlugin && (
              <Badge
                variant="secondary"
                className="absolute right-3 top-3 bg-white/90 text-black"
              >
                {getPluginLabel(pack.targetPlugin)}
              </Badge>
            )}
            {presetCount > 0 && (
              <Badge className="absolute bottom-3 left-3 bg-purple-500">
                {presetCount} Presets
              </Badge>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-purple-500">
              {pack.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {pack.description}
            </p>

            <div className="mb-3 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={pack.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white">
                  {pack.creatorName?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {pack.creatorName || "Creator"}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xl font-bold text-purple-500">
                {pack.price === 0 ? "Free" : `$${pack.price.toFixed(2)}`}
              </span>
              <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
