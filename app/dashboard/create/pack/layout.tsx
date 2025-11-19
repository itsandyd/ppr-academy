"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PackCreationProvider, usePackCreation } from "./context";
import { Package, DollarSign, Lock, Upload } from "lucide-react";

// Import new shared components
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

interface PackCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  { 
    id: "basics", 
    label: "Pack Basics", 
    icon: Package,
    description: "Title, description & pack type",
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "2-3 min"
  },
  { 
    id: "pricing", 
    label: "Pricing", 
    icon: DollarSign,
    description: "Set your price or make it free",
    color: "from-purple-500 to-pink-500",
    estimatedTime: "1-2 min"
  },
  { 
    id: "followGate", 
    label: "Download Gate", 
    icon: Lock,
    description: "Require follows (if free)",
    color: "from-emerald-500 to-teal-500",
    conditional: true, // Only show for free packs
    estimatedTime: "2-3 min"
  },
  { 
    id: "files", 
    label: "Files", 
    icon: Upload,
    description: "Upload your pack files",
    color: "from-orange-500 to-red-500",
    estimatedTime: "5-10 min"
  },
];

function LayoutContent({ children }: PackCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";
  
  const { state, canPublish, createPack, savePack } = usePackCreation();

  const navigateToStep = (step: string) => {
    const packType = searchParams.get("type") || state.data.packType || "sample-pack";
    router.push(`/dashboard/create/pack?type=${packType}&step=${step}${state.packId ? `&packId=${state.packId}` : ''}`);
  };

  const handleSaveDraft = async () => {
    await savePack();
  };

  const handlePublishPack = async () => {
    const result = await createPack();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Filter steps based on pricing model
  const visibleSteps = steps.filter(step => 
    !step.conditional || (step.id === "followGate" && state.data.pricingModel === "free_with_gate")
  );

  const completedStepIds = Object.entries(state.stepCompletion)
    .filter(([_, completed]) => completed)
    .map(([stepId, _]) => stepId);

  const currentIndex = visibleSteps.findIndex(s => s.id === currentStep);
  const progressPercentage = ((currentIndex + 1) / visibleSteps.length) * 100;

  // Get pack type for display
  const packTypeLabel = state.data.packType?.replace("-", " ") || "Pack";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {state.data.packType === 'sample-pack' ? '🎵' : state.data.packType === 'preset-pack' ? '🎛️' : '🎹'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Create {packTypeLabel.charAt(0).toUpperCase() + packTypeLabel.slice(1)}
              </h1>
              <Badge variant="secondary">Music Production</Badge>
            </div>
            {visibleSteps.find(s => s.id === currentStep) && (
              <p className="text-sm text-muted-foreground">
                {visibleSteps.find(s => s.id === currentStep)?.description}
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

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Actions */}
        <ActionBar
          onBack={currentIndex > 0 ? () => navigateToStep(visibleSteps[currentIndex - 1].id) : undefined}
          onNext={currentIndex < visibleSteps.length - 1 ? () => navigateToStep(visibleSteps[currentIndex + 1].id) : undefined}
          onSaveDraft={handleSaveDraft}
        onPublish={currentStep === 'files' ? handlePublishPack : undefined}
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion] || currentStep === 'files'}
          canPublish={canPublish()}
          isSaving={state.isSaving}
        nextLabel={currentStep === 'pricing' && state.data.pricingModel === 'paid' ? 'Continue to Files' : 'Continue'}
        publishLabel="Publish Pack"
        variant="compact"
          showProgress={true}
          progress={progressPercentage}
        />
    </div>
  );
}

export default function PackCreateLayout({ children }: PackCreateLayoutProps) {
  return (
    <PackCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </PackCreationProvider>
  );
}

