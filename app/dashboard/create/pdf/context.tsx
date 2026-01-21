"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { PDFType } from "../types";
import {
  useProductCreationBase,
  createProductCreationContext,
  ProductConfig,
} from "@/lib/create/product-context-factory";
import {
  useDigitalProductById,
  useCreateUniversalProduct,
  useUpdateDigitalProduct,
  DigitalProduct,
} from "@/lib/convex-typed-hooks";
import { useSearchParams } from "next/navigation";

export interface PDFData {
  title?: string;
  description?: string;
  pdfType?: PDFType;
  tags?: string[];
  thumbnail?: string;
  price?: string;
  pricingModel?: "free_with_gate" | "paid";
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
  pageCount?: number;
  fileSize?: number;
  downloadUrl?: string;
  previewUrl?: string;
  files?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    storageId: string;
  }>;
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  followGate: boolean;
  files: boolean;
}

type PDFSteps = keyof StepCompletion;

const pdfConfig: ProductConfig<PDFData, PDFSteps> = {
  productName: "PDF",
  idParamName: "pdfId",
  routeBase: "/dashboard/create/pdf",
  steps: ["basics", "pricing", "followGate", "files"] as const,

  getDefaultData: (searchParams) => ({
    pricingModel: "paid",
    pdfType: (searchParams.get("type") as PDFType) || "guide",
    price: "9.99",
  }),

  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description);
      case "pricing":
        return !!data.pricingModel;
      case "followGate":
        if (data.pricingModel === "free_with_gate") {
          return !!(data.followGateEnabled && data.followGateRequirements);
        }
        return true;
      case "files":
        return true;
      default:
        return false;
    }
  },

  mapToCreateParams: (data, storeId, userId) => ({
    title: data.title || "Untitled PDF",
    description: data.description,
    storeId,
    userId,
    productType: "digital",
    productCategory: "pdf",
    pricingModel: data.pricingModel || "paid",
    price: data.pricingModel === "free_with_gate" ? 0 : parseFloat(data.price || "9.99"),
    imageUrl: data.thumbnail,
    downloadUrl: data.downloadUrl,
    tags: data.tags,
  }),

  mapToUpdateParams: (data, productId) => ({
    id: productId as Id<"digitalProducts">,
    title: data.title,
    description: data.description,
    imageUrl: data.thumbnail,
    price: data.price ? parseFloat(data.price) : undefined,
    tags: data.tags,
    downloadUrl: data.downloadUrl,
  }),
};

function mapFromExisting(existing: unknown): PDFData {
  const product = existing as DigitalProduct;
  return {
    title: product.title || "",
    description: product.description || "",
    pdfType: (product.pdfType as PDFType) || "guide",
    tags: product.tags || [],
    thumbnail: product.imageUrl || "",
    price: product.price?.toString() || "9.99",
    pricingModel: product.followGateEnabled ? "free_with_gate" : "paid",
    downloadUrl: product.downloadUrl || "",
    pageCount: product.pageCount as number | undefined,
    fileSize: product.fileSize as number | undefined,
    followGateEnabled: product.followGateEnabled,
    followGateRequirements: product.followGateRequirements,
    followGateSocialLinks: product.followGateSocialLinks,
    followGateMessage: product.followGateMessage,
  };
}

const { Context: PDFCreationContext, useCreationContext } =
  createProductCreationContext<PDFData, PDFSteps>("PDFCreation");

export function PDFCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pdfId = searchParams.get("pdfId") as Id<"digitalProducts"> | undefined;

  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();
  const existingPDF = useDigitalProductById(pdfId);

  const contextValue = useProductCreationBase(
    pdfConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>,
    existingPDF,
    mapFromExisting
  );

  return (
    <PDFCreationContext.Provider value={contextValue}>
      {children}
    </PDFCreationContext.Provider>
  );
}

export function usePDFCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      pdfId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    savePDF: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    createPDF: context.publishProduct,
  };
}
