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
  Sliders,
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

export default function MixingTemplatesMarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDAW, setSelectedDAW] = useState<string | undefined>();
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();

  const templates =
    useQuery(api.mixingTemplates.getPublishedMixingTemplates, {
      dawType: selectedDAW && selectedDAW !== "all" ? (selectedDAW as any) : undefined,
      genre: selectedGenre && selectedGenre !== "All Genres" ? selectedGenre : undefined,
      searchQuery: searchTerm || undefined,
    }) || [];

  const handleTemplateClick = (template: any) => {
    window.location.href = `/marketplace/mixing-templates/${template.slug || template._id}`;
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
      <section className="border-b border-border bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Sliders className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">Mixing Templates</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Mixing Templates
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Professional mixing and mastering templates for every DAW
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates, genres, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 border-2 border-border bg-background/80 pl-12 pr-4 text-base backdrop-blur-sm transition-all focus:border-emerald-500"
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
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Available Templates</h2>
                <p className="text-sm text-muted-foreground">
                  {templates.length} template{templates.length !== 1 ? "s" : ""} found
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

            {/* Templates Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {templates.map((template: any, index: number) => (
                  <TemplateCard
                    key={template._id}
                    template={template}
                    index={index}
                    onViewDetails={() => handleTemplateClick(template)}
                    formatPrice={formatPrice}
                    getDAWLabel={getDAWLabel}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template: any, index: number) => (
                  <TemplateListItem
                    key={template._id}
                    template={template}
                    index={index}
                    onViewDetails={() => handleTemplateClick(template)}
                    formatPrice={formatPrice}
                    getDAWLabel={getDAWLabel}
                  />
                ))}
              </div>
            )}

            {templates.length === 0 && (
              <Card className="p-12 text-center">
                <Sliders className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No templates found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  index,
  onViewDetails,
  formatPrice,
  getDAWLabel,
}: {
  template: any;
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
        <div className="relative h-48 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
          {template.imageUrl && (
            <Image
              src={template.imageUrl}
              alt={template.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* DAW Badge */}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-emerald-500 text-white">
              {DAW_ICONS[template.dawType] || "📁"} {getDAWLabel(template.dawType)}
            </Badge>
          </div>

          {/* Price Badge */}
          <div className="absolute right-3 top-3">
            <Badge variant={template.price === 0 ? "secondary" : "default"}>
              {formatPrice(template.price)}
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Title */}
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-emerald-600">
              {template.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
          </div>

          {/* Genres */}
          {template.genre && template.genre.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.genre.slice(0, 3).map((g: string) => (
                <Badge key={g} variant="secondary" className="text-xs">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Creator & Download */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={template.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-xs text-white">
                  {template.creatorName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{template.creatorName}</span>
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

// Template List Item
function TemplateListItem({
  template,
  index,
  onViewDetails,
  formatPrice,
  getDAWLabel,
}: {
  template: any;
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
            <div className="text-3xl">{DAW_ICONS[template.dawType] || "🎚️"}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{template.title}</div>
              <div className="text-sm text-muted-foreground">
                {getDAWLabel(template.dawType)} • {template.creatorName}
              </div>
            </div>
            {template.genre && template.genre.length > 0 && (
              <Badge variant="secondary">{template.genre[0]}</Badge>
            )}
            <div className="text-xl font-bold text-emerald-600">{formatPrice(template.price)}</div>
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
