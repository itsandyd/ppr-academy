"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ServiceData, StepCompletion, DEFAULT_PRICING_TIERS } from "./types";
import {
  useProductCreationBase,
  createProductCreationContext,
  ProductConfig,
} from "@/lib/create/product-context-factory";
import {
  useCreateUniversalProduct,
  useUpdateDigitalProduct,
} from "@/lib/convex-typed-hooks";

type ServiceSteps = keyof StepCompletion;

const serviceConfig: ProductConfig<ServiceData, ServiceSteps> = {
  productName: "Service",
  idParamName: "serviceId",
  routeBase: "/dashboard/create/service",
  steps: ["basics", "pricing", "requirements", "delivery"] as const,

  getDefaultData: (searchParams) => ({
    serviceType: (searchParams.get("type") || "mixing") as ServiceData["serviceType"],
    pricingTiers: DEFAULT_PRICING_TIERS,
    rushAvailable: true,
    rushMultiplier: 1.5,
    requirements: {
      acceptedFormats: ["wav", "aiff", "flac"],
      requireDryVocals: true,
      requireReferenceTrack: true,
      requireProjectNotes: false,
      maxFileSize: 500,
    },
    delivery: {
      formats: ["wav-24bit", "mp3-320"],
      includeProjectFile: false,
      includeStemBounces: false,
      deliveryMethod: "download",
      standardTurnaround: 7,
      rushTurnaround: 3,
    },
  }),

  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description && data.serviceType);
      case "pricing":
        return !!(data.pricingTiers && data.pricingTiers.length > 0);
      case "requirements":
        return !!data.requirements?.acceptedFormats?.length;
      case "delivery":
        return !!(data.delivery?.formats?.length && data.delivery?.standardTurnaround);
      default:
        return false;
    }
  },

  mapToCreateParams: (data, storeId, userId) => ({
    title: data.title || `Untitled ${data.serviceType} Service`,
    description: data.description,
    storeId,
    userId,
    productType: "digital",
    productCategory: `${data.serviceType}-service`,
    pricingModel: "paid",
    price: data.pricingTiers?.[0]?.price || 100,
    imageUrl: data.thumbnail,
    tags: data.tags,
    metadata: {
      serviceType: data.serviceType,
      pricingTiers: data.pricingTiers,
      requirements: data.requirements,
      delivery: data.delivery,
      rushAvailable: data.rushAvailable,
      rushMultiplier: data.rushMultiplier,
    },
  }),

  mapToUpdateParams: (data, productId) => ({
    id: productId as Id<"digitalProducts">,
    title: data.title,
    description: data.description,
    imageUrl: data.thumbnail,
    price: data.pricingTiers?.[0]?.price || 100,
  }),
};

const { Context: ServiceCreationContext, useCreationContext } =
  createProductCreationContext<ServiceData, ServiceSteps>("ServiceCreation");

export function ServiceCreationProvider({ children }: { children: React.ReactNode }) {
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();

  const contextValue = useProductCreationBase(
    serviceConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>
  );

  return (
    <ServiceCreationContext.Provider value={contextValue}>
      {children}
    </ServiceCreationContext.Provider>
  );
}

// Keep the same export name for backward compatibility
export function useServiceCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      serviceId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    saveService: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    publishService: context.publishProduct,
  };
}
