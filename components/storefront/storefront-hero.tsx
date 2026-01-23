"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SendMessageButton } from "@/components/messages/SendMessageButton";

interface StorefrontHeroProps {
  displayName: string;
  storeName: string;
  bio?: string;
  avatarUrl?: string;
  initials: string;
  stats: {
    products: number;
    students: number;
    sales: number;
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    spotify?: string;
  };
  userId?: string; // Clerk ID for messaging
}

export function StorefrontHero({
  displayName,
  storeName,
  bio,
  avatarUrl,
  initials,
  stats,
  socialLinks,
  userId,
}: StorefrontHeroProps) {
  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  return (
    <section className="relative overflow-hidden bg-black">
      {/* Atmospheric Background */}
      <div className="absolute inset-0">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-transparent to-transparent" />

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Waveform-inspired decorative lines - hidden on very small screens */}
        <svg
          className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 w-full opacity-10 hidden sm:block"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <motion.path
            d="M0,60 Q150,20 300,60 T600,60 T900,60 T1200,60"
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <motion.path
            d="M0,80 Q150,40 300,80 T600,80 T900,80 T1200,80"
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-14">
        <div className="space-y-4 sm:space-y-5">
          {/* Avatar + Name cluster - stacked on mobile, horizontal on larger */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Avatar with glow */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-br from-cyan-500/50 to-fuchsia-500/50 rounded-full blur-lg opacity-60" />
              <div className="relative h-14 w-14 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-full overflow-hidden ring-2 ring-white/10">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-cyan-600 to-fuchsia-600 flex items-center justify-center text-lg sm:text-2xl lg:text-3xl font-bold text-white">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            {/* Store label */}
            <motion.span
              className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-400 font-medium sm:pb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {storeName}
            </motion.span>
          </motion.div>

          {/* Display name - responsive typography */}
          <motion.h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1] sm:leading-[0.95]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {displayName}
          </motion.h1>

          {/* Bio */}
          {bio && (
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-white/60 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {bio}
            </motion.p>
          )}

          {/* Stats row */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            <StatCard
              value={stats.products}
              label="Products"
              gradient="from-cyan-500 to-cyan-600"
              delay={0}
            />
            <StatCard
              value={stats.students}
              label="Students"
              gradient="from-fuchsia-500 to-fuchsia-600"
              delay={0.1}
            />
            <StatCard
              value={stats.sales}
              label="Sales"
              gradient="from-amber-500 to-orange-600"
              delay={0.2}
            />
          </motion.div>

          {/* Message button - separate row */}
          {userId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <SendMessageButton
                recipientUserId={userId}
                recipientName={displayName}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 text-sm"
              />
            </motion.div>
          )}

          {/* Social links - pill style */}
          {hasSocials && (
            <motion.div
              className="flex flex-wrap gap-2 sm:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {socialLinks?.instagram && (
                <SocialPill href={socialLinks.instagram} platform="instagram" />
              )}
              {socialLinks?.twitter && (
                <SocialPill href={socialLinks.twitter} platform="twitter" />
              )}
              {socialLinks?.youtube && (
                <SocialPill href={socialLinks.youtube} platform="youtube" />
              )}
              {socialLinks?.tiktok && (
                <SocialPill href={socialLinks.tiktok} platform="tiktok" />
              )}
              {socialLinks?.spotify && (
                <SocialPill href={socialLinks.spotify} platform="spotify" />
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

function StatCard({
  value,
  label,
  gradient,
  delay = 0,
}: {
  value: number;
  label: string;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + delay, duration: 0.5 }}
    >
      <div className={cn(
        "absolute -inset-0.5 rounded-lg sm:rounded-xl bg-gradient-to-r opacity-40 blur-sm transition-opacity group-hover:opacity-80",
        gradient
      )} />
      <div className="relative bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-white/10">
        <div className="text-lg sm:text-xl font-bold text-white tabular-nums text-center">
          {value.toLocaleString()}
        </div>
        <div className="text-[8px] sm:text-[9px] uppercase tracking-wide text-white/50 text-center">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function SocialPill({ href, platform }: { href: string; platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    twitter: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    youtube: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    tiktok: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    spotify: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  };

  const colors: Record<string, string> = {
    instagram: "hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500",
    twitter: "hover:bg-sky-500",
    youtube: "hover:bg-red-600",
    tiktok: "hover:bg-black hover:ring-white/20",
    spotify: "hover:bg-green-600",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full",
        "bg-white/5 border border-white/10 text-white/70",
        "transition-all duration-300 hover:text-white hover:border-transparent hover:scale-105",
        colors[platform]
      )}
    >
      {icons[platform]}
      <span className="text-xs sm:text-sm font-medium capitalize">{platform}</span>
    </a>
  );
}
