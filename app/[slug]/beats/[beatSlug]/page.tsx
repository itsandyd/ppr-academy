"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState, useRef, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Music,
  Play,
  Pause,
  Share2,
  ShoppingCart,
  CheckCircle,
  Star,
  Clock,
  Hash,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateMusicRecordingStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

interface BeatPageProps {
  params: Promise<{
    slug: string;
    beatSlug: string;
  }>;
}

export default function BeatLandingPage({ params }: BeatPageProps) {
  const { slug, beatSlug } = use(params);
  const router = useRouter();

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Selected license tier
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch beat by slug
  const beat = useQuery(
    api.digitalProducts.getProductBySlug,
    store && beatSlug ? { storeId: store._id, slug: beatSlug } : "skip"
  );

  // Audio player effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [beat?.demoAudioUrl]);

  // Loading state
  if (store === undefined || (store && (user === undefined || beat === undefined))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found or not a beat
  if (!store || !beat || beat.productType !== "beat-lease") {
    notFound();
  }

  const displayName = user?.name || "Creator";
  const avatarUrl = user?.imageUrl || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // License tiers from beatLeaseConfig
  const licenseTiers = (beat as any).beatLeaseConfig?.tiers || [];
  const selectedLicense = licenseTiers.find((t: any) => t.name === selectedTier);

  // Generate structured data for SEO (MusicRecording schema for better beat discovery)
  const beatUrl = `${baseUrl}/${slug}/beats/${beatSlug}`;
  const structuredData = generateMusicRecordingStructuredData({
    name: beat.title,
    description: beat.description || `${beat.title} - Beat by ${displayName}`,
    byArtist: {
      name: displayName,
      url: `${baseUrl}/${slug}`,
    },
    genre: beat.genre || undefined,
    bpm: beat.bpm || undefined,
    musicalKey: beat.musicalKey || undefined,
    imageUrl: beat.imageUrl || undefined,
    audioUrl: beat.demoAudioUrl || undefined,
    url: beatUrl,
    price: beat.price || 0,
    currency: "USD",
  });

  // Audio controls
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !beat.demoAudioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: beat.title,
        text: beat.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Handle purchase
  const handlePurchase = () => {
    if (!selectedLicense) {
      toast.error("Please select a license tier");
      return;
    }
    // POST-LAUNCH: Integrate beat purchase with Stripe checkout flow
    toast.success(`Purchasing ${selectedLicense.name} license for $${selectedLicense.price}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10">
      {/* JSON-LD Structured Data */}
      <StructuredData data={structuredData} />

      {/* Hidden audio element */}
      {beat.demoAudioUrl && (
        <audio ref={audioRef} src={beat.demoAudioUrl} preload="metadata" />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {store.name}
          </Link>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Beat Image & Audio Player */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-900/20">
              {beat.imageUrl ? (
                <Image
                  src={beat.imageUrl}
                  alt={beat.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-32 w-32 text-purple-500/50" />
                </div>
              )}

              {/* Play overlay */}
              {beat.demoAudioUrl && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform hover:scale-105">
                    {isPlaying ? (
                      <Pause className="h-10 w-10 text-purple-600" />
                    ) : (
                      <Play className="h-10 w-10 text-purple-600 ml-1" />
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Audio Player Controls */}
            {beat.demoAudioUrl && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={togglePlay}
                      className="h-12 w-12"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={toggleMute}>
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-24"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Creator info card */}
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">@{slug}</p>
                </div>
                <Link href={`/${slug}`}>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Beat Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <Music className="mr-1 h-3 w-3" />
                Beat
              </Badge>
              {beat.genre && (
                <Badge variant="secondary">{beat.genre}</Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{beat.title}</h1>
              {beat.description && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {beat.description}
                </p>
              )}
            </div>

            {/* Beat Info */}
            <div className="flex flex-wrap gap-4">
              {beat.bpm && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{beat.bpm} BPM</span>
                </div>
              )}
              {beat.musicalKey && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{beat.musicalKey}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* License Tiers */}
            {licenseTiers.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select License</h3>
                <div className="grid gap-3">
                  {licenseTiers.map((tier: any) => (
                    <Card
                      key={tier.name}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedTier === tier.name
                          ? "border-purple-500 ring-2 ring-purple-500/20"
                          : "hover:border-purple-200 dark:hover:border-purple-800"
                      )}
                      onClick={() => setSelectedTier(tier.name)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                              selectedTier === tier.name
                                ? "border-purple-500 bg-purple-500"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {selectedTier === tier.name && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{tier.name}</p>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground">
                                {tier.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          ${tier.price}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Simple price if no tiers */}
            {licenseTiers.length === 0 && (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-purple-600">
                  ${beat.price || 0}
                </span>
              </div>
            )}

            {/* CTA Section */}
            <Card className="border-2 border-purple-200 dark:border-purple-900/50">
              <CardContent className="p-6 space-y-4">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={licenseTiers.length > 0 && !selectedTier}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {selectedLicense
                    ? `Buy ${selectedLicense.name} - $${selectedLicense.price}`
                    : licenseTiers.length > 0
                    ? "Select a license"
                    : `Buy Now - $${beat.price || 0}`
                  }
                </Button>

                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    Instant delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    WAV + MP3 files
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                High quality
              </span>
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                Industry standard
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
