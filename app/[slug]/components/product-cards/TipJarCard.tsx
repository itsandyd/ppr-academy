"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Heart, Coffee, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCardProps } from "./types";
import { useState } from "react";

/**
 * TipJarCard - Pay-what-you-want donation interface
 * Allows supporters to choose custom amounts
 */
export function TipJarCard({ product, onClick, displayName }: ProductCardProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const suggestedAmounts = [5, 10, 25, 50];

  const handleAmountSelect = (amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAmount(amount);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
        "border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-orange-500/5 backdrop-blur-sm"
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Header with gradient */}
      <div className="relative h-40 bg-gradient-to-br from-rose-500/80 via-rose-600/70 to-orange-500/80 overflow-hidden">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={640}
              height={160}
              className="h-full w-full object-cover opacity-40"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : null}

        {/* Floating hearts animation */}
        <div className="absolute inset-0 overflow-hidden">
          <Heart className="absolute left-[20%] top-[30%] h-4 w-4 text-white/30 animate-pulse" />
          <Heart className="absolute left-[60%] top-[20%] h-3 w-3 text-white/20 animate-pulse delay-300" />
          <Heart className="absolute left-[80%] top-[50%] h-5 w-5 text-white/25 animate-pulse delay-500" />
        </div>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Coffee className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Badge */}
        <Badge className="absolute left-3 top-3 bg-white/20 backdrop-blur-sm text-white text-xs font-medium border-0">
          <Heart className="mr-1 h-3 w-3 fill-current" />
          Support
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {product.title || "Support My Work"}
            </h3>
            {product.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Amount selection */}
          <div className="grid grid-cols-4 gap-2">
            {suggestedAmounts.map((amount) => (
              <button
                key={amount}
                onClick={(e) => handleAmountSelect(amount, e)}
                className={cn(
                  "rounded-lg border py-2 text-sm font-medium transition-all",
                  selectedAmount === amount
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-rose-200 dark:border-rose-800 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                )}
              >
                ${amount}
              </button>
            ))}
          </div>

          {/* Custom amount hint */}
          <p className="text-center text-xs text-muted-foreground">
            Or enter a custom amount
          </p>

          <Button
            className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
            size="sm"
          >
            <Heart className="mr-2 h-4 w-4 fill-current" />
            {selectedAmount ? `Send $${selectedAmount}` : "Send a Tip"}
          </Button>

          {displayName && (
            <p className="text-center text-xs text-muted-foreground">
              Your support means the world to {displayName}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
