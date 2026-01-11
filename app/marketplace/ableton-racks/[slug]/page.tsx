"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Download,
  Music,
  Tag,
  DollarSign,
  User,
  ArrowLeft,
  Cpu,
  Zap,
  Package,
  CheckCircle,
  AlertCircle,
  Waves,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

interface AbletonRackPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function AbletonRackDetailPage({ params }: AbletonRackPageProps) {
  const { slug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const rack = useQuery(api.abletonRacks.getAbletonRackBySlug, { slug });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Handle loading state
  if (rack === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (rack === null) {
    notFound();
  }

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const handlePurchase = async () => {
    // Check if user is signed in
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to purchase");
      router.push(`/sign-in?redirect_url=/marketplace/ableton-racks/${slug}`);
      return;
    }

    // For free products, go directly to download
    if (!rack.price || rack.price === 0) {
      if (rack.downloadUrl) {
        window.open(rack.downloadUrl, "_blank");
      } else {
        toast.error("Download not available");
      }
      return;
    }

    // For paid products, create checkout session
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/products/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: rack._id,
          productSlug: slug,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "Customer",
          productPrice: rack.price,
          productTitle: rack.title,
          productImageUrl: rack.chainImageUrl,
          userId: user.id,
          storeId: rack.storeId,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace/ableton-racks">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ableton Racks
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Rack Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                {rack.chainImageUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={rack.chainImageUrl}
                      alt={rack.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{rack.title}</h1>
                  {rack.creatorName && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{rack.creatorName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={rack.price === 0 ? "secondary" : "default"}>
                      {formatPrice(rack.price)}
                    </Badge>
                    {rack.rackType && (
                      <Badge variant="outline">
                        <Tag className="mr-1 h-3 w-3" />
                        {rack.rackType === "audioEffect"
                          ? "Audio Effect"
                          : rack.rackType === "instrument"
                            ? "Instrument"
                            : rack.rackType === "midiEffect"
                              ? "MIDI Effect"
                              : rack.rackType === "drumRack"
                                ? "Drum Rack"
                                : rack.rackType}
                      </Badge>
                    )}
                    {rack.complexity && (
                      <Badge variant="outline">
                        {rack.complexity.charAt(0).toUpperCase() + rack.complexity.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {rack.description && (
                <div className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert">
                  <p className="whitespace-pre-wrap">{rack.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Audio Demo */}
            {rack.demoAudioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Audio Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <audio src={rack.demoAudioUrl} controls className="w-full" />
                </CardContent>
              </Card>
            )}

            {/* Macro Screenshots */}
            {rack.macroScreenshotUrls && rack.macroScreenshotUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="h-5 w-5" />
                    Macro Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {rack.macroScreenshotUrls.map((url: any, index: number) => (
                      <div
                        key={index}
                        className="relative aspect-video overflow-hidden rounded-lg border border-border"
                      >
                        <Image src={url} alt={`Macro ${index + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Installation Notes */}
            {rack.installationNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Installation Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{rack.installationNotes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Effect Types */}
            {rack.effectType && rack.effectType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Included Effects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {rack.effectType.map((effect: any, index: number) => (
                      <Badge key={index} variant="secondary">
                        {effect}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="space-y-6 p-6">
                {/* Price */}
                <div className="py-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    <span className="text-4xl font-bold">{formatPrice(rack.price)}</span>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={isCheckingOut}
                    size="lg"
                    className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : rack.price === 0 ? (
                      <>
                        Download Free
                        <Download className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Buy Now
                        <ShoppingCart className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {rack.demoAudioUrl && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        document.querySelector("audio")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Listen to Demo
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Rack Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Rack Details</h3>

                  {rack.abletonVersion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ableton Version</span>
                      <span className="font-medium">{rack.abletonVersion}</span>
                    </div>
                  )}

                  {rack.minAbletonVersion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Version</span>
                      <span className="font-medium">{rack.minAbletonVersion}</span>
                    </div>
                  )}

                  {rack.rackType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">
                        {rack.rackType === "audioEffect"
                          ? "Audio Effect"
                          : rack.rackType === "instrument"
                            ? "Instrument"
                            : rack.rackType === "midiEffect"
                              ? "MIDI Effect"
                              : rack.rackType === "drumRack"
                                ? "Drum Rack"
                                : rack.rackType}
                      </span>
                    </div>
                  )}

                  {rack.macroCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Macros</span>
                      <span className="font-medium">{rack.macroCount}</span>
                    </div>
                  )}

                  {rack.cpuLoad && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CPU Load</span>
                      <Badge
                        variant={
                          rack.cpuLoad === "low"
                            ? "secondary"
                            : rack.cpuLoad === "medium"
                              ? "default"
                              : "destructive"
                        }
                      >
                        <Cpu className="mr-1 h-3 w-3" />
                        {rack.cpuLoad.charAt(0).toUpperCase() + rack.cpuLoad.slice(1)}
                      </Badge>
                    </div>
                  )}

                  {rack.fileFormat && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Format</span>
                      <span className="font-medium">.{rack.fileFormat}</span>
                    </div>
                  )}

                  {rack.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size</span>
                      <span className="font-medium">{rack.fileSize.toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Requirements */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Requirements</h3>

                  <div className="flex items-start gap-2">
                    {rack.requiresMaxForLive ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    ) : (
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Max for Live</p>
                      <p className="text-xs text-muted-foreground">
                        {rack.requiresMaxForLive ? "Required" : "Not Required"}
                      </p>
                    </div>
                  </div>

                  {rack.thirdPartyPlugins && rack.thirdPartyPlugins.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Third-Party Plugins</p>
                      <div className="space-y-1">
                        {rack.thirdPartyPlugins.map((plugin: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <Package className="h-3 w-3" />
                            {plugin}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {rack.genre && rack.genre.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold">Best For</h3>
                      <div className="flex flex-wrap gap-2">
                        {rack.genre.map((g: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
