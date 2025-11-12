"use client";

import { useCourseCreation } from "../context";
import { PricingModelSelector } from "../../../products/create/components/PricingModelSelector";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";

export function PricingModelForm() {
  const { state, updateData } = useCourseCreation();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;

  const handlePricingModelChange = (model: "free_with_gate" | "paid") => {
    const newPrice = model === "free_with_gate" ? "0" : (state.data.price && state.data.price !== "0" ? state.data.price : "99");
    updateData("pricing", {
      pricingModel: model,
      followGateEnabled: model === "free_with_gate",
      price: newPrice,
    });
  };

  const handlePriceChange = (price: number) => {
    updateData("pricing", { price: price.toString() });
  };

  const handleContinue = () => {
    const courseId = searchParams.get("courseId");
    const nextStep = state.data.pricingModel === "free_with_gate" ? "followGate" : "checkout";
    router.push(`/store/${storeId}/course/create?step=${nextStep}${courseId ? `&courseId=${courseId}` : ""}`);
  };

  const handleBack = () => {
    const courseId = searchParams.get("courseId");
    router.push(`/store/${storeId}/course/create?step=course${courseId ? `&courseId=${courseId}` : ""}`);
  };

  return (
    <PricingModelSelector
      productCategory="course"
      pricingModel={state.data.pricingModel || "paid"}
      price={parseFloat(state.data.price || "0")}
      onPricingModelChange={handlePricingModelChange}
      onPriceChange={handlePriceChange}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
}

