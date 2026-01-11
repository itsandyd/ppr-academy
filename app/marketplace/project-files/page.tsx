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
  FolderOpen,
  Grid3x3,
  List as ListIcon,
  Music,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const DAW_OPTIONS = [
  { value: "all", label: "All DAWs" },
  { value: "ableton", label: "Ableton Live" },
  { value: "fl-studio", label: "FL Studio" },
  { value: "logic", label: "Logic Pro" },
  { value: "bitwig", label: "Bitwig Studio" },
  { value: "studio-one", label: "Studio One" },
  { value: "cubase", label: "Cubase" },
  { value: "reason", label: "Reason" },
  { value: "multi-daw", label: "Multi-DAW" },
];

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
  "Pop",
  "R&B",
  "Future Bass",
  "EDM",
];

const DAW_ICONS: Record<string, string> = {
  ableton: "🔊",
  "fl-studio": "🎚️",
  logic: "🎹",
  bitwig: "⚡",
  "studio-one": "🎼",
  reason: "🔌",
  cubase: "🎛️",
  "multi-daw": "🔗",
};

export default function ProjectFilesMarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDAW, setSelectedDAW] = useState<string | undefined>();
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();

  const projects =
    useQuery(api.projectFiles.getPublishedProjectFiles, {
      dawType: selectedDAW && selectedDAW !== "all" ? (selectedDAW as any) : undefined,
      genre: selectedGenre && selectedGenre !== "All Genres" ? selectedGenre : undefined,
      searchQuery: searchTerm || undefined,
    }) || [];

  const handleProjectClick = (project: any) => {
    window.location.href = `/marketplace/project-files/${project.slug || project._id}`;
  };

  const activeFiltersCount = [
    selectedDAW && selectedDAW !== "all",
    selectedGenre && selectedGenre !== "All Genres",
    searchTerm,
  ].filter(Boolean).length;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const getDAWLabel = (dawType?: string) => {
    const daw = DAW_OPTIONS.find((d) => d.value === dawType);
    return daw?.label || dawType || "Unknown DAW";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FolderOpen className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600">Project Files</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Project Files
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Complete DAW projects to learn how professional tracks are built
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects, genres, creators..."
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
                        setSelectedDAW(undefined);
                        setSelectedGenre(undefined);
                      }}
                      className="text-xs"
                    >
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* DAW Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">DAW</Label>
                  <Select
                    value={selectedDAW || "all"}
                    onValueChange={(v) => setSelectedDAW(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {DAW_OPTIONS.map((daw) => (
                        <SelectItem key={daw.value} value={daw.value}>
                          <span className="flex items-center gap-2">
                            {daw.value !== "all" && (
                              <span>{DAW_ICONS[daw.value] || "📁"}</span>
                            )}
                            {daw.label}
                          </span>
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

                {/* Info Card */}
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                  <h4 className="mb-2 font-semibold text-purple-700 dark:text-purple-300">
                    Learn by Example
                  </h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Project files let you see exactly how professional tracks are constructed, from arrangement to mixing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Projects</h2>
                <p className="text-sm text-muted-foreground">
                  {projects.length} project{projects.length !== 1 ? "s" : ""} found
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

            {/* Projects Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {projects.map((project: any, index: number) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    index={index}
                    onViewDetails={() => handleProjectClick(project)}
                    formatPrice={formatPrice}
                    getDAWLabel={getDAWLabel}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project: any, index: number) => (
                  <ProjectListItem
                    key={project._id}
                    project={project}
                    index={index}
                    onViewDetails={() => handleProjectClick(project)}
                    formatPrice={formatPrice}
                    getDAWLabel={getDAWLabel}
                  />
                ))}
              </div>
            )}

            {projects.length === 0 && (
              <Card className="p-12 text-center">
                <FolderOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No projects found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  index,
  onViewDetails,
  formatPrice,
  getDAWLabel,
}: {
  project: any;
  index: number;
  onViewDetails: () => void;
  formatPrice: (price?: number) => string;
  getDAWLabel: (dawType?: string) => string;
}) {
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
        <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
          {project.imageUrl && (
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* DAW Badge */}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-purple-500 text-white">
              {DAW_ICONS[project.dawType] || "📁"} {getDAWLabel(project.dawType)}
            </Badge>
          </div>

          {/* Price Badge */}
          <div className="absolute right-3 top-3">
            <Badge variant={project.price === 0 ? "secondary" : "default"}>
              {formatPrice(project.price)}
            </Badge>
          </div>

          {/* Learn Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="border-white/50 bg-black/50 text-white">
              <FolderOpen className="mr-1 h-3 w-3" />
              Full Project
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Title */}
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-purple-600">
              {project.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
          </div>

          {/* Genres */}
          {project.genre && project.genre.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(project.genre) ? project.genre : [project.genre]).slice(0, 3).map((g: string) => (
                <Badge key={g} variant="secondary" className="text-xs">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Creator & View */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={project.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-xs text-white">
                  {project.creatorName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{project.creatorName}</span>
            </div>
            <Button size="sm" variant="ghost" className="gap-1">
              <Download className="h-4 w-4" />
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Project List Item
function ProjectListItem({
  project,
  index,
  onViewDetails,
  formatPrice,
  getDAWLabel,
}: {
  project: any;
  index: number;
  onViewDetails: () => void;
  formatPrice: (price?: number) => string;
  getDAWLabel: (dawType?: string) => string;
}) {
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
            <div className="text-3xl">{DAW_ICONS[project.dawType] || "📁"}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{project.title}</div>
              <div className="text-sm text-muted-foreground">
                {getDAWLabel(project.dawType)} • {project.creatorName}
              </div>
            </div>
            {project.genre && (
              <Badge variant="secondary">
                {Array.isArray(project.genre) ? project.genre[0] : project.genre}
              </Badge>
            )}
            <div className="text-xl font-bold text-purple-600">{formatPrice(project.price)}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Label component
function Label({ children, className = "", ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}
