"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProductCreationBase, createProductCreationContext, ProductConfig } from "@/lib/create/product-context-factory";
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct, DigitalProduct } from "@/lib/convex-typed-hooks";
import { useSearchParams } from "next/navigation";

export interface PackData {
  title?: string; description?: string; packType?: "sample-pack" | "midi-pack" | "preset-pack"; tags?: string[]; thumbnail?: string; price?: string; pricingModel?: "free_with_gate" | "paid";
  followGateEnabled?: boolean; followGateRequirements?: { requireEmail?: boolean; requireInstagram?: boolean; requireTiktok?: boolean; requireYoutube?: boolean; requireSpotify?: boolean; minFollowsRequired?: number; };
  followGateSocialLinks?: { instagram?: string; tiktok?: string; youtube?: string; spotify?: string; }; followGateMessage?: string;
  files?: Array<{ id: string; name: string; url: string; storageId?: string; size?: number; type?: string; }>;
  genre?: string; bpm?: number; key?: string; downloadUrl?: string; targetPlugin?: string; dawType?: string; targetPluginVersion?: string;
}

export interface StepCompletion { basics: boolean; pricing: boolean; followGate: boolean; files: boolean; }
type PackSteps = keyof StepCompletion;

const packConfig: ProductConfig<PackData, PackSteps> = {
  productName: "Pack", idParamName: "packId", routeBase: "/dashboard/create/pack", steps: ["basics", "pricing", "followGate", "files"] as const,
  getDefaultData: (searchParams) => ({ pricingModel: "paid", packType: (searchParams.get("type") as PackData["packType"]) || "sample-pack", price: "9.99" }),
  validateStep: (step, data) => {
    switch (step) {
      case "basics": return !!(data.title && data.description && data.packType);
      case "pricing": return !!data.pricingModel;
      case "followGate": return data.pricingModel === "free_with_gate" ? !!(data.followGateEnabled && data.followGateRequirements) : true;
      case "files": return true;
      default: return false;
    }
  },
  mapToCreateParams: (data, storeId, userId) => {
    const effectivePricingModel = data.pricingModel === "free_with_gate" && !data.followGateRequirements ? "paid" : data.pricingModel || "paid";
    const packPrice = effectivePricingModel === "free_with_gate" ? 0 : data.price ? parseFloat(data.price) : 9.99;
    return { title: data.title || "Untitled Pack", description: data.description, storeId, userId, productType: "digital", productCategory: data.packType || "sample-pack", pricingModel: effectivePricingModel, price: packPrice, imageUrl: data.thumbnail, downloadUrl: data.downloadUrl, tags: data.tags,
      followGateConfig: data.pricingModel === "free_with_gate" && data.followGateRequirements ? { requireEmail: data.followGateRequirements.requireEmail || false, requireInstagram: data.followGateRequirements.requireInstagram || false, requireTiktok: data.followGateRequirements.requireTiktok || false, requireYoutube: data.followGateRequirements.requireYoutube || false, requireSpotify: data.followGateRequirements.requireSpotify || false, minFollowsRequired: data.followGateRequirements.minFollowsRequired || 0, socialLinks: data.followGateSocialLinks || {}, customMessage: data.followGateMessage } : undefined };
  },
  mapToUpdateParams: (data, productId) => {
    const updateData: Record<string, unknown> = { id: productId as Id<"digitalProducts">, title: data.title, description: data.description, imageUrl: data.thumbnail, price: data.price ? parseFloat(data.price) : undefined, tags: data.tags, downloadUrl: data.downloadUrl, genre: data.genre ? [data.genre] : undefined, bpm: data.bpm, musicalKey: data.key, packFiles: data.files ? JSON.stringify(data.files) : undefined, targetPlugin: data.targetPlugin, dawType: data.dawType, targetPluginVersion: data.targetPluginVersion };
    if (data.pricingModel === "free_with_gate" && data.followGateRequirements) { updateData.price = 0; updateData.followGateEnabled = true; updateData.followGateRequirements = data.followGateRequirements; updateData.followGateSocialLinks = data.followGateSocialLinks; updateData.followGateMessage = data.followGateMessage; }
    return updateData;
  },
};

function mapFromExisting(existing: unknown): PackData {
  const product = existing as DigitalProduct;
  return { title: product.title || "", description: product.description || "", packType: (product.productCategory as PackData["packType"]) || "sample-pack", tags: product.tags || [], thumbnail: product.imageUrl || "", price: product.price?.toString() || "9.99", pricingModel: product.followGateEnabled ? "free_with_gate" : "paid", downloadUrl: product.downloadUrl || "", genre: product.genre?.[0] || "", bpm: product.bpm, key: product.musicalKey, followGateEnabled: product.followGateEnabled, followGateRequirements: product.followGateRequirements, followGateSocialLinks: product.followGateSocialLinks, followGateMessage: product.followGateMessage, files: product.packFiles ? JSON.parse(product.packFiles as string) : [], targetPlugin: product.targetPlugin, dawType: product.dawType, targetPluginVersion: product.targetPluginVersion };
}

const { Context: PackCreationContext, useCreationContext } = createProductCreationContext<PackData, PackSteps>("PackCreation");

export function PackCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId") as Id<"digitalProducts"> | undefined;
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();
  const existingPack = useDigitalProductById(packId);
  const contextValue = useProductCreationBase(packConfig, createMutation as (args: Record<string, unknown>) => Promise<unknown>, updateMutation as (args: Record<string, unknown>) => Promise<unknown>, existingPack, mapFromExisting);
  return <PackCreationContext.Provider value={contextValue}>{children}</PackCreationContext.Provider>;
}

export function usePackCreation() {
  const context = useCreationContext();
  return { state: { ...context.state, packId: context.state.productId as Id<"digitalProducts"> | undefined }, updateData: context.updateData, savePack: context.saveProduct, validateStep: context.validateStep, canPublish: context.canPublish, createPack: context.publishProduct };
}
