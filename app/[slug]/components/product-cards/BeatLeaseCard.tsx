"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Music, Play, Pause, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";
import { useState, useRef, useEffect } from "react";

/**
 * BeatLeaseCard - Specialized card for beat leases with audio preview
 * Displays BPM, key, genre, and tiered pricing options
 */
export function BeatLeaseCard({ product, onClick }: ProductCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isNew = Date.now() - product._creationTime < 7 * 24 * 60 * 60 * 1000;

  // Get pricing info from beat lease config
  const tiers = product.beatLeaseConfig?.tiers?.filter((t) => t.enabled) || [];
  const lowestPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : product.price;
  const hasMultipleTiers = tiers.length > 1;

  // Audio playback
  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Hidden audio element */}
      {product.demoAudioUrl && (
        <audio ref={audioRef} src={product.demoAudioUrl} preload="none" />
      )}

      {/* Cover Art / Waveform */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-fuchsia-900/50 overflow-hidden">
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
            <Music className="h-16 w-16 text-purple-400/60" />
          </div>
        )}

        {/* Play button overlay */}
        {product.demoAudioUrl && (
          <button
            onClick={togglePlayback}
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "flex h-14 w-14 items-center justify-center rounded-full",
              "bg-white/90 text-purple-600 shadow-xl transition-all",
              "hover:scale-110 hover:bg-white",
              isPlaying && "animate-pulse"
            )}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </button>
        )}

        {/* Progress bar */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="bg-purple-500/90 text-white text-xs font-medium">
            <Music className="mr-1 h-3 w-3" />
            Beat
          </Badge>
          {isNew && (
            <Badge className="bg-amber-500/90 text-white text-xs font-medium">
              <Sparkles className="mr-1 h-3 w-3" />
              New
            </Badge>
          )}
        </div>

        {/* Price Badge */}
        <Badge className="absolute right-3 top-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold">
          {hasMultipleTiers ? `From $${lowestPrice}` : `$${lowestPrice}`}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-purple-400">
              {product.title}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </div>

          {/* Beat metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(product.beatLeaseConfig?.bpm || product.bpm) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-1 text-purple-400">
                <Clock className="h-3 w-3" />
                {product.beatLeaseConfig?.bpm || product.bpm} BPM
              </span>
            )}
            {(product.beatLeaseConfig?.key || product.musicalKey) && (
              <span className="rounded-full bg-fuchsia-500/10 px-2 py-1 text-fuchsia-400">
                {product.beatLeaseConfig?.key || product.musicalKey}
              </span>
            )}
            {(product.beatLeaseConfig?.genre || product.genre?.[0]) && (
              <span className="rounded-full bg-purple-500/10 px-2 py-1 text-purple-400 capitalize">
                {product.beatLeaseConfig?.genre || product.genre?.[0]}
              </span>
            )}
          </div>

          {/* License tiers preview */}
          {hasMultipleTiers && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {tiers.slice(0, 3).map((tier, i) => (
                <span key={tier.type} className="flex items-center">
                  {i > 0 && <span className="mx-1">•</span>}
                  <span className="capitalize">{tier.type}</span>
                  <span className="ml-1 font-medium text-purple-400">${tier.price}</span>
                </span>
              ))}
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            size="sm"
          >
            {product.buttonLabel || "Lease This Beat"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
