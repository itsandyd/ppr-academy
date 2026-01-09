"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Download,
  ExternalLink,
  Loader2,
  Package,
  ShoppingCart,
  Star,
  Share2,
  Heart,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { SocialProofWidget } from "@/components/social-proof/SocialProofWidget";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function isConvexId(str: string): boolean {
  return /^[a-z0-9]{32}$/.test(str) || str.includes(":");
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const productBySlug = useQuery(
    api.digitalProducts.getProductByGlobalSlug,
    !isConvexId(slug) ? { slug } : "skip"
  );

  const productById = useQuery(
    api.digitalProducts.getProductById,
    isConvexId(slug) || productBySlug === null
      ? { productId: slug as Id<"digitalProducts"> }
      : "skip"
  );

  const product = productBySlug ?? productById;

  const store = useQuery(
    api.stores.getStoreById,
    product?.storeId ? { storeId: product.storeId } : "skip"
  );

  const isInWishlist = useQuery(
    api.wishlists.isInWishlist,
    product?._id ? { productId: product._id } : "skip"
  );
  const addToWishlist = useMutation(api.wishlists.addToWishlist);
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);

  const relatedProducts = useQuery(
    api.digitalProducts.getRelatedProducts,
    product?._id ? { productId: product._id, limit: 4 } : "skip"
  );

  if (product === null) {
    notFound();
  }

  if (!product || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Package className="mx-auto mb-4 h-16 w-16 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    setIsDownloading(true);

    if (product.downloadUrl) {
      window.open(product.downloadUrl, "_blank");
      toast.success("Download started!");
    } else if ((product as any).url) {
      window.open((product as any).url, "_blank");
      toast.success("Opening link...");
    } else {
      toast.error("No download link available");
    }

    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description || `Check out ${product.title}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleCheckout = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to purchase this product");
      router.push("/sign-in");
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/products/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          productSlug: (product as any).slug || slug,
          customerEmail: user.emailAddresses[0]?.emailAddress,
          customerName: user.fullName || user.firstName || "Customer",
          productPrice: product.price,
          productTitle: product.title,
          productImageUrl: product.imageUrl,
          userId: user.id,
          storeId: product.storeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setIsCheckingOut(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save items");
      return;
    }

    if (!product?._id) return;

    setIsTogglingWishlist(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist({ productId: product._id });
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist({
          productId: product._id,
          productType: product.category,
        });
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-2xl">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Category Badge */}
              {product.category && (
                <Badge className="border-chart-1/20 bg-chart-1/10 text-chart-1">
                  {product.category}
                </Badge>
              )}

              {/* Title */}
              <div>
                <h1 className="mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold text-transparent">
                  {product.title}
                </h1>
                {product.description && (
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Creator Info */}
              <Link href={`/${store.slug}`}>
                <Card className="cursor-pointer border-border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-border">
                      <AvatarImage src={store.logoUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-primary-foreground">
                        {store.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <p className="text-lg font-semibold">{store.name}</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-5xl font-bold text-transparent">
                  {product.price === 0 ? "FREE" : `$${product.price}`}
                </span>
                {product.price === 0 && (
                  <Badge className="bg-chart-1/10 text-chart-1">No credit card required</Badge>
                )}
              </div>

              {/* Social Proof */}
              <SocialProofWidget
                type="product"
                id={product._id}
                variant="full"
              />

              {/* Benefits */}
              <Card className="border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-chart-4/5 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-5 w-5 text-chart-1" />
                  What's Included
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>Instant access after purchase</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>Lifetime access to product</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>Direct support from creator</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-chart-1" />
                    <span>30-day money-back guarantee</span>
                  </li>
                </ul>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                {product.price === 0 ? (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-chart-1 to-chart-1/80 py-6 text-lg text-primary-foreground hover:from-chart-1/90 hover:to-chart-1/70"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>Processing...</>
                    ) : product.downloadUrl ? (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        {(product as any).buttonLabel || "Download Now"}
                      </>
                    ) : (product as any).url ? (
                      <>
                        <ExternalLink className="mr-2 h-5 w-5" />
                        {(product as any).buttonLabel || "Access Now"}
                      </>
                    ) : (
                      <>Get Free Access</>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-chart-1 to-chart-1/80 py-6 text-lg text-primary-foreground hover:from-chart-1/90 hover:to-chart-1/70"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Buy Now - ${product.price}
                      </>
                    )}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleWishlistToggle}
                    disabled={isTogglingWishlist}
                  >
                    {isTogglingWishlist ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Heart
                        className={`mr-2 h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`}
                      />
                    )}
                    {isInWishlist ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-chart-1" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Details Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border bg-card p-8">
            <h2 className="mb-6 text-2xl font-bold">About This Product</h2>
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <p className="leading-relaxed text-muted-foreground">
                {product.description || "No additional details available."}
              </p>
            </div>
          </Card>
        </motion.div>

        {relatedProducts && relatedProducts.length > 0 && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">More from {store.name}</h2>
              <Link href={`/${store.slug}`}>
                <Button variant="outline">View All Products</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct: any) => (
                <Link
                  key={relatedProduct._id}
                  href={`/marketplace/products/${relatedProduct.slug || relatedProduct._id}`}
                >
                  <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                      {relatedProduct.imageUrl ? (
                        <Image
                          src={relatedProduct.imageUrl}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="line-clamp-1 font-semibold">{relatedProduct.title}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {relatedProduct.category}
                        </Badge>
                        <span className="font-bold text-chart-1">
                          ${relatedProduct.price.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}
