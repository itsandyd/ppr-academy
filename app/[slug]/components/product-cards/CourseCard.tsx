"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { BookOpen, Clock, Users, Star, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";

/**
 * CourseCard - Educational content with lessons, duration, and skill level
 */
export function CourseCard({ product, onClick }: ProductCardProps) {
  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;
  const isFree = product.price === 0;
  const skillLevel = product.skillLevel || "All Levels";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Course thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-600/80 to-indigo-600/80 overflow-hidden">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={640}
              height={192}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-16 w-16 text-white/40" />
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl">
            <Play className="h-6 w-6 text-blue-600 ml-1" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="bg-blue-500/90 text-white text-xs font-medium">
            <BookOpen className="mr-1 h-3 w-3" />
            Course
          </Badge>
          {isNew && (
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
              : "bg-blue-600/90 text-white"
          )}
        >
          {isFree ? "FREE" : `$${product.price}`}
        </Badge>

        {/* Skill level */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className="bg-black/40 text-white border-white/30 backdrop-blur-sm text-xs">
            {skillLevel}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-bold transition-colors group-hover:text-blue-500">
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          {/* Course meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {product.lessonsCount && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {product.lessonsCount} lessons
              </span>
            )}
            {product.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {product.duration}
              </span>
            )}
            {product.category && (
              <span className="flex items-center gap-1">
                {product.category}
              </span>
            )}
          </div>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            size="sm"
          >
            {product.buttonLabel || (isFree ? "Enroll Free" : "Enroll Now")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
