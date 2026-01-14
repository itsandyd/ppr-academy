"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Play,
  Package,
  Waves,
  ArrowRight,
  Lock,
} from "lucide-react";

interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  productType: string;
  slug?: string;
  category?: string;
  followGateEnabled?: boolean;
}

interface ProductShowcaseProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export function ProductShowcase({ products, onProductClick }: ProductShowcaseProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case "course":
        return BookOpen;
      case "sample":
      case "samplePack":
        return Waves;
      case "preset":
        return Package;
      default:
        return Play;
    }
  };

  const getAccentColor = (type: string, index: number) => {
    const colors = [
      "from-cyan-500 to-blue-600",
      "from-fuchsia-500 to-purple-600",
      "from-amber-500 to-orange-600",
      "from-emerald-500 to-teal-600",
      "from-rose-500 to-pink-600",
    ];
    return colors[index % colors.length];
  };

  const handleClick = (product: Product) => {
    if (product.productType === "course") {
      router.push(`/courses/${product.slug || product._id}`);
    } else {
      onProductClick(product);
    }
  };

  if (products.length === 0) {
    return (
      <motion.div
        className="text-center py-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
          <Package className="w-10 h-10 text-white/30" />
        </div>
        <h3 className="text-2xl font-bold text-white/80 mb-2">No products yet</h3>
        <p className="text-white/50">Check back soon for new releases</p>
      </motion.div>
    );
  }

  return (
    <section className="relative py-16 lg:py-24">
      {/* Section header */}
      <motion.div
        className="container mx-auto px-6 mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-medium">
              Catalog
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-white mt-2">
              Products
            </h2>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-5xl font-black text-white/10">
              {products.length.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Product grid - asymmetric masonry-inspired */}
      <motion.div
        className="container mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => {
            const Icon = getProductIcon(product.productType);
            const accent = getAccentColor(product.productType, index);
            const isHovered = hoveredId === product._id;
            const isFree = product.price === 0;
            const isLarge = index === 0 || index === 4; // Feature first and fifth items

            return (
              <motion.article
                key={product._id}
                variants={itemVariants}
                className={cn(
                  "group relative cursor-pointer",
                  isLarge && "md:col-span-2 lg:col-span-1"
                )}
                onMouseEnter={() => setHoveredId(product._id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleClick(product)}
              >
                {/* Glow effect on hover */}
                <motion.div
                  className={cn(
                    "absolute -inset-1 rounded-3xl bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-500",
                    accent
                  )}
                  animate={{ opacity: isHovered ? 0.4 : 0 }}
                />

                {/* Card */}
                <div className="relative bg-white/[0.03] backdrop-blur-sm rounded-2xl overflow-hidden border border-white/[0.06] transition-all duration-500 group-hover:border-white/[0.12] group-hover:bg-white/[0.05]">
                  {/* Image container */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br",
                        accent,
                        "opacity-20"
                      )} />
                    )}

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                    {/* Product type badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider",
                        "bg-black/60 backdrop-blur-sm border border-white/10 text-white"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                        {product.productType === "digitalProduct" ? "Digital" : product.productType}
                      </span>
                    </div>

                    {/* Follow gate indicator */}
                    {product.followGateEnabled && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 text-amber-300">
                          <Lock className="w-3 h-3" />
                          Gated
                        </span>
                      </div>
                    )}

                    {/* Price tag - floating */}
                    <motion.div
                      className="absolute bottom-4 right-4"
                      initial={false}
                      animate={{
                        y: isHovered ? -8 : 0,
                        scale: isHovered ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className={cn(
                        "inline-block px-4 py-2 rounded-xl text-lg font-bold",
                        isFree
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white text-black"
                      )}>
                        {isFree ? "Free" : `$${product.price}`}
                      </span>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-300">
                      {product.title}
                    </h3>

                    {product.description && (
                      <p className="text-sm text-white/50 line-clamp-2 mb-4">
                        {product.description}
                      </p>
                    )}

                    {/* CTA */}
                    <motion.div
                      className="flex items-center gap-2 text-sm font-medium text-cyan-400"
                      initial={false}
                      animate={{ x: isHovered ? 8 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span>
                        {product.productType === "course" ? "View Course" : "Get Now"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
