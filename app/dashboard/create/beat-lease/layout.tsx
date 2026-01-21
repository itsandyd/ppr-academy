"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { BeatLeaseCreationProvider, useBeatLeaseCreation } from "./context";
import { Music, BarChart3, Upload, DollarSign } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface BeatLeaseCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Beat Info",
    icon: Music,
    description: "Title, description & genre",
    estimatedTime: "2-3 min",
  },
  {
    id: "metadata",
    label: "Beat Details",
    icon: BarChart3,
    description: "BPM, key, mood & instruments",
    estimatedTime: "2 min",
  },
  {
    id: "files",
    label: "Audio Files",
    icon: Upload,
    description: "Upload MP3, WAV, stems & trackouts",
    estimatedTime: "5-10 min",
  },
  {
    id: "licensing",
    label: "Lease Options",
    icon: DollarSign,
    description: "Set pricing for different license types",
    estimatedTime: "3-5 min",
  },
];

function LayoutContentInner({ children }: BeatLeaseCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  const { state, canPublish, createBeat, saveBeat } = useBeatLeaseCreation();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  // @ts-ignore - Type instantiation depth issue
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const store = stores?.[0];

  const navigateToStep = (step: string) => {
    router.push(
      `/dashboard/create/beat-lease?step=${step}${state.beatId ? `&beatId=${state.beatId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await saveBeat();
  };

  const handlePublish = async () => {
    const result = await createBeat();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse">
          <div className="mb-8 h-8 w-1/4 rounded bg-muted"></div>
          <div className="h-96 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  const completedStepIds = Object.entries(state.stepCompletion)
    .filter(([_, completed]) => completed)
    .map(([stepId, _]) => stepId);

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  const genreLabel = state.data.metadata?.genre || "Beat";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎹</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create Beat Lease</h1>
              <Badge variant="secondary">
                {genreLabel.charAt(0).toUpperCase() + genreLabel.slice(1)}
              </Badge>
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
                title: state.data.title,
                description: state.data.description,
                price: state.data.leaseOptions?.find((l) => l.enabled)?.price,
                imageUrl: state.data.thumbnail,
                productType: "beat-lease",
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
        onBack={currentIndex > 0 ? () => navigateToStep(steps[currentIndex - 1].id) : undefined}
        onNext={
          currentIndex < steps.length - 1
            ? () => navigateToStep(steps[currentIndex + 1].id)
            : undefined
        }
        onSaveDraft={handleSaveDraft}
        onPublish={currentStep === "licensing" ? handlePublish : undefined}
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion]}
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Beat Lease"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

function LayoutContent({ children }: BeatLeaseCreateLayoutProps) {
  const { saveBeat } = useBeatLeaseCreation();

  return (
    <AutoSaveProvider onSave={saveBeat} debounceMs={1500}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function BeatLeaseCreateLayout({ children }: BeatLeaseCreateLayoutProps) {
  return (
    <BeatLeaseCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </BeatLeaseCreationProvider>
  );
}
