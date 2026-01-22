"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ListMusic, Send, Clock, Music, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * PlaylistCurationCard - For playlist submission services
 * Shows submission details, pricing, and genre tags
 */
export function PlaylistCurationCard({ product, onClick }: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;
  const acceptsSubmissions = product.acceptsSubmissions !== false;
  const isFree = !product.submissionFee || product.submissionFee === 0;
  const genres = product.genres || [];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Cover / Visual */}
      <div className="relative h-44 bg-gradient-to-br from-emerald-600/80 to-teal-600/80 overflow-hidden">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={640}
              height={176}
              className="h-full w-full object-cover opacity-60"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ListMusic className="h-16 w-16 text-white/40" />
          </div>
        )}

        {/* Floating music notes */}
        <div className="absolute inset-0 overflow-hidden">
          <Music className="absolute left-[15%] top-[25%] h-4 w-4 text-white/20 animate-bounce" style={{ animationDelay: "0s" }} />
          <Music className="absolute left-[70%] top-[35%] h-3 w-3 text-white/15 animate-bounce" style={{ animationDelay: "0.3s" }} />
          <Music className="absolute left-[45%] top-[15%] h-5 w-5 text-white/25 animate-bounce" style={{ animationDelay: "0.6s" }} />
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="bg-emerald-500/90 text-white text-xs font-medium">
            <ListMusic className="mr-1 h-3 w-3" />
            Playlist
          </Badge>
          {isNew && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* Status badge */}
        {!acceptsSubmissions && (
          <Badge className="absolute right-3 top-3 bg-red-500/90 text-white text-xs">
            Closed
          </Badge>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white line-clamp-1 drop-shadow-lg">
            {product.title}
          </h3>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Description */}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Genre tags */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 capitalize"
                >
                  {genre}
                </span>
              ))}
              {genres.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{genres.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Submission details */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Review in 7 days</span>
            </div>
            <div className="font-semibold">
              {isFree ? (
                <span className="text-emerald-600 dark:text-emerald-400">Free Submission</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">${product.submissionFee}</span>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            size="sm"
            disabled={!acceptsSubmissions}
          >
            <Send className="mr-2 h-4 w-4" />
            {acceptsSubmissions ? "Submit Your Track" : "Submissions Closed"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
