"use client";

import { useMemo } from "react";
import {
  ProductGrid,
  ProductSection,
  categorizeProducts,
  BaseProduct,
} from "./product-cards";
import { AnimatedFilterResults } from "@/components/ui/animated-filter-transitions";
import { Star } from "lucide-react";

interface ProductSectionsProps {
  products: BaseProduct[];
  onProductClick: (product: BaseProduct) => void;
  displayName?: string;
  filterKey?: string;
}

/**
 * ProductSections - Organizes and displays products grouped by category
 * Each category gets its own section with appropriate styling
 * Pinned products appear in a Featured section at the top
 */
export function ProductSections({
  products,
  onProductClick,
  displayName,
  filterKey = "all",
}: ProductSectionsProps) {
  // Extract pinned products for the Featured section
  const pinnedProducts = useMemo(() => {
    return products
      .filter((p) => (p as any).isPinned)
      .sort((a, b) => {
        const aPinnedAt = (a as any).pinnedAt || 0;
        const bPinnedAt = (b as any).pinnedAt || 0;
        return bPinnedAt - aPinnedAt;
      });
  }, [products]);

  const categories = useMemo(() => categorizeProducts(products), [products]);

  if (categories.length === 0 && pinnedProducts.length === 0) {
    return null;
  }

  return (
    <AnimatedFilterResults filterKey={filterKey}>
      <div className="space-y-12">
        {/* Featured/Pinned Products Section */}
        {pinnedProducts.length > 0 && (
          <ProductSection
            title="Featured"
            description="Hand-picked products by the creator"
            icon={Star}
            iconColor="text-amber-500"
            iconBgColor="bg-amber-500/10"
          >
            <ProductGrid
              products={pinnedProducts}
              onProductClick={onProductClick}
              displayName={displayName}
              autoSelectCard={true}
            />
          </ProductSection>
        )}

        {/* Category Sections */}
        {categories.map((category) => (
          <ProductSection
            key={category.id}
            title={category.title}
            description={category.description}
            icon={category.icon}
            iconColor={category.iconColor}
            iconBgColor={category.iconBgColor}
          >
            <ProductGrid
              products={category.products}
              onProductClick={onProductClick}
              displayName={displayName}
              autoSelectCard={true}
            />
          </ProductSection>
        ))}
      </div>
    </AnimatedFilterResults>
  );
}
