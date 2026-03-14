"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  X,
  BookOpen,
  Package,
  Video,
  Music,
  Grid3x3,
  List,
  Plug,
  Layers,
  Crown,
  Clock,
  Flame,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MarketplaceGrid } from "@/app/_components/marketplace-grid";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type ContentType = "all" | "courses" | "products" | "coaching" | "sample-packs" | "plugins" | "ableton-racks" | "bundles";
type PriceRange = "free" | "under-10" | "10-25" | "25-50" | "50-100" | "over-100";
type SortBy = "newest" | "popular" | "price-low" | "price-high";

const VALID_CONTENT_TYPES: ContentType[] = ["all", "courses", "products", "coaching", "sample-packs", "plugins", "ableton-racks", "bundles"];
const VALID_PRICE_RANGES: PriceRange[] = ["free", "under-10", "10-25", "25-50", "50-100", "over-100"];
const VALID_SORT_BY: SortBy[] = ["newest", "popular", "price-low", "price-high"];

const ITEMS_PER_PAGE = 18;

const CONTENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof BookOpen; badgeClass: string }> = {
  course: { label: "Course", icon: BookOpen, badgeClass: "bg-chart-1/10 text-chart-1 dark:bg-chart-1/20" },
  product: { label: "Product", icon: Package, badgeClass: "bg-chart-3/10 text-chart-3 dark:bg-chart-3/20" },
  coaching: { label: "Coaching", icon: Video, badgeClass: "bg-chart-4/10 text-chart-4 dark:bg-chart-4/20" },
  bundle: { label: "Bundle", icon: Layers, badgeClass: "bg-chart-2/10 text-chart-2 dark:bg-chart-2/20" },
};

function getItemHref(item: { contentType: string; slug?: string; _id: string }) {
  switch (item.contentType) {
    case "course":
      return `/courses/${item.slug || item._id}`;
    case "bundle":
      return `/marketplace/bundles/${item.slug || item._id}`;
    case "coaching":
      return `/marketplace/coaching/${item.slug || item._id}`;
    default:
      return `/marketplace`;
  }
}

const isValidImageUrl = (url: string | undefined | null): url is string => {
  if (!url || typeof url !== "string" || url.trim() === "") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

interface MarketplaceContentProps {
  marketplaceData: { results: any[]; total: number };
  categories: any[];
  creators: any[];
  stats: any | null;
  justAdded: any[];
  pluginCategories: any[];
  specificCategories: any[];
}

export function MarketplaceContent({
  marketplaceData,
  categories,
  creators,
  stats,
  justAdded,
  pluginCategories,
  specificCategories,
}: MarketplaceContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read filter state from URL params
  const contentType = (VALID_CONTENT_TYPES.includes(searchParams.get("type") as ContentType)
    ? searchParams.get("type") as ContentType
    : "all");
  const selectedCategory = searchParams.get("category") || undefined;
  const selectedSpecificCategories = searchParams.get("subcategories")?.split(",").filter(Boolean) || [];
  const priceRange = (VALID_PRICE_RANGES.includes(searchParams.get("price") as PriceRange)
    ? searchParams.get("price") as PriceRange
    : undefined);
  const sortBy = (VALID_SORT_BY.includes(searchParams.get("sort") as SortBy)
    ? searchParams.get("sort") as SortBy
    : "newest");
  const searchTerm = searchParams.get("q") || "";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  // Local-only state (not in URL)
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Helper to update URL params
  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // Reset to page 1 when changing filters (not when changing page)
    if (!("page" in updates)) {
      params.delete("page");
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // Filter setters that update URL
  const setContentType = useCallback((v: ContentType) => {
    const updates: Record<string, string | undefined> = { type: v === "all" ? undefined : v };
    // Clear category when switching to plugins or all
    if (v === "plugins" || v === "all") {
      updates.category = undefined;
    }
    // Clear subcategories when leaving plugins
    if (v !== "plugins") {
      updates.subcategories = undefined;
    }
    updateParams(updates);
  }, [updateParams]);

  const setSelectedCategory = useCallback((v: string | undefined) => {
    updateParams({ category: v });
  }, [updateParams]);

  const setSelectedSpecificCategories = useCallback((v: string[] | ((prev: string[]) => string[])) => {
    const newVal = typeof v === "function" ? v(selectedSpecificCategories) : v;
    updateParams({ subcategories: newVal.length > 0 ? newVal.join(",") : undefined });
  }, [updateParams, selectedSpecificCategories]);

  const setPriceRange = useCallback((v: PriceRange | undefined) => {
    updateParams({ price: v });
  }, [updateParams]);

  const setSortBy = useCallback((v: SortBy) => {
    updateParams({ sort: v === "newest" ? undefined : v });
  }, [updateParams]);

  const setSearchTerm = useCallback((v: string) => {
    updateParams({ q: v || undefined });
  }, [updateParams]);

  const setCurrentPage = useCallback((v: number | ((prev: number) => number)) => {
    const newPage = typeof v === "function" ? v(currentPage) : v;
    updateParams({ page: newPage > 1 ? String(newPage) : undefined });
  }, [updateParams, currentPage]);

  // Use data from props
  const results = marketplaceData?.results || [];
  const total = marketplaceData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Determine which categories to show based on content type
  const displayCategories =
    contentType === "plugins"
      ? Array.from(new Set(pluginCategories.map((cat: any) => cat.name)))
      : categories;

  // Active filters count
  const activeFiltersCount = [
    contentType !== "all",
    selectedCategory,
    selectedSpecificCategories.length > 0,
    priceRange,
    searchTerm,
    sortBy !== "newest",
  ].filter(Boolean).length;

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const contentTypeCounts = useMemo(() => {
    const counts = {
      all: total,
      courses: 0,
      products: 0,
      coaching: 0,
    };

    results.forEach((item: any) => {
      if (item.contentType === "course") counts.courses++;
      else if (item.contentType === "coaching") counts.coaching++;
      else counts.products++;
    });

    return counts;
  }, [results, total]);

  return (
    <>
      {/* Header Section */}
      <section className="border-b border-border bg-card/50 pt-16 backdrop-blur-sm">
        {/* pt-16 for navbar spacing */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.h1
              className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Marketplace
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Discover courses, digital products, coaching, and more from talented creators
            </motion.p>
          </div>

          {/* Platform Stats */}
          {stats && (
            <motion.div
              className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-chart-1">{stats.totalCreators}+</div>
                  <div className="text-sm text-muted-foreground">Creators</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-chart-2">{stats.totalCourses}+</div>
                  <div className="text-sm text-muted-foreground">Courses</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-chart-3">{stats.totalProducts}+</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-chart-4">{stats.totalStudents}+</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Search Bar */}
          <motion.div
            className="relative mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses, products, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </motion.div>
        </div>
      </section>

      {/* Just Added Section */}
      <JustAddedSection items={justAdded} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="space-y-6 lg:col-span-1">
            <Card className="sticky top-4 border-border bg-card">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Content Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Content Type</label>
                  <Tabs value={contentType} onValueChange={(v: any) => {
                    // "memberships" and "sample-packs" navigate to dedicated pages via Link;
                    // don't update local state for values the backend validator doesn't support
                    if (v === "memberships") return;
                    setContentType(v);
                  }}>
                    <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-black">
                      <TabsTrigger value="all" className="text-xs">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="courses" className="text-xs">
                        <BookOpen className="mr-1 h-3 w-3" />
                        Courses
                      </TabsTrigger>
                    </TabsList>
                    <TabsList className="mt-2 grid w-full grid-cols-2 bg-white dark:bg-black">
                      <TabsTrigger value="products" className="text-xs">
                        <Package className="mr-1 h-3 w-3" />
                        Products
                      </TabsTrigger>
                      <TabsTrigger value="coaching" className="text-xs">
                        <Video className="mr-1 h-3 w-3" />
                        Coaching
                      </TabsTrigger>
                    </TabsList>
                    <TabsList className="mt-2 grid w-full grid-cols-2 bg-white dark:bg-black">
                      <TabsTrigger value="plugins" className="text-xs">
                        <Plug className="mr-1 h-3 w-3" />
                        Plugins
                      </TabsTrigger>
                      <TabsTrigger value="sample-packs" className="text-xs" asChild>
                        <Link href="/marketplace/samples">
                          <Music className="mr-1 h-3 w-3" />
                          Samples
                        </Link>
                      </TabsTrigger>
                    </TabsList>
                    <TabsList className="mt-2 grid w-full grid-cols-2 bg-white dark:bg-black">
                      <TabsTrigger value="bundles" className="text-xs">
                        <Layers className="mr-1 h-3 w-3" />
                        Bundles
                      </TabsTrigger>
                      <TabsTrigger value="memberships" className="text-xs" asChild>
                        <Link href="/marketplace/memberships">
                          <Crown className="mr-1 h-3 w-3" />
                          Memberships
                        </Link>
                      </TabsTrigger>
                    </TabsList>
                    <TabsList className="mt-2 grid w-full bg-white dark:bg-black">
                      <TabsTrigger value="ableton-racks" className="text-xs" asChild>
                        <Link href="/marketplace/ableton-racks">
                          <Plug className="mr-1 h-3 w-3" />
                          Ableton Racks
                        </Link>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Category */}
                {displayCategories.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      {contentType === "plugins" ? "Plugin Category" : "Category"}
                    </label>
                    <Select
                      value={selectedCategory || "all"}
                      onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue
                          placeholder={
                            contentType === "plugins" ? "All Plugin Categories" : "All Categories"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="all">
                          {contentType === "plugins" ? "All Plugin Categories" : "All Categories"}
                        </SelectItem>
                        {displayCategories.map((cat: any) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Specific Categories (for plugins) - Effect/Instrument/Studio Tool categories */}
                {contentType === "plugins" && specificCategories.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Filter by Category Type
                      {selectedSpecificCategories.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({selectedSpecificCategories.length} selected)
                        </span>
                      )}
                    </label>
                    <div className="mb-2 text-xs text-muted-foreground">
                      Select specific categories like Reverb, Delay, Synth, Drums, etc.
                    </div>

                    {/* Search input for categories */}
                    <Input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="mb-2 bg-white dark:bg-black"
                    />

                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-white p-3 dark:bg-black">
                      {specificCategories
                        .filter((category: any) =>
                          category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                        )
                        .map((category: any) => {
                          const isSelected = selectedSpecificCategories.includes(category.name);
                          return (
                            <button
                              key={category._id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSpecificCategories((prev) =>
                                    prev.filter((c) => c !== category.name)
                                  );
                                } else {
                                  setSelectedSpecificCategories((prev) => [...prev, category.name]);
                                }
                              }}
                              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              } `}
                            >
                              <div className="flex items-center justify-between">
                                <span>{category.name}</span>
                                {isSelected && (
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      {specificCategories.filter((category: any) =>
                        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No categories found
                        </div>
                      )}
                    </div>
                    {selectedSpecificCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSpecificCategories([])}
                        className="w-full text-xs"
                      >
                        Clear Selected Categories
                      </Button>
                    )}
                  </div>
                )}

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Price Range</label>
                  <Select
                    value={priceRange || "all"}
                    onValueChange={(v) => setPriceRange(v === "all" ? undefined : (v as PriceRange))}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="under-10">Under $10</SelectItem>
                      <SelectItem value="10-25">$10 - $25</SelectItem>
                      <SelectItem value="25-50">$25 - $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="over-100">Over $100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Browse Creators */}
                <div className="border-t border-border pt-6">
                  <h4 className="mb-3 text-sm font-medium">Browse by Creator</h4>
                  <div className="space-y-2">
                    {creators.slice(0, 5).map((creator: any) => (
                      <button
                        key={creator._id}
                        onClick={() => router.push(`/${creator.slug}`)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarImage src={creator.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-xs text-primary-foreground">
                            {creator.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{creator.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {creator.totalProducts}{" "}
                            {creator.totalProducts === 1 ? "product" : "products"}
                          </div>
                        </div>
                      </button>
                    ))}
                    {creators.length > 5 && (
                      <Link href="/marketplace/creators">
                        <Button variant="outline" size="sm" className="mt-2 w-full">
                          View All Creators
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {searchTerm ? `Results for "${searchTerm}"` : "All Content"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {total} {total === 1 ? "result" : "results"} found
                  </p>
                </div>

                {/* View Mode Toggle */}
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

              {/* Sort Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sort by
                </span>
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1">
                  {(
                    [
                      { value: "newest", label: "Newest", icon: Clock },
                      { value: "popular", label: "Popular", icon: Flame },
                      { value: "price-low", label: "Price \u2191", icon: ArrowUpNarrowWide },
                      { value: "price-high", label: "Price \u2193", icon: ArrowDownNarrowWide },
                    ] as const
                  ).map((option) => {
                    const isActive = sortBy === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Filters Pills */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-2">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm("")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {contentType !== "all" && (
                  <Badge variant="secondary" className="gap-2">
                    Type: {contentType}
                    <button onClick={() => setContentType("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-2">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory(undefined)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {priceRange && (
                  <Badge variant="secondary" className="gap-2">
                    Price: {
                      priceRange === "free" ? "Free" :
                      priceRange === "under-10" ? "Under $10" :
                      priceRange === "10-25" ? "$10 - $25" :
                      priceRange === "25-50" ? "$25 - $50" :
                      priceRange === "50-100" ? "$50 - $100" :
                      priceRange === "over-100" ? "Over $100" :
                      priceRange
                    }
                    <button onClick={() => setPriceRange(undefined)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {sortBy !== "newest" && (
                  <Badge variant="secondary" className="gap-2">
                    Sort: {sortBy === "popular" ? "Popular" : sortBy === "price-low" ? "Price \u2191" : "Price \u2193"}
                    <button onClick={() => setSortBy("newest")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Results Grid */}
            {results.length > 0 ? (
              <>
                <MarketplaceGrid
                  content={results}
                  emptyMessage="No results found. Try adjusting your filters."
                />

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={currentPage === 1 ? "default" : "ghost"}
                            onClick={() => setCurrentPage(1)}
                            size="sm"
                          >
                            1
                          </Button>
                          {currentPage > 4 && <span className="px-2">...</span>}
                        </>
                      )}

                      {/* Page numbers around current */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === currentPage ||
                            page === currentPage - 1 ||
                            page === currentPage + 1 ||
                            page === currentPage - 2 ||
                            page === currentPage + 2
                        )
                        .map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            onClick={() => setCurrentPage(page)}
                            size="sm"
                          >
                            {page}
                          </Button>
                        ))}

                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                          <Button
                            variant={currentPage === totalPages ? "default" : "ghost"}
                            onClick={() => setCurrentPage(totalPages)}
                            size="sm"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

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
              <Card className="border-border bg-card p-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No results found</h3>
                <p className="mb-6 text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Just Added Section ---

function JustAddedSection({ items: justAdded }: { items: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 280 + 16; // card min-width + gap
    el.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    });
  }, []);

  if (!justAdded || justAdded.length === 0) return null;

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-chart-1" />
            <h2 className="text-xl font-bold">Just Added</h2>
            <Badge variant="secondary" className="text-xs font-normal">
              New
            </Badge>
          </div>

          {/* Arrow Buttons (hidden on mobile where swipe is used) */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:snap-none"
        >
          {justAdded.map((item: any) => (
            <JustAddedCard key={item._id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function JustAddedCard({ item }: { item: any }) {
  const router = useRouter();
  const config = CONTENT_TYPE_CONFIG[item.contentType] || CONTENT_TYPE_CONFIG.product;
  const Icon = config.icon;
  const hasImage = isValidImageUrl(item.thumbnail);

  return (
    <Card
      className="group w-[280px] min-w-[280px] shrink-0 snap-start cursor-pointer overflow-hidden border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
      onClick={() => router.push(getItemHref(item))}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-muted to-muted/80">
        {hasImage ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Type Badge */}
        <Badge className={`absolute left-2.5 top-2.5 text-xs ${config.badgeClass} font-medium shadow-sm`}>
          <Icon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>

        {/* Price Badge */}
        <Badge className="absolute right-2.5 top-2.5 border border-border bg-card text-xs font-bold text-foreground shadow-sm dark:bg-card">
          {item.price === 0 ? "FREE" : `$${Number(item.price).toFixed(2)}`}
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-chart-1">
          {item.title}
        </h3>

        {/* Creator */}
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 border border-border">
            <AvatarImage src={item.creatorAvatar} />
            <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-[10px] text-primary-foreground">
              {item.creatorName?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs text-muted-foreground">
            {item.creatorName || "Creator"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
