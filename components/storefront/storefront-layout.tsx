"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function StorefrontLayout({ children, className }: StorefrontLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-[#0a0a0a] text-white", className)}>
      {/* Fixed background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Loading skeleton for the storefront
export function StorefrontSkeleton() {
  return (
    <StorefrontLayout>
      {/* Hero skeleton */}
      <section className="relative min-h-[70vh] overflow-hidden">
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-[1fr,auto] gap-12 lg:gap-20 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="flex items-end gap-6">
                {/* Avatar skeleton */}
                <div className="relative">
                  <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-full bg-white/5 animate-pulse" />
                </div>
                {/* Label skeleton */}
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
              </div>

              {/* Name skeleton */}
              <div className="space-y-4">
                <div className="h-16 lg:h-24 w-3/4 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-6 w-1/2 bg-white/5 rounded animate-pulse" />
              </div>

              {/* Bio skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full max-w-xl bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-4/5 max-w-xl bg-white/5 rounded animate-pulse" />
              </div>

              {/* Social pills skeleton */}
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-28 bg-white/5 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Right: Stats skeleton */}
            <div className="flex flex-col gap-4 lg:gap-6">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="bg-white/[0.03] rounded-2xl px-8 py-6 border border-white/[0.06]">
                    <div className="h-12 w-20 bg-white/5 rounded animate-pulse mb-2" />
                    <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </section>

      {/* Filter bar skeleton */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-4">
          <div className="flex-1 max-w-md h-12 bg-white/5 rounded-xl animate-pulse" />
          <div className="hidden sm:flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 bg-white/5 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Products grid skeleton */}
      <div className="container mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="h-4 w-16 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-12 w-48 bg-white/5 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="bg-white/[0.03] rounded-2xl overflow-hidden border border-white/[0.06]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="aspect-[4/3] bg-white/5 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-6 w-3/4 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </StorefrontLayout>
  );
}
