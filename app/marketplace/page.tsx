"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  X,
  BookOpen,
  Package,
  Video,
  Music,
  TrendingUp,
  Grid3x3,
  List,
  Plug,
  Layers,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { MarketplaceGrid } from "@/app/_components/marketplace-grid";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  const router = useRouter();

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [contentType, setContentType] = useState<
    "all" | "courses" | "products" | "coaching" | "sample-packs" | "plugins" | "ableton-racks" | "bundles"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSpecificCategories, setSelectedSpecificCategories] = useState<string[]>([]); // Multi-select for effect/instrument categories
  const [categorySearchQuery, setCategorySearchQuery] = useState(""); // Search query for filtering categories
  const [priceRange, setPriceRange] = useState<
    "free" | "under-50" | "50-100" | "over-100" | undefined
  >(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 18;

  // Fetch data
  const marketplaceData = useQuery(api.marketplace.searchMarketplace, {
    searchTerm: searchTerm || undefined,
    contentType: contentType === "all" ? undefined : contentType,
    category: selectedCategory,
    specificCategories:
      selectedSpecificCategories.length > 0 ? selectedSpecificCategories : undefined,
    priceRange,
    sortBy,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const categories = useQuery(api.marketplace.getMarketplaceCategories) || [];
  const creators = useQuery(api.marketplace.getAllCreators, { limit: 8 }) || [];
  const stats = useQuery(api.marketplace.getPlatformStats);

  // Fetch plugin categories when plugins content type is selected
  const pluginCategories =
    useQuery(api.plugins.getPluginCategories, contentType === "plugins" ? {} : "skip") || [];

  // Fetch plugin specific categories (Effect/Instrument/Studio Tool categories)
  const specificCategories =
    useQuery(api.plugins.getAllSpecificCategories, contentType === "plugins" ? {} : "skip") || [];

  // Determine which categories to show based on content type
  // Deduplicate categories to avoid duplicate keys
  const displayCategories =
    contentType === "plugins"
      ? Array.from(new Set(pluginCategories.map((cat: any) => cat.name)))
      : categories;

  const results = marketplaceData?.results || [];
  const total = marketplaceData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Active filters count
  const activeFiltersCount = [
    contentType !== "all",
    selectedCategory,
    selectedSpecificCategories.length > 0,
    priceRange,
    searchTerm,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setContentType("all");
    setSelectedCategory(undefined);
    setSelectedSpecificCategories([]);
    setPriceRange(undefined);
    setSortBy("newest");
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, contentType, selectedCategory, selectedSpecificCategories, priceRange, sortBy]);

  // Clear category and specific categories selection when switching content types
  useEffect(() => {
    if (contentType === "plugins" || contentType === "all") {
      setSelectedCategory(undefined);
    }
    if (contentType !== "plugins") {
      setSelectedSpecificCategories([]);
    }
  }, [contentType]);

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
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

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
                  <Tabs value={contentType} onValueChange={(v: any) => setContentType(v)}>
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
                    onValueChange={(v) => setPriceRange(v === "all" ? undefined : (v as any))}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="under-50">Under $50</SelectItem>
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
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {searchTerm ? `Results for "${searchTerm}"` : "All Content"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {total} {total === 1 ? "result" : "results"} found
                </p>
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
                    Price: {priceRange.replace("-", " - ")}
                    <button onClick={() => setPriceRange(undefined)}>
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
    </div>
  );
}
