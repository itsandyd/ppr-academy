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
  "All Genres", "Hip Hop", "Trap", "House", "Techno", "Drum & Bass",
  "Dubstep", "Lo-Fi", "Ambient", "Indie", "Rock", "Jazz"
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
    "Instrument": "instrument",
    "MIDI Effect": "midiEffect",
    "Drum Rack": "drumRack",
  };

  const cpuLoadMap: Record<string, any> = {
    "Low": "low",
    "Medium": "medium",
    "High": "high",
  };

  const complexityMap: Record<string, any> = {
    "Beginner": "beginner",
    "Intermediate": "intermediate",
    "Advanced": "advanced",
  };

  // Query racks with filters
  const racks = useQuery(api.abletonRacks.getPublishedAbletonRacks, {
    rackType: selectedRackType && selectedRackType !== "All Types" 
      ? rackTypeMap[selectedRackType] 
      : undefined,
    abletonVersion: selectedVersion && selectedVersion !== "All Versions" 
      ? selectedVersion 
      : undefined,
    genre: selectedGenre && selectedGenre !== "All Genres" 
      ? selectedGenre 
      : undefined,
    cpuLoad: selectedCpuLoad && selectedCpuLoad !== "All" 
      ? cpuLoadMap[selectedCpuLoad] 
      : undefined,
    complexity: selectedComplexity && selectedComplexity !== "All Levels" 
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
    // Navigate to the rack detail page
    const slug = rack.title.toLowerCase().replace(/\s+/g, "-");
    window.location.href = `/marketplace/ableton-racks/${slug}`;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4 mb-8">
            <motion.div
              className="inline-flex items-center gap-2 bg-chart-1/20 px-4 py-2 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Waves className="w-5 h-5 text-chart-1" />
              <span className="text-sm font-semibold text-chart-1">Ableton Live Racks</span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Audio Effect Racks
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Professional Ableton Live racks and presets from top producers
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search racks, effects, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-14 text-base bg-background/80 backdrop-blur-sm border-2 border-border focus:border-chart-1 transition-all"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-4">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5" />
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
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
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
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Signal className="w-4 h-4" />
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
          <div className="lg:col-span-3 space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Racks</h2>
                <p className="text-sm text-muted-foreground">
                  {racks.length} rack{racks.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Racks Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Waves className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No racks found</h3>
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

// Rack Card Component
function RackCard({ rack, index, isPlaying, onPlayPause, onViewDetails }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="group hover:shadow-xl transition-all duration-300 border-border bg-card overflow-hidden cursor-pointer"
        onClick={onViewDetails}
      >
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-chart-1/20 to-chart-3/20">
          {rack.imageUrl && (
            <Image
              src={rack.imageUrl}
              alt={rack.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Play Button Overlay */}
          {rack.demoAudioUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayPause(rack);
                }}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-chart-1 text-white">
              {rack.abletonVersion}
            </Badge>
            {rack.requiresMaxForLive && (
              <Badge variant="secondary">Max for Live</Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Title & Type */}
          <div>
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-chart-1 transition-colors">
              {rack.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {rack.rackType && getRackTypeLabel(rack.rackType)}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            {rack.cpuLoad && (
              <Badge variant="outline" className="text-xs gap-1">
                <Cpu className="w-3 h-3" />
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
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={rack.creatorAvatar} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-chart-1 to-chart-2 text-white">
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
        className="hover:bg-muted/30 transition-colors border-border cursor-pointer"
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
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            <Waves className="w-8 h-8 text-chart-1" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{rack.title}</div>
              <div className="text-sm text-muted-foreground">
                {rack.rackType && getRackTypeLabel(rack.rackType)} • {rack.creatorName}
              </div>
            </div>
            <Badge variant="secondary">{rack.abletonVersion}</Badge>
            {rack.cpuLoad && (
              <Badge variant="outline" className="gap-1">
                <Cpu className="w-3 h-3" />
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

