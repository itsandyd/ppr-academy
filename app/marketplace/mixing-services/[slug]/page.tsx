"use client";

import { use, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tag,
  DollarSign,
  User,
  ArrowLeft,
  CheckCircle,
  Loader2,
  ShoppingCart,
  Headphones,
  Clock,
  Zap,
  Music,
  RefreshCw,
  FileAudio,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MixingServicePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mix-and-master": "Mix & Master",
  "stem-mixing": "Stem Mixing",
};

const SERVICE_TYPE_ICONS: Record<string, string> = {
  mixing: "🎚️",
  mastering: "🎛️",
  "mix-and-master": "🔊",
  "stem-mixing": "🎹",
};

interface Tier {
  id: string;
  name: string;
  stemCount: string;
  price: number;
  turnaroundDays: number;
  revisions: number;
  features?: string[];
}

export default function MixingServiceDetailPage({ params }: MixingServicePageProps) {
  const { slug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const service = useQuery(api.mixingServices.getMixingServiceBySlug, { slug });
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [isRush, setIsRush] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Auto-select first tier when data loads
  const tiers = service?.tiers as Tier[] | undefined;
  const selectedTier = useMemo(() => {
    if (!tiers?.length) return null;
    if (selectedTierId) {
      return tiers.find((t) => t.id === selectedTierId) || null;
    }
    return tiers[0];
  }, [tiers, selectedTierId]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedTier) return 0;
    let total = selectedTier.price;
    if (isRush && service?.rushFee) {
      total += service.rushFee;
    }
    return total;
  }, [selectedTier, isRush, service?.rushFee]);

  // Handle loading state
  if (service === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (service === null) {
    notFound();
  }

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(0)}`;
  };

  const handlePurchase = async () => {
    // Check if user is signed in
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to purchase");
      router.push(`/sign-in?redirect_url=/marketplace/mixing-services/${slug}`);
      return;
    }

    if (!selectedTier) {
      toast.error("Please select a service tier");
      return;
    }

    // Create checkout session
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/mixing-service/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: service._id,
          productSlug: slug,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "Customer",
          userId: user.id,
          storeId: service.storeId,
          creatorId: service.creatorId,
          creatorStripeAccountId: service.creatorStripeAccountId,
          serviceType: service.serviceType,
          selectedTier: {
            id: selectedTier.id,
            name: selectedTier.name,
            stemCount: selectedTier.stemCount,
            price: selectedTier.price,
            turnaroundDays: selectedTier.turnaroundDays,
            revisions: selectedTier.revisions,
          },
          isRush,
          rushFee: isRush ? service.rushFee : 0,
          customerNotes,
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
          <Link href="/marketplace/mixing-services">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mixing Services
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Service Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                {service.imageUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={service.imageUrl}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{service.title}</h1>
                  {service.creatorName && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={service.creatorAvatar} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-xs text-white">
                          {service.creatorName?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{service.creatorName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-purple-500 text-white">
                      {SERVICE_TYPE_ICONS[service.serviceType] || "🎚️"} {SERVICE_TYPE_LABELS[service.serviceType] || "Mixing"}
                    </Badge>
                    {service.rushAvailable && (
                      <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-600">
                        <Zap className="h-3 w-3" />
                        Rush Available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {service.description && (
                <div className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert">
                  <p className="whitespace-pre-wrap">{service.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Tiers Selection */}
            <div>
              <h2 className="mb-4 text-2xl font-bold">Select Your Package</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {tiers?.map((tier) => (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    isSelected={selectedTier?.id === tier.id}
                    onSelect={() => setSelectedTierId(tier.id)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* What's Included */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  What&apos;s Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Delivery</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        High-quality WAV/MP3 files
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Direct download delivery
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Unlimited access to files
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Communication</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        In-platform messaging
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Progress updates
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Revision feedback system
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {service.tags && service.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="space-y-6 p-6">
                {/* Selected Tier Summary */}
                {selectedTier && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Order Summary</h3>

                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold">{selectedTier.name}</span>
                        <span className="font-bold">{formatPrice(selectedTier.price)}</span>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-3 w-3" />
                          {selectedTier.stemCount}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {selectedTier.turnaroundDays} day delivery
                        </div>
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-3 w-3" />
                          {selectedTier.revisions} revision{selectedTier.revisions !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    {/* Rush Delivery Option */}
                    {service.rushAvailable && (
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="rush"
                            checked={isRush}
                            onCheckedChange={(checked) => setIsRush(checked === true)}
                          />
                          <label htmlFor="rush" className="cursor-pointer">
                            <div className="flex items-center gap-2 font-medium">
                              <Zap className="h-4 w-4 text-amber-500" />
                              Rush Delivery
                            </div>
                            <p className="text-xs text-muted-foreground">Get it faster!</p>
                          </label>
                        </div>
                        <span className="font-semibold text-amber-600">+{formatPrice(service.rushFee)}</span>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes for the engineer (optional)</label>
                      <Textarea
                        placeholder="Reference tracks, style preferences, special instructions..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Total */}
                <div className="py-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    <span className="text-4xl font-bold">{formatPrice(totalPrice)}</span>
                  </div>
                  {isRush && (
                    <p className="text-sm text-amber-600">Includes rush delivery fee</p>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={isCheckingOut || !selectedTier}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-500/90 hover:to-indigo-500/90"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Get Started
                        <ShoppingCart className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You&apos;ll upload your stems after checkout
                  </p>
                </div>

                <Separator />

                {/* Service Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Service Details</h3>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type</span>
                    <span className="font-medium">
                      {SERVICE_TYPE_ICONS[service.serviceType]} {SERVICE_TYPE_LABELS[service.serviceType]}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnaround</span>
                    <span className="font-medium">{service.turnaroundDays} days</span>
                  </div>

                  {service.rushAvailable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rush Available</span>
                      <span className="font-medium text-amber-600">Yes (+{formatPrice(service.rushFee)})</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tier Card Component
function TierCard({
  tier,
  isSelected,
  onSelect,
  formatPrice,
}: {
  tier: Tier;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (price?: number) => string;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        isSelected
          ? "border-2 border-purple-500 bg-purple-500/5 shadow-lg"
          : "border-border hover:border-purple-500/50 hover:bg-muted/30"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{tier.name}</h3>
          {isSelected && (
            <CheckCircle className="h-5 w-5 text-purple-500" />
          )}
        </div>

        <div className="mb-4">
          <span className="text-3xl font-bold text-purple-600">{formatPrice(tier.price)}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <FileAudio className="h-4 w-4 text-muted-foreground" />
            <span>{tier.stemCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{tier.turnaroundDays} day delivery</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span>{tier.revisions} revision{tier.revisions !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {tier.features && tier.features.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {tier.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
