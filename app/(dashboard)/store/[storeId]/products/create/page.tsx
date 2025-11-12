"use client";

import { use, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useProductForm } from "./hooks/useProductForm";
import { ProductTypeSelector } from "./components/ProductTypeSelector";
import { PricingModelSelector } from "./components/PricingModelSelector";
import { ProductDetailsForm } from "./components/ProductDetailsForm";
import { FollowGateConfigStep } from "./components/FollowGateConfigStep";
import { ReviewAndPublish } from "./components/ReviewAndPublish";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProductCategory } from "./types";

interface PageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default function UniversalProductCreatePage({ params }: PageProps) {
  const { storeId } = use(params);
  const { user } = useUser();
  const userId = user?.id || "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoAdvanced = useRef(false);

  // Form state
  const {
    formData,
    updateField,
    updateFields,
    nextStep,
    prevStep,
    goToStep,
    canProceedFromStep,
    totalSteps,
  } = useProductForm({ storeId, userId });

  // Pre-select product type from URL parameter and auto-advance
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      const validCategory = typeParam as ProductCategory;
      
      // Redirect complex product types to their specialized flows
      if (validCategory === "course") {
        router.push(`/store/${storeId}/course/create`);
        return;
      }
      
      // TODO: Add redirects for other complex types when their flows exist
      // if (validCategory === "workshop" || validCategory === "masterclass") {
      //   router.push(`/store/${storeId}/course/create?type=${validCategory}`);
      //   return;
      // }
      
      // For simple products, pre-select and advance to Step 2
      updateFields({
        productCategory: validCategory,
        productType: getProductTypeFromCategory(validCategory),
        currentStep: 2, // Auto-advance to pricing
      });
    }
  }, [searchParams, updateFields, storeId, router]);

  // Calculate progress (skip step 4 if not free)
  const effectiveStep = formData.pricingModel === "paid" && formData.currentStep > 3
    ? formData.currentStep - 1
    : formData.currentStep;
  const effectiveTotalSteps = formData.pricingModel === "paid"
    ? totalSteps - 1
    : totalSteps;
  const progress = (effectiveStep / effectiveTotalSteps) * 100;

  return (
    <div className="max-w-6xl mx-auto px-8 pt-10 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground mt-1">
          Step {effectiveStep} of {effectiveTotalSteps}
        </p>
        <Progress value={progress} className="mt-4" />
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {formData.currentStep === 1 && (
          <ProductTypeSelector
            selectedCategory={formData.productCategory}
            onSelect={(category) => {
              updateFields({
                productCategory: category,
                productType: getProductTypeFromCategory(category),
              });
            }}
            onContinue={nextStep}
          />
        )}

        {formData.currentStep === 2 && (
          <PricingModelSelector
            productCategory={formData.productCategory}
            pricingModel={formData.pricingModel}
            price={formData.price}
            onPricingModelChange={(model) => updateField("pricingModel", model)}
            onPriceChange={(price) => updateField("price", price)}
            onContinue={nextStep}
            onBack={prevStep}
          />
        )}

        {formData.currentStep === 3 && (
          <ProductDetailsForm
            title={formData.title}
            description={formData.description}
            imageUrl={formData.imageUrl}
            downloadUrl={formData.downloadUrl}
            tags={formData.tags}
            productCategory={formData.productCategory}
            onTitleChange={(title) => updateField("title", title)}
            onDescriptionChange={(description) => updateField("description", description)}
            onImageUrlChange={(imageUrl) => updateField("imageUrl", imageUrl)}
            onDownloadUrlChange={(downloadUrl) => updateField("downloadUrl", downloadUrl)}
            onTagsChange={(tags) => updateField("tags", tags)}
            onContinue={() => {
              // Skip step 4 if not free with gate
              if (formData.pricingModel === "paid") {
                goToStep(5);
              } else {
                nextStep();
              }
            }}
            onBack={prevStep}
          />
        )}

        {formData.currentStep === 4 && formData.pricingModel === "free_with_gate" && (
          <FollowGateConfigStep
            config={formData.followGateConfig}
            onConfigChange={(config) => updateField("followGateConfig", config)}
            onContinue={nextStep}
            onBack={prevStep}
          />
        )}

        {formData.currentStep === 5 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Type-Specific Configuration</h2>
            <p className="text-muted-foreground">
              Optional: Add type-specific fields (playlist config, Ableton settings, etc.)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This step is optional - click Continue to skip
            </p>
            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={prevStep}>
                ← Back
              </Button>
              <Button onClick={nextStep}>
                Skip for Now →
              </Button>
            </div>
          </div>
        )}

        {formData.currentStep === 6 && (
          <ReviewAndPublish
            formData={formData}
            onBack={prevStep}
            onEdit={goToStep}
          />
        )}
      </Card>
    </div>
  );
}

// Helper to map category to product type
function getProductTypeFromCategory(category: ProductCategory) {
  const mapping: Record<ProductCategory, any> = {
    "sample-pack": "digital",
    "preset-pack": "digital",
    "midi-pack": "digital",
    "ableton-rack": "abletonRack",
    "beat-lease": "digital",
    "project-files": "digital",
    "mixing-template": "digital",
    "coaching": "coaching",
    "mixing-service": "coaching",
    "mastering-service": "coaching",
    "playlist-curation": "playlistCuration",
    "course": "digital",
    "workshop": "coaching",
    "masterclass": "coaching",
    "pdf-guide": "digital",
    "cheat-sheet": "digital",
    "template": "digital",
    "blog-post": "urlMedia",
    "community": "digital",
    "tip-jar": "digital",
    "donation": "digital",
  };
  return mapping[category] || "digital";
}

