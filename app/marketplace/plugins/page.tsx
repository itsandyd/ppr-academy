"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Puzzle,
  Search,
  X,
  ExternalLink,
  Download,
  DollarSign,
  SlidersHorizontal,
  Grid3x3,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Music,
  Mic,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import { cn } from "@/lib/utils";

type Plugin = {
  _id: Id<"plugins">;
  _creationTime: number;
  name: string;
  slug?: string;
  author?: string;
  description?: string;
  videoScript?: string;
  image?: string;
  videoUrl?: string;
  audioUrl?: string;
  userId?: string;
  categoryId?: Id<"pluginCategories">;
  effectCategoryId?: Id<"pluginEffectCategories">;
  instrumentCategoryId?: Id<"pluginInstrumentCategories">;
  studioToolCategoryId?: Id<"pluginStudioToolCategories">;
  pluginTypeId?: Id<"pluginTypes">;
  tags?: string[];
  optInFormUrl?: string;
  price?: number;
  pricingType: "FREE" | "PAID" | "FREEMIUM";
  purchaseUrl?: string;
  isPublished?: boolean;
  createdAt: number;
  updatedAt: number;
  categoryName?: string;
  typeName?: string;
};

type PluginType = {
  _id: Id<"pluginTypes">;
  _creationTime: number;
  name: string;
  createdAt: number;
  updatedAt: number;
};

type PluginCategory = {
  _id: Id<"pluginCategories">;
  _creationTime: number;
  name: string;
  createdAt: number;
  updatedAt: number;
};

type SpecificCategory = {
  _id: string;
  name: string;
  type: string;
};

const PRICING_OPTIONS = [
  { value: "all", label: "All Pricing" },
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
  { value: "FREEMIUM", label: "Freemium" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Effect: <Wand2 className="h-4 w-4" />,
  Instrument: <Music className="h-4 w-4" />,
  "Studio Tool": <Mic className="h-4 w-4" />,
};

export default function PluginsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [pricingFilter, setPricingFilter] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Fetch data with explicit types
  // @ts-ignore - Convex types causing deep instantiation error
  const pluginsData = useQuery(api.plugins.getAllPublishedPlugins);
  // @ts-ignore - Convex types causing deep instantiation error
  const pluginTypesData = useQuery(api.plugins.getPluginTypes);
  // @ts-ignore - Convex types causing deep instantiation error
  const specificCategoriesData = useQuery(api.plugins.getAllSpecificCategories);

  // Type-safe defaults
  const plugins: Plugin[] = pluginsData ?? [];
  const pluginTypes: PluginType[] = pluginTypesData ?? [];
  const specificCategories: SpecificCategory[] = specificCategoriesData ?? [];

  // Filter plugins
  const filteredPlugins = useMemo(() => {
    let filtered = plugins;

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (plugin) =>
          plugin.name.toLowerCase().includes(search) ||
          plugin.author?.toLowerCase().includes(search) ||
          plugin.description?.toLowerCase().includes(search) ||
          plugin.categoryName?.toLowerCase().includes(search) ||
          plugin.typeName?.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (selectedType !== "all") {
      filtered = filtered.filter((plugin) => plugin.pluginTypeId === selectedType);
    }

    // Pricing filter
    if (pricingFilter !== "all") {
      filtered = filtered.filter((plugin) => plugin.pricingType === pricingFilter);
    }

    // Specific categories filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((plugin) => {
        const categoryName = plugin.categoryName;
        return categoryName && selectedCategories.includes(categoryName);
      });
    }

    return filtered;
  }, [plugins, searchQuery, selectedType, pricingFilter, selectedCategories]);

  // Pagination
  const totalResults = filteredPlugins.length;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
  const paginatedPlugins = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlugins.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlugins, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, pricingFilter, selectedCategories]);

  // Stats
  const stats = {
    total: plugins.length,
    free: plugins.filter((p) => p.pricingType === "FREE").length,
    paid: plugins.filter((p) => p.pricingType === "PAID").length,
    freemium: plugins.filter((p) => p.pricingType === "FREEMIUM").length,
  };

  // Active filters count
  const activeFiltersCount = [
    selectedType !== "all",
    pricingFilter !== "all",
    selectedCategories.length > 0,
    searchQuery,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedType("all");
    setPricingFilter("all");
    setSelectedCategories([]);
    setCurrentPage(1);
  }, []);

  const toggleCategory = useCallback((categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  // Group categories by type for better organization
  const categoriesByType = useMemo(() => {
    const grouped: Record<string, SpecificCategory[]> = {};
    specificCategories.forEach((cat) => {
      if (!grouped[cat.type]) {
        grouped[cat.type] = [];
      }
      grouped[cat.type].push(cat);
    });
    return grouped;
  }, [specificCategories]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 pt-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Puzzle className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">Plugin Directory</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Discover Amazing Plugins
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80 md:text-xl">
              Explore {stats.total}+ plugins for music production, mixing, and mastering
            </p>

            {/* Search Bar - Prominent */}
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plugins by name, author, or category..."
                  className="h-14 rounded-full border-0 bg-white pl-12 pr-4 text-base shadow-xl dark:bg-gray-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/90"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-400" />
              <span className="font-semibold">{stats.free}</span>
              <span className="text-white/70">Free Plugins</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              <span className="font-semibold">{stats.paid}</span>
              <span className="text-white/70">Premium Plugins</span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <div className="flex items-center gap-2">
              <Puzzle className="h-5 w-5 text-purple-300" />
              <span className="font-semibold">{stats.freemium}</span>
              <span className="text-white/70">Freemium</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px] bg-white dark:bg-black">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="all">All Types</SelectItem>
                {pluginTypes.map((type) => (
                  <SelectItem key={type._id} value={type._id}>
                    <div className="flex items-center gap-2">
                      {TYPE_ICONS[type.name] || <Puzzle className="h-4 w-4" />}
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Pricing Filter */}
            <Select value={pricingFilter} onValueChange={setPricingFilter}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-black">
                <SelectValue placeholder="All Pricing" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {PRICING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters Toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Categories
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {selectedCategories.length}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-4 w-4" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Results count */}
            <span className="text-sm text-muted-foreground">
              {totalResults} {totalResults === 1 ? "plugin" : "plugins"}
            </span>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-border bg-white dark:bg-black">
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
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Category Filters (Expandable) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 overflow-hidden"
            >
              <Card className="bg-white dark:bg-black">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Filter by Category</h3>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategories([])}
                        className="h-auto p-0 text-xs text-muted-foreground"
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {Object.entries(categoriesByType).map(([type, categories]) => (
                      <div key={type}>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {TYPE_ICONS[type] || <Puzzle className="h-3 w-3" />}
                          {type}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <button
                              key={category._id}
                              onClick={() => toggleCategory(category.name)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-sm transition-all",
                                selectedCategories.includes(category.name)
                                  ? "bg-purple-600 text-white"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Category Pills */}
        {selectedCategories.length > 0 && !showFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="cursor-pointer gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                onClick={() => toggleCategory(cat)}
              >
                {cat}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}

        {/* Results */}
        {paginatedPlugins.length === 0 ? (
          <Card className="bg-white dark:bg-black">
            <CardContent className="py-16 text-center">
              <Puzzle className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="mb-2 text-xl font-semibold">No plugins found</h3>
              <p className="mb-6 text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedPlugins.map((plugin, index) => (
                  <PluginCard key={plugin._id} plugin={plugin} index={index} />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-3">
                {paginatedPlugins.map((plugin, index) => (
                  <PluginListItem key={plugin._id} plugin={plugin} index={index} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, idx, arr) => {
                      // Add ellipsis
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PluginCard({ plugin, index }: { plugin: Plugin; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link href={`/marketplace/plugins/${plugin.slug || plugin._id}`}>
        <Card className="group h-full overflow-hidden bg-white transition-all hover:shadow-lg dark:bg-gray-900">
          {/* Image */}
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            {plugin.image ? (
              <Image
                src={plugin.image}
                alt={plugin.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Puzzle className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}

            {/* Pricing Badge */}
            <Badge
              className={cn(
                "absolute right-2 top-2 font-semibold",
                plugin.pricingType === "FREE"
                  ? "bg-green-500 hover:bg-green-600"
                  : plugin.pricingType === "FREEMIUM"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-purple-500 hover:bg-purple-600"
              )}
            >
              {plugin.pricingType === "FREE"
                ? "Free"
                : plugin.pricingType === "FREEMIUM"
                  ? "Freemium"
                  : plugin.price
                    ? `$${plugin.price}`
                    : "Paid"}
            </Badge>
          </div>

          <CardContent className="p-4">
            {/* Title & Author */}
            <h3 className="mb-1 line-clamp-1 font-semibold transition-colors group-hover:text-purple-600">
              {plugin.name}
            </h3>
            {plugin.author && (
              <p className="mb-2 text-sm text-muted-foreground">{plugin.author}</p>
            )}

            {/* Categories */}
            <div className="mb-3 flex flex-wrap gap-1">
              {plugin.typeName && (
                <Badge variant="outline" className="text-xs">
                  {plugin.typeName}
                </Badge>
              )}
              {plugin.categoryName && (
                <Badge variant="secondary" className="text-xs">
                  {plugin.categoryName}
                </Badge>
              )}
            </div>

            {/* Description */}
            {plugin.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {plugin.description}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function PluginListItem({ plugin, index }: { plugin: Plugin; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Link href={`/marketplace/plugins/${plugin.slug || plugin._id}`}>
        <Card className="group overflow-hidden bg-white transition-all hover:shadow-md dark:bg-gray-900">
          <div className="flex items-center gap-4 p-4">
            {/* Thumbnail */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              {plugin.image ? (
                <Image
                  src={plugin.image}
                  alt={plugin.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Puzzle className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold transition-colors group-hover:text-purple-600">
                    {plugin.name}
                  </h3>
                  {plugin.author && (
                    <p className="text-sm text-muted-foreground">{plugin.author}</p>
                  )}
                </div>
                <Badge
                  className={cn(
                    "flex-shrink-0",
                    plugin.pricingType === "FREE"
                      ? "bg-green-500 hover:bg-green-600"
                      : plugin.pricingType === "FREEMIUM"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-purple-500 hover:bg-purple-600"
                  )}
                >
                  {plugin.pricingType === "FREE"
                    ? "Free"
                    : plugin.pricingType === "FREEMIUM"
                      ? "Freemium"
                      : plugin.price
                        ? `$${plugin.price}`
                        : "Paid"}
                </Badge>
              </div>

              {/* Categories */}
              <div className="mt-2 flex flex-wrap gap-1">
                {plugin.typeName && (
                  <Badge variant="outline" className="text-xs">
                    {plugin.typeName}
                  </Badge>
                )}
                {plugin.categoryName && (
                  <Badge variant="secondary" className="text-xs">
                    {plugin.categoryName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="hidden flex-shrink-0 sm:block" onClick={(e) => e.stopPropagation()}>
              {plugin.purchaseUrl ? (
                <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <a href={plugin.purchaseUrl} target="_blank" rel="noopener noreferrer">
                    {plugin.pricingType === "FREE" ? "Get Free" : "Get Plugin"}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              ) : plugin.optInFormUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={plugin.optInFormUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </a>
                </Button>
              ) : (
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
