"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Download,
  ShoppingCart,
  Share2,
  Check,
  Star,
  Layers,
  Package,
  BookOpen,
  Lock,
  Percent,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FollowGateWizard, FollowGateStep } from "@/components/follow-gates/FollowGateWizard";

interface BundlePageProps {
  params: Promise<{
    slug: string;
    bundleSlug: string;
  }>;
}

export default function BundlePage({ params }: BundlePageProps) {
  const { slug, bundleSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);

  // Follow gate state
  const [followGateWizardOpen, setFollowGateWizardOpen] = useState(false);
  const [followGateCompleted, setFollowGateCompleted] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch bundle by slug
  const bundle = useQuery(api.bundles.getBundleBySlug, { slug: bundleSlug });

  // Mutations
  const submitLead = useMutation(api.leadSubmissions.submitLead);

  // Handle wizard completion
  const handleFollowGateComplete = useCallback((email: string, completedSteps: Record<string, boolean>) => {
    setCapturedEmail(email);
    setFollowGateCompleted(true);
    setFollowGateWizardOpen(false);
  }, []);

  // Handle follow gate wizard opening
  const handleOpenFollowGate = useCallback(() => {
    setFollowGateWizardOpen(true);
  }, []);

  // Build steps array from legacy schema
  const followGateSteps = useMemo((): FollowGateStep[] => {
    if (!bundle) return [];

    const requirements = bundle.followGateRequirements || {};
    const socialLinks = bundle.followGateSocialLinks || {};
    const legacySteps: FollowGateStep[] = [];
    let order = 0;

    // Email step (always first if required)
    if (requirements.requireEmail !== false) {
      legacySteps.push({
        platform: "email",
        mandatory: true,
        order: order++,
      });
    }

    // Social platforms
    if (requirements.requireInstagram && socialLinks.instagram) {
      legacySteps.push({
        platform: "instagram",
        url: socialLinks.instagram,
        mandatory: true,
        order: order++,
      });
    }
    if (requirements.requireTiktok && socialLinks.tiktok) {
      legacySteps.push({
        platform: "tiktok",
        url: socialLinks.tiktok,
        mandatory: true,
        order: order++,
      });
    }
    if (requirements.requireYoutube && socialLinks.youtube) {
      legacySteps.push({
        platform: "youtube",
        url: socialLinks.youtube,
        mandatory: true,
        order: order++,
      });
    }
    if (requirements.requireSpotify && socialLinks.spotify) {
      legacySteps.push({
        platform: "spotify",
        url: socialLinks.spotify,
        mandatory: true,
        order: order++,
      });
    }

    return legacySteps;
  }, [bundle]);

  // Handle OAuth callback parameters
  useEffect(() => {
    if (oauthProcessed) return;

    const spotifyVerified = searchParams.get("spotifyVerified");
    const spotifyError = searchParams.get("spotifyError");
    const youtubeVerified = searchParams.get("youtubeVerified");
    const youtubeError = searchParams.get("youtubeError");

    let hasOAuthResult = false;

    if (spotifyVerified || spotifyError) {
      hasOAuthResult = true;
      if (spotifyVerified === "true") {
        toast.success("Successfully followed on Spotify!");
        setFollowGateCompleted(true);
      } else if (spotifyError) {
        toast.error(`Spotify: ${spotifyError}`);
      }
    }

    if (youtubeVerified || youtubeError) {
      hasOAuthResult = true;
      if (youtubeVerified === "true") {
        toast.success("Successfully subscribed on YouTube!");
        setFollowGateCompleted(true);
      } else if (youtubeError) {
        toast.error(`YouTube: ${youtubeError}`);
      }
    }

    if (hasOAuthResult) {
      setOauthProcessed(true);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("spotifyVerified");
      newUrl.searchParams.delete("spotifyError");
      newUrl.searchParams.delete("youtubeVerified");
      newUrl.searchParams.delete("youtubeError");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, oauthProcessed]);

  // Loading state
  if (store === undefined || (store && (user === undefined || bundle === undefined))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!store || !bundle) {
    notFound();
  }

  const displayName = bundle.creatorName || user?.name || "Creator";
  const avatarUrl = bundle.creatorAvatar || user?.imageUrl || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isFree = bundle.bundlePrice === 0;
  const price = bundle.bundlePrice || 0;
  const hasDiscount = bundle.originalPrice > bundle.bundlePrice;
  const discountPercent = bundle.discountPercentage || 0;

  // Follow gate config
  const hasFollowGate = bundle.followGateEnabled;
  const followGateMessage = bundle.followGateMessage;
  const hasFollowGateSteps = followGateSteps.length > 0;

  // Combined items count
  const coursesCount = bundle.courses?.length || 0;
  const productsCount = bundle.products?.length || 0;
  const totalItems = coursesCount + productsCount;

  // Handle email submission for free bundles
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = capturedEmail || email;
    if (!emailToUse || !store) return;

    setIsSubmitting(true);
    try {
      if (isFree) {
        await submitLead({
          name: name.trim() || emailToUse.split("@")[0],
          email: emailToUse.toLowerCase(),
          productId: bundle._id,
          storeId: store._id,
          adminUserId: store.userId,
          source: "bundle_page",
        });
      }

      setHasSubmittedEmail(true);
      toast.success("Success! Your bundle is ready.");
    } catch (error: any) {
      if (error?.message?.includes("already exists")) {
        setHasSubmittedEmail(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle bundle access - open download URLs for products, redirect for courses
  const handleDownload = () => {
    const downloadableProducts = (bundle.products || []).filter(
      (p: any) => p.downloadUrl || p.url
    );

    if (downloadableProducts.length > 0) {
      // Open each downloadable product in a new tab
      for (const product of downloadableProducts) {
        const url = product.downloadUrl || product.url;
        if (url) {
          window.open(url, "_blank");
        }
      }
      toast.success(`Opening ${downloadableProducts.length} download${downloadableProducts.length > 1 ? "s" : ""}...`);
    }

    // If bundle has courses, prompt user to sign up for full access
    if (coursesCount > 0) {
      toast.success("Sign up for an account to access your courses!");
      router.push(`/sign-up?redirect_url=/dashboard?mode=learn`);
    } else if (downloadableProducts.length === 0) {
      toast.error("No downloadable items found in this bundle.");
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: bundle.name,
        text: bundle.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Bundle Image */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              {bundle.imageUrl ? (
                <Image
                  src={bundle.imageUrl}
                  alt={bundle.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Layers className="h-24 w-24 text-orange-400" />
                </div>
              )}

              {/* Follow gate badge */}
              {hasFollowGate && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white">
                    <Lock className="mr-1 h-3 w-3" />
                    Follow to Unlock
                  </Badge>
                </div>
              )}

              {/* Discount badge */}
              {hasDiscount && discountPercent > 0 && !hasFollowGate && (
                <div className="absolute left-3 top-3">
                  <Badge className="bg-green-500/90 text-white font-semibold">
                    <Percent className="mr-1 h-3 w-3" />
                    {discountPercent}% OFF
                  </Badge>
                </div>
              )}
            </div>

            {/* Creator info */}
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

            {/* Bundle Contents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-orange-500" />
                  What's Included ({totalItems} items)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Courses */}
                {bundle.courses && bundle.courses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Courses ({coursesCount})
                    </h4>
                    <ul className="space-y-2">
                      {bundle.courses.map((course: any) => (
                        <li key={course._id} className="flex items-center gap-3 rounded-lg border p-3">
                          {course.imageUrl ? (
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              width={48}
                              height={48}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.lessonsCount || 0} lessons
                            </p>
                          </div>
                          {course.price > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              ${course.price}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Products */}
                {bundle.products && bundle.products.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Digital Products ({productsCount})
                    </h4>
                    <ul className="space-y-2">
                      {bundle.products.map((product: any) => (
                        <li key={product._id} className="flex items-center gap-3 rounded-lg border p-3">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.title}
                              width={48}
                              height={48}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {product.productCategory || product.category || "Digital Product"}
                            </p>
                          </div>
                          {product.price > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              ${product.price}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bundle Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-orange-500/90 text-white">
                <Layers className="mr-1 h-3 w-3" />
                Bundle
              </Badge>
              {hasDiscount && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Save ${bundle.savings || (bundle.originalPrice - bundle.bundlePrice)}
                </Badge>
              )}
              {hasFollowGate && (
                <Badge variant="secondary" className="bg-fuchsia-500/10 text-fuchsia-600">
                  <Lock className="mr-1 h-3 w-3" />
                  Follow Gate
                </Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{bundle.name}</h1>
              {bundle.description && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {bundle.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className={cn("text-4xl font-bold", isFree ? "text-emerald-500" : "text-orange-500")}>
                {isFree ? "FREE" : `$${price}`}
              </span>
              {hasDiscount && !isFree && (
                <span className="text-xl text-muted-foreground line-through">
                  ${bundle.originalPrice}
                </span>
              )}
              {!isFree && (
                <span className="text-sm text-muted-foreground">one-time payment</span>
              )}
            </div>

            <Separator />

            {/* Bundle stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-500" />
                <span>{totalItems} items included</span>
              </div>
              {coursesCount > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{coursesCount} {coursesCount === 1 ? "course" : "courses"}</span>
                </div>
              )}
              {productsCount > 0 && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{productsCount} {productsCount === 1 ? "product" : "products"}</span>
                </div>
              )}
            </div>

            {/* CTA Section */}
            <Card className={cn("border-2", hasFollowGate && hasFollowGateSteps && "border-fuchsia-500/50")}>
              <CardContent className="p-6">
                {isFree && !hasSubmittedEmail && !followGateCompleted ? (
                  hasFollowGate && hasFollowGateSteps ? (
                    <div className="space-y-4 text-center">
                      <div>
                        <h3 className="font-semibold">
                          <Lock className="inline-block mr-2 h-4 w-4" />
                          Follow to Unlock Bundle
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {followGateMessage || "Support the creator to get free access"}
                        </p>
                      </div>

                      <Button
                        onClick={handleOpenFollowGate}
                        className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600"
                        size="lg"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Unlock Free Bundle
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        Complete a few quick steps to unlock
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold">Get Free Bundle</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your email to access all {totalItems} items
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder="Your name (optional)"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600"
                        size="lg"
                        disabled={isSubmitting || !email}
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Get Free Bundle
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        We respect your privacy. Unsubscribe anytime.
                      </p>
                    </form>
                  )
                ) : followGateCompleted && !hasSubmittedEmail ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Thanks for your support!</h3>
                      <p className="text-sm text-muted-foreground">Click below to access your bundle</p>
                    </div>
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="lg"
                      onClick={() => {
                        if (capturedEmail && store) {
                          submitLead({
                            name: capturedEmail.split("@")[0],
                            email: capturedEmail.toLowerCase(),
                            productId: bundle._id,
                            storeId: store._id,
                            adminUserId: store.userId,
                            source: "bundle_page",
                          }).catch(() => {});
                        }
                        setHasSubmittedEmail(true);
                        handleDownload();
                      }}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Access Bundle
                    </Button>
                  </div>
                ) : hasSubmittedEmail ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">You're all set!</h3>
                      <p className="text-sm text-muted-foreground">Your bundle is ready to access</p>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg" onClick={handleDownload}>
                      <Layers className="mr-2 h-4 w-4" />
                      Access Bundle
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Get Bundle - ${price}
                    </Button>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Instant access
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Secure checkout
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {hasDiscount ? `Save ${discountPercent}%` : "Great value"}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                Instant access
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {totalItems} items
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Follow Gate Wizard */}
      {hasFollowGate && hasFollowGateSteps && (
        <FollowGateWizard
          open={followGateWizardOpen}
          onOpenChange={setFollowGateWizardOpen}
          steps={followGateSteps}
          customMessage={followGateMessage}
          creatorName={displayName}
          onComplete={handleFollowGateComplete}
        />
      )}
    </div>
  );
}
