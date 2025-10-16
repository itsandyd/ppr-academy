"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CreatorsPickProduct {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  slug: string;
  type: "course" | "digital" | "bundle";
  rating?: number;
  students?: number;
  reason?: string; // Why the creator picked this
}

interface CreatorsPicksProps {
  products: CreatorsPickProduct[];
  creatorName: string;
  className?: string;
}

export function CreatorsPicks({ 
  products, 
  creatorName,
  className 
}: CreatorsPicksProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full mb-4">
          <Crown className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Creator's Picks
          </span>
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Handpicked by {creatorName}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          The best products to start your journey, personally selected and recommended
        </p>
      </div>

      {/* Featured Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800">
              {/* Featured Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>

              {/* Image */}
              <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-purple-400" />
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {product.type}
                  </Badge>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-sm text-yellow-600">
                      <Star className="w-4 h-4 fill-yellow-600" />
                      <span className="font-medium">{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {product.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>

                {/* Creator's Reason */}
                {product.reason && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs text-amber-900 dark:text-amber-100 italic">
                      "{product.reason}"
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">
                      — {creatorName}
                    </p>
                  </div>
                )}

                {/* Stats */}
                {product.students && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {product.students} students
                    </span>
                  </div>
                )}

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-foreground">
                      {product.price === 0 ? "Free" : `$${product.price}`}
                    </span>
                  </div>
                  <Button asChild>
                    <Link href={`/courses/${product.slug}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Compact version for sidebar
export function CreatorsPicksCompact({ 
  products, 
  creatorName,
  className 
}: CreatorsPicksProps) {
  if (!products || products.length === 0) return null;

  return (
    <Card className={cn("bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800", className)}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold">Creator's Picks</h3>
        </div>

        <div className="space-y-3">
          {products.slice(0, 3).map((product) => (
            <Link 
              key={product.id}
              href={`/courses/${product.slug}`}
              className="block group"
            >
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-black rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {product.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.price === 0 ? "Free" : `$${product.price}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="#all-products">
            View All Products
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

