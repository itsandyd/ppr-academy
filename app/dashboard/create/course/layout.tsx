"use client";

import React from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhonePreview } from "@/app/(dashboard)/store/components/PhonePreview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CreditCard, Settings, Save, ArrowRight, Smartphone, CheckCircle, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { CourseCreationProvider, useCourseCreation } from "./context";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { UpgradeBanner } from "@/components/creator/upgrade-prompt";
import { Id } from "@/convex/_generated/dataModel";

// Prevent static generation for this layout
export const dynamic = 'force-dynamic';

interface CourseCreateLayoutProps {
  children: React.ReactNode;
}

const steps = [
  { 
    id: "course", 
    label: "Course Creation", 
    icon: BookOpen,
    description: "Basic course info & content structure",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "checkout", 
    label: "Checkout Page", 
    icon: CreditCard,
    description: "Pricing & payment settings",
    color: "from-emerald-500 to-teal-500"
  },
  { 
    id: "options", 
    label: "Options", 
    icon: Settings,
    description: "Advanced course settings",
    color: "from-purple-500 to-pink-500"
  },
];

function LayoutContent({ children }: CourseCreateLayoutProps) {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawStoreId = params.storeId as string;
  const currentStep = searchParams.get("step") || "course";
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  const { state, canPublish, createCourse, saveCourse } = useCourseCreation();

  // Get user's stores to handle invalid storeId case
  const userStores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  
  // Detect if rawStoreId is actually a user ID and get the correct store ID
  const isUserIdInsteadOfStoreId = rawStoreId && rawStoreId.startsWith('ks7');
  const correctStoreId = isUserIdInsteadOfStoreId ? userStores?.[0]?._id : rawStoreId;
  
  // Redirect to correct URL if we detected a user ID in the URL
  React.useEffect(() => {
    if (isUserIdInsteadOfStoreId && correctStoreId && correctStoreId !== rawStoreId) {
      const currentSearch = searchParams.toString();
      const newUrl = `/store/${correctStoreId}/course/create${currentSearch ? `?${currentSearch}` : ''}`;
      console.log('🔄 Redirecting from invalid store ID to correct one:', { rawStoreId, correctStoreId, newUrl });
      router.replace(newUrl);
      return;
    }
  }, [isUserIdInsteadOfStoreId, correctStoreId, rawStoreId, router, searchParams]);
  
  // Use the correct store ID for queries
  const storeId = correctStoreId;

  // Get store data (skip if we're about to redirect)
  const store = useQuery(
    api.stores.getStoreById,
    storeId && !isUserIdInsteadOfStoreId ? { storeId: storeId as any } : "skip"
  );

  // Check feature access for courses (skip for now to avoid loading issues)
  const hasAccess = true; // TODO: Re-enable feature access check
  const isCheckingAccess = false;
  const showUpgradePrompt = false;
  const UpgradePromptComponent = null;

  const navigateToStep = (step: string) => {
    router.push(`/dashboard/create/course?step=${step}`);
  };

  const handleSaveDraft = async () => {
    await saveCourse();
  };

  const handleCreateCourse = async () => {
    const result = await createCourse();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24">
          <div className="lg:flex lg:gap-8 xl:gap-20">
            <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-muted rounded w-1/3 sm:w-1/4 mb-6 sm:mb-8"></div>
                <div className="h-64 sm:h-96 bg-muted rounded"></div>
              </div>
            </div>
            <div className="hidden lg:block w-[356px] h-[678px] bg-muted rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24">
          <div className="lg:flex lg:gap-8 xl:gap-20">
            <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-muted rounded w-1/3 sm:w-1/4 mb-6 sm:mb-8"></div>
                <div className="h-64 sm:h-96 bg-muted rounded"></div>
              </div>
            </div>
            <div className="hidden lg:block w-[356px] h-[678px] bg-muted rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade banner if no access to courses (only after loading is complete)
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <UpgradeBanner 
            feature="courses"
            requiredPlan="creator"
            storeId={storeId}
          />
        </div>
        <UpgradePromptComponent />
      </div>
    );
  }

  // Calculate overall progress
  const completedSteps = Object.values(state.stepCompletion).filter(Boolean).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Course Creation</h1>
                <p className="text-xs text-muted-foreground">Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2">
            {/* Step Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center bg-card rounded-full p-2 shadow-lg border border-border">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isComplete = state.stepCompletion[step.id as keyof typeof state.stepCompletion];
                    const isPrevious = steps.findIndex(s => s.id === currentStep) > index;
                    
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
                        {index < steps.length - 1 && (
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
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${steps.find(s => s.id === currentStep)?.color} text-white`}>
                    {React.createElement(steps.find(s => s.id === currentStep)?.icon || BookOpen, { className: "w-4 h-4" })}
                  </div>
                  <span className="font-semibold text-foreground">
                    {steps.find(s => s.id === currentStep)?.label}
                  </span>
                </div>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {steps.find(s => s.id === currentStep)?.description}
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
                      {steps.map((_, index) => (
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
                    onClick={handleCreateCourse}
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
                        Create Course
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

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Preview Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl shadow-lg border border-border/50 p-3"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Live Preview</h3>
                </div>
                <div className="hidden lg:block flex justify-center -mx-1">
                  <PhonePreview 
                    user={user}
                    store={store || undefined}
                    mode="course"
                    coursePreview={{
                      title: state.data.title,
                      description: state.data.description,
                      category: state.data.category,
                      skillLevel: state.data.skillLevel,
                      thumbnail: state.data.thumbnail,
                      price: state.data.price ? parseFloat(state.data.price) : undefined,
                      modules: state.data.modules?.length || 0
                    }}
                  />
                </div>
                <div className="lg:hidden">
                  <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Smartphone className="w-4 h-4 mr-2" />
                        View Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <div className="p-4">
                        <PhonePreview 
                          user={user}
                          store={store || undefined}
                          mode="course"
                          coursePreview={{
                            title: state.data.title,
                            description: state.data.description,
                            category: state.data.category,
                            skillLevel: state.data.skillLevel,
                            thumbnail: state.data.thumbnail,
                            price: state.data.price ? parseFloat(state.data.price) : undefined,
                            modules: state.data.modules?.length || 0
                          }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>

              {/* Progress Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
              >
                <h3 className="font-semibold text-foreground mb-4">Your Progress</h3>
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const isComplete = state.stepCompletion[step.id as keyof typeof state.stepCompletion];
                    const isActive = currentStep === step.id;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isComplete 
                            ? "bg-green-500 text-white" 
                            : isActive 
                            ? `bg-gradient-to-r ${step.color} text-white`
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isActive ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        {isComplete && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CourseCreateLayout({ children }: CourseCreateLayoutProps) {
  return (
    <CourseCreationProvider>
      <LayoutContent>{children}</LayoutContent>
    </CourseCreationProvider>
  );
} 