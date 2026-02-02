"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Layers, Download, Lock, Star, Sparkles, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * BundleCard - Product bundles with discount display
 */
export function BundleCard({ product, onClick }: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;
  const isFree = product.price === 0;
  const hasFollowGate = product.followGateEnabled;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = product.discountPercentage ||
    (hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Product image */}
      <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={640}
            height={192}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
            <Layers className="h-16 w-16 text-orange-400 dark:text-orange-600" />
          </div>
        )}

        {/* Follow gate overlay */}
        {hasFollowGate && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <Lock className="h-3 w-3" />
            Follow to Unlock
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {(product as any).isPinned && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium shadow-lg">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          <Badge className="bg-orange-500/90 text-white text-xs font-medium">
            <Layers className="mr-1 h-3 w-3" />
            Bundle
          </Badge>
          {isNew && !(product as any).isPinned && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && !hasFollowGate && (
          <Badge className="absolute right-3 top-3 bg-green-500/90 text-white font-semibold">
            <Percent className="mr-1 h-3 w-3" />
            {discountPercent}% OFF
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-bold transition-colors group-hover:text-orange-500">
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-2">
            {isFree ? (
              <span className="text-lg font-bold text-green-600">FREE</span>
            ) : (
              <>
                <span className="text-lg font-bold">${product.price}</span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </>
            )}
          </div>

          <Button
            className={cn(
              "w-full",
              isFree && !hasFollowGate
                ? "bg-emerald-500 hover:bg-emerald-600"
                : hasFollowGate
                  ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600"
                  : "bg-orange-500 hover:bg-orange-600"
            )}
            size="sm"
          >
            {hasFollowGate ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Unlock Free Bundle
              </>
            ) : isFree ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                Get Free Bundle
              </>
            ) : (
              <>
                <Layers className="mr-2 h-4 w-4" />
                Get Bundle
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
