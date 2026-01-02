"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ServiceData, StepCompletion, DEFAULT_PRICING_TIERS } from "./types";

interface ServiceCreationState {
  data: ServiceData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  serviceId?: Id<"digitalProducts">;
  lastSaved?: Date;
}

interface ServiceCreationContextType {
  state: ServiceCreationState;
  updateData: (step: string, data: Partial<ServiceData>) => void;
  saveService: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  publishService: () => Promise<{
    success: boolean;
    error?: string;
    serviceId?: Id<"digitalProducts">;
  }>;
}

const ServiceCreationContext = createContext<ServiceCreationContextType | undefined>(undefined);

export function ServiceCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const serviceId = searchParams.get("serviceId") as Id<"digitalProducts"> | undefined;
  const serviceType = searchParams.get("type") || "mixing";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stores = useQuery(
    (api as any).stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  const storeId = stores?.[0]?._id;

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: "You need to set up a store before offering services.",
        variant: "destructive",
      });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createServiceMutation = useMutation((api as any).universalProducts.createUniversalProduct);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateServiceMutation = useMutation((api as any).digitalProducts.updateProduct);

  const [state, setState] = useState<ServiceCreationState>({
    data: {
      serviceType: serviceType as ServiceData["serviceType"],
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
    },
    stepCompletion: {
      basics: false,
      pricing: false,
      requirements: false,
      delivery: false,
    },
    isLoading: false,
    isSaving: false,
  });

  const validateStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "basics":
        return !!(state.data.title && state.data.description && state.data.serviceType);
      case "pricing":
        return !!(state.data.pricingTiers && state.data.pricingTiers.length > 0);
      case "requirements":
        return !!state.data.requirements?.acceptedFormats?.length;
      case "delivery":
        return !!(state.data.delivery?.formats?.length && state.data.delivery?.standardTurnaround);
      default:
        return false;
    }
  };

  const updateData = (step: string, newData: Partial<ServiceData>) => {
    setState((prev) => {
      const updatedData = { ...prev.data, ...newData };
      const stepCompletion = {
        ...prev.stepCompletion,
        [step]: validateStep(step as keyof StepCompletion),
      };
      return {
        ...prev,
        data: updatedData,
        stepCompletion,
      };
    });
  };

  const saveService = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const basePrice = state.data.pricingTiers?.[0]?.price || 100;

      if (state.serviceId) {
        await updateServiceMutation({
          id: state.serviceId,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          price: basePrice,
        });
      } else {
        const result = await createServiceMutation({
          title: state.data.title || `Untitled ${state.data.serviceType} Service`,
          description: state.data.description,
          storeId,
          userId: user.id,
          productType: "digital",
          productCategory: `${state.data.serviceType}-service`,
          pricingModel: "paid",
          price: basePrice,
          imageUrl: state.data.thumbnail,
          tags: state.data.tags,
          metadata: {
            serviceType: state.data.serviceType,
            pricingTiers: state.data.pricingTiers,
            requirements: state.data.requirements,
            delivery: state.data.delivery,
            rushAvailable: state.data.rushAvailable,
            rushMultiplier: state.data.rushMultiplier,
          },
        });

        if (result) {
          setState((prev) => ({ ...prev, serviceId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(
            `/dashboard/create/service?serviceId=${result}&step=${currentStep}&type=${state.data.serviceType}`
          );
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Service Saved",
        description: "Your service has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save service:", error);
      setState((prev) => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return (
      state.stepCompletion.basics &&
      state.stepCompletion.pricing &&
      state.stepCompletion.requirements &&
      state.stepCompletion.delivery
    );
  };

  const publishService = async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete all steps before publishing." };
    }

    try {
      if (state.serviceId) {
        await updateServiceMutation({
          id: state.serviceId,
          isPublished: true,
        });

        toast({
          title: "Service Published!",
          description: "Your service is now live and accepting orders.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, serviceId: state.serviceId };
      }

      return { success: false, error: "Service ID not found" };
    } catch (error) {
      return { success: false, error: "Failed to publish service." };
    }
  };

  return (
    <ServiceCreationContext.Provider
      value={{
        state,
        updateData,
        saveService,
        validateStep,
        canPublish,
        publishService,
      }}
    >
      {children}
    </ServiceCreationContext.Provider>
  );
}

export function useServiceCreation() {
  const context = useContext(ServiceCreationContext);
  if (context === undefined) {
    throw new Error("useServiceCreation must be used within a ServiceCreationProvider");
  }
  return context;
}
