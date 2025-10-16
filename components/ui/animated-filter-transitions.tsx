"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedFilterResultsProps {
  children: ReactNode;
  filterKey: string; // Change this when filters change to trigger animation
  className?: string;
}

export function AnimatedFilterResults({ 
  children, 
  filterKey,
  className 
}: AnimatedFilterResultsProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={filterKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// For individual items in a list
export function AnimatedListItem({
  children,
  index = 0,
  className
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// For grid items
export function AnimatedGridItem({
  children,
  index = 0,
  className
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade transition for count/stats
export function AnimatedCount({
  value,
  className
}: {
  value: string | number;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// Example usage:
/*
// Wrap filtered results
<AnimatedFilterResults filterKey={`${category}-${priceRange}-${search}`}>
  <div className="grid grid-cols-3 gap-4">
    {filteredProducts.map((product, i) => (
      <AnimatedGridItem key={product.id} index={i}>
        <ProductCard {...product} />
      </AnimatedGridItem>
    ))}
  </div>
</AnimatedFilterResults>

// Animated count
<AnimatedCount value={filteredProducts.length} />
*/

