"use client";

import { use, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useProductForm } from "./hooks/useProductForm";
import { useCourseCreation } from "../../course/create/context";
import { ProductTypeSelector } from "./components/ProductTypeSelector";
import { PricingModelSelector } from "./components/PricingModelSelector";
import { ProductDetailsForm } from "./components/ProductDetailsForm";
import { FollowGateConfigStep } from "./components/FollowGateConfigStep";
import { ReviewAndPublish } from "./components/ReviewAndPublish";
import { FileManagementStep } from "./components/FileManagementStep";
import { CoachingScheduleStep } from "./components/CoachingScheduleStep";
import { PlaylistConfigStep } from "./components/PlaylistConfigStep";
import { AbletonConfigStep } from "./components/AbletonConfigStep";
import { BundleConfigStep } from "./components/BundleConfigStep";
import { CourseContentForm } from "../../course/create/steps/CourseContentForm";
import { CourseCreationProvider } from "../../course/create/context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepProgressIndicator, StepProgressCompact } from "@/components/ui/step-progress-indicator";
import { ProductCategory, ProductFormData } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { Package, DollarSign, FileText, Lock, Settings, CheckCircle, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";

interface PageProps {
  params: Promise<{
    storeId: string;
  }>;
}

// Step metadata for enhanced UI
const stepMetadata = {
  1: {
    title: "Product Type",
    description: "Choose what you're creating",
    icon: Package,
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "1 min"
  },
  2: {
    title: "Pricing Model",
    description: "Free with gate or paid",
    icon: DollarSign,
    color: "from-purple-500 to-pink-500",
    estimatedTime: "2 min"
  },
  3: {
    title: "Product Details",
    description: "Title, description, and media",
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    estimatedTime: "5-10 min"
  },
  4: {
    title: "Download Gate",
    description: "Require follows to unlock",
    icon: Lock,
    color: "from-purple-500 to-pink-500",
    estimatedTime: "2-3 min"
  },
  5: {
    title: "Type-Specific",
    description: "Optional advanced settings",
    icon: Settings,
    color: "from-orange-500 to-red-500",
    estimatedTime: "2-5 min"
  },
  6: {
    title: "Review & Publish",
    description: "Final review and launch",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-500",
    estimatedTime: "2 min"
  }
};

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
      
      // For all products (including courses), pre-select and advance to Step 2
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

  // Prepare steps for progress indicator (dynamic based on pricing model)
  const isPaid = formData.pricingModel === "paid";
  const isFree = formData.pricingModel === "free_with_gate";
  
  const progressSteps = [
    {
      id: "1",
      title: "Product Type",
      description: "Choose category",
      icon: Package
    },
    {
      id: "2",
      title: "Pricing",
      description: "Free or paid",
      icon: DollarSign
    },
    {
      id: "3",
      title: "Details",
      description: "Info & media",
      icon: FileText
    },
    // Conditional step based on pricing model
    ...(isFree ? [{
      id: "4",
      title: "Download Gate",
      description: "Require follows",
      icon: Lock
    }] : []),
    {
      id: "5",
      title: "Type-Specific",
      description: "Advanced",
      icon: Settings
    },
    {
      id: "6",
      title: "Review",
      description: "Publish",
      icon: CheckCircle
    }
  ];

  const completedSteps = Array.from({ length: formData.currentStep - 1 }, (_, i) => String(i + 1));
  const currentStepMeta = stepMetadata[formData.currentStep as keyof typeof stepMetadata] || stepMetadata[1];
  const CurrentStepIcon = currentStepMeta.icon;

  return (
    <div className="max-w-6xl mx-auto px-8 pt-10 pb-24">
      {/* Enhanced Header */}
      <div className="mb-10">
        {/* Title Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create Product</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <CurrentStepIcon className="w-4 h-4" />
                {currentStepMeta.title}
              </div>
              <span className="text-muted-foreground text-sm">
                {currentStepMeta.description}
              </span>
            </div>
          </div>
          {currentStepMeta.estimatedTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm text-muted-foreground whitespace-nowrap">
              <Clock className="w-4 h-4" />
              <span>{currentStepMeta.estimatedTime}</span>
            </div>
          )}
        </div>

        {/* Progress Indicator - Desktop */}
        <div className="hidden md:block py-6">
          <StepProgressIndicator
            steps={progressSteps}
            currentStep={String(formData.currentStep)}
            completedSteps={completedSteps}
          />
        </div>

        {/* Progress Indicator - Mobile */}
        <div className="md:hidden py-4">
          <StepProgressCompact
            steps={progressSteps}
            currentStep={String(formData.currentStep)}
            completedSteps={completedSteps}
          />
        </div>
      </div>

      {/* Step Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={formData.currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {formData.currentStep === 3 && formData.productCategory === "course" ? (
            // Course creation uses its own layout (no Card wrapper)
            <CourseCreationProvider>
              <CourseContentFormWrapper
                formData={formData}
                updateField={updateField}
                updateFields={updateFields}
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
            </CourseCreationProvider>
          ) : (
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
                  onDoubleClick={(category) => {
                    // Route to dedicated pages for specific product types
                    if (category === "sample-pack" || category === "midi-pack" || category === "preset-pack") {
                      router.push(`/store/${storeId}/products/pack/create?type=${category}`);
                    } else if (category === "course") {
                      router.push(`/store/${storeId}/course/create`);
                    } else if (category === "coaching" || category === "mixing-service" || category === "mastering-service" || category === "workshop") {
                      router.push(`/store/${storeId}/products/coaching-call/create?type=${category}`);
                    } else if (category === "bundle") {
                      router.push(`/store/${storeId}/products/bundle/create`);
                    } else {
                      // Continue with universal wizard for other types
                      updateFields({
                        productCategory: category,
                        productType: getProductTypeFromCategory(category),
                      });
                      nextStep();
                    }
                  }}
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

              {formData.currentStep === 3 && formData.productCategory !== "course" && (
                // Use simple form for non-course products
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
                <>
                  {/* Playlist Curation Configuration */}
                  {formData.productCategory === "playlist-curation" && (
                    <PlaylistConfigStep
                      config={formData.playlistConfig}
                      onConfigChange={(config) => updateField("playlistConfig", config)}
                      onContinue={nextStep}
                      onBack={prevStep}
                    />
                  )}

                  {/* Ableton Rack Configuration */}
                  {formData.productCategory === "ableton-rack" && (
                    <AbletonConfigStep
                      config={formData.abletonRackConfig}
                      onConfigChange={(config) => updateField("abletonRackConfig", config)}
                      onContinue={nextStep}
                      onBack={prevStep}
                    />
                  )}

                  {/* Coaching/Service Configuration */}
                  {(formData.productCategory === "coaching" ||
                    formData.productCategory === "mixing-service" ||
                    formData.productCategory === "mastering-service" ||
                    formData.productCategory === "workshop") && (
                    <CoachingScheduleStep
                      config={formData.coachingConfig}
                      onConfigChange={(config) => updateField("coachingConfig", config)}
                      onContinue={nextStep}
                      onBack={prevStep}
                      productCategory={formData.productCategory}
                    />
                  )}

                  {/* Bundle Configuration */}
                  {formData.productCategory === "bundle" && (
                    <BundleConfigStep
                      config={formData.bundleConfig}
                      onConfigChange={(config) => updateField("bundleConfig", config)}
                      onContinue={nextStep}
                      onBack={prevStep}
                      storeId={formData.storeId}
                      userId={formData.userId}
                    />
                  )}

                  {/* File Management for Digital Products */}
                  {(formData.productCategory === "sample-pack" ||
                    formData.productCategory === "midi-pack" ||
                    formData.productCategory === "preset-pack" ||
                    formData.productCategory === "project-files" ||
                    formData.productCategory === "mixing-template") && (
                    <FileManagementStep
                      files={formData.files || []}
                      onFilesChange={(files) => updateField("files", files)}
                      onContinue={nextStep}
                      onBack={prevStep}
                      productCategory={formData.productCategory}
                    />
                  )}

                  {/* Skip Step for Other Product Types */}
                  {formData.productCategory !== "playlist-curation" &&
                    formData.productCategory !== "ableton-rack" &&
                    formData.productCategory !== "coaching" &&
                    formData.productCategory !== "mixing-service" &&
                    formData.productCategory !== "mastering-service" &&
                    formData.productCategory !== "workshop" &&
                    formData.productCategory !== "bundle" &&
                    formData.productCategory !== "sample-pack" &&
                    formData.productCategory !== "midi-pack" &&
                    formData.productCategory !== "preset-pack" &&
                    formData.productCategory !== "project-files" &&
                    formData.productCategory !== "mixing-template" && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4">Type-Specific Configuration</h2>
                        <p className="text-muted-foreground">
                          No additional configuration needed for this product type.
                        </p>
                        <div className="flex justify-between pt-6">
                          <Button variant="outline" onClick={prevStep}>
                            ← Back
                          </Button>
                          <Button onClick={nextStep}>
                            Continue →
                          </Button>
                        </div>
                      </div>
                    )}
                </>
              )}

              {formData.currentStep === 6 && (
                <ReviewAndPublish
                  formData={formData}
                  onBack={prevStep}
                  onEdit={goToStep}
                />
              )}
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Helper to map category to product type
function getProductTypeFromCategory(category: ProductCategory) {
  const mapping: Record<ProductCategory, any> = {
    "sample-pack": "digital",
    "preset-pack": "digital",
    "midi-pack": "digital",
    "bundle": "digital",
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

// Wrapper component to bridge CourseContentForm with universal wizard state
function CourseContentFormWrapper({
  formData,
  updateField,
  updateFields,
  onContinue,
  onBack,
}: {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  updateFields: (fields: Partial<ProductFormData>) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const { state, updateData } = useCourseCreation();
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  const { user } = useUser();
  const userId = user?.id || "";
  
  // Suppress TypeScript deep instantiation errors by casting API references before use
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createProduct: any = (() => {
    // @ts-ignore TS2589 - Type instantiation is excessively deep
    const fn = api.universalProducts.createUniversalProduct as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutationHook = useMutation as any;
    return mutationHook(fn);
  })();
  
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isInitialMount = useRef(true);

  // Sync universal wizard form data to course context (one-way, on mount only)
  useEffect(() => {
    if (isInitialMount.current && (formData.title || formData.description || formData.imageUrl || formData.tags)) {
      updateData("course", {
        title: formData.title,
        description: formData.description,
        thumbnail: formData.imageUrl,
        tags: formData.tags,
        price: formData.price?.toString(),
        pricingModel: formData.pricingModel,
      });
      isInitialMount.current = false;
    }
  }, [formData.title, formData.description, formData.imageUrl, formData.tags, formData.price, formData.pricingModel, updateData]);

  // Sync course context data back to universal wizard form (only when CourseContentForm updates)
  const prevModulesRef = useRef<any>(null);
  const prevFormDataRef = useRef<any>({
    title: formData.title,
    description: formData.description,
    imageUrl: formData.imageUrl,
    tags: formData.tags,
    category: formData.category,
    subcategory: formData.subcategory,
    skillLevel: formData.skillLevel,
  });
  
  useEffect(() => {
    if (state.data) {
      const updates: Partial<ProductFormData> = {};
      
      // Only update if values are different from previous formData snapshot
      if (state.data.title && state.data.title !== prevFormDataRef.current.title) {
        updates.title = state.data.title;
        prevFormDataRef.current.title = state.data.title;
      }
      if (state.data.description && state.data.description !== prevFormDataRef.current.description) {
        updates.description = state.data.description;
        prevFormDataRef.current.description = state.data.description;
      }
      if (state.data.thumbnail && state.data.thumbnail !== prevFormDataRef.current.imageUrl) {
        updates.imageUrl = state.data.thumbnail;
        prevFormDataRef.current.imageUrl = state.data.thumbnail;
      }
      if (state.data.tags && JSON.stringify(state.data.tags) !== JSON.stringify(prevFormDataRef.current.tags)) {
        updates.tags = state.data.tags;
        prevFormDataRef.current.tags = state.data.tags;
      }
      if (state.data.category && state.data.category !== prevFormDataRef.current.category) {
        updates.category = state.data.category;
        prevFormDataRef.current.category = state.data.category;
      }
      if (state.data.subcategory && state.data.subcategory !== prevFormDataRef.current.subcategory) {
        updates.subcategory = state.data.subcategory;
        prevFormDataRef.current.subcategory = state.data.subcategory;
      }
      if (state.data.skillLevel && state.data.skillLevel !== prevFormDataRef.current.skillLevel) {
        updates.skillLevel = state.data.skillLevel;
        prevFormDataRef.current.skillLevel = state.data.skillLevel;
      }
      
      // Only update modules if they've actually changed
      const currentModulesJson = JSON.stringify(state.data.modules);
      const prevModulesJson = JSON.stringify(prevModulesRef.current);
      if (state.data.modules && currentModulesJson !== prevModulesJson) {
        updates.modules = state.data.modules;
        prevModulesRef.current = state.data.modules;
      }
      
      if (Object.keys(updates).length > 0) {
        updateFields(updates);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data?.title, state.data?.description, state.data?.thumbnail, state.data?.tags, state.data?.category, state.data?.subcategory, state.data?.skillLevel, state.data?.modules]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // Sync latest course data
      if (state.data) {
        updateFields({
          title: state.data.title || formData.title,
          description: state.data.description || formData.description,
          imageUrl: state.data.thumbnail || formData.imageUrl,
          tags: state.data.tags || formData.tags,
          category: state.data.category,
          subcategory: state.data.subcategory,
          skillLevel: state.data.skillLevel,
          modules: state.data.modules,
        } as Partial<ProductFormData>);
      }

      // Create course as draft
      const courseId = await createProduct({
        title: state.data?.title || formData.title,
        description: state.data?.description || formData.description,
        storeId: formData.storeId,
        userId: formData.userId,
        productType: "digital",
        productCategory: "course",
        pricingModel: formData.pricingModel,
        price: formData.price,
        imageUrl: state.data?.thumbnail || formData.imageUrl,
        tags: state.data?.tags || formData.tags,
        
        // Follow gate config (if free)
        followGateConfig: formData.pricingModel === "free_with_gate" && formData.followGateConfig
          ? formData.followGateConfig
          : undefined,
      });

      toast.success("Course draft saved! You can continue editing anytime.");
      router.push(`/store/${storeId}/products`);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleContinue = () => {
    // Ensure all course data is synced before continuing
    if (state.data) {
      updateFields({
        title: state.data.title || formData.title,
        description: state.data.description || formData.description,
        imageUrl: state.data.thumbnail || formData.imageUrl,
        tags: state.data.tags || formData.tags,
        category: state.data.category,
        subcategory: state.data.subcategory,
        skillLevel: state.data.skillLevel,
        modules: state.data.modules,
      } as Partial<ProductFormData>);
    }
    onContinue();
  };

  // Override CourseContentForm's navigation by wrapping it and hiding its navigation
  return (
    <div className="space-y-8">
      <div className="[&>div>div:last-child]:hidden">
        {/* Hide CourseContentForm's navigation section */}
        <CourseContentForm />
      </div>
      {/* Replace with universal wizard navigation */}
      <div className="pt-6 border-t border-border">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={onBack} className="gap-2">
            ← Back
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || !state.data?.title || !state.data?.description}
              className="gap-2"
            >
              {isSavingDraft && <Loader2 className="h-4 w-4 animate-spin" />}
              Save as Draft
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={!state.data?.title || !state.data?.description || !state.data?.category || !state.data?.skillLevel}
              className="gap-2"
            >
              Continue →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

