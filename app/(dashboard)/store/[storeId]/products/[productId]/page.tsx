"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const productId = params.productId as string;

  // Fetch the product to determine its type
  // Skip if productId is "new" or doesn't look like a Convex ID
  const isValidProductId = productId && productId !== "new" && productId.startsWith("k");
  const product = useQuery(
    api.digitalProducts.getProductById,
    isValidProductId ? { productId: productId as any } : "skip"
  );

  useEffect(() => {
    // If productId is "new", redirect to product creation page
    if (productId === "new") {
      router.push(`/store/${storeId}/products`);
      return;
    }

    if (product) {
      // Determine product type and redirect to appropriate creation flow
      const productCategory = (product as any).productCategory;
      
      // Route based on product category
      if (productCategory === "sample-pack" || productCategory === "midi-pack" || productCategory === "preset-pack" || productCategory === "project-files" || productCategory === "mixing-template") {
        router.push(`/dashboard/create/pack?packId=${productId}&step=basics`);
      } else if (productCategory === "effect-chain" || productCategory === "ableton-rack" || (product as any).productType === "abletonRack" || (product as any).productType === "abletonPreset") {
        router.push(`/dashboard/create/chain?chainId=${productId}&step=basics`);
      } else if (productCategory === "coaching" || (product as any).productType === "coaching") {
        router.push(`/dashboard/create/coaching?coachingId=${productId}&step=basics`);
      } else if (productCategory === "beat-lease") {
        router.push(`/dashboard/create/beat-lease?beatId=${productId}&step=basics`);
      } else if (productCategory === "pdf" || productCategory === "pdf-guide" || productCategory === "cheat-sheet") {
        router.push(`/dashboard/create/pdf?pdfId=${productId}&step=basics`);
      } else if (productCategory === "tip-jar" || productCategory === "donation") {
        // Tip jars use the digital creation flow
        router.push(`/dashboard/create/digital?category=${productCategory}&productId=${productId}&step=basics`);
      } else if (product.price === 0 && product.style === "card") {
        // This is a lead magnet - redirect to lead magnet creation with edit mode
        router.push(`/store/${storeId}/products/lead-magnet?step=thumbnail&edit=${productId}`);
      } else {
        // Default: generic digital product editor
        router.push(`/dashboard/create/digital?category=${productCategory || 'digital'}&productId=${productId}&step=basics`);
      }
    }
  }, [product, router, storeId, productId]);

  // Show loading state while we determine the product type (but not for "new")
  if (productId !== "new" && product === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Product not found
  if (product === null) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // This should not render as we redirect above, but just in case
  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24">
      <div className="text-center">
        <p>Redirecting to edit page...</p>
      </div>
    </div>
  );
} 