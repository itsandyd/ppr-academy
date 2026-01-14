"use client";

import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedPriceRange: string;
  onPriceRangeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  categories: { value: string; label: string }[];
  totalResults: number;
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedPriceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  categories,
  totalResults,
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priceRanges = [
    { value: "all", label: "Any Price" },
    { value: "free", label: "Free" },
    { value: "under50", label: "Under $50" },
    { value: "50to100", label: "$50 - $100" },
    { value: "over100", label: "$100+" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price-low", label: "Price: Low" },
    { value: "price-high", label: "Price: High" },
    { value: "title", label: "A-Z" },
  ];

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedPriceRange !== "all" ||
    searchTerm.length > 0;

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onPriceRangeChange("all");
    onSortChange("newest");
  };

  return (
    <motion.div
      className="container mx-auto px-6 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      <div className="space-y-4">
        {/* Main filter bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={cn(
                "w-full pl-12 pr-4 py-3 rounded-xl",
                "bg-white/[0.03] border border-white/[0.08]",
                "text-white placeholder:text-white/30",
                "focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05]",
                "transition-all duration-300"
              )}
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle button - mobile */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "sm:hidden inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "bg-white/[0.03] border border-white/[0.08] text-white/70",
              "transition-all duration-300",
              isExpanded && "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
            )}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* Desktop filter pills */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Category pills */}
            <div className="flex items-center gap-2">
              <FilterPill
                label="All"
                isActive={selectedCategory === "all"}
                onClick={() => onCategoryChange("all")}
              />
              {categories.map((cat) => (
                <FilterPill
                  key={cat.value}
                  label={cat.label}
                  isActive={selectedCategory === cat.value}
                  onClick={() => onCategoryChange(cat.value)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10" />

            {/* Sort dropdown styled as pill */}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className={cn(
                "appearance-none px-4 py-2 rounded-full text-sm font-medium",
                "bg-white/[0.03] border border-white/[0.08] text-white/70",
                "focus:outline-none focus:border-cyan-500/50",
                "cursor-pointer transition-all duration-300"
              )}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-black text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expanded filters - mobile */}
        <motion.div
          className={cn("sm:hidden overflow-hidden")}
          initial={false}
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="pt-4 space-y-4 border-t border-white/[0.06]">
            {/* Category */}
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterPill
                  label="All"
                  isActive={selectedCategory === "all"}
                  onClick={() => onCategoryChange("all")}
                />
                {categories.map((cat) => (
                  <FilterPill
                    key={cat.value}
                    label={cat.label}
                    isActive={selectedCategory === cat.value}
                    onClick={() => onCategoryChange(cat.value)}
                  />
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">
                Price
              </label>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <FilterPill
                    key={range.value}
                    label={range.label}
                    isActive={selectedPriceRange === range.value}
                    onClick={() => onPriceRangeChange(range.value)}
                  />
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs uppercase tracking-wider text-white/40 mb-2 block">
                Sort by
              </label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((opt) => (
                  <FilterPill
                    key={opt.value}
                    label={opt.label}
                    isActive={sortBy === opt.value}
                    onClick={() => onSortChange(opt.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results count + clear filters */}
        <div className="flex items-center justify-between">
          <motion.span
            className="text-sm text-white/40"
            key={totalResults}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {totalResults} {totalResults === 1 ? "product" : "products"}
          </motion.span>

          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={clearFilters}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Clear filters
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FilterPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-cyan-500 text-black"
          : "bg-white/[0.03] border border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white"
      )}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}
