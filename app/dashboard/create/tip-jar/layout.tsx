"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { TipJarCreationProvider, useTipJarCreation } from "./context";
import { Coffee, Sparkles } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { ProductLimitGate } from "@/app/dashboard/create/shared/ProductLimitGate";
import { Badge } from "@/components/ui/badge";
import { useStoresByUser } from "@/lib/convex-typed-hooks";

export const dynamic = "force-dynamic";

interface TipJarLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Basics",
    icon: Coffee,
    description: "Title, description & image",
    color: "from-amber-500 to-orange-500",
    estimatedTime: "2 min",
  },
  {
    id: "publish",
    label: "Publish",
    icon: Sparkles,
    description: "Set amount & go live",
    color: "from-green-500 to-emerald-500",
    estimatedTime: "1 min",
  },
];

function LayoutContentInner({ children }: TipJarLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  const { state, canPublish, createTipJar, saveTipJar } = useTipJarCreation();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  const stores = useStoresByUser(user?.id);
  const store = stores?.[0];

  const navigateToStep = (step: string) => {
    router.push(
      `/dashboard/create/tip-jar?step=${step}${state.productId ? `&productId=${state.productId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await saveTipJar();
  };

  const handlePublish = async () => {
    const result = await createTipJar();
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
    .map(([stepId]) => stepId);

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">☕</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {state.productId ? "Edit" : "Create"} Tip Jar
              </h1>
              <Badge variant="secondary">Support</Badge>
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

      {/* Progress */}
      <StepProgress
        steps={steps}
        currentStepId={currentStep}
        completedSteps={completedStepIds}
        onStepClick={navigateToStep}
        variant="full"
      />

      {/* Content with Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">{children}</div>

        <div className="hidden lg:block">
          <div className="sticky top-24">
            <StorefrontPreview
              product={{
                title: state.data.title || "Untitled Tip Jar",
                description: state.data.description,
                price: state.data.suggestedAmount ? Number(state.data.suggestedAmount) : 5,
                imageUrl: state.data.thumbnail,
                productType: "tip-jar",
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

      {/* Actions */}
      <ActionBar
        onBack={
          currentIndex > 0 ? () => navigateToStep(steps[currentIndex - 1].id) : undefined
        }
        onNext={
          currentIndex < steps.length - 1
            ? () => navigateToStep(steps[currentIndex + 1].id)
            : undefined
        }
        onSaveDraft={handleSaveDraft}
        onPublish={currentStep === "publish" ? handlePublish : undefined}
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion]}
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Tip Jar"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

function LayoutContent({ children }: TipJarLayoutProps) {
  const { saveTipJar } = useTipJarCreation();

  return (
    <AutoSaveProvider onSave={saveTipJar} debounceMs={1500} enabled={false}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function TipJarLayout({ children }: TipJarLayoutProps) {
  return (
    <ProductLimitGate featureType="products">
      <TipJarCreationProvider>
        <LayoutContent>{children}</LayoutContent>
      </TipJarCreationProvider>
    </ProductLimitGate>
  );
}
