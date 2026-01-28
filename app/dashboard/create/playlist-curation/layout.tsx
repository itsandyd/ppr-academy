"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PlaylistCurationProvider, usePlaylistCuration } from "./context";
import { List, Settings, DollarSign, Share2 } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { ProductLimitGate } from "@/app/dashboard/create/shared/ProductLimitGate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface PlaylistCurationLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Playlist Details",
    icon: List,
    description: "Name, description & genres",
    estimatedTime: "2-3 min",
  },
  {
    id: "submissionSettings",
    label: "Submission Settings",
    icon: Settings,
    description: "Rules & guidelines for artists",
    estimatedTime: "2-3 min",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    description: "Free or paid submissions",
    estimatedTime: "1 min",
  },
];

function LayoutContentInner({ children }: PlaylistCurationLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  const { state, canPublish, publishPlaylist, savePlaylist } = usePlaylistCuration();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  const navigateToStep = (step: string) => {
    router.push(
      `/dashboard/create/playlist-curation?step=${step}${state.playlistId ? `&playlistId=${state.playlistId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await savePlaylist();
  };

  const handlePublish = async () => {
    const result = await publishPlaylist();
    if (result.success) {
      router.push(`/home/playlists`);
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">&#127926;</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create Playlist Curation</h1>
              {state.data.pricingModel === "paid" && (
                <Badge variant="secondary">Paid Submissions</Badge>
              )}
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
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Preview
                </h3>

                {/* Playlist Preview */}
                <div className="space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                    {state.data.coverUrl ? (
                      <img
                        src={state.data.coverUrl}
                        alt="Playlist cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <List className="h-16 w-16 text-purple-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold line-clamp-1">
                      {state.data.name || "Untitled Playlist"}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {state.data.description || "Add a description..."}
                    </p>
                  </div>

                  {state.data.genres && state.data.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {state.data.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {state.data.genres.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{state.data.genres.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submissions</span>
                      <span>
                        {state.data.acceptsSubmissions ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                            Open
                          </Badge>
                        ) : (
                          <Badge variant="outline">Closed</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee</span>
                      <span className="font-medium">
                        {state.data.pricingModel === "paid" && state.data.submissionFee
                          ? `$${state.data.submissionFee}`
                          : "Free"}
                      </span>
                    </div>
                    {state.data.submissionSLA && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Review Time</span>
                        <span>{state.data.submissionSLA} days</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
        onPublish={currentStep === "pricing" ? handlePublish : undefined}
        canProceed={
          state.stepCompletion[currentStep as keyof typeof state.stepCompletion] ||
          currentStep === "pricing"
        }
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Playlist"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

function LayoutContent({ children }: PlaylistCurationLayoutProps) {
  const { savePlaylist } = usePlaylistCuration();

  return (
    <AutoSaveProvider onSave={savePlaylist} debounceMs={1500} enabled={false}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function PlaylistCurationLayout({ children }: PlaylistCurationLayoutProps) {
  return (
    <ProductLimitGate featureType="products">
      <PlaylistCurationProvider>
        <LayoutContent>{children}</LayoutContent>
      </PlaylistCurationProvider>
    </ProductLimitGate>
  );
}
