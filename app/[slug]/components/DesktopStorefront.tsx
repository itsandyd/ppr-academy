"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Store,
  Gift,
  ExternalLink,
  GraduationCap,
  Youtube,
  Music,
  Globe,
  Link as LinkIcon,
  Lock,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";

interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  style?: string;
  isPublished?: boolean;
  imageUrl?: string;
  buttonLabel?: string;
  downloadUrl?: string;
  _creationTime: number;
  productType?: string;
  mediaType?: string;
  url?: string;
  slug?: string;
  category?: string;
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;
}

interface DesktopStorefrontProps {
  store: {
    _id: string;
    userId: string;
    name: string;
    slug: string;
    description?: string;
  };
  user: {
    name?: string;
    imageUrl?: string;
  } | null;
  products: Product[];
  displayName: string;
  initials: string;
  avatarUrl: string;
  socialAccounts?: Array<{
    _id: string;
    platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
    platformUsername?: string;
    platformDisplayName?: string;
    accountLabel?: string;
    isActive: boolean;
    isConnected: boolean;
  }>;
}

// Helper function to get product landing page URL
function getProductUrl(storeSlug: string, product: Product): string {
  const productSlug = product.slug || product._id;
  const productType = product.productType || "digitalProduct";

  switch (productType) {
    case "course":
      return `/${storeSlug}/courses/${productSlug}`;
    case "beat-lease":
      return `/${storeSlug}/beats/${productSlug}`;
    case "membership":
      return `/${storeSlug}/memberships/${productSlug}`;
    case "tip-jar":
      return `/${storeSlug}/tips/${productSlug}`;
    case "coaching":
      return `/${storeSlug}/coaching/${productSlug}`;
    case "urlMedia":
      return product.url || "#";
    default:
      return `/${storeSlug}/products/${productSlug}`;
  }
}

export function DesktopStorefront({
  store,
  user,
  products,
  displayName,
  initials,
  avatarUrl,
  socialAccounts = [],
}: DesktopStorefrontProps) {
  // Filter published products
  const publishedProducts = products?.filter((p) => p.isPublished) || [];

  // Group products by type
  const freeProducts = publishedProducts.filter((p) => p.price === 0);
  const paidProducts = publishedProducts.filter((p) => p.price > 0);
  const courses = publishedProducts.filter((p) => p.productType === "course");
  const urlMediaProducts = publishedProducts.filter((p) => p.productType === "urlMedia");

  return (
    <div>
      {/* Store Landing Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 flex items-center gap-6">
            <Avatar className="h-16 w-16 border-4 border-primary-foreground/20">
              <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
              <AvatarFallback className="bg-primary-foreground/20 text-xl font-bold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold text-background">{store.name}</h1>
              <p className="mb-3 text-lg text-background/80">
                by {displayName} • @{store.slug}
              </p>
              {store.description && (
                <p className="max-w-2xl text-base leading-relaxed text-background/90">
                  {store.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 text-center md:grid-cols-3">
            <div className="rounded-lg bg-primary-foreground/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-background">
                {publishedProducts.length || 0}
              </div>
              <div className="text-sm text-background/80">Products & Courses</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-background">
                {freeProducts.length || 0}
              </div>
              <div className="text-sm text-background/80">Free Resources</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-background">🎓</div>
              <div className="text-sm text-background/80">Learn & Grow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Store Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Products Section */}
        <div className="space-y-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Available Products & Resources
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* All Products - Navigate to Landing Pages */}
            {publishedProducts.map((product) => {
              const productUrl = getProductUrl(store.slug, product);
              const isExternal = product.productType === "urlMedia";

              const ProductCard = (
                <Card
                  key={product._id}
                  className={cn(
                    "group cursor-pointer p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                    product.price === 0
                      ? "border border-primary/20 bg-primary/5"
                      : "border-premium bg-card"
                  )}
                >
                  {/* Image */}
                  <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={640}
                        height={192}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="text-center">
                        {product.productType === "course" ? (
                          <GraduationCap className="mx-auto mb-2 h-16 w-16 text-primary" />
                        ) : product.price === 0 ? (
                          <Gift className="mx-auto mb-2 h-16 w-16 text-primary" />
                        ) : (
                          <Store className="mx-auto mb-2 h-16 w-16 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-muted-foreground">
                          {product.productType === "course"
                            ? "Course"
                            : product.price === 0
                            ? "Free Resource"
                            : "Digital Product"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Follow Gate Badge */}
                  {product.followGateEnabled && (
                    <div className="absolute right-2 top-2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Lock className="mr-1 h-3 w-3" />
                        Follow to Unlock
                      </Badge>
                    </div>
                  )}

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        className={cn(
                          "text-xs font-semibold",
                          product.price === 0
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {product.price === 0 ? "FREE" : `$${product.price}`}
                      </Badge>
                      {product.productType && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {product.productType === "digitalProduct"
                            ? "Digital"
                            : product.productType.replace("-", " ")}
                        </Badge>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-foreground">
                      {product.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {product.description || "Get instant access to this resource"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {product.price === 0 ? "Get free access" : "View details"}
                      </span>
                      {isExternal ? (
                        <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:scale-110" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
                      )}
                    </div>
                  </div>
                </Card>
              );

              // External links open in new tab
              if (isExternal && product.url) {
                return (
                  <a
                    key={product._id}
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ProductCard}
                  </a>
                );
              }

              // Internal products use Next.js Link
              return (
                <Link key={product._id} href={productUrl}>
                  {ProductCard}
                </Link>
              );
            })}

            {/* Empty State */}
            {publishedProducts.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                  <Store className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  No products available yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Check back soon for amazing resources and products!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Accounts Section */}
        {socialAccounts && socialAccounts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Connect With Me</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {socialAccounts
                .filter((account) => account.isActive && account.isConnected)
                .map((account) => {
                  const getPlatformIcon = () => {
                    switch (account.platform) {
                      case "instagram":
                        return <Instagram className="h-6 w-6" />;
                      case "twitter":
                        return <Twitter className="h-6 w-6" />;
                      case "facebook":
                        return <Facebook className="h-6 w-6" />;
                      case "tiktok":
                        return <Music className="h-6 w-6" />;
                      case "linkedin":
                        return <LinkIcon className="h-6 w-6" />;
                      default:
                        return <Globe className="h-6 w-6" />;
                    }
                  };

                  const getPlatformColor = () => {
                    switch (account.platform) {
                      case "instagram":
                        return "from-purple-500 to-pink-500";
                      case "twitter":
                        return "from-blue-400 to-blue-600";
                      case "facebook":
                        return "from-blue-600 to-blue-800";
                      case "tiktok":
                        return "from-black to-gray-800 dark:from-white dark:to-gray-200";
                      case "linkedin":
                        return "from-blue-700 to-blue-900";
                      default:
                        return "from-gray-500 to-gray-700";
                    }
                  };

                  const getPlatformUsername = () => {
                    if (account.platformUsername) {
                      return `@${account.platformUsername.replace("@", "")}`;
                    }
                    return account.platformDisplayName || account.platform;
                  };

                  const getPlatformUrl = () => {
                    const username = account.platformUsername?.replace("@", "") || "";
                    switch (account.platform) {
                      case "instagram":
                        return `https://instagram.com/${username}`;
                      case "twitter":
                        return `https://twitter.com/${username}`;
                      case "facebook":
                        return `https://facebook.com/${username}`;
                      case "tiktok":
                        return `https://tiktok.com/@${username}`;
                      case "linkedin":
                        return `https://linkedin.com/in/${username}`;
                      default:
                        return "#";
                    }
                  };

                  return (
                    <a
                      key={account._id}
                      href={getPlatformUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <Card className="cursor-pointer bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${getPlatformColor()} flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110`}
                          >
                            {getPlatformIcon()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold capitalize text-foreground">
                              {account.platform}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {getPlatformUsername()}
                            </p>
                            {account.accountLabel && (
                              <Badge variant="outline" className="mt-1 h-4 px-1 py-0 text-[10px]">
                                {account.accountLabel}
                              </Badge>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </Card>
                    </a>
                  );
                })}
            </div>
          </div>
        )}

        {/* Store Footer */}
        <div className="mt-16 border-t border-border pt-12">
          <div className="rounded-2xl bg-muted/30 p-8">
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
                <AvatarFallback className="bg-muted font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-foreground">About {displayName}</h3>
                <p className="text-muted-foreground">Creator of {store.name}</p>
              </div>
            </div>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Welcome to my digital store! I create high-quality resources and tools to help you
              succeed in your journey. Every product is carefully crafted with your success in mind.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground"></div>
                </div>
                <span className="text-sm font-medium text-foreground">Instant Access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground"></div>
                </div>
                <span className="text-sm font-medium text-foreground">Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground"></div>
                </div>
                <span className="text-sm font-medium text-foreground">Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
