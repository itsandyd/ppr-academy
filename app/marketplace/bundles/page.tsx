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
  Package,
  Grid3x3,
  List as ListIcon,
  TrendingDown,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const BUNDLE_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "course_bundle", label: "Course Bundles" },
  { value: "product_bundle", label: "Product Bundles" },
  { value: "mixed", label: "Mixed Bundles" },
];

export default function BundlesMarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | undefined>();

  const bundles =
    useQuery(api.bundles.getAllPublishedBundles, {
      bundleType: selectedType && selectedType !== "all" ? (selectedType as any) : undefined,
      searchQuery: searchTerm || undefined,
    }) || [];

  const handleBundleClick = (bundle: any) => {
    // Use slug if available, otherwise fallback to ID
    const identifier = bundle.slug || bundle._id;
    window.location.href = `/marketplace/bundles/${identifier}`;
  };

  const activeFiltersCount = [
    selectedType && selectedType !== "all",
    searchTerm,
  ].filter(Boolean).length;

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  const getBundleTypeLabel = (bundleType?: string) => {
    const type = BUNDLE_TYPE_OPTIONS.find((t) => t.value === bundleType);
    return type?.label || "Bundle";
  };

  const getBundleTypeIcon = (bundleType?: string) => {
    switch (bundleType) {
      case "course_bundle":
        return <BookOpen className="h-4 w-4" />;
      case "product_bundle":
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Package className="h-5 w-5 text-violet-600" />
              <span className="text-sm font-semibold text-violet-600">Bundle Deals</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Bundles
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Save big with curated bundles of courses and products
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bundles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 border-2 border-border bg-background/80 pl-12 pr-4 text-base backdrop-blur-sm transition-all focus:border-violet-500"
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
                        setSelectedType(undefined);
                      }}
                      className="text-xs"
                    >
                      Clear ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Bundle Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bundle Type</Label>
                  <Select
                    value={selectedType || "all"}
                    onValueChange={(v) => setSelectedType(v === "all" ? undefined : v)}
                  >
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      {BUNDLE_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            {type.value !== "all" && getBundleTypeIcon(type.value)}
                            {type.label}
                          </span>
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
                <h2 className="text-2xl font-bold">Available Bundles</h2>
                <p className="text-sm text-muted-foreground">
                  {bundles.length} bundle{bundles.length !== 1 ? "s" : ""} found
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

            {/* Bundles Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {bundles.map((bundle: any, index: number) => (
                  <BundleCard
                    key={bundle._id}
                    bundle={bundle}
                    index={index}
                    onViewDetails={() => handleBundleClick(bundle)}
                    formatPrice={formatPrice}
                    getBundleTypeLabel={getBundleTypeLabel}
                    getBundleTypeIcon={getBundleTypeIcon}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {bundles.map((bundle: any, index: number) => (
                  <BundleListItem
                    key={bundle._id}
                    bundle={bundle}
                    index={index}
                    onViewDetails={() => handleBundleClick(bundle)}
                    formatPrice={formatPrice}
                    getBundleTypeLabel={getBundleTypeLabel}
                  />
                ))}
              </div>
            )}

            {bundles.length === 0 && (
              <Card className="p-12 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No bundles found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bundle Card Component
function BundleCard({
  bundle,
  index,
  onViewDetails,
  formatPrice,
  getBundleTypeLabel,
  getBundleTypeIcon,
}: {
  bundle: any;
  index: number;
  onViewDetails: () => void;
  formatPrice: (price?: number) => string;
  getBundleTypeLabel: (bundleType?: string) => string;
  getBundleTypeIcon: (bundleType?: string) => React.ReactNode;
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
        <div className="relative h-48 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          {bundle.imageUrl && (
            <Image
              src={bundle.imageUrl}
              alt={bundle.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Type Badge */}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="bg-violet-500 text-white">
              {getBundleTypeIcon(bundle.bundleType)}
              <span className="ml-1">{getBundleTypeLabel(bundle.bundleType)}</span>
            </Badge>
          </div>

          {/* Discount Badge */}
          {bundle.discountPercentage > 0 && (
            <div className="absolute right-3 top-3">
              <Badge variant="destructive" className="bg-red-500">
                <TrendingDown className="mr-1 h-3 w-3" />
                {bundle.discountPercentage}% OFF
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Title */}
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-violet-600">
              {bundle.name}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{bundle.description}</p>
          </div>

          {/* Items Count */}
          <div className="flex flex-wrap gap-2">
            {bundle.courseIds?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <BookOpen className="mr-1 h-3 w-3" />
                {bundle.courseIds.length} Course{bundle.courseIds.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {bundle.productIds?.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                <ShoppingBag className="mr-1 h-3 w-3" />
                {bundle.productIds.length} Product{bundle.productIds.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Price & Creator */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={bundle.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs text-white">
                  {bundle.creatorName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{bundle.creatorName}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-violet-600">
                {formatPrice(bundle.bundlePrice)}
              </div>
              {bundle.originalPrice > bundle.bundlePrice && (
                <div className="text-xs text-muted-foreground line-through">
                  {formatPrice(bundle.originalPrice)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Bundle List Item
function BundleListItem({
  bundle,
  index,
  onViewDetails,
  formatPrice,
  getBundleTypeLabel,
}: {
  bundle: any;
  index: number;
  onViewDetails: () => void;
  formatPrice: (price?: number) => string;
  getBundleTypeLabel: (bundleType?: string) => string;
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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{bundle.name}</div>
              <div className="text-sm text-muted-foreground">
                {getBundleTypeLabel(bundle.bundleType)} by {bundle.creatorName}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bundle.discountPercentage > 0 && (
                <Badge variant="destructive" className="bg-red-500 text-xs">
                  {bundle.discountPercentage}% OFF
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-violet-600">
                {formatPrice(bundle.bundlePrice)}
              </div>
              {bundle.originalPrice > bundle.bundlePrice && (
                <div className="text-xs text-muted-foreground line-through">
                  {formatPrice(bundle.originalPrice)}
                </div>
              )}
            </div>
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
