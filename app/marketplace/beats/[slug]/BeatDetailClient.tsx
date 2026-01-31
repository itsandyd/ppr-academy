"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Music2,
  Clock,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  Disc3,
  Volume2,
  VolumeX,
  SkipBack,
  Shield,
  Zap,
  Music,
  FileAudio,
  Crown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import { LicenseTierPicker } from "@/components/beats/LicenseTierPicker";

interface BeatDetailClientProps {
  productId: string;
  slug: string;
  initialProduct: any;
  initialStore: any;
}

export function BeatDetailClient({
  productId,
  slug,
  initialProduct,
  initialStore,
}: BeatDetailClientProps) {
  const product =
    useQuery(api.digitalProducts.getProductById, {
      productId: productId as Id<"digitalProducts">,
    }) ?? initialProduct;

  const store =
    useQuery(api.stores.getStoreById, initialStore?._id ? { storeId: initialStore._id } : "skip") ??
    initialStore;

  const creator = useQuery(
    api.users.getUserFromClerk,
    product?.userId ? { clerkId: product.userId } : "skip"
  );

  const { user } = useUser();

  // Fetch beat license tiers
  const beatTiers = useQuery(
    api.beatLeases.getBeatLicenseTiers,
    productId ? { beatId: productId as Id<"digitalProducts"> } : "skip"
  );

  // Check if user owns any licenses for this beat
  const userLicenses = useQuery(
    api.beatLeases.checkUserBeatLicense,
    user?.id && productId
      ? { userId: user.id, beatId: productId as Id<"digitalProducts"> }
      : "skip"
  );

  // Check if this is a beat-lease product with tiers
  const isBeatLease = product?.productCategory === "beat-lease" && (beatTiers?.tiers?.length ?? 0) > 0;
  const isExclusivelySold = product?.exclusiveSoldAt != null;

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const resetTrack = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Beat Not Found</h1>
          <p className="mt-2 text-muted-foreground">This beat is no longer available.</p>
          <Link href="/marketplace/beats">
            <Button className="mt-4">Browse Beats</Button>
          </Link>
        </div>
      </div>
    );
  }

  const audioUrl = product.previewUrl || product.audioUrl || product.downloadUrl;
  const purchaseUrl = store?.slug
    ? `/${store.slug}/products/${productId}`
    : `/marketplace/beats/${productId}/purchase`;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/marketplace/beats"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Beats
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <motion.div
            className="space-y-6 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Hero Image with Audio Player */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="relative aspect-square">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    <Disc3 className="h-32 w-32 text-orange-500/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play Button Overlay */}
                {audioUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="h-20 w-20 rounded-full bg-white/90 text-black shadow-2xl transition-transform hover:scale-105 hover:bg-white"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-8 w-8" />
                      ) : (
                        <Play className="ml-1 h-8 w-8" />
                      )}
                    </Button>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
                  <div className="flex gap-2">
                    {product.bpm && (
                      <Badge className="bg-black/70 text-white backdrop-blur-sm">
                        <Clock className="mr-1 h-3 w-3" />
                        {product.bpm} BPM
                      </Badge>
                    )}
                    {product.key && (
                      <Badge className="bg-black/70 text-white backdrop-blur-sm">
                        <Music className="mr-1 h-3 w-3" />
                        {product.key}
                      </Badge>
                    )}
                  </div>
                  {product.price === 0 && <Badge className="bg-green-500 text-white">Free</Badge>}
                </div>
              </div>

              {/* Audio Progress Bar */}
              {audioUrl && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={resetTrack}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-white hover:bg-white/20"
                      onClick={togglePlay}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <span className="w-10 text-xs text-white/70">{formatTime(currentTime)}</span>
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="flex-1"
                    />
                    <span className="w-10 text-xs text-white/70">{formatTime(duration)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{product.title}</h1>
              {product.description && (
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            {/* Genres */}
            {product.genres && product.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.genres.map((genre: string) => (
                  <Badge key={genre} variant="secondary" className="text-sm">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Beat Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Beat Details</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {product.bpm && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                        <Clock className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">BPM</p>
                        <p className="font-medium">{product.bpm}</p>
                      </div>
                    </div>
                  )}
                  {product.key && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                        <Music className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Key</p>
                        <p className="font-medium">{product.key}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <FileAudio className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Format</p>
                      <p className="font-medium">WAV / MP3</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <Disc3 className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">License</p>
                      <p className="font-medium">{product.licenseType || "Standard"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">What&apos;s Included</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                      <Zap className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="font-medium">High Quality Files</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Uncompressed WAV + MP3 formats
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                      <Music2 className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="font-medium">Stems Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Separate tracks for mixing</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                      <Shield className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="font-medium">Commercial Rights</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Use in your releases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Beat Lease with Tiers */}
                {isBeatLease && !isExclusivelySold && beatTiers?.tiers && (
                  <>
                    <LicenseTierPicker
                      beatId={productId}
                      beatTitle={product.title}
                      tiers={beatTiers.tiers}
                      storeId={store?.userId || product.storeId}
                      creatorStripeAccountId={creator?.stripeConnectAccountId}
                      userOwnedTiers={userLicenses?.licenses?.map((l: { tierType: string }) => l.tierType) || []}
                      isExclusivelySold={false}
                    />
                    <Separator className="my-6" />
                  </>
                )}

                {/* Exclusively Sold Message */}
                {isExclusivelySold && (
                  <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Crown className="h-5 w-5" />
                      <span className="font-semibold">Exclusively Sold</span>
                    </div>
                    <p className="mt-2 text-sm text-amber-600">
                      This beat has been purchased exclusively and is no longer available.
                    </p>
                  </div>
                )}

                {/* Standard Purchase (non beat-lease or fallback) */}
                {!isBeatLease && !isExclusivelySold && (
                  <>
                    <div className="mb-6 text-center">
                      <div className="text-4xl font-bold text-orange-500">
                        {product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {product.licenseType || "Standard"} License
                      </p>
                    </div>

                    <Link href={purchaseUrl}>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {product.price === 0 ? "Download Free" : "License Beat"}
                      </Button>
                    </Link>

                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Instant download after purchase
                    </p>

                    <Separator className="my-6" />
                  </>
                )}

                {/* Producer Info */}
                {(creator || store) && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Producer</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator?.imageUrl || store?.logoUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                          {creator?.name?.charAt(0) || store?.name?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {creator?.name || store?.name || product.creatorName || "Producer"}
                        </p>
                        {store?.slug && (
                          <Link
                            href={`/${store.slug}`}
                            className="text-sm text-orange-500 hover:underline"
                          >
                            View Profile
                          </Link>
                        )}
                      </div>
                    </div>
                    {(creator?.bio || store?.description) && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {creator?.bio || store?.description}
                      </p>
                    )}
                  </div>
                )}

                {!isExclusivelySold && (
                  <>
                    <Separator className="my-6" />

                    {/* License Features */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Instant download</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Commercial use allowed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>High quality WAV + MP3</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Stems included</span>
                      </div>
                      {product.price === 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>No payment required</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
