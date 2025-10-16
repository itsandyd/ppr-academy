"use client";

import { motion } from "framer-motion";
import { Music, Headphones, Radio, Disc, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroFlourishesProps {
  variant?: "default" | "music" | "minimal";
  className?: string;
}

/**
 * Animated background flourishes for hero sections
 * Adds subtle branded elements and micro-animations
 */
export function HeroFlourishes({ 
  variant = "default",
  className 
}: HeroFlourishesProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none opacity-10", className)}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white dark:bg-white rounded-full blur-3xl translate-y-24 -translate-x-24"></div>
      </div>
    );
  }

  if (variant === "music") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
        {/* Floating Icons */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-10 right-20 opacity-10"
        >
          <Music className="w-24 h-24 text-white" />
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -8, 0]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 left-16 opacity-10"
        >
          <Headphones className="w-20 h-20 text-white" />
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-10 opacity-10"
        >
          <Disc className="w-16 h-16 text-white" />
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute bottom-10 right-32 opacity-10"
        >
          <Radio className="w-14 h-14 text-white" />
        </motion.div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-y-36 -translate-x-36"></div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Sparkles */}
      <motion.div
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 right-40"
      >
        <Sparkles className="w-8 h-8 text-white/40" />
      </motion.div>

      <motion.div
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
        className="absolute bottom-32 left-24"
      >
        <Sparkles className="w-6 h-6 text-white/30" />
      </motion.div>

      <motion.div
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.3, 1]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8
        }}
        className="absolute top-1/2 right-20"
      >
        <Sparkles className="w-5 h-5 text-white/25" />
      </motion.div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-24 -translate-x-24"></div>
    </div>
  );
}

/**
 * Branded watermark overlay for sections
 * Subtle PPR branding that doesn't interfere with content
 */
export function BrandedWatermark({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none opacity-5", className)}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <p className="text-9xl font-black text-foreground select-none">
          PPR
        </p>
      </div>
    </div>
  );
}

/**
 * Animated gradient background for hero sections
 */
export function AnimatedGradientBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-[length:200%_100%]"
      />
    </div>
  );
}

/**
 * Pulsing glow effect for important elements
 */
export function PulsingGlow({ 
  color = "purple",
  className 
}: { 
  color?: "purple" | "blue" | "green" | "amber";
  className?: string;
}) {
  const colorClasses = {
    purple: "bg-purple-500/20",
    blue: "bg-blue-500/20",
    green: "bg-green-500/20",
    amber: "bg-amber-500/20"
  };

  return (
    <motion.div
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 0.8, 0.5]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn(
        "absolute inset-0 rounded-full blur-2xl",
        colorClasses[color],
        className
      )}
    />
  );
}

