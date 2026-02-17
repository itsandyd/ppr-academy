"use client";

import { use, useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Check,
  TrendingDown,
  Loader2,
  ShoppingCart,
  BookOpen,
  ShoppingBag,
  User,
  Lock,
  Download,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { FollowGateWizard, FollowGateStep } from "@/components/follow-gates/FollowGateWizard";

interface BundleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BundleDetailPage({ params }: BundleDetailPageProps) {
  const { slug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const bundle = useQuery(api.bundles.getBundleBySlug, { slug });
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isClaimingFree, setIsClaimingFree] = useState(false);
  const [freeBundleClaimed, setFreeBundleClaimed] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // Follow gate state
  const [followGateWizardOpen, setFollowGateWizardOpen] = useState(false);
  const [followGateCompleted, setFollowGateCompleted] = useState(false);

  // Mutations
  const claimFreeBundle = useMutation(api.library.claimFreeBundle);
  const submitLead = useMutation(api.leadSubmissions.submitLead);

  // Build follow gate steps from bundle config (must be before early returns)
  const followGateSteps = useMemo((): FollowGateStep[] => {
    if (!bundle) return [];
    const requirements = bundle.followGateRequirements || {};
    const socialLinks = bundle.followGateSocialLinks || {};
    const steps: FollowGateStep[] = [];
    let order = 0;

    if (requirements.requireEmail !== false) {
      steps.push({ platform: "email", mandatory: true, order: order++ });
    }
    if (requirements.requireInstagram && socialLinks.instagram) {
      steps.push({ platform: "instagram", url: socialLinks.instagram, mandatory: true, order: order++ });
    }
    if (requirements.requireTiktok && socialLinks.tiktok) {
      steps.push({ platform: "tiktok", url: socialLinks.tiktok, mandatory: true, order: order++ });
    }
    if (requirements.requireYoutube && socialLinks.youtube) {
      steps.push({ platform: "youtube", url: socialLinks.youtube, mandatory: true, order: order++ });
    }
    if (requirements.requireSpotify && socialLinks.spotify) {
      steps.push({ platform: "spotify", url: socialLinks.spotify, mandatory: true, order: order++ });
    }
    return steps;
  }, [bundle]);

  const handleFollowGateComplete = useCallback((capturedEmail: string, _completedSteps: Record<string, boolean>) => {
    setFollowGateCompleted(true);
    setFollowGateWizardOpen(false);
    setEmail(capturedEmail);
  }, []);

  // Handle loading state
  if (bundle === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (bundle === null) {
    notFound();
  }

  const isFree = bundle.bundlePrice === 0;
  const hasFollowGate = bundle.followGateEnabled;
  const hasFollowGateSteps = followGateSteps.length > 0;

  const handleClaimFreeBundle = async () => {
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to claim this bundle");
      router.push(`/sign-in?redirect_url=/marketplace/bundles/${slug}`);
      return;
    }

    setIsClaimingFree(true);
    try {
      await claimFreeBundle({
        bundleId: bundle._id,
      });
      setFreeBundleClaimed(true);
      toast.success("Bundle claimed! You now have access to all items.");
      router.push("/dashboard?mode=learn&purchase=success");
    } catch (error: any) {
      if (error?.message?.includes("already have access")) {
        toast.error("You already have access to this bundle.");
      } else {
        console.error("Free bundle claim error:", error);
        toast.error("Failed to claim bundle. Please try again.");
      }
    } finally {
      setIsClaimingFree(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${(price / 100).toFixed(2)}`;
  };

  const handlePurchase = async () => {
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to purchase");
      router.push(`/sign-in?redirect_url=/marketplace/bundles/${slug}`);
      return;
    }

    // Free bundles bypass Stripe entirely
    if (isFree) {
      await handleClaimFreeBundle();
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/bundles/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle._id,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "Customer",
          bundlePrice: bundle.bundlePrice / 100, // Convert from cents
          bundleName: bundle.name,
          bundleImageUrl: bundle.imageUrl,
          userId: user.id,
          storeId: bundle.storeId,
          courseIds: bundle.courseIds,
          productIds: bundle.productIds,
          creatorStripeAccountId: bundle.stripeConnectAccountId,
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

  const { courses, products, ...bundleData } = bundle;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace/bundles">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bundles
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Bundle Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                {bundleData.imageUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={bundleData.imageUrl}
                      alt={bundleData.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{bundleData.name}</h1>
                  {bundleData.creatorName && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{bundleData.creatorName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-violet-500 text-white">
                      <Package className="mr-1 h-3 w-3" />
                      Bundle Deal
                    </Badge>
                    {bundleData.discountPercentage > 0 && (
                      <Badge variant="destructive" className="bg-red-500">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        {bundleData.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {bundleData.description && (
                <div className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert">
                  <p className="whitespace-pre-wrap">{bundleData.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Included Courses */}
            {courses && courses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-600" />
                    Included Courses ({courses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courses.map((course: any) => (
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
                      <Badge variant="outline">${((course.price || 0) / 100).toFixed(2)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Included Products */}
            {products && products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-violet-600" />
                    Included Products ({products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {products.map((product: any) => (
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
                      <Badge variant="outline">${((product.price || 0) / 100).toFixed(2)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* What's Included */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>What You'll Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {courses && courses.length > 0 && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>Instant access to all {courses.length} courses</span>
                    </li>
                  )}
                  {products && products.length > 0 && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>All {products.length} digital products included</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>
                      Save {formatPrice(bundleData.savings)} compared to buying separately
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span>Lifetime access to all content</span>
                  </li>
                  {bundleData.maxPurchases && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span>
                        Limited to {bundleData.maxPurchases} purchases - {bundleData.totalPurchases}{" "}
                        sold
                      </span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="space-y-6 p-6">
                {/* Price */}
                <div className="py-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className={`text-4xl font-bold ${isFree ? "text-emerald-500" : ""}`}>
                      {formatPrice(bundleData.bundlePrice)}
                    </span>
                  </div>
                  {!isFree && (
                    <>
                      <div className="flex items-center justify-center gap-2 text-muted-foreground line-through">
                        <span>{formatPrice(bundleData.originalPrice)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-2 font-semibold text-green-600">
                        <TrendingDown className="h-4 w-4" />
                        <span>
                          Save {formatPrice(bundleData.savings)} ({bundleData.discountPercentage}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isFree && !freeBundleClaimed ? (
                    hasFollowGate && hasFollowGateSteps && !followGateCompleted ? (
                      <>
                        <div className="text-center">
                          <h3 className="text-sm font-semibold">
                            <Lock className="mr-1 inline-block h-4 w-4" />
                            Follow to Unlock Bundle
                          </h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {bundle.followGateMessage || "Support the creator to get free access"}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            if (!isUserLoaded) return;
                            if (!user) {
                              toast.error("Please sign in to claim this bundle");
                              router.push(`/sign-in?redirect_url=/marketplace/bundles/${slug}`);
                              return;
                            }
                            setFollowGateWizardOpen(true);
                          }}
                          size="lg"
                          className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Unlock Free Bundle
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleClaimFreeBundle}
                          disabled={isClaimingFree}
                          size="lg"
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-500/90 hover:to-green-500/90"
                        >
                          {isClaimingFree ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              Get Free Bundle
                              <Download className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          Instant access to all items
                        </p>
                      </>
                    )
                  ) : freeBundleClaimed ? (
                    <>
                      <div className="flex items-center justify-center gap-2 py-2 text-emerald-600">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">Bundle Claimed!</span>
                      </div>
                      <p className="text-center text-xs text-muted-foreground">
                        Check your dashboard for access
                      </p>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handlePurchase}
                        disabled={isCheckingOut}
                        size="lg"
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-500/90 hover:to-purple-500/90"
                      >
                        {isCheckingOut ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Buy Bundle Now
                            <ShoppingCart className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        30-day money-back guarantee
                      </p>
                    </>
                  )}
                </div>

                <Separator />

                {/* Bundle Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Bundle Details</h3>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courses</span>
                    <span className="font-medium">{courses?.length || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium">{products?.length || 0}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-medium">{formatPrice(bundleData.originalPrice)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-green-600">
                    <span>You Save</span>
                    <span>{formatPrice(bundleData.savings)}</span>
                  </div>
                </div>

                {bundleData.totalPurchases > 0 && (
                  <>
                    <Separator />
                    <p className="text-center text-sm text-muted-foreground">
                      {bundleData.totalPurchases}{" "}
                      {bundleData.totalPurchases === 1 ? "person has" : "people have"} purchased
                      this bundle
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Follow Gate Wizard */}
      {hasFollowGate && hasFollowGateSteps && (
        <FollowGateWizard
          open={followGateWizardOpen}
          onOpenChange={setFollowGateWizardOpen}
          steps={followGateSteps}
          customMessage={bundle.followGateMessage}
          creatorName={bundleData.creatorName || "Creator"}
          onComplete={handleFollowGateComplete}
        />
      )}
    </div>
  );
}
