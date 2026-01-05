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
  Video,
  Phone,
  Headphones,
  Filter,
  Grid3x3,
  List,
  TrendingUp,
  X,
  Clock,
  Star,
  Calendar,
  Users,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const dynamic = "force-dynamic";

const SESSION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "video", label: "Video Call", icon: Video },
  { value: "audio", label: "Audio Call", icon: Headphones },
  { value: "phone", label: "Phone Call", icon: Phone },
];

const DURATION_FILTERS = [
  { value: "all", label: "Any Duration" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "2 hours" },
];

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "under-50", label: "Under $50" },
  { value: "50-100", label: "$50 - $100" },
  { value: "100-200", label: "$100 - $200" },
  { value: "over-200", label: "Over $200" },
];

export default function CoachingMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSessionType, setSelectedSessionType] = useState<string | undefined>(undefined);
  const [selectedDuration, setSelectedDuration] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<
    "free" | "under-50" | "50-100" | "over-100" | undefined
  >(undefined);
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "price-low" | "price-high">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // @ts-ignore TS2589 - Type instantiation is excessively deep (pre-existing Convex API type issue)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marketplaceData: any = useQuery(api.marketplace.searchMarketplace, {
    searchTerm: searchTerm || undefined,
    contentType: "coaching",
    priceRange,
    sortBy,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSessionType, selectedDuration, priceRange, sortBy]);

  let results = marketplaceData?.results || [];
  if (selectedSessionType && selectedSessionType !== "all") {
    results = results.filter((item: any) => item.sessionType === selectedSessionType);
  }
  if (selectedDuration && selectedDuration !== "all") {
    results = results.filter((item: any) => item.duration === parseInt(selectedDuration));
  }

  const total = results.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const activeFiltersCount = [
    selectedSessionType && selectedSessionType !== "all",
    selectedDuration && selectedDuration !== "all",
    priceRange,
    searchTerm,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSessionType(undefined);
    setSelectedDuration(undefined);
    setPriceRange(undefined);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Headphones className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-purple-500/5 to-background pt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Video className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-500">1-on-1 Coaching</span>
            </motion.div>
            <motion.h1
              className="mb-4 text-4xl font-bold md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Learn from the Pros
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-lg text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Book personalized coaching sessions with professional music producers. Get direct
              feedback, learn advanced techniques, and accelerate your growth.
            </motion.p>
          </div>

          {/* Search */}
          <motion.div
            className="relative mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search coaches, topics, genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters & Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Session Type Filter */}
            <Select
              value={selectedSessionType || "all"}
              onValueChange={(v) => setSelectedSessionType(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[160px] bg-white dark:bg-black">
                <Video className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Session Type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {SESSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Duration Filter */}
            <Select
              value={selectedDuration || "all"}
              onValueChange={(v) => setSelectedDuration(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[160px] bg-white dark:bg-black">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {DURATION_FILTERS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range Filter */}
            <Select
              value={priceRange || "all"}
              onValueChange={(v) => setPriceRange(v === "all" ? undefined : (v as any))}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-black">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                {PRICE_RANGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
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

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {total} coaching {total === 1 ? "session" : "sessions"} available
          </p>
        </div>

        {/* Results Grid/List */}
        {results.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {results.map((session: any, index: number) => (
                <CoachingCard
                  key={session._id}
                  session={session}
                  index={index}
                  viewMode={viewMode}
                  getSessionTypeIcon={getSessionTypeIcon}
                />
              ))}
            </div>

            {/* Pagination */}
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
            <Video className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No coaching sessions found</h3>
            <p className="mb-6 text-muted-foreground">
              Try adjusting your filters or check back soon for new coaches
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={clearFilters}>Clear All Filters</Button>
              <Link href="/marketplace/creators">
                <Button variant="outline">Browse Creators</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function CoachingCard({
  session,
  index,
  viewMode,
  getSessionTypeIcon,
}: {
  session: any;
  index: number;
  viewMode: "grid" | "list";
  getSessionTypeIcon: (type: string) => React.ReactNode;
}) {
  const detailUrl = `/marketplace/coaching/${session.slug || session._id}`;

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
      >
        <Link href={detailUrl}>
          <Card className="cursor-pointer overflow-hidden transition-all hover:shadow-lg">
            <div className="flex">
              <div className="relative h-32 w-48 flex-shrink-0">
                {session.imageUrl ? (
                  <img
                    src={session.imageUrl}
                    alt={session.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Video className="h-8 w-8 text-purple-500" />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h3 className="mb-1 line-clamp-1 font-semibold">{session.title}</h3>
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                    {session.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {session.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.duration} min
                      </span>
                    )}
                    {session.sessionType && (
                      <span className="flex items-center gap-1">
                        {getSessionTypeIcon(session.sessionType)}
                        {session.sessionType}
                      </span>
                    )}
                    {session.creatorName && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {session.creatorName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-purple-500">
                    ${(session.price / 100).toFixed(2)}
                  </span>
                  <Button size="sm">View Details</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={detailUrl}>
        <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-video">
            {session.imageUrl ? (
              <img
                src={session.imageUrl}
                alt={session.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Video className="h-12 w-12 text-purple-500" />
              </div>
            )}
            {session.sessionType && (
              <Badge className="absolute left-3 top-3 bg-purple-500 text-white">
                <span className="mr-1">{getSessionTypeIcon(session.sessionType)}</span>
                {session.sessionType}
              </Badge>
            )}
            {session.duration && (
              <Badge variant="secondary" className="absolute right-3 top-3">
                <Clock className="mr-1 h-3 w-3" />
                {session.duration} min
              </Badge>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-purple-500">
              {session.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{session.description}</p>

            <div className="mb-4 flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs text-white">
                  {session.creatorName?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{session.creatorName || "Coach"}</p>
                {session.bookingCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {session.bookingCount} sessions booked
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xl font-bold text-purple-500">
                ${(session.price / 100).toFixed(2)}
              </span>
              <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                <Calendar className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
