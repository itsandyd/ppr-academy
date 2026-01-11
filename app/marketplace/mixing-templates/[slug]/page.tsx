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
  Download,
  Tag,
  DollarSign,
  User,
  ArrowLeft,
  Sliders,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Music,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

interface MixingTemplatePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const DAW_LABELS: Record<string, string> = {
  ableton: "Ableton Live",
  "fl-studio": "FL Studio",
  logic: "Logic Pro",
  bitwig: "Bitwig Studio",
  "studio-one": "Studio One",
  reason: "Reason",
  cubase: "Cubase",
  "multi-daw": "Multi-DAW",
};

const DAW_ICONS: Record<string, string> = {
  ableton: "🔊",
  "fl-studio": "🎚️",
  logic: "🎹",
  bitwig: "⚡",
  "studio-one": "🎼",
  reason: "🔌",
  cubase: "🎛️",
  "multi-daw": "🔗",
};

export default function MixingTemplateDetailPage({ params }: MixingTemplatePageProps) {
  const { slug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const template = useQuery(api.mixingTemplates.getMixingTemplateBySlug, { slug });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Handle loading state
  if (template === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (template === null) {
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
      router.push(`/sign-in?redirect_url=/marketplace/mixing-templates/${slug}`);
      return;
    }

    // For free products, go directly to download
    if (!template.price || template.price === 0) {
      if (template.downloadUrl) {
        window.open(template.downloadUrl, "_blank");
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
          productId: template._id,
          productSlug: slug,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "Customer",
          productPrice: template.price,
          productTitle: template.title,
          productImageUrl: template.imageUrl,
          userId: user.id,
          storeId: template.storeId,
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
          <Link href="/marketplace/mixing-templates">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mixing Templates
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Template Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                {template.imageUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={template.imageUrl}
                      alt={template.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{template.title}</h1>
                  {template.creatorName && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{template.creatorName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={template.price === 0 ? "secondary" : "default"}>
                      {formatPrice(template.price)}
                    </Badge>
                    {template.dawType && (
                      <Badge variant="outline">
                        {DAW_ICONS[template.dawType] || "📁"} {DAW_LABELS[template.dawType] || template.dawType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {template.description && (
                <div className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert">
                  <p className="whitespace-pre-wrap">{template.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Installation Notes */}
            {template.installationNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Installation Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{template.installationNotes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Genres */}
            {template.genre && template.genre.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Best For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.genre.map((g: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
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
                    <span className="text-4xl font-bold">{formatPrice(template.price)}</span>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={isCheckingOut}
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-500/90 hover:to-teal-500/90"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : template.price === 0 ? (
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
                </div>

                <Separator />

                {/* Template Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Template Details</h3>

                  {template.dawType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DAW</span>
                      <span className="font-medium">
                        {DAW_ICONS[template.dawType]} {DAW_LABELS[template.dawType] || template.dawType}
                      </span>
                    </div>
                  )}

                  {template.dawVersion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Version</span>
                      <span className="font-medium">{template.dawVersion}</span>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                {template.thirdPartyPlugins && template.thirdPartyPlugins.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold">Required Plugins</h3>
                      <div className="space-y-1">
                        {template.thirdPartyPlugins.map((plugin: string, index: number) => (
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
