"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { PDFCreationProvider, usePDFCreation } from "./context";
import { FileText, DollarSign, Lock, Upload } from "lucide-react";
import { StepProgress, Step } from "@/app/dashboard/create/shared/StepProgress";
import { ActionBar } from "@/app/dashboard/create/shared/ActionBar";
import { StorefrontPreview } from "@/app/dashboard/create/shared/StorefrontPreview";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PDFCreateLayoutProps {
  children: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "basics",
    label: "PDF Basics",
    icon: FileText,
    description: "Title, description & pdf type",
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "2-3 min",
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: DollarSign,
    description: "Set your price or make it free",
    color: "from-purple-500 to-pink-500",
    estimatedTime: "1-2 min",
  },
  {
    id: "followGate",
    label: "Download Gate",
    icon: Lock,
    description: "Require follows (if free)",
    color: "from-emerald-500 to-teal-500",
    conditional: true, // Only show for free pdfs
    estimatedTime: "2-3 min",
  },
  {
    id: "files",
    label: "Files",
    icon: Upload,
    description: "Upload your pdf files",
    color: "from-orange-500 to-red-500",
    estimatedTime: "5-10 min",
  },
];

function LayoutContent({ children }: PDFCreateLayoutProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = searchParams.get("step") || "basics";

  // @ts-ignore - Type instantiation depth issue
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");
  const store = stores?.[0];

  const { state, canPublish, createPDF, savePDF } = usePDFCreation();

  const navigateToStep = (step: string) => {
    const pdfType = searchParams.get("type") || state.data.pdfType || "sample-pdf";
    router.push(
      `/dashboard/create/pdf?type=${pdfType}&step=${step}${state.pdfId ? `&pdfId=${state.pdfId}` : ""}`
    );
  };

  const handleSaveDraft = async () => {
    await savePDF();
  };

  const handlePublishPDF = async () => {
    const result = await createPDF();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    } else {
      console.error("Publish failed:", result.error);
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

  // Get pdf type for display
  const pdfTypeLabel = state.data.pdfType?.replace("-", " ") || "PDF";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {state.data.pdfType === "cheat-sheet"
              ? "📋"
              : state.data.pdfType === "guide"
                ? "📖"
                : "📄"}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Create {pdfTypeLabel.charAt(0).toUpperCase() + pdfTypeLabel.slice(1)}
              </h1>
              <Badge variant="secondary">Music Production</Badge>
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
                productType: "pdf",
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
          (currentStep === "followGate" && state.data.pricingModel === "free_with_gate") ||
          currentStep === "files"
            ? handlePublishPDF
            : undefined
        }
        canProceed={
          state.stepCompletion[currentStep as keyof typeof state.stepCompletion] ||
          currentStep === "files"
        }
        canPublish={canPublish()}
        isSaving={state.isSaving}
        nextLabel={
          currentStep === "pricing" && state.data.pricingModel === "paid"
            ? "Continue to Files"
            : "Continue"
        }
        publishLabel="Publish PDF"
        variant="compact"
        showProgress={true}
        progress={progressPercentage}
      />
    </div>
  );
}

export default function PDFCreateLayout({ children }: PDFCreateLayoutProps) {
  return (
    <PDFCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </PDFCreationProvider>
  );
}
