"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ExternalLink, Youtube, Music2, Link2, Sparkles, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * UrlMediaCard - External links and media embeds (YouTube, Spotify, etc.)
 */
export function UrlMediaCard({ product, onClick }: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;
  const mediaType = product.mediaType || "link";

  const getMediaStyle = () => {
    switch (mediaType) {
      case "youtube":
        return {
          icon: Youtube,
          gradient: "from-red-500/10 to-red-600/10",
          border: "border-red-500/20",
          badge: "bg-red-500/90",
          buttonGradient: "from-red-500 to-red-600",
          text: "text-red-500",
          label: "YouTube",
        };
      case "spotify":
        return {
          icon: Music2,
          gradient: "from-green-500/10 to-green-600/10",
          border: "border-green-500/20",
          badge: "bg-green-500/90",
          buttonGradient: "from-green-500 to-green-600",
          text: "text-green-500",
          label: "Spotify",
        };
      default:
        return {
          icon: Link2,
          gradient: "from-slate-500/10 to-slate-600/10",
          border: "border-slate-500/20",
          badge: "bg-slate-500/90",
          buttonGradient: "from-slate-500 to-slate-600",
          text: "text-slate-500",
          label: "Link",
        };
    }
  };

  const style = getMediaStyle();
  const IconComponent = style.icon;

  const handleClick = () => {
    if (product.url) {
      window.open(product.url, "_blank", "noopener,noreferrer");
    }
    onClick?.(product);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        `border ${style.border} bg-gradient-to-br ${style.gradient} backdrop-blur-sm`
      )}
      onClick={handleClick}
    >
      {/* Media visual */}
      <div className="relative h-44 overflow-hidden">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={640}
              height={176}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <div className={cn("h-full w-full flex items-center justify-center", `bg-gradient-to-br ${style.gradient}`)}>
            <IconComponent className={cn("h-16 w-16 opacity-40", style.text)} />
          </div>
        )}

        {/* Play button for video content */}
        {mediaType === "youtube" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-xl">
              <Play className="h-6 w-6 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className={cn("text-white text-xs font-medium", style.badge)}>
            <IconComponent className="mr-1 h-3 w-3" />
            {style.label}
          </Badge>
          {isNew && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* External link indicator */}
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
          <ExternalLink className="h-4 w-4 text-white" />
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white line-clamp-2 drop-shadow-lg">
            {product.title}
          </h3>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <Button
            className={cn("w-full bg-gradient-to-r hover:opacity-90", `${style.buttonGradient}`)}
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {product.buttonLabel ||
              (mediaType === "youtube"
                ? "Watch Video"
                : mediaType === "spotify"
                  ? "Listen Now"
                  : "Visit Link")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
