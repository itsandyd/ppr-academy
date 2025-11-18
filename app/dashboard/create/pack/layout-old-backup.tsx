"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Package, DollarSign, Lock, Upload, Save, Sparkles, CheckCircle, Clock } from "lucide-react";
import { PackCreationProvider, usePackCreation } from "./context";
import { useState } from "react";
import { motion } from "framer-motion";
import { useValidStoreId } from "@/hooks/useStoreId";

export const dynamic = 'force-dynamic';

interface PackCreateLayoutProps {
  children: React.ReactNode;
}

const steps = [
  { 
    id: "basics", 
    label: "Pack Basics", 
    icon: Package,
    description: "Title, description & pack type",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "pricing", 
    label: "Pricing", 
    icon: DollarSign,
    description: "Set your price or make it free",
    color: "from-purple-500 to-pink-500"
  },
  { 
    id: "followGate", 
    label: "Download Gate", 
    icon: Lock,
    description: "Require follows (if free)",
    color: "from-emerald-500 to-teal-500",
    conditional: true // Only show for free packs
  },
  { 
    id: "files", 
    label: "Files", 
    icon: Upload,
    description: "Upload your pack files",
    color: "from-orange-500 to-red-500"
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
    router.push(`/store/${storeId}/pack/create?step=${step}${state.packId ? `&packId=${state.packId}` : ''}`);
  };

  const handleSaveDraft = async () => {
    await savePack();
  };

  const handlePublishPack = async () => {
    const result = await createPack();
    if (result.success) {
      router.push(`/store/${storeId}/products`);
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

  const completedSteps = Object.values(state.stepCompletion).filter(Boolean).length;
  const progressPercentage = (completedSteps / visibleSteps.length) * 100;

  return (
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Pack Creation</h1>
                <p className="text-xs text-muted-foreground">
                  {state.data.packType?.replace("-", " ") || "New Pack"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Auto-saving</span>
              </div>
              <Progress value={progressPercentage} className="w-24 h-2" />
              <span className="text-sm font-medium text-foreground">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center bg-card rounded-full p-2 shadow-lg border border-border">
              {visibleSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isComplete = state.stepCompletion[step.id as keyof typeof state.stepCompletion];
                const isPrevious = visibleSteps.findIndex(s => s.id === currentStep) > index;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateToStep(step.id)}
                      className={`relative p-3 rounded-full transition-all duration-300 ${
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : isComplete || isPrevious
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {isComplete && !isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </motion.button>
                    {index < visibleSteps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isPrevious || isComplete ? "bg-green-300 dark:bg-green-700" : "bg-border"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Step Info */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-sm border border-border mb-4">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${visibleSteps.find(s => s.id === currentStep)?.color} text-white`}>
                {React.createElement(visibleSteps.find(s => s.id === currentStep)?.icon || Package, { className: "w-4 h-4" })}
              </div>
              <span className="font-semibold text-foreground">
                {visibleSteps.find(s => s.id === currentStep)?.label}
              </span>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              {visibleSteps.find(s => s.id === currentStep)?.description}
            </p>
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="mb-8"
        >
          <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
            <div className="p-8 lg:p-12">
              {children}
            </div>
          </div>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-lg border border-border/50 p-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {state.lastSaved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Saved {state.lastSaved.toLocaleTimeString()}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Progress:</span>
                <div className="flex gap-1">
                  {visibleSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index < completedSteps ? "bg-green-500" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={state.isSaving}
                className="h-12 px-6 rounded-xl hover:shadow-md transition-all"
              >
                <Save className="w-4 h-4 mr-2" />
                {state.isSaving ? "Saving..." : "Save Draft"}
              </Button>
              
              <Button
                onClick={handlePublishPack}
                disabled={!canPublish()}
                className={`h-12 px-8 rounded-xl font-semibold transition-all ${
                  canPublish()
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {canPublish() ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Publish Pack
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Complete Steps
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
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

