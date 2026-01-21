"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProductCreationBase, createProductCreationContext, ProductConfig } from "@/lib/create/product-context-factory";
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct, DigitalProduct } from "@/lib/convex-typed-hooks";
import { useSearchParams } from "next/navigation";

export interface CheatSheetData {
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  pricingModel?: "free_with_gate" | "paid";
  price?: number;
}

export interface StepCompletion {
  basics: boolean;
  publish: boolean;
}

type CheatSheetSteps = keyof StepCompletion;

const cheatSheetConfig: ProductConfig<CheatSheetData, CheatSheetSteps> = {
  productName: "Cheat Sheet",
  idParamName: "productId",
  routeBase: "/dashboard/create/cheat-sheet",
  steps: ["basics", "publish"] as const,
  getDefaultData: () => ({
    pricingModel: "paid" as const,
    price: 5,
  }),
  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description);
      case "publish":
        return !!(
          data.pricingModel === "free_with_gate" ||
          (data.pricingModel === "paid" && data.price && data.price >= 1)
        );
      default:
        return false;
    }
  },
  mapToCreateParams: (data, storeId, userId) => ({
    title: data.title || "Untitled Cheat Sheet",
    description: data.description || "",
    storeId,
    userId,
    productType: "digital",
    productCategory: "cheat-sheet",
    pricingModel: data.pricingModel || "paid",
    price: data.pricingModel === "free_with_gate" ? 0 : (data.price || 5),
    imageUrl: data.thumbnail,
    tags: data.tags || [],
  }),
  mapToUpdateParams: (data, productId) => ({
    id: productId as Id<"digitalProducts">,
    title: data.title,
    description: data.description,
    imageUrl: data.thumbnail,
    price: data.pricingModel === "free_with_gate" ? 0 : data.price,
    tags: data.tags,
  }),
};

function mapFromExisting(existing: unknown): CheatSheetData {
  const product = existing as DigitalProduct;
  return {
    title: product.title || "",
    description: product.description || "",
    thumbnail: product.imageUrl || "",
    tags: product.tags || [],
    pricingModel: product.price > 0 ? "paid" : "free_with_gate",
    price: product.price || 5,
  };
}

const { Context: CheatSheetCreationContext, useCreationContext } = createProductCreationContext<CheatSheetData, CheatSheetSteps>("CheatSheetCreation");

export function CheatSheetCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") as Id<"digitalProducts"> | undefined;
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();
  const existingProduct = useDigitalProductById(productId);

  const contextValue = useProductCreationBase(
    cheatSheetConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>,
    existingProduct,
    mapFromExisting
  );

  return (
    <CheatSheetCreationContext.Provider value={contextValue}>
      {children}
    </CheatSheetCreationContext.Provider>
  );
}

export function useCheatSheetCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      productId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    saveCheatSheet: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    createCheatSheet: context.publishProduct,
  };
}
