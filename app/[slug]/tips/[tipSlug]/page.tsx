"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState, useEffect } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Heart,
  Coffee,
  Share2,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateProductStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";
import { useUser } from "@clerk/nextjs";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

interface TipPageProps {
  params: Promise<{
    slug: string;
    tipSlug: string;
  }>;
}

const SUGGESTED_AMOUNTS = [5, 10, 25, 50];

export default function TipJarLandingPage({ params }: TipPageProps) {
  const { slug, tipSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();

  // Check for success state
  const isSuccess = searchParams.get("success") === "true";

  // Tip amount state
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch tip jar by slug
  const tipJar = useQuery(
    api.digitalProducts.getProductBySlug,
    store && tipSlug ? { storeId: store._id, slug: tipSlug } : "skip"
  );

  // Loading state
  if (store === undefined || (store && (user === undefined || tipJar === undefined))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found or not a tip jar (check productCategory, not productType)
  if (!store || !tipJar || tipJar.productCategory !== "tip-jar") {
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

  // Get final amount
  const getFinalAmount = () => {
    if (customAmount && parseFloat(customAmount) > 0) {
      return parseFloat(customAmount);
    }
    return selectedAmount || 0;
  };

  // Generate structured data for SEO
  const tipUrl = `${baseUrl}/${slug}/tips/${tipSlug}`;
  const structuredData = generateProductStructuredData({
    name: tipJar.title,
    description: tipJar.description || `Support ${displayName} with a tip`,
    price: tipJar.price || 0,
    currency: "USD",
    imageUrl: tipJar.imageUrl || undefined,
    url: tipUrl,
    brand: store.name,
    category: "Tip Jar",
  });

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Support ${displayName}`,
        text: tipJar.description || `Support ${displayName}'s work!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Handle tip
  const handleTip = async () => {
    const amount = getFinalAmount();
    if (amount <= 0) {
      toast.error("Please select or enter an amount");
      return;
    }

    if (!clerkUser) {
      toast.error("Please sign in to send a tip");
      router.push(`/sign-in?redirect_url=/${slug}/tips/${tipSlug}`);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/tips/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipJarId: tipJar._id,
          amount,
          customerEmail: clerkUser.primaryEmailAddress?.emailAddress || "",
          customerName: clerkUser.fullName || clerkUser.firstName || "",
          userId: clerkUser.id,
          storeId: store._id,
          creatorStripeAccountId: user?.stripeConnectAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Tip checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process tip");
      setIsProcessing(false);
    }
  };

  // Handle amount selection
  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  // Handle custom amount change
  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-rose-50/20 dark:to-rose-950/10">
      {/* JSON-LD Structured Data */}
      <StructuredData data={structuredData} />

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
        <div className="mx-auto max-w-md">
          {/* Success State */}
          {isSuccess && (
            <Card className="mb-8 border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-800 dark:text-green-200">Thank You!</h2>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    Your tip has been sent successfully. {displayName} appreciates your support!
                  </p>
                </div>
                <Link href={`/${slug}`}>
                  <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-100">
                    Back to Store
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Creator Card */}
          <Card className="mb-8 overflow-hidden">
            {/* Background gradient */}
            <div className="h-24 bg-gradient-to-r from-rose-400 to-orange-400" />

            <CardContent className="relative pt-0 pb-6">
              {/* Avatar */}
              <div className="-mt-12 mb-4 flex justify-center">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
              </div>

              {/* Creator info */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">{displayName}</h2>
                <p className="text-sm text-muted-foreground">@{slug}</p>
                <Link href={`/${slug}`}>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tip Card */}
          <Card className="border-2 border-rose-200 dark:border-rose-900/50">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  <Heart className="mr-1 h-3 w-3 fill-current" />
                  Tip Jar
                </Badge>
                <h1 className="text-2xl font-bold">{tipJar.title}</h1>
                {tipJar.description && (
                  <p className="text-muted-foreground">{tipJar.description}</p>
                )}
              </div>

              {/* Image if available */}
              {tipJar.imageUrl && (
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  <Image
                    src={tipJar.imageUrl}
                    alt={tipJar.title}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
              )}

              {/* Amount selection */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-center">Select an amount</p>

                {/* Suggested amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {SUGGESTED_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleSelectAmount(amount)}
                      className={cn(
                        "py-3 px-2 rounded-lg border-2 font-semibold transition-all",
                        selectedAmount === amount && !customAmount
                          ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                          : "border-border hover:border-rose-200 dark:hover:border-rose-800"
                      )}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={cn(
                      "pl-7 text-center font-semibold border-2",
                      customAmount
                        ? "border-rose-500 focus-visible:ring-rose-500"
                        : ""
                    )}
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                size="lg"
                onClick={handleTip}
                disabled={getFinalAmount() <= 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coffee className="mr-2 h-5 w-5" />
                    {getFinalAmount() > 0
                      ? `Send $${getFinalAmount()} Tip`
                      : "Select an amount"
                    }
                  </>
                )}
              </Button>

              {/* Message */}
              <div className="text-center text-sm text-muted-foreground">
                <Sparkles className="inline-block mr-1 h-4 w-4 text-amber-500" />
                Your support means the world!
              </div>
            </CardContent>
          </Card>

          {/* Trust signals */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              Secure payment
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500" />
              100% goes to creator
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
