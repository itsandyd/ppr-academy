"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Loader2,
  ShoppingCart,
  Share2,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SocialProofWidget } from "@/components/social-proof/SocialProofWidget";

interface ProductActionsProps {
  productId: string;
  productSlug: string;
  productTitle: string;
  productDescription?: string;
  productPrice: number;
  productImageUrl?: string;
  productDownloadUrl?: string;
  productUrl?: string;
  productButtonLabel?: string;
  productType?: string;
  storeId: string;
}

export function ProductActions({
  productId,
  productSlug,
  productTitle,
  productDescription,
  productPrice,
  productImageUrl,
  productDownloadUrl,
  productUrl,
  productButtonLabel,
  productType,
  storeId,
}: ProductActionsProps) {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const isInWishlist = useQuery(
    api.wishlists.isInWishlist,
    { productId: productId as Id<"digitalProducts"> }
  );
  const addToWishlist = useMutation(api.wishlists.addToWishlist);
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);

  const handleDownload = () => {
    setIsDownloading(true);

    if (productDownloadUrl) {
      window.open(productDownloadUrl, "_blank");
      toast.success("Download started!");
    } else if (productUrl) {
      window.open(productUrl, "_blank");
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
          title: productTitle,
          text: productDescription || `Check out ${productTitle}`,
          url: window.location.href,
        });
      } catch {
        // Share was cancelled or not supported
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
          productId,
          productSlug,
          customerEmail: user.emailAddresses[0]?.emailAddress,
          customerName: user.fullName || user.firstName || "Customer",
          productPrice,
          productTitle,
          productImageUrl,
          userId: user.id,
          storeId,
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

    setIsTogglingWishlist(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist({ productId: productId as Id<"digitalProducts"> });
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist({
          productId: productId as Id<"digitalProducts">,
          productType: productType || "digital_product",
        });
        toast.success("Added to wishlist!");
      }
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <>
      {/* Social Proof */}
      <SocialProofWidget
        type="product"
        id={productId as Id<"digitalProducts">}
        variant="full"
      />

      {/* Action Buttons */}
      <div className="space-y-3">
        {productPrice === 0 ? (
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-chart-1 to-chart-1/80 py-6 text-lg text-primary-foreground hover:from-chart-1/90 hover:to-chart-1/70"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>Processing...</>
            ) : productDownloadUrl ? (
              <>
                <Download className="mr-2 h-5 w-5" />
                {productButtonLabel || "Download Now"}
              </>
            ) : productUrl ? (
              <>
                <ExternalLink className="mr-2 h-5 w-5" />
                {productButtonLabel || "Access Now"}
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
                Buy Now - ${productPrice}
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
    </>
  );
}
