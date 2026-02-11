"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Crown,
  Check,
  Loader2,
  BookOpen,
  ShoppingBag,
  Users,
  Sparkles,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

interface MembershipDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function MembershipDetailPage({ params }: MembershipDetailPageProps) {
  const { slug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const membership = useQuery(api.memberships.getMembershipBySlug, { slug });

  const userMembership = useQuery(
    api.memberships.getUserMembership,
    user?.id && membership?.storeId
      ? { userId: user.id, storeId: membership.storeId }
      : "skip"
  );

  if (membership === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (membership === null) {
    notFound();
  }

  const isSubscribed = !!userMembership?.subscription;
  const price = billingCycle === "yearly" && membership.priceYearly
    ? membership.priceYearly
    : membership.priceMonthly;
  const monthlyEquivalent = billingCycle === "yearly" && membership.priceYearly
    ? membership.priceYearly / 12
    : membership.priceMonthly;
  const yearlySavings = membership.priceYearly
    ? (membership.priceMonthly * 12 - membership.priceYearly).toFixed(2)
    : null;

  const handleSubscribe = async () => {
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to subscribe");
      router.push(`/sign-in?redirect_url=/marketplace/memberships/${slug}`);
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
          billingCycle,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace/memberships">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Memberships
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Membership Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{membership.tierName}</h1>
                  {membership.creator && (
                    <div className="mb-3 flex items-center gap-3 text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={membership.creator.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {membership.creator.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>by {membership.creator.name}</span>
                      {membership.store?.slug && (
                        <Link
                          href={`/${membership.store.slug}`}
                          className="text-amber-600 hover:underline"
                        >
                          View Store
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-500 text-white">
                      <Crown className="mr-1 h-3 w-3" />
                      Membership
                    </Badge>
                    {membership.includesAllContent && (
                      <Badge variant="secondary">
                        <Sparkles className="mr-1 h-3 w-3" />
                        All Content Included
                      </Badge>
                    )}
                    {membership.trialDays && membership.trialDays > 0 && (
                      <Badge variant="outline">
                        <Calendar className="mr-1 h-3 w-3" />
                        {membership.trialDays}-day free trial
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {membership.description && (
                <div className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert">
                  <p className="whitespace-pre-wrap">{membership.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Benefits */}
            {membership.benefits && membership.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-amber-600" />
                    What You Get
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {membership.benefits.map((benefit: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Included Courses */}
            {membership.courses && membership.courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                    Included Courses ({membership.courses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {membership.courses.map((course: any) => (
                    <div
                      key={course._id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        {course.imageUrl && (
                          <div className="relative h-12 w-12 overflow-hidden rounded">
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold">{course.title}</h4>
                          {course.description && (
                            <p className="line-clamp-1 text-sm text-muted-foreground">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {course.price > 0 && (
                        <Badge variant="outline">${(course.price / 100).toFixed(2)}</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Included Products */}
            {membership.products && membership.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-amber-600" />
                    Included Products ({membership.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {membership.products.map((product: any) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <div className="relative h-12 w-12 overflow-hidden rounded">
                            <Image
                              src={product.imageUrl}
                              alt={product.title || product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold">{product.title || product.name}</h4>
                          {product.description && (
                            <p className="line-clamp-1 text-sm text-muted-foreground">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {product.price > 0 && (
                        <Badge variant="outline">${(product.price / 100).toFixed(2)}</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Other Tiers */}
            {membership.allStoreTiers && membership.allStoreTiers.length > 1 && (
              <>
                <Separator />
                <div>
                  <h2 className="mb-4 text-xl font-bold">
                    All Tiers from {membership.store?.name || "this creator"}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {membership.allStoreTiers.map((t: any) => (
                      <Link
                        key={t._id}
                        href={`/marketplace/memberships/${t.slug || t._id}`}
                      >
                        <Card
                          className={`cursor-pointer transition-all hover:shadow-md ${t._id === membership._id ? "border-amber-500 ring-1 ring-amber-500" : ""}`}
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

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="space-y-6 p-6">
                {/* Billing Toggle */}
                {membership.priceYearly && (
                  <div className="flex rounded-lg border border-border p-1">
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle("yearly")}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Yearly
                      {yearlySavings && (
                        <span className="ml-1 text-xs text-green-500">Save ${yearlySavings}</span>
                      )}
                    </button>
                  </div>
                )}

                {/* Price */}
                <div className="py-4 text-center">
                  <div className="mb-1 flex items-center justify-center gap-1">
                    <span className="text-4xl font-bold">${price.toFixed(2)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    per {billingCycle === "yearly" ? "year" : "month"}
                  </span>
                  {billingCycle === "yearly" && membership.priceYearly && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      ${monthlyEquivalent.toFixed(2)}/mo equivalent
                    </p>
                  )}
                </div>

                <Separator />

                {/* Action Button */}
                <div className="space-y-3">
                  {isSubscribed ? (
                    <>
                      <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">Subscribed</span>
                      </div>
                      <Link href="/dashboard?mode=learn">
                        <Button variant="outline" className="w-full">
                          Go to Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSubscribe}
                        disabled={isCheckingOut}
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : membership.trialDays && membership.trialDays > 0 ? (
                          <>
                            Start {membership.trialDays}-Day Free Trial
                          </>
                        ) : (
                          <>
                            Subscribe Now
                            <Crown className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      {membership.trialDays && membership.trialDays > 0 ? (
                        <p className="text-center text-xs text-muted-foreground">
                          Free for {membership.trialDays} days, then ${price.toFixed(2)}/
                          {billingCycle === "yearly" ? "yr" : "mo"}
                        </p>
                      ) : (
                        <p className="text-center text-xs text-muted-foreground">
                          Cancel anytime
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                {/* Membership Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Membership Details</h3>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courses</span>
                    <span className="font-medium">
                      {membership.includesAllContent
                        ? "All"
                        : membership.courses?.length || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium">
                      {membership.includesAllContent
                        ? "All"
                        : membership.products?.length || 0}
                    </span>
                  </div>

                  {(membership.subscriberCount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Members</span>
                      <span className="font-medium">{membership.subscriberCount}</span>
                    </div>
                  )}
                </div>

                {/* Creator card */}
                {membership.store && (
                  <>
                    <Separator />
                    <Link href={`/${membership.store.slug}`}>
                      <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={membership.creator?.imageUrl || membership.store.logoUrl} />
                          <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs text-white">
                            {membership.store.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{membership.store.name}</p>
                          <p className="text-xs text-muted-foreground">View creator store</p>
                        </div>
                      </div>
                    </Link>
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
