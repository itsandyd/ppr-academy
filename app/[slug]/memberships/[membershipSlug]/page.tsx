"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
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
  Check,
  Star,
  Users,
  Sparkles,
  Zap,
  BookOpen,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateProductStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

interface MembershipPageProps {
  params: Promise<{
    slug: string;
    membershipSlug: string;
  }>;
}

export default function MembershipLandingPage({ params }: MembershipPageProps) {
  const { slug, membershipSlug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [isYearly, setIsYearly] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const creator = useQuery(
    api.users.getUserFromClerk,
    store ? { clerkId: store.userId } : "skip"
  );

  // Fetch membership tier by slug (falls back to _id lookup)
  const membership = useQuery(
    api.memberships.getMembershipBySlug,
    membershipSlug ? { slug: membershipSlug } : "skip"
  );

  // Check if current user is already subscribed
  const userMembership = useQuery(
    api.memberships.getUserMembership,
    user?.id && membership?.storeId
      ? { userId: user.id, storeId: membership.storeId }
      : "skip"
  );

  // Loading state
  if (store === undefined || membership === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store || !membership) {
    notFound();
  }

  const displayName = creator?.name || store.name || "Creator";
  const avatarUrl = creator?.imageUrl || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isSubscribed = !!userMembership?.subscription;
  const monthlyPrice = membership.priceMonthly || 0;
  const yearlyPrice = membership.priceYearly || monthlyPrice * 10;
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;
  const savings = isYearly ? monthlyPrice * 12 - yearlyPrice : 0;
  const benefits = membership.benefits || [];
  const totalCourses = membership.courses?.length || 0;
  const totalProducts = membership.products?.length || 0;
  const totalContentValue =
    (membership.courses || []).reduce((sum: number, c: any) => sum + (c.price || 0), 0) +
    (membership.products || []).reduce((sum: number, p: any) => sum + (p.price || 0), 0);

  // Generate structured data for SEO
  const membershipUrl = `${baseUrl}/${slug}/memberships/${membershipSlug}`;
  const structuredData = generateProductStructuredData({
    name: membership.tierName,
    description: membership.description || `${membership.tierName} - ${displayName}`,
    price: monthlyPrice,
    currency: "USD",
    imageUrl: membership.imageUrl || undefined,
    url: membershipUrl,
    brand: store.name,
    category: "Membership",
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: membership.tierName,
        text: membership.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSubscribe = async () => {
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to subscribe");
      router.push(`/sign-in?redirect_url=/${slug}/memberships/${membershipSlug}`);
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/memberships/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId: membership._id,
          tierName: membership.tierName,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "Subscriber",
          priceMonthly: membership.priceMonthly,
          priceYearly: membership.priceYearly,
          billingCycle: isYearly ? "yearly" : "monthly",
          trialDays: membership.trialDays || 0,
          userId: user.id,
          storeId: membership.storeId,
          creatorId: membership.creatorId,
          stripePriceIdMonthly: membership.stripePriceIdMonthly || undefined,
          stripePriceIdYearly: membership.stripePriceIdYearly || undefined,
          creatorStripeAccountId: membership.creator?.stripeConnectAccountId || undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10">
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
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Crown className="mr-1 h-3 w-3" />
                Membership
              </Badge>
              {membership.includesAllContent && (
                <Badge variant="secondary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  All Content Included
                </Badge>
              )}
              {(membership.trialDays ?? 0) > 0 && (
                <Badge variant="outline">
                  <Calendar className="mr-1 h-3 w-3" />
                  {membership.trialDays}-day free trial
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold md:text-5xl">{membership.tierName}</h1>
            {membership.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto whitespace-pre-wrap">
                {membership.description}
              </p>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Benefits & Content */}
            <div className="space-y-6">
              {/* Value proposition summary */}
              {(totalCourses > 0 || totalProducts > 0) && (
                <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      {membership.includesAllContent ? "Full Access to Everything" : "What\u0027s included"}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {totalCourses > 0 && (
                        <div className="text-center p-3 rounded-lg bg-background/60">
                          <BookOpen className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold">{totalCourses}</div>
                          <div className="text-xs text-muted-foreground">
                            {totalCourses === 1 ? "Course" : "Courses"}
                          </div>
                        </div>
                      )}
                      {totalProducts > 0 && (
                        <div className="text-center p-3 rounded-lg bg-background/60">
                          <ShoppingBag className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold">{totalProducts}</div>
                          <div className="text-xs text-muted-foreground">
                            {totalProducts === 1 ? "Product" : "Products"}
                          </div>
                        </div>
                      )}
                    </div>
                    {totalContentValue > 0 && (
                      <div className="mt-4 text-center p-3 rounded-lg bg-background/60">
                        <p className="text-sm text-muted-foreground">
                          Total value if purchased separately
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                          ${totalContentValue.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {membership.includesAllContent && (
                      <p className="mt-3 text-sm text-muted-foreground text-center">
                        Plus instant access to all future content
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Custom benefits */}
              {benefits.length > 0 && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-emerald-500" />
                      Member Benefits
                    </h3>
                    <ul className="space-y-3">
                      {benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
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

            {/* Right Column - Pricing Card */}
            <div className="space-y-4">
              <Card className="border-2 border-amber-200 dark:border-amber-900/50 overflow-hidden sticky top-20">
                {/* Premium ribbon */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                  <Crown className="inline-block mr-1 h-4 w-4" />
                  Premium Membership
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Billing toggle */}
                  {membership.priceYearly && (
                    <>
                      <div className="flex rounded-lg border border-border p-1">
                        <button
                          onClick={() => setIsYearly(false)}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            !isYearly
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setIsYearly(true)}
                          className={cn(
                            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isYearly
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          Yearly
                          {savings > 0 && (
                            <span className="ml-1 text-xs text-green-500">
                              Save ${savings}
                            </span>
                          )}
                        </button>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Price display */}
                  <div className="text-center py-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-amber-600">
                        ${currentPrice}
                      </span>
                      <span className="text-muted-foreground">
                        /{isYearly ? "year" : "month"}
                      </span>
                    </div>
                    {isYearly && membership.priceYearly && (
                      <p className="text-sm text-muted-foreground mt-2">
                        That&apos;s just ${(yearlyPrice / 12).toFixed(2)}/month
                      </p>
                    )}
                  </div>

                  {/* Trial info */}
                  {(membership.trialDays ?? 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        <Zap className="inline-block mr-1 h-4 w-4" />
                        {membership.trialDays}-day free trial
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Action Button */}
                  {isSubscribed ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">Subscribed</span>
                      </div>
                      <Link href="/dashboard?mode=learn">
                        <Button variant="outline" className="w-full">
                          Go to Dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Button
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        size="lg"
                        onClick={handleSubscribe}
                        disabled={isCheckingOut}
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="mr-2 h-5 w-5" />
                            {(membership.trialDays ?? 0) > 0
                              ? `Start ${membership.trialDays}-Day Free Trial`
                              : "Subscribe Now"}
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-500" />
                          Instant access
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          Cancel anytime
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          Secure billing
                        </span>
                      </div>
                    </>
                  )}

                  {/* Membership stats */}
                  <div className="space-y-3 text-sm pt-2">
                    {membership.courses && membership.courses.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Courses</span>
                        <span className="font-medium">
                          {membership.includesAllContent ? "All" : membership.courses.length}
                        </span>
                      </div>
                    )}
                    {membership.products && membership.products.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Products</span>
                        <span className="font-medium">
                          {membership.includesAllContent ? "All" : membership.products.length}
                        </span>
                      </div>
                    )}
                    {(membership.subscriberCount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">{membership.subscriberCount}</span>
                      </div>
                    )}
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

          {/* Included Content - Full width below pricing */}
          {(totalCourses > 0 || totalProducts > 0) && (
            <div className="mt-12 space-y-8">
              <h2 className="text-2xl font-bold text-center">
                Everything Included in Your Membership
              </h2>

              {/* Courses grid */}
              {membership.courses && membership.courses.length > 0 && (() => {
                const PREVIEW_COUNT = 6;
                const visibleCourses = showAllCourses
                  ? membership.courses
                  : membership.courses.slice(0, PREVIEW_COUNT);
                const hiddenCount = membership.courses.length - PREVIEW_COUNT;
                return (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                      {membership.courses.length} Courses
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {visibleCourses.map((course: any) => (
                        <div
                          key={course._id}
                          className="group overflow-hidden rounded-lg border border-border bg-card"
                        >
                          {course.imageUrl ? (
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                              <Image
                                src={course.imageUrl}
                                alt={course.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                              {(course.price ?? 0) > 0 && (
                                <Badge className="absolute top-1.5 right-1.5 bg-background/80 text-foreground text-[10px] backdrop-blur-sm">
                                  ${course.price.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex aspect-video items-center justify-center bg-muted">
                              <BookOpen className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-2.5">
                            <h4 className="text-sm font-semibold line-clamp-2 leading-snug">
                              {course.title}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hiddenCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setShowAllCourses(!showAllCourses)}
                      >
                        {showAllCourses ? "Show less" : `Show all ${membership.courses.length} courses`}
                      </Button>
                    )}
                  </div>
                );
              })()}

              {/* Products grid */}
              {membership.products && membership.products.length > 0 && (() => {
                const PREVIEW_COUNT = 6;
                const visibleProducts = showAllProducts
                  ? membership.products
                  : membership.products.slice(0, PREVIEW_COUNT);
                const hiddenCount = membership.products.length - PREVIEW_COUNT;
                return (
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <ShoppingBag className="h-5 w-5 text-amber-600" />
                      {membership.products.length} Products
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {visibleProducts.map((product: any) => (
                        <div
                          key={product._id}
                          className="group overflow-hidden rounded-lg border border-border bg-card"
                        >
                          {product.imageUrl ? (
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                              <Image
                                src={product.imageUrl}
                                alt={product.title || product.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                              {(product.price ?? 0) > 0 && (
                                <Badge className="absolute top-1.5 right-1.5 bg-background/80 text-foreground text-[10px] backdrop-blur-sm">
                                  ${product.price.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex aspect-video items-center justify-center bg-muted">
                              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-2.5">
                            <h4 className="text-sm font-semibold line-clamp-2 leading-snug">
                              {product.title || product.name}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hiddenCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setShowAllProducts(!showAllProducts)}
                      >
                        {showAllProducts ? "Show less" : `Show all ${membership.products.length} products`}
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Other Tiers */}
          {membership.allStoreTiers && membership.allStoreTiers.length > 1 && (
            <>
              <Separator className="my-12" />
              <div>
                <h2 className="mb-4 text-xl font-bold text-center">
                  All Tiers from {store.name}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
                  {membership.allStoreTiers.map((t: any) => (
                    <Link
                      key={t._id}
                      href={`/${slug}/memberships/${t.slug || t._id}`}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          t._id === membership._id
                            ? "border-amber-500 ring-1 ring-amber-500"
                            : ""
                        )}
                      >
                        <CardContent className="p-4">
                          <h4 className="mb-1 font-semibold">{t.tierName}</h4>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-amber-600">
                              ${t.priceMonthly.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">/mo</span>
                          </div>
                          {t._id === membership._id && (
                            <Badge className="mt-2 bg-amber-500 text-white" variant="default">
                              Current
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
