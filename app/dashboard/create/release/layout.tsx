"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ReleaseCreationProvider, useReleaseCreation } from "./context";
import { Disc3, Link2, Bell, Mail } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { ProductLimitGate } from "@/app/dashboard/create/shared/ProductLimitGate";
import { Badge } from "@/components/ui/badge";
import { useStoresByUser } from "@/lib/convex-typed-hooks";

export const dynamic = "force-dynamic";

interface ReleaseCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Release Details",
    icon: Disc3,
    description: "Title, release date & cover art",
    color: "from-purple-500 to-pink-500",
    estimatedTime: "3-5 min",
  },
  {
    id: "platforms",
    label: "Streaming Platforms",
    icon: Link2,
    description: "Spotify, Apple Music & more",
    color: "from-green-500 to-emerald-500",
    estimatedTime: "2-3 min",
  },
  {
    id: "presave",
    label: "Pre-Save Campaign",
    icon: Bell,
    description: "Capture fans before release",
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "2-3 min",
  },
  {
    id: "drip",
    label: "Email Sequence",
    icon: Mail,
    description: "Automated drip campaign",
    color: "from-orange-500 to-red-500",
    estimatedTime: "3-5 min",
  },
];

function LayoutContentInner({ children }: ReleaseCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  const { state, canPublish, publishRelease, saveRelease } = useReleaseCreation();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  const stores = useStoresByUser(user?.id);
  const store = stores?.[0];

  const navigateToStep = (step: string) => {
    router.push(
      `/dashboard/create/release?step=${step}${state.releaseId ? `&releaseId=${state.releaseId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await saveRelease();
  };

  const handlePublishRelease = async () => {
    const result = await publishRelease();
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

  // Format release date for preview
  const releaseDate = state.data.releaseDate
    ? new Date(state.data.releaseDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBD";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {state.data.releaseType === "album" ? "💿" : state.data.releaseType === "ep" ? "📀" : "🎵"}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Create Release
              </h1>
              <Badge variant="secondary">Music Marketing</Badge>
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
                title: state.data.title || "Your Release",
                description: state.data.description || `${state.data.releaseType?.toUpperCase() || "SINGLE"} - Releases ${releaseDate}`,
                price: 0,
                imageUrl: state.data.coverArtUrl || state.data.thumbnail,
                productType: "release",
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
        onPublish={currentStep === "drip" ? handlePublishRelease : undefined}
        canProceed={
          state.stepCompletion[currentStep as keyof typeof state.stepCompletion] ||
          currentStep === "drip"
        }
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Launch Pre-Save Campaign"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

function LayoutContent({ children }: ReleaseCreateLayoutProps) {
  const { saveRelease } = useReleaseCreation();

  return (
    <AutoSaveProvider onSave={saveRelease} debounceMs={1500} enabled={false}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function ReleaseCreateLayout({ children }: ReleaseCreateLayoutProps) {
  return (
    <ProductLimitGate featureType="products">
      <ReleaseCreationProvider>
        <LayoutContent>{children}</LayoutContent>
      </ReleaseCreationProvider>
    </ProductLimitGate>
  );
}
