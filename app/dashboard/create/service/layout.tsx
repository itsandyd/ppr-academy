"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { ServiceCreationProvider, useServiceCreation } from "./context";
import { Settings, DollarSign, FileCheck, Send } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { Badge } from "@/components/ui/badge";
import { SERVICE_TYPES } from "./types";

export const dynamic = "force-dynamic";

interface ServiceCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "Service Details",
    icon: Settings,
    description: "Name, description & what's included",
    estimatedTime: "3-4 min",
  },
  {
    id: "pricing",
    label: "Pricing Tiers",
    icon: DollarSign,
    description: "Set prices based on complexity",
    estimatedTime: "2-3 min",
  },
  {
    id: "requirements",
    label: "File Requirements",
    icon: FileCheck,
    description: "What clients need to provide",
    estimatedTime: "2 min",
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Send,
    description: "Turnaround time & formats",
    estimatedTime: "2 min",
  },
];

function LayoutContent({ children }: ServiceCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";
  const serviceType = searchParams.get("type") || "mixing";

  const { state, canPublish, publishService, saveService } = useServiceCreation();

  // @ts-ignore - Type instantiation depth issue
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const store = stores?.[0];

  const navigateToStep = (step: string) => {
    const params = new URLSearchParams();
    params.set("step", step);
    params.set("type", serviceType);
    if (state.serviceId) params.set("serviceId", state.serviceId);
    router.push(`/dashboard/create/service?${params.toString()}`);
  };

  const handleSaveDraft = async () => {
    await saveService();
  };

  const handlePublish = async () => {
    const result = await publishService();
    if (result.success) {
      router.push("/dashboard?mode=create");
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
    .filter(([, completed]) => completed)
    .map(([stepId]) => stepId);

  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  const serviceInfo = SERVICE_TYPES.find((s) => s.id === serviceType);
  const serviceLabel = serviceInfo?.label || "Service";
  const serviceIcon = serviceInfo?.icon || "🎚️";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{serviceIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Create {serviceLabel} Service</h1>
              <Badge variant="secondary">{serviceLabel}</Badge>
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
                price: state.data.pricingTiers?.[0]?.price,
                productType: "service",
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
        onPublish={currentStep === "delivery" ? handlePublish : undefined}
        canProceed={state.stepCompletion[currentStep as keyof typeof state.stepCompletion] || false}
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel="Continue"
        publishLabel="Publish Service"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

export default function ServiceCreateLayout({ children }: ServiceCreateLayoutProps) {
  return (
    <ServiceCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </ServiceCreationProvider>
  );
}
