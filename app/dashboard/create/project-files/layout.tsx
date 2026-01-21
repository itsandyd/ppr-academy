"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { ProjectFileCreationProvider, useProjectFileCreation } from "./context";
import { DollarSign, Lock, Upload, FolderOpen } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface ProjectFileCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Project Basics",
    icon: FolderOpen,
    description: "DAW type, title & description",
    estimatedTime: "2-3 min",
  },
  {
    id: "files",
    label: "Files",
    icon: Upload,
    description: "Upload your project files",
    estimatedTime: "5-10 min",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    description: "Set your price or make it free",
    estimatedTime: "1-2 min",
  },
  {
    id: "followGate",
    label: "Download Gate",
    icon: Lock,
    description: "Require follows (if free)",
    conditional: true,
    estimatedTime: "2-3 min",
  },
];

function LayoutContentInner({ children }: ProjectFileCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  const { state, canPublish, createProject, saveProject } = useProjectFileCreation();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  // @ts-ignore - Type instantiation depth issue
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const store = stores?.[0];

  const navigateToStep = (step: string) => {
    const dawType = state.data.dawType || "ableton";
    router.push(
      `/dashboard/create/project-files?daw=${dawType}&step=${step}${state.projectId ? `&projectId=${state.projectId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await saveProject();
  };

  const handlePublishProject = async () => {
    const result = await createProject();
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

  // Filter steps based on pricing model
  const visibleSteps = steps.filter(
    (step) =>
      !step.conditional ||
      (step.id === "followGate" && state.data.pricingModel === "free_with_gate")
  );

  const completedStepIds = Object.entries(state.stepCompletion)
    .filter(([_, completed]) => completed)
    .map(([stepId, _]) => stepId);

  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStep);
  const progressPercentage = ((currentIndex + 1) / visibleSteps.length) * 100;

  const dawLabel =
    state.data.dawType === "ableton"
      ? "Ableton Live"
      : state.data.dawType === "fl-studio"
        ? "FL Studio"
        : state.data.dawType === "logic"
          ? "Logic Pro"
          : state.data.dawType === "bitwig"
            ? "Bitwig Studio"
            : state.data.dawType === "studio-one"
              ? "Studio One"
              : state.data.dawType === "cubase"
                ? "Cubase"
                : state.data.dawType === "reason"
                  ? "Reason"
                  : state.data.dawType || "Project File";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📁</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create Project File</h1>
              <Badge variant="secondary">{dawLabel}</Badge>
              <SaveStatusIndicator className="ml-2" />
            </div>
            {visibleSteps.find((s) => s.id === currentStep) && (
              <p className="text-sm text-muted-foreground">
                {visibleSteps.find((s) => s.id === currentStep)?.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <StepProgress
        steps={visibleSteps}
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
                title: state.data.title,
                description: state.data.description,
                price: state.data.pricingModel === "paid" ? Number(state.data.price) : 0,
                imageUrl: state.data.thumbnail,
                productType: "project-files",
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
          currentIndex > 0 ? () => navigateToStep(visibleSteps[currentIndex - 1].id) : undefined
        }
        onNext={
          currentIndex < visibleSteps.length - 1
            ? () => navigateToStep(visibleSteps[currentIndex + 1].id)
            : undefined
        }
        onSaveDraft={handleSaveDraft}
        onPublish={
          (currentStep === "pricing" && state.data.pricingModel === "paid") ||
          (currentStep === "followGate" && state.data.pricingModel === "free_with_gate")
            ? handlePublishProject
            : undefined
        }
        canProceed={
          state.stepCompletion[currentStep as keyof typeof state.stepCompletion] ||
          currentStep === "files"
        }
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Project File"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

function LayoutContent({ children }: ProjectFileCreateLayoutProps) {
  const { saveProject } = useProjectFileCreation();

  return (
    <AutoSaveProvider onSave={saveProject} debounceMs={1500}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function ProjectFileCreateLayout({ children }: ProjectFileCreateLayoutProps) {
  return (
    <ProjectFileCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </ProjectFileCreationProvider>
  );
}
