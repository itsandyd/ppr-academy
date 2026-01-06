"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Trash2,
  ShoppingCart,
  ExternalLink,
  Package,
  Music,
  Loader2,
  BookOpen,
  TrendingDown,
  Bell,
  BellOff,
  Share2,
  ArrowUpDown,
  Filter,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type SortOption = "date_desc" | "date_asc" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
type FilterType = "all" | "product" | "course";

export default function WishlistPage() {
  const { isLoaded } = useUser();
  const [removingId, setRemovingId] = useState<Id<"wishlists"> | null>(null);
  const [togglingNotification, setTogglingNotification] = useState<Id<"wishlists"> | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const wishlistItems = useQuery(api.wishlists.getUserWishlist, {
    sortBy,
    filterType,
    filterCategory: filterCategory || undefined,
  });
  const categories = useQuery(api.wishlists.getWishlistCategories);
  const priceDropItems = useQuery(api.wishlists.getWishlistItemsWithPriceDrops);
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);
  const toggleNotification = useMutation(api.wishlists.togglePriceDropNotification);

  const handleRemove = async (item: NonNullable<typeof wishlistItems>[number]) => {
    setRemovingId(item._id);
    try {
      await removeFromWishlist({
        productId: item.productId,
        courseId: item.courseId,
      });
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleNotification = async (wishlistId: Id<"wishlists">, currentState: boolean) => {
    setTogglingNotification(wishlistId);
    try {
      await toggleNotification({ wishlistId, enabled: !currentState });
      toast.success(currentState ? "Price drop alerts disabled" : "Price drop alerts enabled");
    } catch {
      toast.error("Failed to update notification settings");
    } finally {
      setTogglingNotification(null);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/library/wishlist`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Wishlist link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getItemLink = (item: NonNullable<typeof wishlistItems>[number]) => {
    if (item.itemType === "course") {
      return `/courses/${item.slug || item.courseId}`;
    }
    return `/marketplace/products/${item.slug || item.productId}`;
  };

  if (!isLoaded || wishlistItems === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="mt-1 text-muted-foreground">
            Save products and courses you're interested in for later
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/20 dark:to-red-900/20">
            <Heart className="h-10 w-10 text-pink-500" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Your wishlist is empty</h2>
          <p className="mb-6 max-w-md text-muted-foreground">
            Browse our marketplace and click the heart icon on products or courses you'd like to
            save for later.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/marketplace">
                <Package className="mr-2 h-4 w-4" />
                Browse Products
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const priceDropCount = priceDropItems?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Heart className="h-8 w-8 fill-pink-500 text-pink-500" />
            My Wishlist
          </h1>
          <p className="mt-1 text-muted-foreground">
            {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
            {priceDropCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingDown className="h-4 w-4" />
                {priceDropCount} price {priceDropCount === 1 ? "drop" : "drops"}!
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Share"}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/marketplace">
              <Package className="mr-2 h-4 w-4" />
              Browse More
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="name_asc">Name: A to Z</SelectItem>
              <SelectItem value="name_desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="product">Products Only</SelectItem>
              <SelectItem value="course">Courses Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categories && categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wishlistItems.map((item) => (
          <Card
            key={item._id}
            className="group overflow-hidden transition-all duration-200 hover:shadow-lg"
          >
            <CardContent className="p-0">
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                {item.coverImageUrl ? (
                  <Image
                    src={item.coverImageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {item.itemType === "course" ? (
                      <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                    ) : (
                      <Music className="h-16 w-16 text-muted-foreground/30" />
                    )}
                  </div>
                )}

                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    onClick={() =>
                      handleToggleNotification(item._id, item.notifyOnPriceDrop ?? true)
                    }
                    disabled={togglingNotification === item._id}
                    className="rounded-full bg-white p-2 shadow-md transition-colors hover:bg-blue-50 dark:bg-black dark:hover:bg-blue-900/20"
                    title={
                      item.notifyOnPriceDrop
                        ? "Disable price drop alerts"
                        : "Enable price drop alerts"
                    }
                  >
                    {togglingNotification === item._id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : item.notifyOnPriceDrop ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={removingId === item._id}
                    className="rounded-full bg-white p-2 shadow-md transition-colors hover:bg-red-50 dark:bg-black dark:hover:bg-red-900/20"
                  >
                    {removingId === item._id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Badge className="bg-white/90 text-foreground dark:bg-black/90">
                    {item.category}
                  </Badge>
                  <Badge variant="outline" className="bg-white/90 text-foreground dark:bg-black/90">
                    {item.itemType === "course" ? "Course" : "Product"}
                  </Badge>
                </div>

                {item.priceDropped && (
                  <div className="absolute left-3 top-3">
                    <Badge className="bg-green-500 text-white">
                      <TrendingDown className="mr-1 h-3 w-3" />${item.priceDropAmount?.toFixed(2)}{" "}
                      off!
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h3 className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(item._creationTime).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">
                    {item.currentPrice === 0 ? "Free" : `$${item.currentPrice.toFixed(2)}`}
                  </span>
                  {item.priceDropped && item.priceAtAdd && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${item.priceAtAdd.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={getItemLink(item)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {item.itemType === "course" ? "View Course" : "View Product"}
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={getItemLink(item)}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
