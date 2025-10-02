"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Music,
  MoreVertical,
  Edit,
  Eye,
  Copy,
  Trash2,
  Grid,
  List as ListIcon,
  Play,
  Download,
  Heart,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Sample {
  _id: Id<"audioSamples">;
  title: string;
  description?: string;
  genre: string;
  category: string;
  tags: string[];
  creditPrice: number;
  duration: number;
  bpm?: number;
  key?: string;
  isPublished: boolean;
  downloads: number;
  plays: number;
  favorites: number;
  fileUrl: string;
  format: string;
}

interface SamplesListProps {
  samples: Sample[];
  storeId: string;
}

export function SamplesList({ samples, storeId }: SamplesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-high" | "price-low" | "title-asc" | "title-desc">("newest");
  const [filterBy, setFilterBy] = useState<"all" | "published" | "draft">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const togglePublish = useMutation(api.samples.toggleSamplePublish);
  const deleteSample = useMutation(api.samples.deleteSample);

  const handleTogglePublish = async (sampleId: Id<"audioSamples">, isPublished: boolean, title: string) => {
    try {
      await togglePublish({ sampleId });
      toast.success(`${title} ${isPublished ? "unpublished" : "published"} successfully!`);
    } catch (error) {
      toast.error(`Failed to ${isPublished ? "unpublish" : "publish"} sample`);
      console.error(error);
    }
  };

  const handleDelete = async (sampleId: Id<"audioSamples">, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteSample({ sampleId });
      toast.success(`${title} deleted successfully!`);
    } catch (error) {
      toast.error("Failed to delete sample");
      console.error(error);
    }
  };

  const handleCopyLink = (sampleId: string) => {
    const url = `${window.location.origin}/marketplace/samples/${sampleId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const processedSamples = useMemo(() => {
    let filtered = samples;

    // Filter by status
    if (filterBy === "published") {
      filtered = filtered.filter((s) => s.isPublished);
    } else if (filterBy === "draft") {
      filtered = filtered.filter((s) => !s.isPublished);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.genre.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return 0; // Keep original order (newest first from DB)
        case "oldest":
          return 0; // Reverse not implemented here
        case "price-high":
          return b.creditPrice - a.creditPrice;
        case "price-low":
          return a.creditPrice - b.creditPrice;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [samples, searchQuery, sortBy, filterBy]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search samples by title, genre, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-900"
              />
            </div>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <Filter className="w-4 h-4 mr-2" />
                  {filterBy === "all" ? "All" : filterBy === "published" ? "Published" : "Drafts"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterBy("all")}>
                  All Samples
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("published")}>
                  Published
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("draft")}>
                  Drafts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  Sort by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-high")}>
                  Price: High to Low
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price-low")}>
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title-asc")}>
                  Title: A to Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title-desc")}>
                  Title: Z to A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
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

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {processedSamples.length} of {samples.length} samples
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {processedSamples.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No samples found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterBy !== "all"
                ? "Try adjusting your search or filters"
                : "Start by uploading your first sample"}
            </p>
            {(searchQuery || filterBy !== "all") ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/store/${storeId}/samples/upload`}>
                  Upload Sample
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Samples Grid/List */}
      {processedSamples.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Samples ({processedSamples.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {processedSamples.map((sample, index) => (
                    <motion.div
                      key={sample._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:border-indigo-200 dark:hover:border-indigo-800">
                        {/* Sample Header */}
                        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-pink-900/20">
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-16 h-16 text-indigo-300 dark:text-indigo-700" />
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge
                              variant={sample.isPublished ? "default" : "secondary"}
                              className="shadow-lg backdrop-blur-sm bg-opacity-90"
                            >
                              {sample.isPublished ? "✓ Published" : "Draft"}
                            </Badge>
                          </div>

                          {/* Actions Dropdown */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-9 w-9 p-0 rounded-full bg-white/95 hover:bg-white dark:bg-slate-900/95 dark:hover:bg-slate-900 shadow-lg"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Manage Sample</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/store/${storeId}/samples/edit/${sample._id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Sample
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTogglePublish(sample._id, sample.isPublished, sample.title)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {sample.isPublished ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyLink(sample._id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(sample._id, sample.title)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Sample Content */}
                        <CardContent className="p-5">
                          {/* Title */}
                          <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {sample.title}
                          </h3>

                          {/* Tags */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {sample.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {sample.genre}
                            </Badge>
                            {sample.bpm && (
                              <Badge variant="outline" className="text-xs">
                                {sample.bpm} BPM
                              </Badge>
                            )}
                            {sample.key && (
                              <Badge variant="outline" className="text-xs">
                                {sample.key}
                              </Badge>
                            )}
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                <span>{sample.plays}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                <span>{sample.downloads}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>{sample.favorites}</span>
                              </div>
                            </div>
                            <span className="text-xs">{formatDuration(sample.duration)}</span>
                          </div>

                          {/* Price */}
                          <div className="mt-4">
                            <Badge
                              variant="outline"
                              className="text-base font-bold px-3 py-1 w-full justify-center"
                            >
                              <Coins className="w-4 h-4 mr-1" />
                              {sample.creditPrice} credits
                            </Badge>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <Link href={`/store/${storeId}/samples/edit/${sample._id}`}>
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                handleTogglePublish(sample._id, sample.isPublished, sample.title)
                              }
                            >
                              {sample.isPublished ? "Unpublish" : "Publish"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                <AnimatePresence>
                  {processedSamples.map((sample, index) => (
                    <motion.div
                      key={sample._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <Music className="h-8 w-8 text-indigo-400" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-base mb-1">{sample.title}</h3>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge
                                    variant={sample.isPublished ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {sample.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Coins className="w-3 h-3 mr-1" />
                                    {sample.creditPrice}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {sample.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {formatDuration(sample.duration)}
                                  </Badge>
                                </div>
                              </div>

                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/store/${storeId}/samples/edit/${sample._id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleTogglePublish(sample._id, sample.isPublished, sample.title)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {sample.isPublished ? "Unpublish" : "Publish"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyLink(sample._id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(sample._id, sample.title)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                {sample.plays} plays
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {sample.downloads} downloads
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {sample.favorites} favorites
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

