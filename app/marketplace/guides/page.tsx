"use client";

import { useState, useEffect } from "react";
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
  FileText,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  X,
  Download,
  BookOpen,
  GraduationCap,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "All Categories",
  "Music Theory",
  "Mixing",
  "Mastering",
  "Sound Design",
  "Arrangement",
  "Songwriting",
  "Music Business",
  "Marketing",
  "DAW Tutorials",
];

const FORMATS = [
  { value: "all", label: "All Formats" },
  { value: "pdf", label: "PDF" },
  { value: "ebook", label: "eBook" },
  { value: "cheatsheet", label: "Cheat Sheet" },
  { value: "workbook", label: "Workbook" },
];

export default function GuidesMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedFormat, setSelectedFormat] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<
    "free" | "under-50" | "50-100" | "over-100" | undefined
  >(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // @ts-ignore TS2589 - Type instantiation is excessively deep (pre-existing Convex API type issue)
  const allProducts: any = useQuery(api.digitalProducts.getAllPublishedProducts) || [];

  const guides = allProducts.filter(
    (p: any) =>
      p.productCategory === "pdf" ||
      p.productCategory === "ebook" ||
      p.productCategory === "guide" ||
      p.productType === "pdf" ||
      p.productType === "ebook" ||
      p.category?.toLowerCase().includes("guide") ||
      p.category?.toLowerCase().includes("pdf") ||
      p.category?.toLowerCase().includes("ebook")
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedFormat, priceRange, sortBy]);

  let filteredGuides = guides;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredGuides = filteredGuides.filter(
      (guide: any) =>
        guide.title?.toLowerCase().includes(term) ||
        guide.description?.toLowerCase().includes(term) ||
        guide.creatorName?.toLowerCase().includes(term)
    );
  }

  if (selectedCategory && selectedCategory !== "All Categories") {
    filteredGuides = filteredGuides.filter(
      (guide: any) => guide.category === selectedCategory || guide.tags?.includes(selectedCategory)
    );
  }

  if (priceRange) {
    filteredGuides = filteredGuides.filter((guide: any) => {
      const price = guide.price || 0;
      switch (priceRange) {
        case "free":
          return price === 0;
        case "under-50":
          return price > 0 && price < 5000;
        case "50-100":
          return price >= 5000 && price <= 10000;
        case "over-100":
          return price > 10000;
        default:
          return true;
      }
    });
  }

  const total = filteredGuides.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const paginatedGuides = filteredGuides.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFiltersCount = [
    selectedCategory && selectedCategory !== "All Categories",
    selectedFormat && selectedFormat !== "all",
    priceRange,
    searchTerm,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(undefined);
    setSelectedFormat(undefined);
    setPriceRange(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      <section className="border-b border-border bg-gradient-to-b from-emerald-500/5 to-background pt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FileText className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">Guides & eBooks</span>
            </motion.div>
            <motion.h1
              className="mb-4 text-4xl font-bold md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Level Up Your Knowledge
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Download comprehensive guides, cheat sheets, and eBooks from industry professionals.
              Learn music theory, mixing techniques, and business strategies.
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
              placeholder="Search guides, topics, authors..."
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
              value={selectedCategory || "All Categories"}
              onValueChange={(v) => setSelectedCategory(v === "All Categories" ? undefined : v)}
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-black">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedFormat || "all"}
              onValueChange={(v) => setSelectedFormat(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-black">
                <FileText className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
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
            {total} {total === 1 ? "guide" : "guides"} found
          </p>
        </div>

        {paginatedGuides.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {paginatedGuides.map((guide: any, index: number) => (
                <GuideCard key={guide._id} guide={guide} index={index} viewMode={viewMode} />
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
            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No guides found</h3>
            <p className="mb-6 text-muted-foreground">
              Try adjusting your filters or check back soon for new resources
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={clearFilters}>Clear All Filters</Button>
              <Link href="/marketplace/courses">
                <Button variant="outline">Browse Courses</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function GuideCard({
  guide,
  index,
  viewMode,
}: {
  guide: any;
  index: number;
  viewMode: "grid" | "list";
}) {
  if (viewMode === "list") {
    return (
      <Link href={`/marketplace/guides/${guide.slug || guide._id}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex">
              <div className="relative h-32 w-32 flex-shrink-0">
                {guide.imageUrl ? (
                  <Image
                    src={guide.imageUrl}
                    alt={guide.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <FileText className="h-8 w-8 text-emerald-500" />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="mb-1 line-clamp-1 font-semibold">{guide.title}</h3>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {guide.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {guide.category && <Badge variant="secondary">{guide.category}</Badge>}
                    {guide.pageCount && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {guide.pageCount} pages
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-500">
                    {guide.price === 0 ? "Free" : `$${(guide.price / 100).toFixed(2)}`}
                  </span>
                  <Button size="sm">View Details</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/marketplace/guides/${guide.slug || guide._id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card className="group overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-[4/3]">
            {guide.imageUrl ? (
              <Image
                src={guide.imageUrl}
                alt={guide.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <FileText className="h-16 w-16 text-emerald-500" />
              </div>
            )}
            {guide.price === 0 && (
              <Badge className="absolute left-3 top-3 bg-green-500">Free</Badge>
            )}
            {guide.category && (
              <Badge variant="secondary" className="absolute right-3 top-3">
                {guide.category}
              </Badge>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-emerald-500">
              {guide.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{guide.description}</p>

            <div className="mb-3 flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={guide.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-xs text-white">
                  {guide.creatorName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{guide.creatorName || "Author"}</span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xl font-bold text-emerald-500">
                {guide.price === 0 ? "Free" : `$${(guide.price / 100).toFixed(2)}`}
              </span>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
