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
  Music,
  Filter,
  Waves,
  Cpu,
  Zap,
  Package,
  CheckCircle,
  X,
  Grid3x3,
  List as ListIcon,
  Signal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const ABLETON_VERSIONS = ["All Versions", "Live 9", "Live 10", "Live 11", "Live 12"];
const RACK_TYPES = ["All Types", "Audio Effect", "Instrument", "MIDI Effect", "Drum Rack"];
const CPU_LOADS = ["All", "Low", "Medium", "High"];
const COMPLEXITY_LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const GENRES = [
  "All Genres",
  "Hip Hop",
  "Trap",
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "Lo-Fi",
  "Ambient",
  "Indie",
  "Rock",
  "Jazz",
];

export default function AbletonRacksMarketplacePage() {
  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();
  const [selectedRackType, setSelectedRackType] = useState<string | undefined>();
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [selectedCpuLoad, setSelectedCpuLoad] = useState<string | undefined>();
  const [selectedComplexity, setSelectedComplexity] = useState<string | undefined>();

  // Audio player state
  const [playingRack, setPlayingRack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Convert UI selections to query params
  const rackTypeMap: Record<string, any> = {
    "Audio Effect": "audioEffect",
    Instrument: "instrument",
    "MIDI Effect": "midiEffect",
    "Drum Rack": "drumRack",
  };

  const cpuLoadMap: Record<string, any> = {
    Low: "low",
    Medium: "medium",
    High: "high",
  };

  const complexityMap: Record<string, any> = {
    Beginner: "beginner",
    Intermediate: "intermediate",
    Advanced: "advanced",
  };

  // Query racks with filters
  const racks =
    useQuery(api.abletonRacks.getPublishedAbletonRacks, {
      rackType:
        selectedRackType && selectedRackType !== "All Types"
          ? rackTypeMap[selectedRackType]
          : undefined,
      abletonVersion:
        selectedVersion && selectedVersion !== "All Versions" ? selectedVersion : undefined,
      genre: selectedGenre && selectedGenre !== "All Genres" ? selectedGenre : undefined,
      cpuLoad:
        selectedCpuLoad && selectedCpuLoad !== "All" ? cpuLoadMap[selectedCpuLoad] : undefined,
      complexity:
        selectedComplexity && selectedComplexity !== "All Levels"
          ? complexityMap[selectedComplexity]
          : undefined,
      searchQuery: searchTerm || undefined,
    }) || [];

  // Audio player
  const handlePlayPause = (rack: any) => {
    if (!rack.demoAudioUrl) {
      toast.error("No audio preview available");
      return;
    }

    if (playingRack?._id === rack._id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = rack.demoAudioUrl;
        audioRef.current.play();
        setPlayingRack(rack);
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

  const handleRackClick = (rack: any) => {
    window.location.href = `/marketplace/ableton-racks/${rack.slug || rack._id}`;
  };

  const activeFiltersCount = [
    selectedVersion && selectedVersion !== "All Versions",
    selectedRackType && selectedRackType !== "All Types",
    selectedGenre && selectedGenre !== "All Genres",
    selectedCpuLoad && selectedCpuLoad !== "All",
    selectedComplexity && selectedComplexity !== "All Levels",
    searchTerm,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-chart-1/10 via-chart-2/10 to-chart-3/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-chart-1/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Waves className="h-5 w-5 text-chart-1" />
              <span className="text-sm font-semibold text-chart-1">Ableton Live Racks</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Audio Effect Racks
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Professional Ableton Live racks and presets from top producers
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search racks, effects, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 border-2 border-border bg-background/80 pl-12 pr-4 text-base backdrop-blur-sm transition-all focus:border-chart-1"
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
                        setSelectedVersion(undefined);
                        setSelectedRackType(undefined);
                        setSelectedGenre(undefined);
                        setSelectedCpuLoad(undefined);
                        setSelectedComplexity(undefined);
                      }}
                      className="text-xs"
                    >
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Ableton Version Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ableton Version</Label>
                  <Select
                    value={selectedVersion || "All Versions"}
                    onValueChange={(v) => setSelectedVersion(v === "All Versions" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {ABLETON_VERSIONS.map((version) => (
                        <SelectItem key={version} value={version}>
                          {version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rack Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rack Type</Label>
                  <Select
                    value={selectedRackType || "All Types"}
                    onValueChange={(v) => setSelectedRackType(v === "All Types" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {RACK_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Genre Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Genre</Label>
                  <Select
                    value={selectedGenre || "All Genres"}
                    onValueChange={(v) => setSelectedGenre(v === "All Genres" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CPU Load Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Cpu className="h-4 w-4" />
                    CPU Load
                  </Label>
                  <Select
                    value={selectedCpuLoad || "All"}
                    onValueChange={(v) => setSelectedCpuLoad(v === "All" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {CPU_LOADS.map((load) => (
                        <SelectItem key={load} value={load}>
                          {load}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Complexity Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Signal className="h-4 w-4" />
                    Complexity
                  </Label>
                  <Select
                    value={selectedComplexity || "All Levels"}
                    onValueChange={(v) => setSelectedComplexity(v === "All Levels" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {COMPLEXITY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Racks</h2>
                <p className="text-sm text-muted-foreground">
                  {racks.length} rack{racks.length !== 1 ? "s" : ""} found
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

            {/* Racks Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {racks.map((rack: any, index: number) => (
                  <RackCard
                    key={rack._id}
                    rack={rack}
                    index={index}
                    isPlaying={playingRack?._id === rack._id && isPlaying}
                    onPlayPause={handlePlayPause}
                    onViewDetails={() => handleRackClick(rack)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {racks.map((rack: any, index: number) => (
                  <RackListItem
                    key={rack._id}
                    rack={rack}
                    index={index}
                    isPlaying={playingRack?._id === rack._id && isPlaying}
                    onPlayPause={handlePlayPause}
                    onViewDetails={() => handleRackClick(rack)}
                  />
                ))}
              </div>
            )}

            {racks.length === 0 && (
              <Card className="p-12 text-center">
                <Waves className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No racks found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Rack Card Component
function RackCard({ rack, index, isPlaying, onPlayPause, onViewDetails }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl"
        onClick={onViewDetails}
      >
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-chart-1/20 to-chart-3/20">
          {rack.imageUrl && (
            <Image
              src={rack.imageUrl}
              alt={rack.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play Button Overlay */}
          {rack.demoAudioUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-white/90 text-black shadow-lg hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayPause(rack);
                }}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-chart-1 text-white">{rack.abletonVersion}</Badge>
            {rack.requiresMaxForLive && <Badge variant="secondary">Max for Live</Badge>}
          </div>
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Title & Type */}
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-chart-1">
              {rack.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {rack.rackType && getRackTypeLabel(rack.rackType)}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {rack.cpuLoad && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Cpu className="h-3 w-3" />
                {rack.cpuLoad} CPU
              </Badge>
            )}
            {rack.macroCount && (
              <Badge variant="outline" className="text-xs">
                {rack.macroCount} Macros
              </Badge>
            )}
            {rack.complexity && (
              <Badge variant="outline" className="text-xs">
                {rack.complexity}
              </Badge>
            )}
          </div>

          {/* Genres */}
          {rack.genre && rack.genre.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rack.genre.slice(0, 3).map((g: string) => (
                <Badge key={g} variant="secondary" className="text-xs">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {/* Creator & Price */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={rack.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-xs text-white">
                  {rack.creatorName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{rack.creatorName}</span>
            </div>
            <div className="text-2xl font-bold text-chart-1">${rack.price}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Rack List Item
function RackListItem({ rack, index, isPlaying, onPlayPause, onViewDetails }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card
        className="cursor-pointer border-border transition-colors hover:bg-muted/30"
        onClick={onViewDetails}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {rack.demoAudioUrl && (
              <Button
                size="icon"
                variant={isPlaying ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayPause(rack);
                }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
            <Waves className="h-8 w-8 text-chart-1" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{rack.title}</div>
              <div className="text-sm text-muted-foreground">
                {rack.rackType && getRackTypeLabel(rack.rackType)} • {rack.creatorName}
              </div>
            </div>
            <Badge variant="secondary">{rack.abletonVersion}</Badge>
            {rack.cpuLoad && (
              <Badge variant="outline" className="gap-1">
                <Cpu className="h-3 w-3" />
                {rack.cpuLoad}
              </Badge>
            )}
            <div className="text-xl font-bold text-chart-1">${rack.price}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper functions
function getRackTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    audioEffect: "Audio Effect Rack",
    instrument: "Instrument Rack",
    midiEffect: "MIDI Effect Rack",
    drumRack: "Drum Rack",
  };
  return labels[type] || type;
}

// Label component
function Label({ children, className = "", ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}
