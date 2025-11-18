"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CoachingCreationProvider, useCoachingCreation } from "./context";
import { Headphones, DollarSign, Calendar, Users, MessageCircle } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

interface CoachingCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  { 
    id: "basics", 
    label: "Session Details", 
    icon: Headphones,
    description: "Session type, duration & description",
    estimatedTime: "3-4 min"
  },
  { 
    id: "pricing", 
    label: "Pricing", 
    icon: DollarSign,
    description: "Free or paid sessions",
    estimatedTime: "1 min"
  },
  { 
    id: "followGate", 
    label: "Download Gate", 
    icon: Users,
    description: "Require follows (if free)",
    conditional: true,
    estimatedTime: "2-3 min"
  },
  { 
    id: "discord", 
    label: "Discord Setup", 
    icon: MessageCircle,
    description: "Auto-create private channels",
    estimatedTime: "2-3 min"
  },
  { 
    id: "availability", 
    label: "Availability", 
    icon: Calendar,
    description: "Set your schedule & timezone",
    estimatedTime: "5-7 min"
  },
];

function LayoutContent({ children }: CoachingCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";
  
  const { state, canPublish, createCoaching, saveCoaching } = useCoachingCreation();

  const navigateToStep = (step: string) => {
    router.push(`/dashboard/create/coaching?step=${step}${state.coachingId ? `&coachingId=${state.coachingId}` : ''}`);
  };

  const handleSaveDraft = async () => {
    await saveCoaching();
  };

  const handlePublish = async () => {
    const result = await createCoaching();
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

  const sessionTypeLabel = state.data.sessionType === 'production-coaching' ? 'Production Coaching' :
                          state.data.sessionType === 'mixing-service' ? 'Mixing Service' :
                          state.data.sessionType === 'mastering-service' ? 'Mastering Service' :
                          state.data.sessionType === 'feedback-session' ? 'Feedback Session' :
                          'Coaching Session';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎧</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create Coaching Session</h1>
              <Badge variant="secondary">{sessionTypeLabel}</Badge>
            </div>
            {steps.find(s => s.id === currentStep) && (
              <p className="text-sm text-muted-foreground">
                {steps.find(s => s.id === currentStep)?.description}
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
        onPublish={currentStep === 'availability' ? handlePublish : undefined}
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion] || currentStep === 'availability'}
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Coaching Session"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

export default function CoachingCreateLayout({ children }: CoachingCreateLayoutProps) {
  return (
    <CoachingCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </CoachingCreationProvider>
  );
}

