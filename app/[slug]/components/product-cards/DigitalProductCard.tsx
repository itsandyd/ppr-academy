"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Package,
  Download,
  Waves,
  Music2,
  FileAudio,
  Palette,
  File,
  Sparkles,
  Lock,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * DigitalProductCard - Generic digital products (sample packs, presets, etc.)
 * Supports different styles like card, callout, etc.
 */
export function DigitalProductCard({ product, onClick }: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;
  const isFree = product.price === 0;
  const hasFollowGate = product.followGateEnabled;

  // Determine icon and color based on category
  const getProductStyle = () => {
    const category = product.productCategory || product.category || "";
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes("sample") || lowerCategory.includes("pack")) {
      return {
        icon: FileAudio,
        gradient: "from-cyan-500/10 to-blue-500/10",
        border: "border-cyan-500/20",
        badge: "bg-cyan-500/90",
        text: "text-cyan-500",
      };
    }
    if (lowerCategory.includes("preset") || lowerCategory.includes("ableton")) {
      return {
        icon: Waves,
        gradient: "from-orange-500/10 to-amber-500/10",
        border: "border-orange-500/20",
        badge: "bg-orange-500/90",
        text: "text-orange-500",
      };
    }
    if (lowerCategory.includes("midi")) {
      return {
        icon: Music2,
        gradient: "from-violet-500/10 to-purple-500/10",
        border: "border-violet-500/20",
        badge: "bg-violet-500/90",
        text: "text-violet-500",
      };
    }
    if (lowerCategory.includes("template") || lowerCategory.includes("project")) {
      return {
        icon: File,
        gradient: "from-emerald-500/10 to-teal-500/10",
        border: "border-emerald-500/20",
        badge: "bg-emerald-500/90",
        text: "text-emerald-500",
      };
    }

    // Default
    return {
      icon: Package,
      gradient: "from-blue-500/10 to-indigo-500/10",
      border: "border-blue-500/20",
      badge: "bg-blue-500/90",
      text: "text-blue-500",
    };
  };

  const style = getProductStyle();
  const IconComponent = style.icon;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        `border ${style.border} bg-gradient-to-br ${style.gradient} backdrop-blur-sm`
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
          <div className="flex h-full w-full items-center justify-center">
            <IconComponent className="h-16 w-16 text-muted-foreground/50" />
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
          <Badge className={cn("text-white text-xs font-medium", style.badge)}>
            <IconComponent className="mr-1 h-3 w-3" />
            {product.category || "Digital"}
          </Badge>
          {isNew && !(product as any).isPinned && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* Price Badge - only show if no follow gate lock badge */}
        {!hasFollowGate && (
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
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className={cn("line-clamp-2 text-lg font-bold transition-colors", `group-hover:${style.text}`)}>
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          <Button
            className={cn(
              "w-full",
              isFree && !hasFollowGate
                ? "bg-emerald-500 hover:bg-emerald-600"
                : hasFollowGate
                  ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600"
                  : ""
            )}
            size="sm"
          >
            {hasFollowGate ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Unlock Free
              </>
            ) : isFree ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                Get Free Access
              </>
            ) : (
              product.buttonLabel || "View Details"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
