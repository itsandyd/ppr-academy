"use client";

import { useState, useCallback } from "react";
import { ProductFormData, ProductCategory, ProductType, PricingModel } from "../types";

const TOTAL_STEPS = 6;

interface UseProductFormProps {
  storeId: string;
  userId: string;
}

export function useProductForm({ storeId, userId }: UseProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    // Step 1
    productType: "digital",
    productCategory: "sample-pack",
    
    // Step 2
    pricingModel: "paid",
    price: 0,
    
    // Step 3
    title: "",
    description: "",
    imageUrl: "",
    downloadUrl: "",
    tags: [],
    
    // Step 4
    followGateConfig: undefined,
    
    // Step 5
    playlistConfig: undefined,
    abletonRackConfig: undefined,
    
    // Meta
    storeId,
    userId,
    currentStep: 1,
  });

  const updateField = useCallback(<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((fields: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setFormData(prev => ({ ...prev, currentStep: step }));
    }
  }, []);

  const nextStep = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const canProceedFromStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Type selection
        return !!formData.productCategory;
      case 2: // Pricing
        return formData.pricingModel === "free_with_gate" 
          ? formData.price === 0 
          : formData.price > 0;
      case 3: // Details
        return !!formData.title.trim();
      case 4: // Follow gate (only if free)
        if (formData.pricingModel !== "free_with_gate") return true;
        return !!formData.followGateConfig;
      case 5: // Type-specific
        return true; // Optional fields
      case 6: // Review
        return true;
      default:
        return false;
    }
  }, [formData]);

  const shouldShowStep = useCallback((step: number): boolean => {
    // Skip follow gate step if not free
    if (step === 4 && formData.pricingModel !== "free_with_gate") {
      return false;
    }
    return true;
  }, [formData.pricingModel]);

  const reset = useCallback(() => {
    setFormData({
      productType: "digital",
      productCategory: "sample-pack",
      pricingModel: "paid",
      price: 0,
      title: "",
      description: "",
      imageUrl: "",
      downloadUrl: "",
      tags: [],
      followGateConfig: undefined,
      playlistConfig: undefined,
      abletonRackConfig: undefined,
      storeId,
      userId,
      currentStep: 1,
    });
  }, [storeId, userId]);

  return {
    formData,
    updateField,
    updateFields,
    goToStep,
    nextStep,
    prevStep,
    canProceedFromStep,
    shouldShowStep,
    reset,
    totalSteps: TOTAL_STEPS,
  };
}

