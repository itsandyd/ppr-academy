"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { CoachingData, StepCompletion } from "./types";
import {
  useProductCreationBase,
  createProductCreationContext,
  ProductConfig,
} from "@/lib/create/product-context-factory";
import {
  useCreateUniversalProduct,
  useUpdateDigitalProduct,
} from "@/lib/convex-typed-hooks";

type CoachingSteps = keyof StepCompletion;

const coachingConfig: ProductConfig<CoachingData, CoachingSteps> = {
  productName: "Coaching Session",
  idParamName: "coachingId",
  routeBase: "/dashboard/create/coaching",
  steps: ["basics", "pricing", "followGate", "platform", "availability"] as const,

  getDefaultData: () => ({
    pricingModel: "paid",
    sessionType: "production-coaching",
    duration: 60,
    price: "50",
    sessionPlatform: "zoom" as const,
    discordConfig: {
      requireDiscord: true,
      autoCreateChannel: true,
      notifyOnBooking: true,
    },
    sessionDurations: [60],
    bufferTime: 15,
    maxBookingsPerDay: 3,
    minNoticeHours: 24,
    advanceBookingDays: 30,
    sessionFormat: "video",
    lateCancellationFeePercent: 50,
  }),

  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description && data.sessionType && data.duration);
      case "pricing":
        return !!data.pricingModel;
      case "followGate":
        if (data.pricingModel === "free_with_gate") {
          return !!(data.followGateEnabled && data.followGateRequirements);
        }
        return true;
      case "platform": {
        if (!data.sessionPlatform) return false;
        // Require link for platforms that need one
        if (["zoom", "google_meet", "custom"].includes(data.sessionPlatform)) {
          return !!data.sessionLink;
        }
        // Require phone for phone/facetime
        if (["phone", "facetime"].includes(data.sessionPlatform)) {
          return !!data.sessionPhone;
        }
        // Discord doesn't need a link (auto-created)
        return true;
      }
      case "availability":
        return !!data.weekSchedule;
      default:
        return false;
    }
  },

  mapToCreateParams: (data, storeId, userId) => ({
    title: data.title || "Untitled Coaching Session",
    description: data.description,
    storeId,
    userId,
    productType: "coaching",
    productCategory: "coaching",
    pricingModel: "paid",
    price: parseFloat(data.price || "50"),
    imageUrl: data.thumbnail,
    tags: data.tags,
    duration: data.duration,
    sessionType: data.sessionType,
    sessionPlatform: data.sessionPlatform,
    sessionLink: data.sessionLink,
    sessionPhone: data.sessionPhone,
    lateCancellationFeePercent: data.lateCancellationFeePercent,
    availability: data.weekSchedule ? {
      weekSchedule: data.weekSchedule,
      dateOverrides: data.dateOverrides || [],
      sessionDurations: data.sessionDurations || [data.duration || 60],
      bufferTime: data.bufferTime ?? 15,
      maxBookingsPerDay: data.maxBookingsPerDay ?? 3,
      minNoticeHours: data.minNoticeHours ?? 24,
      advanceBookingDays: data.advanceBookingDays ?? 30,
    } : undefined,
  }),

  mapToUpdateParams: (data, productId) => ({
    id: productId as Id<"digitalProducts">,
    title: data.title,
    description: data.description,
    imageUrl: data.thumbnail,
    price: data.price ? parseFloat(data.price) : undefined,
    duration: data.duration,
    sessionType: data.sessionType,
    sessionPlatform: data.sessionPlatform,
    sessionLink: data.sessionLink,
    sessionPhone: data.sessionPhone,
    lateCancellationFeePercent: data.lateCancellationFeePercent,
    availability: data.weekSchedule ? {
      weekSchedule: data.weekSchedule,
      dateOverrides: data.dateOverrides || [],
      sessionDurations: data.sessionDurations || [data.duration || 60],
      bufferTime: data.bufferTime ?? 15,
      maxBookingsPerDay: data.maxBookingsPerDay ?? 3,
      minNoticeHours: data.minNoticeHours ?? 24,
      advanceBookingDays: data.advanceBookingDays ?? 30,
    } : undefined,
  }),
};

const { Context: CoachingCreationContext, useCreationContext } =
  createProductCreationContext<CoachingData, CoachingSteps>("CoachingCreation");

export function CoachingCreationProvider({ children }: { children: React.ReactNode }) {
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();

  const contextValue = useProductCreationBase(
    coachingConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>
  );

  return (
    <CoachingCreationContext.Provider value={contextValue}>
      {children}
    </CoachingCreationContext.Provider>
  );
}

export function useCoachingCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      coachingId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    saveCoaching: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    createCoaching: context.publishProduct,
  };
}
