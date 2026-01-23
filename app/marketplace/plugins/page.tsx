"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
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
  Filter,
  ExternalLink,
  Download,
  DollarSign,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function PluginsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [pricingFilter, setPricingFilter] = useState<string | undefined>(undefined);
  const [selectedSpecificCategories, setSelectedSpecificCategories] = useState<string[]>([]); // Multi-select for effect/instrument categories
  const [categorySearchQuery, setCategorySearchQuery] = useState(""); // Search query for filtering categories
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch data with explicit types
  // @ts-ignore - Convex types causing deep instantiation error  
  const pluginsData = useQuery(api.plugins.getAllPublishedPlugins);
  // @ts-ignore - Convex types causing deep instantiation error
  const pluginTypesData = useQuery(api.plugins.getPluginTypes);
  // @ts-ignore - Convex types causing deep instantiation error
  const pluginCategoriesData = useQuery(api.plugins.getPluginCategories);
  // @ts-ignore - Convex types causing deep instantiation error
  const specificCategoriesData = useQuery(api.plugins.getAllSpecificCategories);
  
  // Type-safe defaults
  const plugins: Plugin[] = pluginsData ?? [];
  const pluginTypes: PluginType[] = pluginTypesData ?? [];
  const pluginCategories: PluginCategory[] = pluginCategoriesData ?? [];
  const specificCategories: SpecificCategory[] = specificCategoriesData ?? []; // Effect/Instrument/Studio Tool categories
  
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
          plugin.description?.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter((plugin) => plugin.pluginTypeId === selectedType);
    }

    // Category filter (same as Type filter since both use pluginTypeId)
    if (selectedCategory) {
      filtered = filtered.filter((plugin) => plugin.pluginTypeId === selectedCategory);
    }

    // Pricing filter
    if (pricingFilter) {
      filtered = filtered.filter((plugin) => plugin.pricingType === pricingFilter);
    }

    // Specific categories filter (Effect/Instrument/Studio Tool categories)
    if (selectedSpecificCategories.length > 0) {
      filtered = filtered.filter((plugin) => {
        // Check if plugin has any matching specific category by name
        const categoryName = plugin.categoryName;
        return categoryName && selectedSpecificCategories.includes(categoryName);
      });
    }

    return filtered;
  }, [plugins, searchQuery, selectedType, selectedCategory, pricingFilter, selectedSpecificCategories]);
  
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
  }, [searchQuery, selectedType, selectedCategory, pricingFilter, selectedSpecificCategories]);

  // Stats
  const stats = {
    total: plugins.length,
    free: plugins.filter((p) => p.pricingType === "FREE").length,
    paid: plugins.filter((p) => p.pricingType === "PAID").length,
    freemium: plugins.filter((p) => p.pricingType === "FREEMIUM").length,
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType(undefined);
    setSelectedCategory(undefined);
    setPricingFilter(undefined);
    setSelectedSpecificCategories([]);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
              <Puzzle className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Plugin Directory
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Discover the best plugins for music production, mixing, and mastering
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Plugins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500">{stats.free}</div>
              <div className="text-sm text-muted-foreground">Free</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-500">{stats.paid}</div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-500">{stats.freemium}</div>
              <div className="text-sm text-muted-foreground">Freemium</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plugins by name, author, or description..."
                  className="pl-10 bg-background"
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select 
                  value={selectedType || "all"} 
                  onValueChange={(v) => setSelectedType(v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">All Types</SelectItem>
                    {pluginTypes.map((type) => (
                      <SelectItem key={type._id} value={type._id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedCategory || "all"} 
                  onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">All Categories</SelectItem>
                    {pluginCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={pricingFilter || "all"} 
                  onValueChange={(v) => setPricingFilter(v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All Pricing" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">All Pricing</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FREEMIUM">Freemium</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Specific Categories Filter (Effects, Instruments, Studio Tools) */}
              {specificCategories.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Filter by Category Type
                    {selectedSpecificCategories.length > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({selectedSpecificCategories.length} selected)
                      </span>
                    )}
                  </label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Select specific categories like Reverb, Delay, Synth, Drums, etc.
                  </div>
                  
                  {/* Search input for categories */}
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="mb-2 bg-background"
                  />
                  
                  <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-3 space-y-2 bg-background">
                    {specificCategories
                      .filter((category) => 
                        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                      )
                      .map((category) => {
                      const isSelected = selectedSpecificCategories.includes(category.name);
                      return (
                        <button
                          key={category._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSpecificCategories(prev => prev.filter(c => c !== category.name));
                            } else {
                              setSelectedSpecificCategories(prev => [...prev, category.name]);
                            }
                          }}
                          className={`
                            w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                            ${isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-accent hover:text-accent-foreground'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span>{category.name}</span>
                            {isSelected && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {specificCategories.filter((category) => 
                      category.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {paginatedPlugins.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Puzzle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No plugins found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} of {totalResults} plugin{totalResults !== 1 ? "s" : ""}
              </div>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {paginatedPlugins.map((plugin, index) => (
                <motion.div
                  key={plugin._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link href={`/marketplace/plugins/${plugin.slug || plugin._id}`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full cursor-pointer">
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-purple-500/10 to-pink-500/10 overflow-hidden">
                        {plugin.image ? (
                          <img
                            src={plugin.image}
                            alt={plugin.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Puzzle className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )}

                        {/* Pricing Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={
                              plugin.pricingType === "FREE"
                                ? "default"
                                : plugin.pricingType === "PAID"
                                ? "destructive"
                                : "secondary"
                            }
                            className="font-semibold"
                          >
                            {plugin.pricingType}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">
                        {/* Header */}
                        <div className="mb-3">
                          <h3 className="text-xl font-bold mb-1 group-hover:text-purple-500 transition-colors">
                            {plugin.name}
                          </h3>
                          {plugin.author && (
                            <p className="text-sm text-muted-foreground">{plugin.author}</p>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
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
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                            {plugin.description}
                          </p>
                        )}

                        {/* Price */}
                        {typeof plugin.price === 'number' && plugin.price > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-lg font-bold">${plugin.price}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                          {plugin.purchaseUrl && (
                            <Button
                              asChild
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                              <a
                                href={plugin.purchaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {plugin.pricingType === "FREE" ? "Get Free" : "Buy Now"}
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          )}
                          {plugin.optInFormUrl && !plugin.purchaseUrl && (
                            <Button
                              asChild
                              variant="outline"
                              className="flex-1"
                            >
                              <a
                                href={plugin.optInFormUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>

                        {/* Media Links */}
                        {(plugin.videoUrl || plugin.audioUrl) && (
                          <div className="flex gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                            {plugin.videoUrl && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-xs"
                              >
                                <a
                                  href={plugin.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Watch Demo
                                </a>
                              </Button>
                            )}
                            {plugin.audioUrl && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="flex-1 text-xs"
                              >
                                <a
                                  href={plugin.audioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Audio Demo
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                    .filter(page => 
                      page === currentPage ||
                      page === currentPage - 1 ||
                      page === currentPage + 1 ||
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    )
                    .map(page => (
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

