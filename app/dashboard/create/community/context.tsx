"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProductCreationBase, createProductCreationContext, ProductConfig } from "@/lib/create/product-context-factory";
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct, DigitalProduct } from "@/lib/convex-typed-hooks";
import { useSearchParams } from "next/navigation";

export interface CommunityData {
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  discordInviteLink?: string;
  accessType?: "free_with_gate" | "paid";
  price?: string;
}

export interface StepCompletion {
  basics: boolean;
  access: boolean;
  publish: boolean;
}

type CommunitySteps = keyof StepCompletion;

const communityConfig: ProductConfig<CommunityData, CommunitySteps> = {
  productName: "Community",
  idParamName: "productId",
  routeBase: "/dashboard/create/community",
  steps: ["basics", "access", "publish"] as const,
  getDefaultData: () => ({
    accessType: "paid",
    price: "10",
  }),
  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description);
      case "access":
        if (data.accessType === "paid") {
          return !!(data.price && parseFloat(data.price) >= 1);
        }
        return true; // free_with_gate doesn't require price
      case "publish":
        return !!(data.title && data.description && data.accessType);
      default:
        return false;
    }
  },
  mapToCreateParams: (data, storeId, userId) => ({
    title: data.title || "Untitled Community",
    description: data.description || "",
    storeId,
    userId,
    productType: "digital",
    productCategory: "community",
    pricingModel: data.accessType || "paid",
    price: data.accessType === "paid" && data.price ? parseFloat(data.price) : 0,
    imageUrl: data.thumbnail,
    tags: data.tags || [],
    discordInviteLink: data.discordInviteLink,
  }),
  mapToUpdateParams: (data, productId) => ({
    id: productId as Id<"digitalProducts">,
    title: data.title,
    description: data.description,
    imageUrl: data.thumbnail,
    price: data.accessType === "paid" && data.price ? parseFloat(data.price) : 0,
    tags: data.tags,
  }),
};

function mapFromExisting(existing: unknown): CommunityData {
  const product = existing as DigitalProduct;
  return {
    title: product.title || "",
    description: product.description || "",
    thumbnail: product.imageUrl || "",
    tags: product.tags || [],
    discordInviteLink: (product as any).discordInviteLink || "",
    accessType: product.price && product.price > 0 ? "paid" : "free_with_gate",
    price: product.price?.toString() || "10",
  };
}

const { Context: CommunityCreationContext, useCreationContext } = createProductCreationContext<CommunityData, CommunitySteps>("CommunityCreation");

export function CommunityCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") as Id<"digitalProducts"> | undefined;
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();
  const existingProduct = useDigitalProductById(productId);

  const contextValue = useProductCreationBase(
    communityConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>,
    existingProduct,
    mapFromExisting
  );

  return (
    <CommunityCreationContext.Provider value={contextValue}>
      {children}
    </CommunityCreationContext.Provider>
  );
}

export function useCommunityCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      productId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    saveCommunity: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    createCommunity: context.publishProduct,
  };
}
