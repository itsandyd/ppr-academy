"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProductCreationBase, createProductCreationContext, ProductConfig } from "@/lib/create/product-context-factory";
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct, DigitalProduct } from "@/lib/convex-typed-hooks";
import { useSearchParams } from "next/navigation";

export interface TipJarData {
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  suggestedAmount?: string;
}

export interface StepCompletion {
  basics: boolean;
  publish: boolean;
}

type TipJarSteps = keyof StepCompletion;

const tipJarConfig: ProductConfig<TipJarData, TipJarSteps> = {
  productName: "Tip Jar",
  idParamName: "productId",
  routeBase: "/dashboard/create/tip-jar",
  steps: ["basics", "publish"] as const,
  getDefaultData: () => ({
    suggestedAmount: "5",
  }),
  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description);
      case "publish":
        return !!(data.suggestedAmount && parseFloat(data.suggestedAmount) >= 1);
      default:
        return false;
    }
  },
  mapToCreateParams: (data, storeId, userId) => ({
    title: data.title || "Untitled Tip Jar",
    description: data.description || "",
    storeId,
    userId,
    productType: "digital",
    productCategory: "tip-jar",
    pricingModel: "paid",
    price: data.suggestedAmount ? parseFloat(data.suggestedAmount) : 5,
    imageUrl: data.thumbnail,
    tags: data.tags || [],
  }),
  mapToUpdateParams: (data, productId) => ({
    id: productId as Id<"digitalProducts">,
    title: data.title,
    description: data.description,
    imageUrl: data.thumbnail,
    price: data.suggestedAmount ? parseFloat(data.suggestedAmount) : undefined,
    tags: data.tags,
  }),
};

function mapFromExisting(existing: unknown): TipJarData {
  const product = existing as DigitalProduct;
  return {
    title: product.title || "",
    description: product.description || "",
    thumbnail: product.imageUrl || "",
    tags: product.tags || [],
    suggestedAmount: product.price?.toString() || "5",
  };
}

const { Context: TipJarCreationContext, useCreationContext } = createProductCreationContext<TipJarData, TipJarSteps>("TipJarCreation");

export function TipJarCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") as Id<"digitalProducts"> | undefined;
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();
  const existingProduct = useDigitalProductById(productId);

  const contextValue = useProductCreationBase(
    tipJarConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>,
    existingProduct,
    mapFromExisting
  );

  return (
    <TipJarCreationContext.Provider value={contextValue}>
      {children}
    </TipJarCreationContext.Provider>
  );
}

export function useTipJarCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      productId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    saveTipJar: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    createTipJar: context.publishProduct,
  };
}
