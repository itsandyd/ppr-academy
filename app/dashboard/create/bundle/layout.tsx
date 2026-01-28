"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { BundleCreationProvider, useBundleCreation } from "./context";
import { useStoresByUser } from "@/lib/convex-typed-hooks";
import { Package, Layers, DollarSign } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { ProductLimitGate } from "@/app/dashboard/create/shared/ProductLimitGate";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface BundleCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Bundle Basics",
    icon: Package,
    description: "Title, description & cover",
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "2-3 min",
  },
  {
    id: "products",
    label: "Products",
    icon: Layers,
    description: "Select products to include",
    color: "from-purple-500 to-pink-500",
    estimatedTime: "3-5 min",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    description: "Set bundle price & discount",
    color: "from-emerald-500 to-teal-500",
    estimatedTime: "1-2 min",
  },
];

function LayoutContentInner({ children }: BundleCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  const { state, canPublish, createBundle, saveBundle } = useBundleCreation();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  const stores = useStoresByUser(user?.id);
  const store = stores?.[0];

  const navigateToStep = (step: string) => {
    router.push(
      `/dashboard/create/bundle?step=${step}${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await saveBundle();
  };

  const handlePublishBundle = async () => {
    const result = await createBundle();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-1/4 rounded bg-muted"></div>
            <div className="h-96 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  const completedStepIds = Object.entries(state.stepCompletion)
    .filter(([_, completed]) => completed)
    .map(([stepId, _]) => stepId);

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📦</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create Bundle</h1>
              <Badge variant="secondary">Multi-Product</Badge>
              <SaveStatusIndicator className="ml-2" />
            </div>
            {steps.find((s) => s.id === currentStep) && (
              <p className="text-sm text-muted-foreground">
                {steps.find((s) => s.id === currentStep)?.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <StepProgress
        steps={steps}
        currentStepId={currentStep}
        completedSteps={completedStepIds}
        onStepClick={navigateToStep}
        variant="full"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">{children}</div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <StorefrontPreview
              product={{
                title: state.data.title,
                description: state.data.description,
                price: state.data.price ? Number(state.data.price) : 0,
                imageUrl: state.data.thumbnail,
                productType: "bundle" as any,
              }}
              store={
                store
                  ? {
                      name: store.name,
                      slug: store.slug,
                    }
                  : undefined
              }
              user={
                user
                  ? {
                      name: user.fullName || user.firstName || undefined,
                      imageUrl: user.imageUrl,
                    }
                  : undefined
              }
              defaultDevice="mobile"
            />
          </div>
        </div>
      </div>

      <ActionBar
        onBack={currentIndex > 0 ? () => navigateToStep(steps[currentIndex - 1].id) : undefined}
        onNext={
          currentIndex < steps.length - 1
            ? () => navigateToStep(steps[currentIndex + 1].id)
            : undefined
        }
        onSaveDraft={handleSaveDraft}
        onPublish={currentStep === "pricing" ? handlePublishBundle : undefined}
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion]}
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Bundle"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

function LayoutContent({ children }: BundleCreateLayoutProps) {
  const { saveBundle } = useBundleCreation();

  return (
    <AutoSaveProvider onSave={saveBundle} debounceMs={1500} enabled={false}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function BundleCreateLayout({ children }: BundleCreateLayoutProps) {
  return (
    <ProductLimitGate featureType="products">
      <BundleCreationProvider>
        <LayoutContent>{children}</LayoutContent>
      </BundleCreationProvider>
    </ProductLimitGate>
  );
}
