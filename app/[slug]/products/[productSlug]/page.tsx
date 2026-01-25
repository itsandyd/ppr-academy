"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState, useEffect, useCallback } from "react";
import { notFound, useRouter, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Download,
  ExternalLink,
  ShoppingCart,
  Share2,
  Heart,
  Check,
  CheckCircle2,
  Star,
  Clock,
  Package,
  BookOpen,
  Music,
  Users,
  Play,
  Pause,
  Instagram,
  Youtube,
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
import { SocialLinkDialog, SocialPlatform } from "@/components/follow-gates/SocialLinkDialog";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

// TikTok and Spotify icons (not in lucide)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

interface ProductPageProps {
  params: Promise<{
    slug: string;
    productSlug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = use(params);
  const router = useRouter();

  // State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Follow gate state
  const [followedPlatforms, setFollowedPlatforms] = useState<Record<string, boolean>>({});
  const [activePlatformDialog, setActivePlatformDialog] = useState<SocialPlatform | null>(null);

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
  const createContact = useMutation(api.emailContacts.createContact);
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

  // Define callbacks before any early returns (React hooks rule)
  const openPlatformDialog = useCallback((platform: SocialPlatform) => {
    setActivePlatformDialog(platform);
  }, []);

  const handlePlatformConfirmed = useCallback((platform: SocialPlatform) => {
    setFollowedPlatforms((prev) => ({
      ...prev,
      [platform]: true,
    }));
    setActivePlatformDialog(null);
  }, []);

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

  // Follow gate config
  const hasFollowGate = product.followGateEnabled;
  const followGateRequirements = product.followGateRequirements || {};
  const followGateSocialLinks = product.followGateSocialLinks || {};
  const followGateMessage = product.followGateMessage;

  // Calculate required follows
  const requiredPlatforms: string[] = [];
  if (followGateRequirements.requireInstagram) requiredPlatforms.push("instagram");
  if (followGateRequirements.requireTiktok) requiredPlatforms.push("tiktok");
  if (followGateRequirements.requireYoutube) requiredPlatforms.push("youtube");
  if (followGateRequirements.requireSpotify) requiredPlatforms.push("spotify");

  const minFollowsRequired = followGateRequirements.minFollowsRequired || requiredPlatforms.length;
  const currentFollowCount = Object.values(followedPlatforms).filter(Boolean).length;
  const hasMetFollowRequirement = currentFollowCount >= minFollowsRequired;

  // Handle email submission for free products
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !store) return;

    // Check follow gate requirements
    if (hasFollowGate && !hasMetFollowRequirement) {
      toast.error(`Please follow at least ${minFollowsRequired} account(s) to continue`);
      return;
    }

    setIsSubmitting(true);
    try {
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

      await createContact({
        storeId: store._id,
        email: email.toLowerCase(),
        firstName,
        lastName,
        source: "product_page",
        sourceProductId: product._id,
      });

      if (isFree) {
        await submitLead({
          name: name.trim() || email.split("@")[0],
          email: email.toLowerCase(),
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

  // Get social link for platform
  const getSocialLink = (platform: string) => {
    switch (platform) {
      case "instagram":
        return followGateSocialLinks.instagram;
      case "tiktok":
        return followGateSocialLinks.tiktok;
      case "youtube":
        return followGateSocialLinks.youtube;
      case "spotify":
        return followGateSocialLinks.spotify;
      default:
        return null;
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "tiktok":
        return <TikTokIcon className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "spotify":
        return <SpotifyIcon className="h-4 w-4" />;
      default:
        return null;
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
            <Card className={cn("border-2", hasFollowGate && "border-primary/50")}>
              <CardContent className="p-6">
                {isFree && !hasSubmittedEmail ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold">
                        {hasFollowGate ? "Follow to Unlock" : "Get Free Access"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {followGateMessage || (hasFollowGate
                          ? `Follow ${minFollowsRequired} account(s) and enter your email`
                          : "Enter your email to download instantly"
                        )}
                      </p>
                    </div>

                    {/* Follow Gate Requirements - v2 with validation */}
                    {hasFollowGate && requiredPlatforms.length > 0 && (
                      <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">
                            <Lock className="h-4 w-4 text-primary" />
                            Follow to unlock
                          </span>
                          <Badge variant={hasMetFollowRequirement ? "default" : "secondary"}>
                            {currentFollowCount}/{minFollowsRequired}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {requiredPlatforms.map((platform) => {
                            const rawLink = getSocialLink(platform);
                            // Validate link - must be non-empty string
                            const link = rawLink && typeof rawLink === "string" && rawLink.trim().length > 0
                              ? rawLink.trim()
                              : null;

                            // Log warning for missing social links
                            if (!link && typeof window !== "undefined") {
                              console.warn(`[FollowGate] Platform "${platform}" is required but no social link is configured. Raw value:`, rawLink);
                            }

                            const isFollowed = followedPlatforms[platform];

                            // Get platform-specific styling
                            const getPlatformStyle = () => {
                              switch (platform) {
                                case "instagram":
                                  return {
                                    bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
                                    hoverBorder: "hover:border-pink-500/50",
                                  };
                                case "tiktok":
                                  return {
                                    bg: "bg-black",
                                    hoverBorder: "hover:border-gray-500/50",
                                  };
                                case "youtube":
                                  return {
                                    bg: "bg-red-600",
                                    hoverBorder: "hover:border-red-500/50",
                                  };
                                case "spotify":
                                  return {
                                    bg: "bg-green-600",
                                    hoverBorder: "hover:border-green-500/50",
                                  };
                                default:
                                  return {
                                    bg: "bg-primary",
                                    hoverBorder: "hover:border-primary/50",
                                  };
                              }
                            };

                            const style = getPlatformStyle();

                            // If link is not configured, show a disabled state
                            if (!link) {
                              return (
                                <div
                                  key={platform}
                                  className="flex items-center gap-3 p-3 rounded-lg w-full bg-muted/30 border-2 border-dashed border-muted-foreground/20 opacity-60"
                                >
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted flex-shrink-0">
                                    <span className="text-muted-foreground">{getPlatformIcon(platform)}</span>
                                  </div>
                                  <span className="flex-1 font-medium capitalize text-muted-foreground">
                                    {platform} (not configured)
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={platform}
                                type="button"
                                onClick={() => !isFollowed && link && openPlatformDialog(platform as SocialPlatform)}
                                disabled={isFollowed}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg w-full transition-all text-left",
                                  isFollowed
                                    ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-500"
                                    : `bg-background border-2 border-transparent ${style.hoverBorder} hover:bg-muted/50`
                                )}
                              >
                                <div className={cn(
                                  "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                                  isFollowed ? "bg-green-500" : style.bg
                                )}>
                                  {isFollowed ? (
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                  ) : (
                                    <span className="text-white">{getPlatformIcon(platform)}</span>
                                  )}
                                </div>
                                <span className="flex-1 font-medium capitalize">
                                  {isFollowed
                                    ? `Following on ${platform}`
                                    : `Follow on ${platform}`
                                  }
                                </span>
                                {!isFollowed && (
                                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Email form */}
                    {followGateRequirements.requireEmail !== false && (
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
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting || !email || (hasFollowGate && !hasMetFollowRequirement)}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {hasFollowGate && !hasMetFollowRequirement
                        ? `Follow ${minFollowsRequired - currentFollowCount} more to unlock`
                        : "Get Free Access"
                      }
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      We respect your privacy. Unsubscribe anytime.
                    </p>
                  </form>
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

      {/* Social Platform Dialogs for Follow Gate */}
      {followGateSocialLinks.instagram && (
        <SocialLinkDialog
          open={activePlatformDialog === "instagram"}
          onOpenChange={(open) => !open && setActivePlatformDialog(null)}
          platform="instagram"
          url={followGateSocialLinks.instagram}
          onConfirmed={() => handlePlatformConfirmed("instagram")}
          creatorName={displayName}
        />
      )}
      {followGateSocialLinks.tiktok && (
        <SocialLinkDialog
          open={activePlatformDialog === "tiktok"}
          onOpenChange={(open) => !open && setActivePlatformDialog(null)}
          platform="tiktok"
          url={followGateSocialLinks.tiktok}
          onConfirmed={() => handlePlatformConfirmed("tiktok")}
          creatorName={displayName}
        />
      )}
      {followGateSocialLinks.youtube && (
        <SocialLinkDialog
          open={activePlatformDialog === "youtube"}
          onOpenChange={(open) => !open && setActivePlatformDialog(null)}
          platform="youtube"
          url={followGateSocialLinks.youtube}
          onConfirmed={() => handlePlatformConfirmed("youtube")}
          creatorName={displayName}
        />
      )}
      {followGateSocialLinks.spotify && (
        <SocialLinkDialog
          open={activePlatformDialog === "spotify"}
          onOpenChange={(open) => !open && setActivePlatformDialog(null)}
          platform="spotify"
          url={followGateSocialLinks.spotify}
          onConfirmed={() => handlePlatformConfirmed("spotify")}
          creatorName={displayName}
        />
      )}
    </div>
  );
}
