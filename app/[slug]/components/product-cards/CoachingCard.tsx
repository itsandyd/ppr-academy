"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Users, Calendar, Clock, Video, MessageCircle, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * CoachingCard - One-on-one coaching sessions and mentorship
 */
export function CoachingCard({ product, onClick, displayName }: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;
  const isFree = product.price === 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-purple-500/5 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Header with coach image */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-600/80 via-violet-600/70 to-purple-600/80 overflow-hidden">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={640}
              height={144}
              className="h-full w-full object-cover opacity-40"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : null}

        {/* Video call illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Video className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="bg-indigo-500/90 text-white text-xs font-medium">
            <Users className="mr-1 h-3 w-3" />
            1-on-1 Coaching
          </Badge>
          {isNew && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold transition-colors group-hover:text-indigo-500">
              {product.title || "Personal Coaching Session"}
            </h3>
            {product.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Session details */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              60 min session
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Video call
            </span>
          </div>

          {/* What's included */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-muted-foreground">Personalized feedback</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-muted-foreground">Action items & resources</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-muted-foreground">Recording provided</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {isFree ? "Free" : `$${product.price}`}
              </span>
              <span className="text-xs text-muted-foreground ml-1">/session</span>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600"
            size="sm"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {product.buttonLabel || "Book Session"}
          </Button>

          {displayName && (
            <p className="text-center text-xs text-muted-foreground">
              with {displayName}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
