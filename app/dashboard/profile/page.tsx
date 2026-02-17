"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing-hooks";
import {
  User,
  Save,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Camera,
  Globe,
  Plus,
  Trash2,
  Pencil,
  Link as LinkIcon,
  Music,
  Check,
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Banknote,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Social platform configuration
const socialPlatforms = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/username", color: "bg-black" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel", color: "bg-red-600" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username", color: "bg-black" },
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/...", color: "bg-[#1DB954]" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/username", color: "bg-[#FF5500]" },
  { key: "appleMusic", label: "Apple Music", placeholder: "https://music.apple.com/artist/...", color: "bg-gradient-to-r from-[#FC3C44] to-[#AF2896]" },
  { key: "bandcamp", label: "Bandcamp", placeholder: "https://username.bandcamp.com", color: "bg-[#1DA0C3]" },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/@username", color: "bg-black" },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/invite", color: "bg-[#5865F2]" },
  { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username", color: "bg-[#9146FF]" },
  { key: "beatport", label: "Beatport", placeholder: "https://beatport.com/artist/...", color: "bg-[#94D500]" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username", color: "bg-[#0A66C2]" },
  { key: "website", label: "Website", placeholder: "https://yoursite.com", color: "bg-zinc-700" },
];

// Social icons component
function SocialIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    twitter: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    youtube: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    tiktok: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    spotify: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
    soundcloud: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.102-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.19-1.308-.19-1.334c-.01-.057-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.059-.104-.12-.104m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.015-.075-.075-.135-.15-.135m.93-.296c-.09 0-.165.075-.179.164l-.18 2.921.18 2.593c.015.09.089.164.179.164.09 0 .164-.074.179-.164l.21-2.593-.21-2.921c-.015-.089-.089-.164-.179-.164m.93-.252c-.105 0-.18.075-.194.18l-.165 3.165.165 2.607c.015.105.09.18.194.18.104 0 .178-.075.194-.18l.194-2.607-.194-3.165c-.015-.105-.089-.18-.194-.18m.94-.09c-.12 0-.209.09-.224.21l-.154 3.239.154 2.61c.015.12.104.21.224.21.12 0 .209-.09.224-.21l.165-2.61-.165-3.239c-.015-.12-.104-.21-.224-.21m1.005-.165c-.135 0-.239.105-.254.24l-.134 3.39.149 2.595c.015.135.119.24.254.24.135 0 .239-.105.254-.24l.165-2.595-.165-3.39c-.015-.135-.119-.24-.254-.24m1.02-.36c-.149 0-.269.12-.284.27l-.12 3.735.12 2.595c.015.15.135.27.284.27.15 0 .27-.12.285-.27l.134-2.595-.134-3.735c-.015-.15-.135-.27-.285-.27m1.034-.21c-.164 0-.299.135-.314.3l-.104 3.93.104 2.58c.015.165.15.3.314.3.165 0 .3-.135.315-.3l.12-2.58-.12-3.93c-.015-.165-.15-.3-.315-.3m1.109.645c0-.18-.149-.33-.329-.33-.181 0-.33.15-.33.33l-.09 3.27.09 2.565c0 .18.149.33.33.33.18 0 .329-.15.329-.33l.105-2.565-.105-3.27m.87-1.035c-.195 0-.36.164-.36.359v.001l-.075 4.32.075 2.55c0 .194.165.359.36.359.195 0 .36-.165.36-.36l.09-2.549-.09-4.32c0-.195-.165-.36-.36-.36m1.17-.645c-.211 0-.39.18-.39.39l-.06 4.95.06 2.535c0 .21.179.39.39.39.21 0 .39-.18.39-.39l.075-2.535-.075-4.95c0-.21-.18-.39-.39-.39m1.095-.135c-.225 0-.405.18-.405.405l-.045 5.07.045 2.52c0 .225.18.405.405.405.225 0 .405-.18.405-.405l.06-2.52-.06-5.07c0-.225-.18-.405-.405-.405m1.155-.27c-.24 0-.42.18-.42.42l-.03 5.325.03 2.505c0 .24.18.42.42.42.24 0 .42-.18.42-.42l.045-2.505-.045-5.325c0-.24-.18-.42-.42-.42m1.125-.12c-.255 0-.435.18-.435.435l-.015 5.43.015 2.49c0 .255.18.435.435.435.255 0 .435-.18.435-.435l.03-2.49-.03-5.43c0-.255-.18-.435-.435-.435m1.095.15c-.255 0-.45.195-.45.45v5.265l.015 2.475c0 .255.195.45.435.45.255 0 .45-.195.45-.45l.015-2.475-.015-5.265c0-.255-.195-.45-.45-.45m4.935 2.07c-.27 0-.54.03-.795.09-.165-1.905-1.755-3.39-3.72-3.39-.48 0-.945.09-1.38.255-.18.075-.225.15-.225.3v6.66c0 .15.12.285.27.3h5.85c1.32 0 2.385-1.065 2.385-2.385s-1.065-2.385-2.385-2.385" />
      </svg>
    ),
    appleMusic: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.401-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.49-2.09-1.335a1.8 1.8 0 011.067-2.283c.34-.125.7-.2 1.063-.26.39-.065.788-.118 1.18-.185.4-.07.58-.265.62-.67.003-.032.007-.062.007-.093V9.057c0-.138-.04-.18-.18-.163-.076.01-.152.02-.228.036l-5.38 1.072c-.053.012-.106.025-.16.04-.12.04-.168.107-.168.234 0 2.916 0 5.833-.004 8.75 0 .4-.05.795-.215 1.166-.297.668-.814 1.07-1.533 1.245-.353.087-.714.136-1.08.15-1.013.034-1.87-.532-2.143-1.453-.2-.677-.075-1.316.4-1.86.346-.39.79-.62 1.3-.725.39-.08.79-.14 1.185-.2.36-.052.54-.233.59-.59.008-.056.01-.112.01-.168V6.2c0-.048.003-.097.01-.144.027-.168.128-.274.29-.316.106-.027.216-.045.324-.065l6.97-1.39.36-.073c.168-.034.33.04.398.192.04.09.06.197.06.3v5.41z" />
      </svg>
    ),
    bandcamp: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
      </svg>
    ),
    threads: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.082-1.146 3.39-1.17 1.066-.02 1.98.13 2.87.46l.076-.18c.097-.252.157-.544.157-.91 0-1.18-.59-2.27-2.15-2.27-1.005 0-1.77.395-2.276 1.176-.13.201-.44.201-.569 0-.39-.6-.137-1.503.88-1.936.634-.27 1.395-.405 2.264-.405 2.39 0 3.866 1.398 3.866 3.66 0 .454-.065.866-.19 1.23.91.538 1.63 1.21 2.13 2.02.77 1.246 1.035 2.759.765 4.38-.4 2.417-1.842 4.37-4.063 5.502-1.634.833-3.543 1.198-5.673 1.085zm.06-6.789c1.182-.064 2.06-.467 2.606-1.2.444-.596.716-1.37.81-2.303-.642-.228-1.343-.343-2.094-.343-.044 0-.088 0-.132.002-.99.03-1.81.295-2.376.766-.518.43-.77.99-.73 1.617.044.686.399 1.175 1.06 1.455.367.155.784.218 1.243.218.18 0 .36-.006.541-.018l.072-.004z" />
      </svg>
    ),
    discord: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    twitch: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
    beatport: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.429 5.143v13.714h-7.715l-3.857-3.857V8.143L6 4.286V0h2.571v2.571L12.43 6.43v2.713h4.285V6.857h2.572v4.286h-4.286v2.571l2.571 2.572h1.286V5.143zM2.571 24V8.143l3.858 3.857v7.714h7.714l3.857 3.857v.429z" />
      </svg>
    ),
    linkedin: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    website: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  };

  return icons[platform] || <Globe className={className} />;
}

interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export default function ProfilePage() {
  const { user } = useUser();
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );
  const updateStoreProfile = useMutation(api.stores.updateStoreProfile);

  // Get user data from Convex for Stripe Connect info
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get pending earnings
  const pendingEarnings = useQuery(
    api.monetizationUtils.getCreatorPendingEarnings,
    user?.id ? { creatorId: user.id } : "skip"
  );

  // Get payout history
  const payoutHistory = useQuery(
    api.monetizationUtils.getCreatorPayouts,
    user?.id ? { creatorId: user.id } : "skip"
  );

  // Calculate totals from payout history
  const totalPaidOut = payoutHistory
    ?.filter((p: { status: string }) => p.status === "completed")
    .reduce((sum: number, p: { netPayout: number }) => sum + p.netPayout, 0) || 0;

  const totalSalesCount = payoutHistory
    ?.filter((p: { status: string }) => p.status === "completed")
    .reduce((sum: number, p: { totalSales: number }) => sum + p.totalSales, 0) || 0;

  // Stripe account status state
  const [stripeAccountStatus, setStripeAccountStatus] = useState<any>(null);
  const [isLoadingStripeStatus, setIsLoadingStripeStatus] = useState(false);

  // Check Stripe account status if user has an account
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (convexUser?.stripeConnectAccountId) {
        setIsLoadingStripeStatus(true);
        try {
          const response = await fetch("/api/stripe/connect/account-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: convexUser.stripeConnectAccountId }),
          });

          const data = await response.json();
          if (data.success) {
            setStripeAccountStatus(data.account);
          }
        } catch (error) {
          console.error("Failed to check account status:", error);
        } finally {
          setIsLoadingStripeStatus(false);
        }
      }
    };

    checkAccountStatus();
  }, [convexUser?.stripeConnectAccountId]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: "",
    isPublic: true,
  });

  // AI bio generation state
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // UploadThing hook for avatar uploads
  const { startUpload } = useUploadThing("avatarUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]?.url) {
        setFormData((prev) => ({ ...prev, avatar: res[0].url }));
        toast.success("Profile picture uploaded!");
      }
      setIsUploadingAvatar(false);
    },
    onUploadError: (error) => {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload profile picture");
      setIsUploadingAvatar(false);
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (2MB max for avatars)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await startUpload([file]);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
      setIsUploadingAvatar(false);
    }

    // Reset input so same file can be selected again
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // Social links state - array of { platform, url }
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogPlatform, setDialogPlatform] = useState("");
  const [dialogUrl, setDialogUrl] = useState("");
  const [dialogLabel, setDialogLabel] = useState("");

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || "",
        bio: store.bio || "",
        avatar: store.avatar || "",
        isPublic: store.isPublic ?? true,
      });

      // Load social links - prefer V2 format, fallback to legacy
      if (store.socialLinksV2 && store.socialLinksV2.length > 0) {
        // Use new V2 format directly
        setSocialLinks(store.socialLinksV2);
      } else if (store.socialLinks) {
        // Convert legacy store.socialLinks object to array
        const links: SocialLink[] = [];
        Object.entries(store.socialLinks).forEach(([platform, url]) => {
          if (url && typeof url === "string" && url.trim()) {
            links.push({ platform, url });
          }
        });
        setSocialLinks(links);
      }
    }
  }, [store]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateBio = async () => {
    if (!store) return;

    setIsGeneratingBio(true);
    try {
      const response = await fetch("/api/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store._id,
          creatorName: formData.name || store.name,
          existingBio: formData.bio,
        }),
      });

      const data = await response.json();

      if (data.success && data.bio) {
        setFormData((prev) => ({ ...prev, bio: data.bio }));
        toast.success(`Bio generated based on ${data.productCount} products!`);
      } else {
        toast.error(data.error || "Failed to generate bio");
      }
    } catch (error) {
      console.error("Failed to generate bio:", error);
      toast.error("Failed to generate bio");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const openAddDialog = () => {
    setEditingIndex(null);
    setDialogPlatform("");
    setDialogUrl("");
    setDialogLabel("");
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    const link = socialLinks[index];
    setEditingIndex(index);
    setDialogPlatform(link.platform);
    setDialogUrl(link.url);
    setDialogLabel(link.label || "");
    setIsAddDialogOpen(true);
  };

  const handleSaveLink = () => {
    if (!dialogPlatform || !dialogUrl.trim()) {
      toast.error("Please select a platform and enter a URL");
      return;
    }

    const newLink: SocialLink = {
      platform: dialogPlatform,
      url: dialogUrl.trim(),
      label: dialogLabel.trim() || undefined,
    };

    if (editingIndex !== null) {
      // Edit existing
      const updated = [...socialLinks];
      updated[editingIndex] = newLink;
      setSocialLinks(updated);
    } else {
      // Add new - no longer preventing duplicates since we support multiple of same platform
      setSocialLinks([...socialLinks, newLink]);
    }

    setIsAddDialogOpen(false);
    setDialogPlatform("");
    setDialogUrl("");
    setDialogLabel("");
    setEditingIndex(null);
  };

  const handleDeleteLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!store || !user?.id) return;

    setIsSaving(true);
    try {
      // Use new V2 format - array that supports multiple links per platform with labels
      const socialLinksV2 = socialLinks.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label,
      }));

      await updateStoreProfile({
        storeId: store._id,
        name: formData.name || undefined,
        bio: formData.bio || undefined,
        avatar: formData.avatar || undefined,
        isPublic: formData.isPublic,
        socialLinksV2: socialLinksV2.length > 0 ? socialLinksV2 : undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!store) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getPlatformInfo = (key: string) => socialPlatforms.find((p) => p.key === key);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage how you appear on your public storefront
          </p>
        </div>
        <Link
          href={`/${store.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Public Profile
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="basic" className="gap-2">
            <User className="h-4 w-4" />
            <span>Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            <span>Social Links</span>
            {socialLinks.length > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {socialLinks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Revenue</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                This information will be displayed on your public profile page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 overflow-hidden">
                    {formData.avatar ? (
                      <Image
                        src={formData.avatar}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {formData.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  {/* Hidden file input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-1.5 bg-background border rounded-full shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{formData.name || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">/{store.slug}</p>
                </div>
              </div>

              {/* Name & Avatar URL */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL (or use camera button)</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar}
                    onChange={(e) => handleInputChange("avatar", e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Click the camera icon to upload, or paste an image URL
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Bio</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateBio}
                    disabled={isGeneratingBio}
                    className="gap-1.5 text-xs"
                  >
                    {isGeneratingBio ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {isGeneratingBio ? "Generating..." : "Generate with AI"}
                  </Button>
                </div>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell visitors about yourself..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  AI will analyze your products to create a relevant bio
                </p>
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {formData.isPublic ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label>Public Profile</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPublic
                      ? "Your profile is visible on the marketplace"
                      : "Your profile is hidden from the marketplace"}
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Social Links</CardTitle>
                  <CardDescription>
                    Add your social profiles to display them on your storefront
                  </CardDescription>
                </div>
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {socialLinks.length === 0 ? (
                <div className="text-center py-12">
                  <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <h3 className="mt-4 text-lg font-medium">No social links yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add your social profiles so visitors can find you
                  </p>
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {socialLinks.map((link, index) => {
                    const platformInfo = getPlatformInfo(link.platform);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border p-3 group"
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg text-white",
                            platformInfo?.color || "bg-zinc-700"
                          )}
                        >
                          <SocialIcon platform={link.platform} className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{platformInfo?.label || link.platform}</p>
                            {link.label && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                {link.label}
                              </span>
                            )}
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary truncate block"
                          >
                            {link.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Stripe Connect Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Connect
              </CardTitle>
              <CardDescription>
                Connect your Stripe account to receive payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStripeStatus ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !convexUser?.stripeConnectAccountId ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Connect Stripe to Get Paid</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Set up Stripe Connect to receive payments from your course sales, products, and other offerings.
                  </p>
                  <Link href="/dashboard/settings/payouts">
                    <Button>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Set Up Payouts
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Account Status */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 dark:bg-green-500/20">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Stripe Account Connected</h4>
                        <p className="text-sm text-muted-foreground">
                          Account ID: {convexUser.stripeConnectAccountId}
                        </p>
                      </div>
                    </div>
                    {stripeAccountStatus && (
                      <Badge className={cn(
                        stripeAccountStatus.isComplete
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                      )}>
                        {stripeAccountStatus.isComplete ? "Active" : "Pending Verification"}
                      </Badge>
                    )}
                  </div>

                  {/* Verification Status - only show if we have status details */}
                  {stripeAccountStatus && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                        <CheckCircle className={cn(
                          "h-4 w-4",
                          stripeAccountStatus.detailsSubmitted
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        )} />
                        <span className="text-sm">Details</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                        <CheckCircle className={cn(
                          "h-4 w-4",
                          stripeAccountStatus.chargesEnabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        )} />
                        <span className="text-sm">Charges</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                        <CheckCircle className={cn(
                          "h-4 w-4",
                          stripeAccountStatus.payoutsEnabled
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        )} />
                        <span className="text-sm">Payouts</span>
                      </div>
                    </div>
                  )}

                  {/* Show message if we couldn't load status */}
                  {!stripeAccountStatus && !isLoadingStripeStatus && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Visit the Payouts page for detailed account status
                    </p>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-3 pt-2">
                    <Link href="/dashboard/settings/payouts" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Banknote className="mr-2 h-4 w-4" />
                        Manage Payouts
                      </Button>
                    </Link>
                    <Button variant="outline" asChild>
                      <a
                        href="https://dashboard.stripe.com/connect/accounts/overview"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Stripe Dashboard
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings Overview Card */}
          {convexUser?.stripeConnectAccountId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Earnings Overview
                    </CardTitle>
                    <CardDescription>
                      Your revenue at a glance
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/settings/payouts">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(totalPaidOut + (pendingEarnings?.netEarnings || 0))}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500">Total Earnings</p>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {totalSalesCount + (pendingEarnings?.totalSales || 0)}
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-500">Total Sales</p>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {formatCurrency(totalPaidOut)}
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-500">Paid Out</p>
                  </div>
                  <div className="text-center p-4 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg border border-orange-500/20">
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {formatCurrency(pendingEarnings?.netEarnings || 0)}
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-500">Available</p>
                  </div>
                </div>

                {/* Pending Payout Alert */}
                {pendingEarnings && pendingEarnings.netEarnings >= 2500 && (
                  <div className="mt-4 p-4 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            {formatCurrency(pendingEarnings.netEarnings)} ready to cash out
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500">
                            From {pendingEarnings.totalSales} sale{pendingEarnings.totalSales !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/settings/payouts">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          Request Payout
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {pendingEarnings && pendingEarnings.netEarnings > 0 && pendingEarnings.netEarnings < 2500 && (
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Minimum payout is $25. You need {formatCurrency(2500 - pendingEarnings.netEarnings)} more to request a payout.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Links Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Link
                  href="/dashboard/settings/payouts"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Payout Settings</p>
                      <p className="text-sm text-muted-foreground">
                        Manage payouts, view history, and request transfers
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Analytics</p>
                      <p className="text-sm text-muted-foreground">
                        View detailed sales analytics and performance metrics
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Social Link Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent sidebarOffset>
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Social Link" : "Add Social Link"}
            </DialogTitle>
            <DialogDescription>
              Select a platform and enter your profile URL
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={dialogPlatform} onValueChange={setDialogPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {socialPlatforms.map((platform) => (
                    <SelectItem key={platform.key} value={platform.key}>
                      <div className="flex items-center gap-2">
                        <SocialIcon platform={platform.key} className="h-4 w-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={dialogUrl}
                onChange={(e) => setDialogUrl(e.target.value)}
                placeholder={
                  dialogPlatform
                    ? getPlatformInfo(dialogPlatform)?.placeholder
                    : "https://..."
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={dialogLabel}
                onChange={(e) => setDialogLabel(e.target.value)}
                placeholder="e.g., Ableton Tips, Main Account, Music Channel"
              />
              <p className="text-xs text-muted-foreground">
                Add a custom label to distinguish this link from others
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLink}>
              <Check className="mr-2 h-4 w-4" />
              {editingIndex !== null ? "Update" : "Add"} Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
