"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { EffectChainCreationProvider, useEffectChainCreation } from "./context";
import { Package, DollarSign, Lock, Upload, Zap } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

interface ChainCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  { 
    id: "basics", 
    label: "Chain Basics", 
    icon: Zap,
    description: "DAW type, title & description",
    estimatedTime: "2-3 min"
  },
  { 
    id: "files", 
    label: "Files", 
    icon: Upload,
    description: "Upload your effect chain files",
    estimatedTime: "5-10 min"
  },
  { 
    id: "pricing", 
    label: "Pricing", 
    icon: DollarSign,
    description: "Set your price or make it free",
    estimatedTime: "1-2 min"
  },
  { 
    id: "followGate", 
    label: "Download Gate", 
    icon: Lock,
    description: "Require follows (if free)",
    conditional: true,
    estimatedTime: "2-3 min"
  },
];

function LayoutContent({ children }: ChainCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";
  
  const { state, canPublish, createChain, saveChain } = useEffectChainCreation();

  const navigateToStep = (step: string) => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/chain?daw=${dawType}&step=${step}${state.chainId ? `&chainId=${state.chainId}` : ''}`);
  };

  const handleSaveDraft = async () => {
    await saveChain();
  };

  const handlePublishChain = async () => {
    const result = await createChain();
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

  const dawLabel = state.data.dawType === 'ableton' ? 'Ableton Live' :
                   state.data.dawType === 'fl-studio' ? 'FL Studio' :
                   state.data.dawType === 'logic' ? 'Logic Pro' :
                   state.data.dawType === 'bitwig' ? 'Bitwig Studio' :
                   state.data.dawType || 'Effect Chain';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔊</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create Effect Chain</h1>
              <Badge variant="secondary">{dawLabel}</Badge>
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
        onPublish={
          (currentStep === 'pricing' && state.data.pricingModel === 'paid') ||
          (currentStep === 'followGate' && state.data.pricingModel === 'free_with_gate')
            ? handlePublishChain
            : undefined
        }
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion] || currentStep === 'files'}
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Effect Chain"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

export default function ChainCreateLayout({ children }: ChainCreateLayoutProps) {
  return (
    <EffectChainCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </EffectChainCreationProvider>
  );
}

