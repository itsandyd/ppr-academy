"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Search,
  Filter,
  BookOpen,
  Play,
  Users,
  Star,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { SubscriptionSection } from "./components/SubscriptionSection";
import {
  ProductSections,
  TrustSignals,
  SocialProof,
  VerifiedCreatorBadge,
} from "./components/";
import { ProductGrid, BaseProduct, getCategoryLabel } from "./components/product-cards";
import {
  StorefrontLayout,
  StorefrontSkeleton,
  StorefrontHero,
} from "@/components/storefront";
import { AnimatedFilterResults } from "@/components/ui/animated-filter-transitions";
import { StorefrontStructuredDataWrapper } from "./components/StorefrontStructuredDataWrapper";
import { ArtistShowcase } from "@/components/music/artist-showcase";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

// Platform configuration for social links
const socialPlatformConfig: Record<string, { icon: React.ReactNode; color: string; hoverColor: string; name: string }> = {
  instagram: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    hoverColor: "hover:border-pink-500/50",
    name: "Instagram",
  },
  twitter: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "bg-black dark:bg-white dark:text-black",
    hoverColor: "hover:border-gray-500/50",
    name: "X",
  },
  youtube: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    color: "bg-red-600",
    hoverColor: "hover:border-red-500/50",
    name: "YouTube",
  },
  tiktok: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    color: "bg-black dark:bg-white dark:text-black",
    hoverColor: "hover:border-gray-500/50",
    name: "TikTok",
  },
  spotify: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    color: "bg-[#1DB954]",
    hoverColor: "hover:border-[#1DB954]/50",
    name: "Spotify",
  },
  soundcloud: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.102-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.059-.104-.12-.104m4.935 2.07c-.27 0-.54.03-.795.09-.165-1.905-1.755-3.39-3.72-3.39-.48 0-.945.09-1.38.255-.18.075-.225.15-.225.3v6.66c0 .15.12.285.27.3h5.85c1.32 0 2.385-1.065 2.385-2.385s-1.065-2.385-2.385-2.385" />
      </svg>
    ),
    color: "bg-[#FF5500]",
    hoverColor: "hover:border-[#FF5500]/50",
    name: "SoundCloud",
  },
  appleMusic: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.401-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393z" />
      </svg>
    ),
    color: "bg-gradient-to-r from-[#FC3C44] to-[#AF2896]",
    hoverColor: "hover:border-[#FC3C44]/50",
    name: "Apple Music",
  },
  bandcamp: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
      </svg>
    ),
    color: "bg-[#1DA0C3]",
    hoverColor: "hover:border-[#1DA0C3]/50",
    name: "Bandcamp",
  },
  threads: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75z" />
      </svg>
    ),
    color: "bg-black dark:bg-white dark:text-black",
    hoverColor: "hover:border-gray-500/50",
    name: "Threads",
  },
  discord: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028z" />
      </svg>
    ),
    color: "bg-[#5865F2]",
    hoverColor: "hover:border-[#5865F2]/50",
    name: "Discord",
  },
  twitch: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
    color: "bg-[#9146FF]",
    hoverColor: "hover:border-[#9146FF]/50",
    name: "Twitch",
  },
  beatport: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.429 5.143v13.714h-7.715l-3.857-3.857V8.143L6 4.286V0h2.571v2.571L12.43 6.43v2.713h4.285V6.857h2.572v4.286h-4.286v2.571l2.571 2.572h1.286V5.143zM2.571 24V8.143l3.858 3.857v7.714h7.714l3.857 3.857v.429z" />
      </svg>
    ),
    color: "bg-[#94D500]",
    hoverColor: "hover:border-[#94D500]/50",
    name: "Beatport",
  },
  linkedin: {
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: "bg-[#0A66C2]",
    hoverColor: "hover:border-[#0A66C2]/50",
    name: "LinkedIn",
  },
  website: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    color: "bg-zinc-600",
    hoverColor: "hover:border-zinc-500/50",
    name: "Website",
  },
};

// Sidebar social link - full width, shows icon + label (or platform name if no label)
function SidebarSocialLink({ href, platform, label }: { href: string; platform: string; label?: string }) {
  const config = socialPlatformConfig[platform] || socialPlatformConfig.website;
  const displayText = label || config.name;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30 transition-all duration-200 hover:bg-muted/50 ${config.hoverColor}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-md ${config.color} flex items-center justify-center text-white`}>
        {config.icon}
      </div>
      <span className="text-sm font-medium truncate">{displayText}</span>
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0" />
    </a>
  );
}

// Sidebar social button component - shows icon only when no label, icon + label when label provided (kept for backwards compatibility)
function SidebarSocialButton({ href, platform, label }: { href: string; platform: string; label?: string }) {
  const platformConfig: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
    instagram: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      color: "hover:border-[#E4405F] hover:bg-[#E4405F]/10 hover:text-[#E4405F]",
      name: "Instagram",
    },
    twitter: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "hover:border-black hover:bg-black/10 hover:text-black dark:hover:border-white dark:hover:bg-white/10 dark:hover:text-white",
      name: "X",
    },
    youtube: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: "hover:border-[#FF0000] hover:bg-[#FF0000]/10 hover:text-[#FF0000]",
      name: "YouTube",
    },
    tiktok: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
      color: "hover:border-black hover:bg-black/10 hover:text-black dark:hover:border-white dark:hover:bg-white/10 dark:hover:text-white",
      name: "TikTok",
    },
    spotify: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      ),
      color: "hover:border-[#1DB954] hover:bg-[#1DB954]/10 hover:text-[#1DB954]",
      name: "Spotify",
    },
    soundcloud: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.102-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.059-.104-.12-.104m4.935 2.07c-.27 0-.54.03-.795.09-.165-1.905-1.755-3.39-3.72-3.39-.48 0-.945.09-1.38.255-.18.075-.225.15-.225.3v6.66c0 .15.12.285.27.3h5.85c1.32 0 2.385-1.065 2.385-2.385s-1.065-2.385-2.385-2.385" />
        </svg>
      ),
      color: "hover:border-[#FF5500] hover:bg-[#FF5500]/10 hover:text-[#FF5500]",
      name: "SoundCloud",
    },
    appleMusic: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.401-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393z" />
        </svg>
      ),
      color: "hover:border-[#FC3C44] hover:bg-[#FC3C44]/10 hover:text-[#FC3C44]",
      name: "Apple Music",
    },
    bandcamp: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
        </svg>
      ),
      color: "hover:border-[#1DA0C3] hover:bg-[#1DA0C3]/10 hover:text-[#1DA0C3]",
      name: "Bandcamp",
    },
    threads: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75z" />
        </svg>
      ),
      color: "hover:border-black hover:bg-black/10 hover:text-black dark:hover:border-white dark:hover:bg-white/10 dark:hover:text-white",
      name: "Threads",
    },
    discord: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028z" />
        </svg>
      ),
      color: "hover:border-[#5865F2] hover:bg-[#5865F2]/10 hover:text-[#5865F2]",
      name: "Discord",
    },
    twitch: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
        </svg>
      ),
      color: "hover:border-[#9146FF] hover:bg-[#9146FF]/10 hover:text-[#9146FF]",
      name: "Twitch",
    },
    beatport: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.429 5.143v13.714h-7.715l-3.857-3.857V8.143L6 4.286V0h2.571v2.571L12.43 6.43v2.713h4.285V6.857h2.572v4.286h-4.286v2.571l2.571 2.572h1.286V5.143zM2.571 24V8.143l3.858 3.857v7.714h7.714l3.857 3.857v.429z" />
        </svg>
      ),
      color: "hover:border-[#94D500] hover:bg-[#94D500]/10 hover:text-[#94D500]",
      name: "Beatport",
    },
    linkedin: {
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      color: "hover:border-[#0A66C2] hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
      name: "LinkedIn",
    },
    website: {
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      color: "hover:border-zinc-500 hover:bg-zinc-500/10 hover:text-zinc-500",
      name: "Website",
    },
  };

  const config = platformConfig[platform] || platformConfig.website;
  const hasLabel = !!label;

  return (
    <Button
      variant="outline"
      size="sm"
      className={`${hasLabel ? "min-w-[80px] flex-1" : "w-9 h-9 p-0"} ${config.color}`}
      asChild
    >
      <a href={href} target="_blank" rel="noopener noreferrer" title={label || config.name}>
        {hasLabel ? (
          <>
            <span className="mr-1">{config.icon}</span>
            {label}
          </>
        ) : (
          config.icon
        )}
      </a>
    </Button>
  );
}

interface StorefrontPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function StorefrontPage({ params }: StorefrontPageProps) {
  // Unwrap the params Promise
  const { slug } = use(params);
  const router = useRouter();

  // Enhanced filtering and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug: slug });

  // Fetch artist profile by slug (for Linktree-style profiles)
  const artistProfile = useQuery(api.musicShowcase.getArtistProfileBySlug, { slug: slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch user data for artist profile if no store
  const artistUser = useQuery(
    api.users.getUserFromClerk,
    artistProfile && !store ? { clerkId: artistProfile.userId } : "skip"
  );

  // Fetch published products for this store (public storefront only shows published)
  const products = useQuery(
    api.digitalProducts.getPublishedProductsByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Fetch published courses from Convex (public storefront only shows published)
  const courses = useQuery(
    api.courses.getPublishedCoursesByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Fetch connected social accounts for this store
  const socialAccounts = useQuery(
    api.socialMedia?.getSocialAccounts as any,
    store ? { storeId: store._id } : "skip"
  );

  // Fetch store statistics
  const storeStats = useQuery(
    api.storeStats.getQuickStoreStats,
    store ? { storeId: store._id } : "skip"
  );

  // TODO: Fetch coaching profiles for this store
  // const coachProfiles = useQuery(
  //   api.coachProfiles.getProfilesByStore,
  //   store ? { storeId: store._id } : "skip"
  // );


  // Combine all product types into unified list with BaseProduct shape
  const allProducts: BaseProduct[] = useMemo(
    () => [
      // Digital Products (preserve existing productType or default to "digitalProduct")
      ...(products || []).map((product: any): BaseProduct => ({
        _id: product._id,
        title: product.title,
        description: product.description,
        price: product.price || 0,
        imageUrl: product.imageUrl,
        buttonLabel: product.buttonLabel,
        downloadUrl: product.downloadUrl,
        url: product.url,
        slug: product.slug || product._id,
        category: product.category || "Digital Product",
        productType: product.productType || "digitalProduct",
        productCategory: product.productCategory,
        _creationTime: product._creationTime,
        isPublished: product.isPublished,
        style: product.style,
        followGateEnabled: product.followGateEnabled,
        followGateRequirements: product.followGateRequirements,
        followGateSocialLinks: product.followGateSocialLinks,
        followGateMessage: product.followGateMessage,
        beatLeaseConfig: product.beatLeaseConfig,
        bpm: product.bpm,
        musicalKey: product.musicalKey,
        genre: product.genre,
        demoAudioUrl: product.demoAudioUrl,
        tierName: product.tierName,
        priceMonthly: product.priceMonthly,
        priceYearly: product.priceYearly,
        benefits: product.benefits,
        trialDays: product.trialDays,
        acceptsSubmissions: product.acceptsSubmissions,
        submissionFee: product.submissionFee,
        genres: product.genres,
        mediaType: product.mediaType,
      })),

      // Courses (add course-specific properties)
      ...(courses || []).map((course: any): BaseProduct => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        price: course.price || 0,
        imageUrl: course.imageUrl,
        buttonLabel: "Enroll Now",
        slug: course.slug || course._id,
        category: course.category || "Course",
        productType: "course",
        _creationTime: course._creationTime,
        isPublished: course.isPublished,
        skillLevel: course.skillLevel,
        duration: course.duration,
        lessonsCount: course.lessonsCount,
      })),
    ],
    [products, courses]
  );

  // Enhanced filtering and search logic
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.productType === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange !== "all") {
      switch (selectedPriceRange) {
        case "free":
          filtered = filtered.filter((product) => (product.price || 0) === 0);
          break;
        case "under50":
          filtered = filtered.filter(
            (product) => (product.price || 0) > 0 && (product.price || 0) < 50
          );
          break;
        case "50to100":
          filtered = filtered.filter(
            (product) => (product.price || 0) >= 50 && (product.price || 0) <= 100
          );
          break;
        case "over100":
          filtered = filtered.filter((product) => (product.price || 0) > 100);
          break;
      }
    }

    // Sort products - pinned products always come first
    filtered.sort((a, b) => {
      // First, sort by pinned status (pinned products come first)
      const aIsPinned = (a as any).isPinned ? 1 : 0;
      const bIsPinned = (b as any).isPinned ? 1 : 0;
      if (aIsPinned !== bIsPinned) {
        return bIsPinned - aIsPinned; // Pinned products first
      }

      // For pinned products, sort by pinnedAt (most recently pinned first)
      if (aIsPinned && bIsPinned) {
        const aPinnedAt = (a as any).pinnedAt || 0;
        const bPinnedAt = (b as any).pinnedAt || 0;
        if (aPinnedAt !== bPinnedAt) {
          return bPinnedAt - aPinnedAt;
        }
      }

      // Then apply the selected sort within each group
      switch (sortBy) {
        case "newest":
          return b._creationTime - a._creationTime;
        case "oldest":
          return a._creationTime - b._creationTime;
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, searchTerm, selectedCategory, selectedPriceRange, sortBy]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allProducts.map((p) => p.productType || "digitalProduct"))];
    return uniqueCategories.map((cat) => ({
      value: cat,
      label: getCategoryLabel(cat),
    }));
  }, [allProducts]);

  // Check if there are lead magnets (price: 0)
  const leadMagnets =
    products?.filter((p: any) => p.price === 0 && (p.style === "card" || p.style === "callout")) ||
    [];
  const hasLeadMagnets = leadMagnets.length > 0;
  const latestLeadMagnet = hasLeadMagnets
    ? leadMagnets.sort((a: any, b: any) => b._creationTime - a._creationTime)[0]
    : null;

  const leadMagnetData = latestLeadMagnet
    ? {
        title: latestLeadMagnet.title,
        subtitle: latestLeadMagnet.description,
        imageUrl: latestLeadMagnet.imageUrl,
        ctaText: latestLeadMagnet.buttonLabel,
        downloadUrl: latestLeadMagnet.downloadUrl,
      }
    : null;

  // Click handlers - Navigate to dedicated landing pages
  const handleProductClick = (product: any) => {
    const productSlug = product.slug || product._id;
    const productType = product.productType || product.productCategory || "digitalProduct";

    // Route to appropriate landing page based on product type
    switch (productType) {
      case "course":
        router.push(`/${slug}/courses/${productSlug}`);
        break;
      case "beat-lease":
        router.push(`/${slug}/beats/${productSlug}`);
        break;
      case "membership":
        router.push(`/${slug}/memberships/${productSlug}`);
        break;
      case "tip-jar":
        router.push(`/${slug}/tips/${productSlug}`);
        break;
      case "coaching":
        router.push(`/${slug}/coaching/${productSlug}`);
        break;
      case "urlMedia":
        // URL/Media products open external link directly
        if (product.url) {
          window.open(product.url, "_blank", "noopener,noreferrer");
        }
        break;
      default:
        // All other digital products go to the products landing page
        router.push(`/${slug}/products/${productSlug}`);
        break;
    }
  };


  const handleStartStorefront = () => {
    router.push("/sign-up?intent=creator");
  };

  const handleSeeExamples = () => {
    router.push("/courses"); // or wherever you want to show examples
  };

  const handleLeadMagnetClick = () => {
    if (leadMagnetData?.downloadUrl) {
      window.open(leadMagnetData.downloadUrl, "_blank");
    }
  };

  // Determine page type: store storefront or artist profile
  const hasStore = !!store;
  const hasProducts = (products && products.length > 0) || (courses && courses.length > 0);
  const hasArtistProfile = !!artistProfile;
  const shouldShowStore = hasStore && hasProducts;
  const shouldShowArtistProfile = hasArtistProfile && !shouldShowStore;

  // Enhanced loading state with skeleton
  // If we have a store, wait for store data. Otherwise, wait for artist profile data.
  const isLoadingStore =
    store === undefined ||
    (store && (user === undefined || products === undefined || courses === undefined));
  const isLoadingArtist =
    !store && (artistProfile === undefined || (artistProfile && artistUser === undefined));

  // Show loading if we're still determining what to show
  if ((store === undefined && artistProfile === undefined) || isLoadingStore || isLoadingArtist) {
    return <StorefrontSkeleton />;
  }

  // Show artist profile if no store or store has no products
  if (shouldShowArtistProfile && artistProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="font-semibold">
                  {artistProfile.displayName || artistProfile.artistName}
                </h1>
                <p className="hidden text-sm text-muted-foreground sm:block">Music Showcase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Showcase Content */}
        <div className="container mx-auto px-4 py-8">
          <ArtistShowcase artistProfileId={artistProfile.userId} isOwner={false} />
        </div>
      </div>
    );
  }

  // Store not found and no artist profile
  if (store === null && artistProfile === null) {
    notFound();
  }

  // If we get here, show store storefront
  if (!store) {
    return null; // Should not happen, but safety check
  }

  // Get display name and avatar
  const displayName = user?.name || "Store Owner";
  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = user?.imageUrl || "";

  return (
    <StorefrontLayout>
      {/* Structured Data for SEO */}
      <StorefrontStructuredDataWrapper
        name={displayName}
        description={store.description || store.bio}
        url={`${baseUrl}/${slug}`}
        imageUrl={store.bannerImage || store.logoUrl}
        socialLinks={{
          instagram: store.socialLinks?.instagram,
          twitter: store.socialLinks?.twitter,
          youtube: store.socialLinks?.youtube,
        }}
      />

      {/* Hero Section */}
      <StorefrontHero
        displayName={displayName}
        storeName={store.name}
        bio={store.bio || store.description}
        avatarUrl={avatarUrl}
        initials={initials}
        stats={{
          products: storeStats?.totalItems || allProducts.length,
          students: storeStats?.totalStudents || 0,
          sales: storeStats?.totalSales || 0,
        }}
        socialLinks={store.socialLinks}
        socialLinksV2={store.socialLinksV2}
        userId={store.userId}
      />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-3">
            {/* Search and Filters */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Filter className="h-5 w-5 text-cyan-400" />
                Search & Filter
              </h2>
              <div className="flex flex-col gap-4 md:flex-row">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search products, courses, and more..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Price Range Filter */}
                <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="under50">Under $50</SelectItem>
                    <SelectItem value="50to100">$50 - $100</SelectItem>
                    <SelectItem value="over100">Over $100</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-36">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}{" "}
                found
                {searchTerm && ` for "${searchTerm}"`}
              </p>
              {(searchTerm || selectedCategory !== "all" || selectedPriceRange !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedPriceRange("all");
                    setSortBy("newest");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Products Organized by Category */}
            {filteredProducts.length > 0 ? (
              <>
                {/* Show categorized sections when viewing all categories without search */}
                {selectedCategory === "all" && !searchTerm ? (
                  <ProductSections
                    products={filteredProducts}
                    onProductClick={handleProductClick}
                    displayName={displayName}
                    filterKey={`${selectedCategory}-${selectedPriceRange}-${searchTerm}-${sortBy}`}
                  />
                ) : (
                  /* Show flat grid when filtering or searching */
                  <AnimatedFilterResults
                    filterKey={`${selectedCategory}-${selectedPriceRange}-${searchTerm}-${sortBy}`}
                  >
                    <ProductGrid
                      products={filteredProducts}
                      onProductClick={handleProductClick}
                      displayName={displayName}
                      autoSelectCard={true}
                    />
                  </AnimatedFilterResults>
                )}
              </>
            ) : (
              /* No Results State */
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No products found</h3>
                <p className="mb-4 text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedPriceRange("all");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Lead Magnet Section (if exists) */}
            {leadMagnetData && (
              <div className="mt-12 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold">🎁 Free Resource</h3>
                  <h4 className="mb-2 text-lg font-semibold">{leadMagnetData.title}</h4>
                  <p className="mb-4 text-muted-foreground">{leadMagnetData.subtitle}</p>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80"
                    onClick={handleLeadMagnetClick}
                  >
                    {leadMagnetData.ctaText || "Download Free"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* About Store Card */}
            <Card className="sticky top-4 border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-primary" />
                  About This Store
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm font-medium">Products</span>
                    <Badge variant="secondary">
                      {storeStats?.totalItems || allProducts.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm font-medium">Students</span>
                    <Badge variant="secondary">{storeStats?.totalStudents || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm font-medium">Sales</span>
                    <Badge variant="secondary">{storeStats?.totalSales || 0}</Badge>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-bold text-primary-foreground">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={48}
                          height={48}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{store.name}</p>
                    </div>
                  </div>
                  {(store.bio || store.description) && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {store.bio || store.description}
                    </p>
                  )}
                </div>

                {/* Social Links in Sidebar */}
                {((store.socialLinksV2 && store.socialLinksV2.length > 0) ||
                  store.socialLinks?.instagram ||
                  store.socialLinks?.twitter ||
                  store.socialLinks?.youtube ||
                  store.socialLinks?.tiktok ||
                  store.socialLinks?.spotify) && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-sm font-medium">Connect with me</p>
                    <div className="flex flex-col gap-2">
                      {store.socialLinksV2 && store.socialLinksV2.length > 0 ? (
                        // Use V2 format with labels
                        store.socialLinksV2.map((link, index) => (
                          <SidebarSocialLink
                            key={`${link.platform}-${index}`}
                            href={link.url}
                            platform={link.platform}
                            label={link.label}
                          />
                        ))
                      ) : (
                        // Fallback to legacy format
                        <>
                          {store.socialLinks?.instagram && (
                            <SidebarSocialLink href={store.socialLinks.instagram} platform="instagram" />
                          )}
                          {store.socialLinks?.youtube && (
                            <SidebarSocialLink href={store.socialLinks.youtube} platform="youtube" />
                          )}
                          {store.socialLinks?.spotify && (
                            <SidebarSocialLink href={store.socialLinks.spotify} platform="spotify" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Creator Call-to-Action Section */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="relative overflow-hidden">
          {/* Enhanced Background with Gradient & Pattern */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-chart-1/30 via-chart-2/20 to-chart-3/30"></div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          {/* Floating Elements for Visual Interest */}
          <div className="absolute left-10 top-10 h-20 w-20 animate-pulse rounded-full bg-chart-1/20 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 h-32 w-32 animate-pulse rounded-full bg-chart-3/20 blur-3xl delay-1000"></div>

          <div className="relative p-8 md:p-16">
            <div className="mx-auto max-w-5xl">
              {/* Attention-Grabbing Pre-Headline */}
              <div className="mb-8 text-center">
                <Badge className="mb-4 border-none bg-gradient-to-r from-chart-1 to-chart-4 px-6 py-2 text-base font-semibold text-primary-foreground shadow-lg">
                  🎵 For Music Creators Like {displayName}
                </Badge>

                {/* Power Headline with Benefit Focus */}
                <h2 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
                    Build Your Own
                  </span>
                  <br />
                  <span className="text-foreground">Professional Storefront</span>
                </h2>

                {/* Compelling Sub-Headline */}
                <p className="mx-auto mb-4 max-w-3xl text-xl font-medium text-foreground/80 md:text-2xl">
                  Sell sample packs, presets, courses, and coaching - all from your own link-in-bio
                  storefront
                </p>
              </div>

              {/* Benefit-Driven Value Props */}
              <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="group rounded-2xl border-2 border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-1/50 hover:shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg transition-transform group-hover:scale-110">
                    <BookOpen className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-bold">All-in-One Platform</h3>
                    <p className="text-sm text-muted-foreground">
                      Sell products, courses, and services from one professional storefront
                    </p>
                  </div>
                </div>

                <div className="group rounded-2xl border-2 border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-2/50 hover:shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2 to-chart-3 shadow-lg transition-transform group-hover:scale-110">
                    <Users className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-bold">Your Brand, Your Way</h3>
                    <p className="text-sm text-muted-foreground">
                      Custom branding perfect for Instagram, TikTok, and YouTube bios
                    </p>
                  </div>
                </div>

                <div className="group rounded-2xl border-2 border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-3/50 hover:shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-1 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-bold">Setup in Minutes</h3>
                    <p className="text-sm text-muted-foreground">
                      Get started quickly with our intuitive platform - no coding required
                    </p>
                  </div>
                </div>
              </div>

              {/* Powerful CTA with Risk Reversal */}
              <div className="text-center">
                <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    className="hover:shadow-3xl group relative overflow-hidden bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 px-12 py-7 text-xl font-bold text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 hover:opacity-90"
                    onClick={handleStartStorefront}
                    aria-label="Start your free storefront"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <span>Get Started Free</span>
                      <ArrowRight
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-chart-2 via-chart-3 to-chart-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  </Button>
                </div>

                {/* Trust Signals & Guarantees */}
                <div className="mb-4 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row sm:gap-8">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span>Free plan available</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span>Setup in under 10 minutes</span>
                  </div>
                </div>

                {/* Final Trust Line */}
                <p className="text-sm text-muted-foreground">
                  Join producers and creators already earning with their own storefronts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <SubscriptionSection storeId={store._id} storeName={displayName} />

      {/* Trust Signals */}
      <div className="container mx-auto px-6 pb-8">
        <TrustSignals variant="compact" className="justify-center" />
      </div>
    </StorefrontLayout>
  );
}
