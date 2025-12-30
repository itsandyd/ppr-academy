"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  // Fetch all published digital products
  const products = useQuery(api.digitalProducts.getAllPublishedProducts);

  // Loading state
  if (products === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              Explore Digital Products
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
              Discover sample packs, presets, project files, and more from talented creators
            </p>
          </div>

          {/* Loading Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800"
              >
                <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                <div className="p-6">
                  <div className="mb-3 h-6 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter products
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && product.price === 0) ||
      (priceFilter === "paid" && product.price > 0);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            Explore Digital Products
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            Discover sample packs, presets, project files, and more from talented creators
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white pl-10 dark:bg-gray-800"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-gray-800 md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Samples">Samples</SelectItem>
              <SelectItem value="Presets">Presets</SelectItem>
              <SelectItem value="Project Files">Project Files</SelectItem>
              <SelectItem value="Guides">Guides</SelectItem>
              <SelectItem value="Templates">Templates</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Filter */}
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full bg-white dark:bg-gray-800 md:w-48">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-6">
              <Filter className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                No products found
              </h2>
              <p className="mx-auto max-w-md text-gray-600 dark:text-gray-400">
                {searchQuery || categoryFilter !== "all" || priceFilter !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "No digital products have been published yet. Check back soon!"}
              </p>
            </div>
            {(searchQuery || categoryFilter !== "all" || priceFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setPriceFilter("all");
                }}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product: any) => (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                className="group overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl dark:bg-gray-800"
              >
                {/* Product Image */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-4xl font-bold text-white opacity-50">
                        {product.name?.charAt(0) || "P"}
                      </div>
                    </div>
                  )}
                  {/* Price Badge */}
                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-900 dark:bg-gray-900 dark:text-white">
                      {product.price === 0 ? "FREE" : `$${(product.price / 100).toFixed(2)}`}
                    </span>
                  </div>
                  {/* Category Badge */}
                  {product.category && (
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {product.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {product.description}
                    </p>
                  )}

                  {/* Product Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      {product.productType === "file"
                        ? "Digital Download"
                        : product.productType === "urlMedia"
                          ? "External Link"
                          : "Digital Product"}
                    </span>
                    <span className="text-sm font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Creator CTA Section */}
        {filteredProducts.length > 0 && (
          <div className="mt-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-12 text-center dark:from-gray-800 dark:to-gray-800">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                Want to Sell Your Own Products?
              </h2>
              <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
                Join thousands of creators selling sample packs, presets, and more with their own
                professional storefront.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/sign-up?intent=creator"
                  className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Start Selling Free
                </Link>
                <Link
                  href="/courses"
                  className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
