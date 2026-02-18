"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  BookOpen,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  X,
  Users,
  Clock,
  Star,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const dynamic = "force-dynamic";

export default function CoursesMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<
    "free" | "under-50" | "50-100" | "over-100" | undefined
  >(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const marketplaceData = useQuery(api.marketplace.searchMarketplace, {
    searchTerm: searchTerm || undefined,
    contentType: "courses",
    category: selectedCategory,
    priceRange,
    sortBy,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const categories = useQuery(api.marketplace.getMarketplaceCategories) || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, sortBy]);

  const results = marketplaceData?.results || [];
  const total = marketplaceData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const activeFiltersCount = [selectedCategory, priceRange, searchTerm].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(undefined);
    setPriceRange(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      <section className="border-b border-border bg-gradient-to-b from-chart-1/5 to-background pt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-chart-1/10 px-4 py-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BookOpen className="h-5 w-5 text-chart-1" />
              <span className="text-sm font-medium text-chart-1">Courses</span>
            </motion.div>
            <motion.h1
              className="mb-4 text-4xl font-bold md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Learn Music Production
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Master your craft with courses from professional producers. From beginner basics to
              advanced techniques.
            </motion.p>
          </div>

          <motion.div
            className="relative mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={selectedCategory || "all"}
              onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-black">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priceRange || "all"}
              onValueChange={(v) => setPriceRange(v === "all" ? undefined : (v as any))}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-black">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="under-50">Under $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="over-100">Over $100</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
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

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "course" : "courses"} found
          </p>
        </div>

        {results.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {results.map((course: any) => (
                <CourseCard key={course._id} course={course} viewMode={viewMode} />
              ))}
            </div>

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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No courses found</h3>
            <p className="mb-6 text-muted-foreground">Try adjusting your filters or search terms</p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, viewMode }: { course: any; viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <Link href={`/courses/${course.slug}`}>
        <Card className="overflow-hidden transition-all hover:shadow-lg">
          <div className="flex">
            <div className="relative h-32 w-48 flex-shrink-0">
              {(course.thumbnail || course.imageUrl) ? (
                <img
                  src={course.thumbnail || course.imageUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-chart-1/20 to-chart-2/20">
                  <BookOpen className="h-8 w-8 text-chart-1" />
                </div>
              )}
            </div>
            <CardContent className="flex flex-1 flex-col justify-between p-4">
              <div>
                <h3 className="mb-1 line-clamp-1 font-semibold">{course.title}</h3>
                <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {course.enrollmentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.enrollmentCount} students
                    </span>
                  )}
                  {course.category && <Badge variant="secondary">{course.category}</Badge>}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-bold text-chart-1">
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </span>
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-video">
          {(course.thumbnail || course.imageUrl) ? (
            <img
              src={course.thumbnail || course.imageUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-chart-1/20 to-chart-2/20">
              <BookOpen className="h-12 w-12 text-chart-1" />
            </div>
          )}
          {course.price === 0 && <Badge className="absolute left-3 top-3 bg-green-500">Free</Badge>}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-chart-1">
            {course.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            {course.creatorName && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.creatorName}
              </span>
            )}
            {course.category && (
              <Badge variant="outline" className="text-xs">
                {course.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-chart-1">
              {course.price === 0 ? "Free" : `$${course.price}`}
            </span>
            {course.enrollmentCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {course.enrollmentCount} enrolled
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
