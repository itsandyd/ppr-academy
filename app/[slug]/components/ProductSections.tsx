"use client";

import { useMemo } from "react";
import {
  ProductGrid,
  ProductSection,
  categorizeProducts,
  BaseProduct,
} from "./product-cards";
import { AnimatedFilterResults } from "@/components/ui/animated-filter-transitions";

interface ProductSectionsProps {
  products: BaseProduct[];
  onProductClick: (product: BaseProduct) => void;
  displayName?: string;
  filterKey?: string;
}

/**
 * ProductSections - Organizes and displays products grouped by category
 * Each category gets its own section with appropriate styling
 */
export function ProductSections({
  products,
  onProductClick,
  displayName,
  filterKey = "all",
}: ProductSectionsProps) {
  const categories = useMemo(() => categorizeProducts(products), [products]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <AnimatedFilterResults filterKey={filterKey}>
      <div className="space-y-12">
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
