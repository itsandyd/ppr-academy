"use client";

import { cn } from "@/lib/utils";
import { BaseProduct } from "./types";
import { BeatLeaseCard } from "./BeatLeaseCard";
import { TipJarCard } from "./TipJarCard";
import { MembershipCard } from "./MembershipCard";
import { PlaylistCurationCard } from "./PlaylistCurationCard";
import { CourseCard } from "./CourseCard";
import { DigitalProductCard } from "./DigitalProductCard";
import { UrlMediaCard } from "./UrlMediaCard";
import { CoachingCard } from "./CoachingCard";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: BaseProduct[];
  onProductClick?: (product: BaseProduct) => void;
  displayName?: string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  /**
   * When true, automatically selects the appropriate card component based on productType/productCategory
   * When false, uses the generic ProductCard for all items
   */
  autoSelectCard?: boolean;
}

/**
 * ProductGrid - Responsive grid layout for products
 * Automatically renders the appropriate card component based on product type
 */
export function ProductGrid({
  products,
  onProductClick,
  displayName,
  columns = 3,
  className,
  autoSelectCard = true,
}: ProductGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const renderProductCard = (product: BaseProduct) => {
    if (!autoSelectCard) {
      return (
        <ProductCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    const type = product.productType || product.productCategory || "";
    const category = product.productCategory || "";

    // Beat lease products
    if (type === "beat-lease" || category === "beat-lease" || product.beatLeaseConfig) {
      return (
        <BeatLeaseCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // Tip jar products
    if (type === "tip-jar" || category === "tip-jar") {
      return (
        <TipJarCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // Membership tiers
    if (type === "membership" || category === "membership" || product.tierName) {
      return (
        <MembershipCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // Playlist curation
    if (type === "playlist-curation" || category === "playlist-curation" || product.acceptsSubmissions !== undefined) {
      return (
        <PlaylistCurationCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // Courses
    if (type === "course") {
      return (
        <CourseCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // URL/Media links
    if (type === "urlMedia" || product.mediaType) {
      return (
        <UrlMediaCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // Coaching
    if (type === "coaching" || category === "coaching") {
      return (
        <CoachingCard
          key={product._id}
          product={product}
          onClick={onProductClick}
          displayName={displayName}
        />
      );
    }

    // Default to digital product card for everything else
    return (
      <DigitalProductCard
        key={product._id}
        product={product}
        onClick={onProductClick}
        displayName={displayName}
      />
    );
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {products.map(renderProductCard)}
    </div>
  );
}
