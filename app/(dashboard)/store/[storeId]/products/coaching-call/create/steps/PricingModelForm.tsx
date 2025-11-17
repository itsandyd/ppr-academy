"use client";

import { useCoachingPreview } from "../CoachingPreviewContext";
import { PricingModelSelector } from "../../../create/components/PricingModelSelector";
import { useRouter, useSearchParams, useParams } from "next/navigation";

export function PricingModelForm() {
  const { formData, updateFormData } = useCoachingPreview();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;

  const handlePricingModelChange = (model: "free_with_gate" | "paid") => {
    const newPrice = model === "free_with_gate" ? 0 : (formData.price && formData.price !== 0 ? formData.price : 99);
    updateFormData({
      pricingModel: model,
      followGateEnabled: model === "free_with_gate",
      price: newPrice,
    });
  };

  const handlePriceChange = (price: number) => {
    updateFormData({ price });
  };

  const handleContinue = () => {
    const nextStep = formData.pricingModel === "free_with_gate" ? "followGate" : "checkout";
    const qs = new URLSearchParams(searchParams);
    qs.set('step', nextStep);
    router.push(`/store/${storeId}/products/coaching-call/create?${qs.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const qs = new URLSearchParams(searchParams);
    qs.set('step', 'details');
    router.push(`/store/${storeId}/products/coaching-call/create?${qs.toString()}`, { scroll: false });
  };

  return (
    <PricingModelSelector
      productCategory="coaching"
      pricingModel={formData.pricingModel || "paid"}
      price={formData.price || 0}
      onPricingModelChange={handlePricingModelChange}
      onPriceChange={handlePriceChange}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
}

