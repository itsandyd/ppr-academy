"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Crown,
  Share2,
  CheckCircle,
  Star,
  Users,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateProductStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

interface MembershipPageProps {
  params: Promise<{
    slug: string;
    membershipSlug: string;
  }>;
}

export default function MembershipLandingPage({ params }: MembershipPageProps) {
  const { slug, membershipSlug } = use(params);
  const router = useRouter();

  // Billing toggle
  const [isYearly, setIsYearly] = useState(false);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch membership by slug
  const membership = useQuery(
    api.digitalProducts.getProductBySlug,
    store && membershipSlug ? { storeId: store._id, slug: membershipSlug } : "skip"
  );

  // Loading state
  if (store === undefined || (store && (user === undefined || membership === undefined))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found or not a membership
  if (!store || !membership || membership.productType !== "membership") {
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

  // Membership pricing
  const monthlyPrice = (membership as any).priceMonthly || membership.price || 0;
  const yearlyPrice = (membership as any).priceYearly || monthlyPrice * 10; // Default 2 months free
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;
  const savings = isYearly ? (monthlyPrice * 12) - yearlyPrice : 0;

  // Benefits list
  const benefits = (membership as any).benefits || [];

  // Generate structured data for SEO
  const membershipUrl = `${baseUrl}/${slug}/memberships/${membershipSlug}`;
  const structuredData = generateProductStructuredData({
    name: membership.title,
    description: membership.description || `${(membership as any).tierName || "Membership"} - ${displayName}`,
    price: monthlyPrice,
    currency: "USD",
    imageUrl: membership.imageUrl || undefined,
    url: membershipUrl,
    brand: store.name,
    category: "Membership",
  });

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: membership.title,
        text: membership.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Handle subscribe
  const handleSubscribe = () => {
    // TODO: Integrate with Stripe subscription
    toast.success(`Subscribing to ${(membership as any).tierName || membership.title} - $${currentPrice}/${isYearly ? "year" : "month"}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10">
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
        <div className="mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Crown className="mr-1 h-3 w-3" />
              {(membership as any).tierName || "Membership"}
            </Badge>
            <h1 className="text-4xl font-bold md:text-5xl">{membership.title}</h1>
            {membership.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {membership.description}
              </p>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Benefits Section */}
            <div className="space-y-6">
              {/* Image if available */}
              {membership.imageUrl && (
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
                  <Image
                    src={membership.imageUrl}
                    alt={membership.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}

              {/* What's included */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    What's included
                  </h3>
                  {benefits.length > 0 ? (
                    <ul className="space-y-3">
                      {benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Exclusive member content</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Early access to new releases</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">Direct community access</span>
                      </li>
                    </ul>
                  )}
                </CardContent>
              </Card>

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

            {/* Pricing Card */}
            <div className="space-y-4">
              <Card className="border-2 border-amber-200 dark:border-amber-900/50 overflow-hidden">
                {/* Premium ribbon */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                  <Crown className="inline-block mr-1 h-4 w-4" />
                  Premium Membership
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Billing toggle */}
                  <div className="flex items-center justify-center gap-4">
                    <Label
                      htmlFor="billing-toggle"
                      className={cn(
                        "cursor-pointer transition-colors",
                        !isYearly ? "text-foreground font-semibold" : "text-muted-foreground"
                      )}
                    >
                      Monthly
                    </Label>
                    <Switch
                      id="billing-toggle"
                      checked={isYearly}
                      onCheckedChange={setIsYearly}
                    />
                    <Label
                      htmlFor="billing-toggle"
                      className={cn(
                        "cursor-pointer transition-colors",
                        isYearly ? "text-foreground font-semibold" : "text-muted-foreground"
                      )}
                    >
                      Yearly
                    </Label>
                    {savings > 0 && isYearly && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Save ${savings}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Price display */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-amber-600">
                        ${currentPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-muted-foreground mt-2">
                        That's just ${(yearlyPrice / 12).toFixed(2)}/month
                      </p>
                    )}
                  </div>

                  {/* Trial info */}
                  {(membership as any).trialDays && (membership as any).trialDays > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        <Zap className="inline-block mr-1 h-4 w-4" />
                        {(membership as any).trialDays}-day free trial
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    size="lg"
                    onClick={handleSubscribe}
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    {(membership as any).trialDays
                      ? `Start ${(membership as any).trialDays}-Day Free Trial`
                      : `Subscribe Now`
                    }
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Cancel anytime
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      Secure billing
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Premium support
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Join the community
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
