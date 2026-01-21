"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";
import { useStoresByUser } from "@/lib/convex-typed-hooks";

// Generic state shape for all product creation contexts
export interface ProductCreationState<TData, TSteps extends string> {
  data: TData;
  stepCompletion: Record<TSteps, boolean>;
  isLoading: boolean;
  isSaving: boolean;
  productId?: string;
  lastSaved?: Date;
}

// Generic context type
export interface ProductCreationContextType<TData, TSteps extends string> {
  state: ProductCreationState<TData, TSteps>;
  storeId: Id<"stores"> | undefined;
  updateData: (step: string, data: Partial<TData>) => void;
  saveProduct: () => Promise<void>;
  validateStep: (step: TSteps) => boolean;
  canPublish: () => boolean;
  publishProduct: () => Promise<{ success: boolean; error?: string; productId?: string }>;
}

// Configuration interface for product contexts
export interface ProductConfig<TData, TSteps extends string> {
  productName: string;
  idParamName: string;
  routeBase: string;
  steps: readonly TSteps[];
  getDefaultData: (searchParams: URLSearchParams) => TData;
  validateStep: (step: TSteps, data: TData) => boolean;
  mapToCreateParams: (data: TData, storeId: Id<"stores">, userId: string) => Record<string, unknown>;
  mapToUpdateParams: (data: TData, productId: string) => Record<string, unknown>;
}

// Hook that provides common product creation logic
export function useProductCreationBase<TData, TSteps extends string>(
  config: ProductConfig<TData, TSteps>,
  createMutation: (args: Record<string, unknown>) => Promise<unknown>,
  updateMutation: (args: Record<string, unknown>) => Promise<unknown>,
  existingProduct?: unknown,
  mapFromExisting?: (existing: unknown) => TData
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const productId = searchParams.get(config.idParamName) || undefined;

  // Store management
  const stores = useStoresByUser(user?.id);
  const storeId = stores?.[0]?._id;

  // Redirect if no store
  useEffect(() => {
    if (user?.id && stores !== undefined && (!stores || stores.length === 0)) {
      toast({
        title: "Store Required",
        description: `You need to set up a store before creating ${config.productName.toLowerCase()}s.`,
        variant: "destructive",
      });
      router.push("/dashboard?mode=create");
    }
  }, [user, stores, router, toast, config.productName]);

  // Initialize step completion
  const initialStepCompletion = useMemo(() =>
    config.steps.reduce((acc, step) => {
      acc[step] = false;
      return acc;
    }, {} as Record<TSteps, boolean>),
    [config.steps]
  );

  const [state, setState] = useState<ProductCreationState<TData, TSteps>>({
    data: config.getDefaultData(searchParams),
    stepCompletion: initialStepCompletion,
    isLoading: false,
    isSaving: false,
    productId: productId,
  });

  // Load existing product data
  useEffect(() => {
    if (existingProduct && mapFromExisting && productId) {
      const newData = mapFromExisting(existingProduct);
      const newStepCompletion = config.steps.reduce((acc, step) => {
        acc[step] = config.validateStep(step, newData);
        return acc;
      }, {} as Record<TSteps, boolean>);

      setState(prev => ({
        ...prev,
        productId,
        data: newData,
        stepCompletion: newStepCompletion,
      }));
    }
  }, [existingProduct, productId, mapFromExisting, config]);

  const validateStep = useCallback((step: TSteps): boolean => {
    return config.validateStep(step, state.data);
  }, [state.data, config]);

  const updateData = useCallback((step: string, newData: Partial<TData>) => {
    setState(prev => {
      const updatedData = { ...prev.data, ...newData } as TData;
      const stepCompletion = {
        ...prev.stepCompletion,
        [step]: config.validateStep(step as TSteps, updatedData),
      };
      return { ...prev, data: updatedData, stepCompletion };
    });
  }, [config]);

  const saveProduct = useCallback(async () => {
    if (state.isSaving || !user?.id || !storeId) return;

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      if (state.productId) {
        await updateMutation(config.mapToUpdateParams(state.data, state.productId as string));
      } else {
        const result = await createMutation(
          config.mapToCreateParams(state.data, storeId, user.id)
        ) as string;

        if (result) {
          setState(prev => ({ ...prev, productId: result }));
          const currentStep = searchParams.get("step") || config.steps[0];
          router.replace(`${config.routeBase}?${config.idParamName}=${result}&step=${currentStep}`);
        }
      }

      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() }));

      toast({
        title: `${config.productName} Saved`,
        description: `Your ${config.productName.toLowerCase()} has been saved as a draft.`,
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error(`Failed to save ${config.productName.toLowerCase()}:`, error);
      setState(prev => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    }
  }, [state.isSaving, state.productId, state.data, user?.id, storeId, router, searchParams, toast, config, createMutation, updateMutation]);

  const canPublish = useCallback((): boolean => {
    return config.steps.every(step => state.stepCompletion[step]);
  }, [state.stepCompletion, config.steps]);

  const publishProduct = useCallback(async () => {
    if (!user?.id || !storeId) {
      return { success: false, error: "User not found or invalid store." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete all steps before publishing." };
    }

    try {
      if (state.productId) {
        await updateMutation({
          id: state.productId,
          isPublished: true,
        });

        toast({
          title: `${config.productName} Published!`,
          description: `Your ${config.productName.toLowerCase()} is now live.`,
          className: "bg-white dark:bg-black",
        });

        return { success: true, productId: state.productId as string };
      }

      return { success: false, error: `${config.productName} ID not found` };
    } catch (error) {
      return { success: false, error: `Failed to publish ${config.productName.toLowerCase()}.` };
    }
  }, [user?.id, storeId, state.productId, canPublish, toast, config.productName, updateMutation]);

  return {
    state,
    storeId,
    updateData,
    saveProduct,
    validateStep,
    canPublish,
    publishProduct,
  };
}

// Helper to create typed context and provider
export function createProductCreationContext<TData, TSteps extends string>(
  displayName: string
) {
  const Context = createContext<ProductCreationContextType<TData, TSteps> | undefined>(undefined);
  Context.displayName = displayName;

  function useCreationContext() {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(`use${displayName} must be used within its Provider`);
    }
    return context;
  }

  return { Context, useCreationContext };
}
