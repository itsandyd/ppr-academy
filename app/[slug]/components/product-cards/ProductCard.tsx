"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Package, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * Base ProductCard component that can be used for any product type.
 * Provides a consistent card layout with image, badges, title, description, and CTA.
 */
export function ProductCard({
  product,
  onClick,
  showBadge = true,
  badgeText,
  badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  icon: IconComponent = Package,
}: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000; // 7 days
  const isFree = product.price === 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Product Image */}
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
          <div className="flex h-full w-full items-center justify-center">
            <IconComponent className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Badge row */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {(product as any).isPinned && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium shadow-lg">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          {showBadge && badgeText && (
            <Badge className={cn("text-xs font-medium", badgeColor)}>
              <IconComponent className="mr-1 h-3 w-3" />
              {badgeText}
            </Badge>
          )}
          {isNew && !(product as any).isPinned && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <Badge
          className={cn(
            "absolute right-3 top-3 font-semibold",
            isFree
              ? "bg-emerald-500/90 text-white"
              : "border border-border bg-card text-card-foreground"
          )}
        >
          {isFree ? "FREE" : `$${product.price}`}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          {/* Category/Meta info */}
          {product.category && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{product.category}</span>
            </div>
          )}

          <Button className="w-full" size="sm">
            {product.buttonLabel || (isFree ? "Get Free Access" : "View Details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
