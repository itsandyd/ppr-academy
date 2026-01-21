"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Id } from "@/convex/_generated/dataModel";
import {
  useStoresByUser,
  useCreateBundle,
  useUpdateBundle,
  usePublishBundle,
} from "@/lib/convex-typed-hooks";

export interface BundleProduct {
  id: Id<"digitalProducts"> | Id<"courses">;
  type: "digital" | "course";
  title: string;
  price: number;
  imageUrl?: string;
  productCategory?: string;
}

export interface BundleData {
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  products?: BundleProduct[];
  price?: string;
  originalPrice?: string;
  discountPercentage?: number;
  showSavings?: boolean;
}

export interface StepCompletion {
  basics: boolean;
  products: boolean;
  pricing: boolean;
}

interface BundleCreationState {
  data: BundleData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  bundleId?: Id<"bundles">;
  lastSaved?: Date;
}

interface BundleCreationContextType {
  state: BundleCreationState;
  updateData: (step: string, data: Partial<BundleData>) => void;
  saveBundle: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  createBundle: () => Promise<{
    success: boolean;
    error?: string;
    bundleId?: Id<"bundles">;
  }>;
}

const BundleCreationContext = createContext<BundleCreationContextType | undefined>(undefined);

export function BundleCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const bundleId = searchParams.get("bundleId") as Id<"bundles"> | undefined;

  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;

  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: "You need to set up a store before creating bundles.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast]);

  const createBundleMutation = useCreateBundle();
  const updateBundleMutation = useUpdateBundle();
  const publishBundleMutation = usePublishBundle();

  const existingBundle = useQuery(
    api.bundles.getBundleDetails,
    bundleId ? { bundleId } : "skip"
  ) as { _id: Id<"bundles">; courses?: unknown[]; products?: unknown[]; title?: string; name?: string; description?: string; price?: number; bundlePrice?: number; originalPrice?: number; discountPercentage?: number; imageUrl?: string } | null | undefined;

  const [state, setState] = useState<BundleCreationState>({
    data: {
      products: [],
      showSavings: true,
    },
    stepCompletion: {
      basics: false,
      products: false,
      pricing: false,
    },
    isLoading: false,
    isSaving: false,
  });

  useEffect(() => {
    if (existingBundle && existingBundle._id === bundleId) {
      const bundleProducts: BundleProduct[] = [];

      existingBundle.courses?.forEach((c: any) => {
        if (c) {
          bundleProducts.push({
            id: c._id,
            type: "course",
            title: c.title,
            price: c.price || 0,
            imageUrl: c.imageUrl,
            productCategory: "course",
          });
        }
      });

      existingBundle.products?.forEach((p: any) => {
        if (p) {
          bundleProducts.push({
            id: p._id,
            type: "digital",
            title: p.title,
            price: p.price || 0,
            imageUrl: p.imageUrl,
            productCategory: p.productCategory,
          });
        }
      });

      const newData: BundleData = {
        title: existingBundle.name || "",
        description: existingBundle.description || "",
        thumbnail: existingBundle.imageUrl || "",
        products: bundleProducts,
        price: existingBundle.bundlePrice?.toString() || "",
        originalPrice: existingBundle.originalPrice?.toString() || "",
        discountPercentage: existingBundle.discountPercentage,
        showSavings: true,
      };

      const stepCompletion = {
        basics: validateStepWithData("basics", newData),
        products: validateStepWithData("products", newData),
        pricing: validateStepWithData("pricing", newData),
      };

      setState((prev) => ({
        ...prev,
        bundleId: existingBundle._id,
        data: newData,
        stepCompletion,
      }));
    }
  }, [existingBundle, bundleId]);

  const validateStepWithData = (step: keyof StepCompletion, data: BundleData): boolean => {
    switch (step) {
      case "basics":
        return !!(data.title && data.description);
      case "products":
        return !!(data.products && data.products.length >= 2);
      case "pricing":
        return !!(data.price && parseFloat(data.price) > 0);
      default:
        return false;
    }
  };

  const validateStep = (step: keyof StepCompletion): boolean => {
    return validateStepWithData(step, state.data);
  };

  const updateData = (step: string, newData: Partial<BundleData>) => {
    setState((prev) => {
      const updatedData = { ...prev.data, ...newData };

      if (newData.products) {
        const totalOriginalPrice = newData.products.reduce((sum, p) => sum + p.price, 0);
        updatedData.originalPrice = totalOriginalPrice.toFixed(2);

        if (updatedData.price) {
          const bundlePrice = parseFloat(updatedData.price);
          const discount = ((totalOriginalPrice - bundlePrice) / totalOriginalPrice) * 100;
          updatedData.discountPercentage = Math.round(discount);
        }
      }

      const stepCompletion = {
        ...prev.stepCompletion,
        [step]: validateStepWithData(step as keyof StepCompletion, updatedData),
      };

      return {
        ...prev,
        data: updatedData,
        stepCompletion,
      };
    });
  };

  const saveBundle = async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      const courseIds =
        (state.data.products
          ?.filter((p) => p.type === "course")
          .map((p) => p.id) as Id<"courses">[]) || [];

      const productIds =
        (state.data.products
          ?.filter((p) => p.type === "digital")
          .map((p) => p.id) as Id<"digitalProducts">[]) || [];

      const bundleType =
        courseIds.length > 0 && productIds.length > 0
          ? "mixed"
          : courseIds.length > 0
            ? "course_bundle"
            : "product_bundle";

      if (state.bundleId) {
        await updateBundleMutation({
          bundleId: state.bundleId,
          name: state.data.title,
          description: state.data.description,
          imageUrl: state.data.thumbnail,
          bundlePrice: state.data.price ? parseFloat(state.data.price) : undefined,
          courseIds: courseIds.length > 0 ? courseIds : undefined,
          productIds: productIds.length > 0 ? productIds : undefined,
        });
      } else {
        const result = await createBundleMutation({
          storeId,
          creatorId: user.id,
          name: state.data.title || "Untitled Bundle",
          description: state.data.description || "",
          bundleType,
          courseIds: courseIds.length > 0 ? courseIds : undefined,
          productIds: productIds.length > 0 ? productIds : undefined,
          bundlePrice: state.data.price ? parseFloat(state.data.price) : 0,
          imageUrl: state.data.thumbnail,
        });

        if (result) {
          setState((prev) => ({ ...prev, bundleId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(
            `/dashboard/create/bundle?bundleId=${result}&step=${currentStep}`
          );
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Bundle Saved",
        description: "Your bundle has been saved as a draft.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save bundle:", error);
      setState((prev) => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    }
  };

  const canPublish = (): boolean => {
    return (
      state.stepCompletion.basics && state.stepCompletion.products && state.stepCompletion.pricing
    );
  };

  const createBundle = async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete all required steps before publishing." };
    }

    try {
      await saveBundle();

      if (state.bundleId) {
        await publishBundleMutation({ bundleId: state.bundleId });

        toast({
          title: "Bundle Published!",
          description: "Your bundle is now live.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, bundleId: state.bundleId };
      }

      return { success: false, error: "Bundle ID not found" };
    } catch (error) {
      return { success: false, error: "Failed to publish bundle." };
    }
  };

  return (
    <BundleCreationContext.Provider
      value={{
        state,
        updateData,
        saveBundle,
        validateStep,
        canPublish,
        createBundle,
      }}
    >
      {children}
    </BundleCreationContext.Provider>
  );
}

export function useBundleCreation() {
  const context = useContext(BundleCreationContext);
  if (context === undefined) {
    throw new Error("useBundleCreation must be used within a BundleCreationProvider");
  }
  return context;
}
