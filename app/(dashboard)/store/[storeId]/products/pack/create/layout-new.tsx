"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PackCreationProvider, usePackCreation } from "./context";
import { useValidStoreId } from "@/hooks/useStoreId";
import { Package, DollarSign, Lock, Upload } from "lucide-react";

// Import new shared components
import { CreationLayout } from "@/app/dashboard/create/shared/CreationLayout";
import { CreationHeader } from "@/app/dashboard/create/shared/CreationHeader";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";

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
  const storeId = useValidStoreId();
  const currentStep = searchParams.get("step") || "basics";
  
  const { state, canPublish, createPack, savePack } = usePackCreation();

  const navigateToStep = (step: string) => {
    router.push(`/store/${storeId}/products/pack/create?step=${step}${state.packId ? `&packId=${state.packId}` : ''}`);
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
    <CreationLayout
      header={
        <CreationHeader
          title={`Create ${packTypeLabel.charAt(0).toUpperCase() + packTypeLabel.slice(1)}`}
          description={visibleSteps.find(s => s.id === currentStep)?.description}
          icon={state.data.packType === 'sample-pack' ? '🎵' : state.data.packType === 'preset-pack' ? '🎛️' : '🎹'}
          badge="Music Production"
          backHref="/dashboard?mode=create"
        />
      }
      progress={
        <StepProgress
          steps={visibleSteps}
          currentStepId={currentStep}
          completedSteps={completedStepIds}
          onStepClick={navigateToStep}
          variant="full"
        />
      }
      content={children}
      actions={
        <ActionBar
          onBack={currentIndex > 0 ? () => navigateToStep(visibleSteps[currentIndex - 1].id) : undefined}
          onNext={currentIndex < visibleSteps.length - 1 ? () => navigateToStep(visibleSteps[currentIndex + 1].id) : undefined}
          onSaveDraft={handleSaveDraft}
          onPublish={currentStep === 'files' || (currentStep === 'followGate' && state.data.pricingModel === 'free_with_gate') ? handlePublishPack : undefined}
          canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion]}
          canPublish={canPublish()}
          isSaving={state.isSaving}
          variant="sticky"
          showProgress={true}
          progress={progressPercentage}
        />
      }
      variant="full-width"
    />
  );
}

export default function PackCreateLayout({ children }: PackCreateLayoutProps) {
  return (
    <PackCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </PackCreationProvider>
  );
}


