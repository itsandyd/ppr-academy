"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ImageIcon, Lock } from "lucide-react";

// ────────────────────────────────────────────────────────────────
// ScreenshotShowcase
// A browser-chrome–framed image container that breaks out of the
// 680 px text column to ~900 px for visual impact.
//
// TODO: Replace placeholder screenshots with real product images.
//       Pass `src="/path/to/screenshot.png"` once assets exist.
// ────────────────────────────────────────────────────────────────

interface ScreenshotShowcaseProps {
  /** Path to the screenshot image (public/ or Convex URL). Omit for placeholder. */
  src?: string;
  /** Alt text — always required. */
  alt: string;
  /** Short caption rendered below the frame. */
  caption: string;
  /** Fake URL shown in the browser chrome address bar. */
  url?: string;
  /** Fallback content rendered inside the viewport when no `src`. */
  children?: ReactNode;
  /** CSS aspect-ratio value. @default "16/9" */
  aspectRatio?: string;
}

export function ScreenshotShowcase({
  src,
  alt,
  caption,
  url = "pauseplayrepeat.com",
  children,
  aspectRatio = "16/9",
}: ScreenshotShowcaseProps) {
  return (
    <motion.figure
      className="relative mx-auto my-16 w-[calc(100%+2rem)] max-w-[900px] -translate-x-4 sm:my-20 sm:w-[calc(100%+6rem)] sm:-translate-x-12 lg:w-[900px] lg:-translate-x-[110px]"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Browser chrome frame */}
      <div className="group overflow-hidden rounded-xl border border-border/30 bg-[hsl(240_10%_10%)] shadow-[0_8px_40px_-12px_rgba(139,92,246,0.12)] transition-shadow duration-500 hover:shadow-[0_12px_48px_-8px_rgba(139,92,246,0.18)]">
        {/* ── Title bar ── */}
        <div className="flex items-center gap-2 border-b border-border/20 bg-[hsl(240_10%_9%)] px-4 py-2.5">
          {/* Traffic lights */}
          <span className="flex items-center gap-1.5">
            <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
          </span>

          {/* Address bar */}
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-[hsl(240_8%_14%)] px-3 py-1">
            <Lock className="h-3 w-3 shrink-0 text-emerald-400/70" />
            <span className="truncate text-[11px] tracking-wide text-muted-foreground/70 sm:text-xs">
              {url}
            </span>
          </div>
        </div>

        {/* ── Viewport ── */}
        <div
          className="relative w-full overflow-hidden bg-[hsl(240_10%_8%)]"
          style={{ aspectRatio }}
        >
          {src ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 100vw, 900px"
              quality={90}
            />
          ) : children ? (
            children
          ) : (
            /* ── Placeholder ── */
            /* TODO: Replace with real screenshot — pass src="/screenshots/…" */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/20 bg-gradient-to-br from-[hsl(240_10%_10%)] via-[hsl(260_12%_12%)] to-[hsl(240_10%_10%)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <ImageIcon className="h-6 w-6 text-purple-400/60" />
              </div>
              <span className="max-w-[280px] text-center text-xs leading-relaxed text-muted-foreground/50 sm:text-sm">
                {alt}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Caption ── */}
      <figcaption className="mt-4 px-4 text-center text-sm leading-relaxed text-muted-foreground/60 sm:text-[13px]">
        {caption}
      </figcaption>
    </motion.figure>
  );
}

// ────────────────────────────────────────────────────────────────
// SectionVisualBreak
// A decorative divider that replaces plain <hr> elements.
// Three pulsing dots connected by gradient lines — minimal,
// music-EQ–inspired.
// ────────────────────────────────────────────────────────────────

export function SectionVisualBreak() {
  return (
    <div
      className="my-14 flex items-center justify-center gap-0"
      aria-hidden="true"
    >
      {/* Left gradient line */}
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/30 sm:w-24" />

      {/* Dots — EQ-bar inspired */}
      <div className="mx-3 flex items-end gap-1">
        <span className="h-1.5 w-1 rounded-full bg-purple-500/40" />
        <span className="h-3 w-1 rounded-full bg-purple-400/50" />
        <span className="h-2 w-1 rounded-full bg-indigo-400/40" />
      </div>

      {/* Right gradient line */}
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-indigo-500/30 sm:w-24" />
    </div>
  );
}
