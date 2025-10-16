"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MasonryGridProps {
  children: ReactNode[];
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: number;
  animated?: boolean;
  className?: string;
}

/**
 * Masonry grid layout for product cards
 * Creates Pinterest-style staggered grid
 */
export function MasonryGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3 },
  gap = 6,
  animated = true,
  className
}: MasonryGridProps) {
  const { sm = 1, md = 2, lg = 3 } = columns;
  const gapClass = `gap-${gap}`;

  return (
    <div className={cn("w-full", className)}>
      {/* CSS Masonry Grid (modern browsers) */}
      <div
        className={cn(
          "columns-1",
          md && `md:columns-${md}`,
          lg && `lg:columns-${lg}`,
          gapClass
        )}
        style={{ columnGap: `${gap * 4}px` }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className={cn("break-inside-avoid mb-6")}
            style={{ marginBottom: `${gap * 4}px` }}
          >
            {animated ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
              >
                {child}
              </motion.div>
            ) : (
              child
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Staggered grid - Alternative to masonry
 * Items arranged in rows with alternating heights
 */
export function StaggeredGrid({
  children,
  className
}: {
  children: ReactNode[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {children.map((child, index) => {
        // Alternate between normal and tall cards
        const isTall = index % 5 === 0 || index % 7 === 0;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.05,
              ease: "easeOut"
            }}
            className={cn(
              isTall && "md:row-span-2"
            )}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Bento grid - Modern asymmetric layout
 * Featured items take more space
 */
export function BentoGrid({
  children,
  featuredIndices = [0, 4, 8],
  className
}: {
  children: ReactNode[];
  featuredIndices?: number[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[200px]", className)}>
      {children.map((child, index) => {
        const isFeatured = featuredIndices.includes(index);
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.05,
              ease: "easeOut"
            }}
            className={cn(
              "relative overflow-hidden rounded-xl",
              isFeatured 
                ? "col-span-1 md:col-span-2 lg:col-span-2 row-span-2"
                : "col-span-1 md:col-span-2 lg:col-span-2"
            )}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}

// Example usage:
/*
// Masonry (Pinterest-style)
<MasonryGrid columns={{ sm: 1, md: 2, lg: 3 }}>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</MasonryGrid>

// Staggered (alternating heights)
<StaggeredGrid>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</StaggeredGrid>

// Bento (featured items larger)
<BentoGrid featuredIndices={[0, 5, 10]}>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</BentoGrid>
*/

