"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { notFound, useRouter, redirect } from "next/navigation";
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
  Clock,
  Package,
  BookOpen,
  Music,
  Users,
  Play,
  Pause,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateProductStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";
import { FollowGateWizard, FollowGateStep, FollowGatePlatform } from "@/components/follow-gates/FollowGateWizard";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

interface ProductPageProps {
  params: Promise<{
    slug: string;
    productSlug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Follow gate state
  const [followGateWizardOpen, setFollowGateWizardOpen] = useState(false);
  const [followGateCompleted, setFollowGateCompleted] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch product by slug
  const digitalProduct = useQuery(
    api.digitalProducts.getProductBySlug,
    store && productSlug ? { storeId: store._id, slug: productSlug } : "skip"
  );

  // Mutations
  const submitLead = useMutation(api.leadSubmissions.submitLead);

  // Redirect to specialized pages for certain product types
  useEffect(() => {
    if (digitalProduct) {
      const productType = digitalProduct.productType;
      const productSlugValue = digitalProduct.slug || digitalProduct._id;

      // Redirect to specialized landing pages
      if (productType === "course") {
        router.replace(`/${slug}/courses/${productSlugValue}`);
      } else if (productType === "beat-lease") {
        router.replace(`/${slug}/beats/${productSlugValue}`);
      } else if (productType === "membership") {
        router.replace(`/${slug}/memberships/${productSlugValue}`);
      } else if (productType === "tip-jar") {
        router.replace(`/${slug}/tips/${productSlugValue}`);
      } else if (productType === "coaching") {
        router.replace(`/${slug}/coaching/${productSlugValue}`);
      }
    }
  }, [digitalProduct, slug, router]);

  const product = digitalProduct;

  // Handle wizard completion - must be before early returns
  const handleFollowGateComplete = useCallback((email: string, completedSteps: Record<string, boolean>) => {
    setCapturedEmail(email);
    setFollowGateCompleted(true);
    setFollowGateWizardOpen(false);
  }, []);

  // Handle follow gate wizard opening - must be before early returns
  const handleOpenFollowGate = useCallback(() => {
    setFollowGateWizardOpen(true);
  }, []);

  // Build steps array from either new or legacy schema - must be before early returns
  const followGateSteps = useMemo((): FollowGateStep[] => {
    if (!product) return [];

    // Check for new schema first
    const newSteps = (product as any).followGateSteps;
    if (newSteps && Array.isArray(newSteps) && newSteps.length > 0) {
      return newSteps as FollowGateStep[];
    }

    // Fall back to legacy schema
    const requirements = product.followGateRequirements || {};
    const socialLinks = product.followGateSocialLinks || {};
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
  }, [product]);

  // Handle OAuth callback parameters from Spotify/YouTube verification
  useEffect(() => {
    if (oauthProcessed) return;

    const spotifyVerified = searchParams.get("spotifyVerified");
    const spotifyError = searchParams.get("spotifyError");
    const youtubeVerified = searchParams.get("youtubeVerified");
    const youtubeError = searchParams.get("youtubeError");

    let hasOAuthResult = false;

    // Handle Spotify OAuth callback
    if (spotifyVerified || spotifyError) {
      hasOAuthResult = true;
      if (spotifyVerified === "true") {
        toast.success("Successfully followed on Spotify!");
        // If this was the only requirement, mark as complete
        setFollowGateCompleted(true);
      } else if (spotifyError) {
        toast.error(`Spotify: ${spotifyError}`);
      }
    }

    // Handle YouTube OAuth callback
    if (youtubeVerified || youtubeError) {
      hasOAuthResult = true;
      if (youtubeVerified === "true") {
        toast.success("Successfully subscribed on YouTube!");
        setFollowGateCompleted(true);
      } else if (youtubeError) {
        toast.error(`YouTube: ${youtubeError}`);
      }
    }

    // Clean up URL parameters after processing
    if (hasOAuthResult) {
      setOauthProcessed(true);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("spotifyVerified");
      newUrl.searchParams.delete("spotifyError");
      newUrl.searchParams.delete("youtubeVerified");
      newUrl.searchParams.delete("youtubeError");
      newUrl.searchParams.delete("productId");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, oauthProcessed]);

  // Loading state
  if (store === undefined || (store && (user === undefined || digitalProduct === undefined))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!store || !product) {
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

  const isFree = product.price === 0;
  const price = product.price || 0;

  // Follow gate config - support both new followGateSteps and legacy schema
  const hasFollowGate = product.followGateEnabled;
  const followGateMessage = product.followGateMessage;
  const hasFollowGateSteps = followGateSteps.length > 0;

  // Handle email submission for free products (without follow gate or after wizard completion)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = capturedEmail || email;
    if (!emailToUse || !store) return;

    setIsSubmitting(true);
    try {
      // Submit lead - this handles contact creation via email workflows
      if (isFree) {
        await submitLead({
          name: name.trim() || emailToUse.split("@")[0],
          email: emailToUse.toLowerCase(),
          productId: product._id,
          storeId: store._id,
          adminUserId: store.userId,
          source: "product_page",
        });
      }

      setHasSubmittedEmail(true);
      toast.success("Success! Your download is ready.");
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

  // Handle download
  const handleDownload = () => {
    const downloadUrl = product.downloadUrl || product.url;
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: product.title,
        text: product.description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Get product icon based on type
  const getProductIcon = () => {
    const category = product.productCategory || product.category || "";
    if (category.includes("beat")) return Music;
    if (category.includes("coaching")) return Users;
    return Package;
  };

  const ProductIcon = getProductIcon();

  // Generate structured data for SEO
  const productUrl = `${baseUrl}/${slug}/products/${productSlug}`;
  const structuredData = generateProductStructuredData({
    name: product.title,
    description: product.description || `${product.title} by ${displayName}`,
    price: price,
    currency: "USD",
    imageUrl: product.imageUrl || undefined,
    url: productUrl,
    brand: store.name,
    category: product.category || product.productCategory || "Digital Product",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/80">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ProductIcon className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}

              {/* Follow gate badge */}
              {hasFollowGate && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-primary text-primary-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    Follow to Unlock
                  </Badge>
                </div>
              )}

              {/* Audio preview for beats */}
              {product.demoAudioUrl && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl">
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-primary" />
                    ) : (
                      <Play className="h-6 w-6 text-primary ml-1" />
                    )}
                  </div>
                </button>
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
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {product.category || product.productCategory || "Digital Product"}
              </Badge>
              {(product as any).skillLevel && (
                <Badge variant="secondary">{(product as any).skillLevel}</Badge>
              )}
              {hasFollowGate && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Lock className="mr-1 h-3 w-3" />
                  Follow Gate
                </Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{product.title}</h1>
              {product.description && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className={cn("text-4xl font-bold", isFree ? "text-emerald-500" : "text-primary")}>
                {isFree ? "FREE" : `$${price}`}
              </span>
              <span className="text-sm text-muted-foreground">one-time payment</span>
            </div>

            <Separator />

            {/* Meta info */}
            {((product as any).lessonsCount || (product as any).duration || product.bpm) && (
              <div className="flex flex-wrap gap-4 text-sm">
                {(product as any).lessonsCount && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{(product as any).lessonsCount} lessons</span>
                  </div>
                )}
                {(product as any).duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{(product as any).duration}</span>
                  </div>
                )}
                {product.bpm && (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>{product.bpm} BPM</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA Section */}
            <Card className={cn("border-2", hasFollowGate && hasFollowGateSteps && "border-primary/50")}>
              <CardContent className="p-6">
                {isFree && !hasSubmittedEmail && !followGateCompleted ? (
                  // Show wizard trigger for follow gate products, or simple email form otherwise
                  hasFollowGate && hasFollowGateSteps ? (
                    <div className="space-y-4 text-center">
                      <div>
                        <h3 className="font-semibold">
                          <Lock className="inline-block mr-2 h-4 w-4" />
                          Follow to Unlock
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {followGateMessage || "Support the creator to get free access"}
                        </p>
                      </div>

                      <Button
                        onClick={handleOpenFollowGate}
                        className="w-full"
                        size="lg"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Get Free Download
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        Complete a few quick steps to unlock
                      </p>
                    </div>
                  ) : (
                    // Simple email form for non-follow gate products
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold">Get Free Access</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your email to download instantly
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
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting || !email}
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Get Free Access
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        We respect your privacy. Unsubscribe anytime.
                      </p>
                    </form>
                  )
                ) : followGateCompleted && !hasSubmittedEmail ? (
                  // After wizard completion, submit email and show download
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Thanks for your support!</h3>
                      <p className="text-sm text-muted-foreground">Click below to get your download</p>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        // If email was captured via wizard, submit lead
                        if (capturedEmail && store) {
                          submitLead({
                            name: capturedEmail.split("@")[0],
                            email: capturedEmail.toLowerCase(),
                            productId: product._id,
                            storeId: store._id,
                            adminUserId: store.userId,
                            source: "product_page",
                          }).catch(() => {});
                        }
                        setHasSubmittedEmail(true);
                        handleDownload();
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </Button>
                  </div>
                ) : hasSubmittedEmail ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">You're all set!</h3>
                      <p className="text-sm text-muted-foreground">Click below to access your download</p>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button className="w-full" size="lg">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Now - ${price}
                    </Button>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Instant delivery
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
                Quality guaranteed
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                Instant access
              </span>
            </div>
          </div>
        </div>

        {/* Related products section would go here */}
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
