"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Download, 
  ExternalLink, 
  Package, 
  ShoppingCart, 
  Star,
  Share2,
  Heart,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

interface ProductPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { productId } = use(params);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch product
  const product = useQuery(
    api.digitalProducts.getProductById,
    { productId: productId as Id<"digitalProducts"> }
  );

  // Get creator/store info
  const store = useQuery(
    api.stores.getStoreById,
    product?.storeId ? { storeId: product.storeId } : "skip"
  );

  if (product === null) {
    notFound();
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    setIsDownloading(true);
    
    if (product.downloadUrl) {
      window.open(product.downloadUrl, '_blank');
      toast.success("Download started!");
    } else if ((product as any).url) {
      window.open((product as any).url, '_blank');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-2xl">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-muted-foreground/30" />
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
                <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                  {product.category}
                </Badge>
              )}

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {product.title}
                </h1>
                {product.description && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Creator Info */}
              <Link href={`/${store.slug}`}>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer border-border bg-card">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-border">
                      <AvatarImage src={store.logoUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-primary-foreground">
                        {store.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <p className="font-semibold text-lg">{store.name}</p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                  {product.price === 0 ? "FREE" : `$${product.price}`}
                </span>
                {product.price === 0 && (
                  <Badge className="bg-chart-1/10 text-chart-1">
                    No credit card required
                  </Badge>
                )}
              </div>

              {/* Benefits */}
              <Card className="p-6 bg-gradient-to-br from-chart-1/5 to-chart-4/5 border-chart-1/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-chart-1" />
                  What's Included
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-chart-1 flex-shrink-0" />
                    <span>Instant access after purchase</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-chart-1 flex-shrink-0" />
                    <span>Lifetime access to product</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-chart-1 flex-shrink-0" />
                    <span>Direct support from creator</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-chart-1 flex-shrink-0" />
                    <span>30-day money-back guarantee</span>
                  </li>
                </ul>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                {product.price === 0 ? (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-chart-1 to-chart-1/80 hover:from-chart-1/90 hover:to-chart-1/70 text-primary-foreground text-lg py-6"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>Processing...</>
                    ) : product.downloadUrl ? (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        {(product as any).buttonLabel || "Download Now"}
                      </>
                    ) : (product as any).url ? (
                      <>
                        <ExternalLink className="w-5 h-5 mr-2" />
                        {(product as any).buttonLabel || "Access Now"}
                      </>
                    ) : (
                      <>Get Free Access</>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-chart-1 to-chart-1/80 hover:from-chart-1/90 hover:to-chart-1/70 text-primary-foreground text-lg py-6"
                    onClick={() => toast.info("Payment integration coming soon!")}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Buy Now - ${product.price}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toast.success("Added to wishlist!")}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-chart-1" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-chart-1" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-chart-1" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Details Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-8 border-border bg-card">
            <h2 className="text-2xl font-bold mb-6">About This Product</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "No additional details available."}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* More from Creator */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">More from {store.name}</h2>
            <Link href={`/${store.slug}`}>
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>
          {/* TODO: Add related products grid */}
        </motion.div>
      </section>
    </div>
  );
}

