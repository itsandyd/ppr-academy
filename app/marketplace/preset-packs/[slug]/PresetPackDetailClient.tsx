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
import {
  Play,
  Pause,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  Settings,
  Download,
  Music,
  Layers,
  Zap,
  Shield,
  FileAudio,
  Volume2,
  Share2,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import { FollowGateModal } from "@/components/follow-gates/FollowGateModal";
import { useRouter } from "next/navigation";

interface PresetPackDetailClientProps {
  productId: string;
  slug: string;
  initialProduct: any;
  initialStore: any;
}

// Helper function to get plugin display name
function getPluginLabel(plugin: string): string {
  const pluginMap: Record<string, string> = {
    serum: "Serum",
    vital: "Vital",
    massive: "Massive",
    "massive-x": "Massive X",
    omnisphere: "Omnisphere",
    sylenth1: "Sylenth1",
    "phase-plant": "Phase Plant",
    pigments: "Pigments",
    diva: "Diva",
    "ana-2": "ANA 2",
    spire: "Spire",
    zebra: "Zebra",
    hive: "Hive",
    "ableton-wavetable": "Wavetable",
    "ableton-operator": "Operator",
    "ableton-analog": "Analog",
    "fl-sytrus": "Sytrus",
    "fl-harmor": "Harmor",
    "fl-harmless": "Harmless",
    "logic-alchemy": "Alchemy",
    "logic-retro-synth": "Retro Synth",
    fabfilter: "FabFilter",
    soundtoys: "Soundtoys",
    valhalla: "Valhalla",
    other: "Other",
  };
  return pluginMap[plugin] || plugin;
}

// Helper function to get DAW display name
function getDawLabel(daw: string): string {
  const dawMap: Record<string, string> = {
    ableton: "Ableton Live",
    "fl-studio": "FL Studio",
    logic: "Logic Pro",
    bitwig: "Bitwig Studio",
    "studio-one": "Studio One",
    reason: "Reason",
    cubase: "Cubase",
    "multi-daw": "Multi-DAW",
  };
  return dawMap[daw] || "Universal";
}

export function PresetPackDetailClient({
  productId,
  slug,
  initialProduct,
  initialStore,
}: PresetPackDetailClientProps) {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showFollowGateModal, setShowFollowGateModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Real-time product data
  const product =
    useQuery(api.presetPacks.getBySlug, { slug }) ?? initialProduct;

  const store = product?.store ?? initialStore;

  // Related packs
  const relatedPacks = useQuery(
    api.presetPacks.getRelated,
    product?._id
      ? { productId: product._id as Id<"digitalProducts">, limit: 4 }
      : "skip"
  );

  // Audio player for demo
  const handlePlayPause = () => {
    if (!audioRef.current || !product?.demoAudioUrl) return;
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

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description || `Check out ${product.title}`,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Settings className="mx-auto mb-4 h-16 w-16 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading preset pack...</p>
        </div>
      </div>
    );
  }

  const isFreeWithGate = product.price === 0 && product.followGateEnabled;
  const isPaid = product.price > 0;
  const isFreeNoGate = product.price === 0 && !product.followGateEnabled;

  // Handle checkout for paid products
  const handleCheckout = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to purchase");
      router.push("/sign-in");
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/products/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          productSlug: slug,
          customerEmail: user.emailAddresses[0]?.emailAddress,
          customerName: user.fullName || user.firstName || "Customer",
          productPrice: product.price,
          productTitle: product.title,
          productImageUrl: product.imageUrl,
          userId: user.id,
          storeId: product.storeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
      setIsCheckingOut(false);
    }
  };

  // Handle free download with follow gate
  const handleFreeDownload = () => {
    if (isFreeWithGate) {
      setShowFollowGateModal(true);
    } else if (product.downloadUrl) {
      window.open(product.downloadUrl, "_blank");
      toast.success("Download started!");
    }
  };

  // Handle successful follow gate submission - trigger email
  const handleFollowGateSuccess = async (
    submissionId: Id<"followGateSubmissions">
  ) => {
    try {
      // Call API to send email with download link
      const response = await fetch("/api/follow-gate/send-download-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          productId: product._id,
        }),
      });

      if (response.ok) {
        toast.success("Download link sent to your email!");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  };

  const presetCount = product.packFilesArray?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      {/* Demo Audio */}
      {product.demoAudioUrl && (
        <audio ref={audioRef} src={product.demoAudioUrl} preload="metadata" />
      )}

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/marketplace/preset-packs"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Preset Packs
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Settings className="h-32 w-32 text-purple-500/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Play Button Overlay (if demo audio) */}
                {product.demoAudioUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="h-20 w-20 rounded-full bg-white/90 text-black shadow-2xl transition-transform hover:scale-105 hover:bg-white"
                      onClick={handlePlayPause}
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
                    {product.targetPlugin && (
                      <Badge className="bg-purple-500 text-white">
                        <Settings className="mr-1 h-3 w-3" />
                        {getPluginLabel(product.targetPlugin)}
                      </Badge>
                    )}
                    {presetCount > 0 && (
                      <Badge className="bg-black/70 text-white backdrop-blur-sm">
                        <Layers className="mr-1 h-3 w-3" />
                        {presetCount} Presets
                      </Badge>
                    )}
                  </div>
                  {product.price === 0 && (
                    <Badge className="bg-green-500 text-white">Free</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div>
              <div className="mb-4 flex items-start justify-between">
                <h1 className="text-3xl font-bold md:text-4xl">
                  {product.title}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="shrink-0"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              {product.description && (
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            {/* Genres/Tags */}
            {product.genre && product.genre.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.genre.map((g: string) => (
                  <Badge key={g} variant="secondary" className="text-sm">
                    {g}
                  </Badge>
                ))}
              </div>
            )}

            {/* Pack Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Pack Details</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Settings className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Plugin</p>
                      <p className="font-medium">
                        {product.targetPlugin
                          ? getPluginLabel(product.targetPlugin)
                          : "Various"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Layers className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Presets</p>
                      <p className="font-medium">{presetCount || "Multiple"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Music className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">DAW</p>
                      <p className="font-medium">
                        {product.dawType
                          ? getDawLabel(product.dawType)
                          : "Universal"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <FileAudio className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Format</p>
                      <p className="font-medium">.fxp / .fxb</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">What's Included</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Zap className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium">Pro Sound Design</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Industry-quality presets
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Volume2 className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium">Mix Ready</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Optimized for productions
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Shield className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium">Royalty Free</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use in commercial projects
                    </p>
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
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold text-purple-500">
                    {product.price === 0
                      ? "Free"
                      : `$${product.price.toFixed(2)}`}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {presetCount > 0
                      ? `${presetCount} Presets Included`
                      : "Preset Pack"}
                  </p>
                </div>

                {/* CTA Button */}
                {isPaid ? (
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      "Processing..."
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Buy Now - ${product.price.toFixed(2)}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-purple-500 hover:bg-purple-600"
                    size="lg"
                    onClick={handleFreeDownload}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isFreeWithGate ? "Unlock Free Download" : "Download Free"}
                  </Button>
                )}

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Instant download after {isPaid ? "purchase" : "unlocking"}
                </p>

                <Separator className="my-6" />

                {/* Creator Info */}
                {store && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Sound Designer</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={store.logoUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          {store.name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{store.name}</p>
                        {store.slug && (
                          <Link
                            href={`/${store.slug}`}
                            className="text-sm text-purple-500 hover:underline"
                          >
                            View Profile
                          </Link>
                        )}
                      </div>
                    </div>
                    {store.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {store.description}
                      </p>
                    )}
                  </div>
                )}

                <Separator className="my-6" />

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Instant download</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Royalty-free license</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Commercial use allowed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Lifetime access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Related Packs */}
        {relatedPacks && relatedPacks.length > 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="mb-6 text-2xl font-bold">Related Preset Packs</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPacks.map((pack: any) => (
                <Link
                  key={pack._id}
                  href={`/marketplace/preset-packs/${pack.slug || pack._id}`}
                >
                  <Card className="group overflow-hidden transition-all hover:shadow-lg">
                    <div className="relative aspect-square">
                      {pack.imageUrl ? (
                        <Image
                          src={pack.imageUrl}
                          alt={pack.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          <Settings className="h-12 w-12 text-purple-500/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="line-clamp-1 font-semibold">
                        {pack.title}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        {pack.targetPlugin && (
                          <Badge variant="secondary" className="text-xs">
                            {getPluginLabel(pack.targetPlugin)}
                          </Badge>
                        )}
                        <span className="font-bold text-purple-500">
                          {pack.price === 0
                            ? "Free"
                            : `$${pack.price.toFixed(2)}`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Follow Gate Modal */}
      <FollowGateModal
        open={showFollowGateModal}
        onOpenChange={setShowFollowGateModal}
        product={product}
        onSuccess={handleFollowGateSuccess}
      />
    </div>
  );
}
