"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhonePreview } from "@/app/(dashboard)/store/components/PhonePreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, CreditCard, Image, Settings, Check, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { CourseCreationProvider, useCourseCreation } from "./context";

// Prevent static generation for this layout
export const dynamic = 'force-dynamic';

interface CourseCreateLayoutProps {
  children: React.ReactNode;
}

const steps = [
  { id: "course", label: "Course Creation", icon: BookOpen },
  { id: "checkout", label: "Checkout Page", icon: CreditCard },
  { id: "options", label: "Options", icon: Settings },
];

function LayoutContent({ children }: CourseCreateLayoutProps) {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = params.storeId as string;
  const currentStep = searchParams.get("step") || "course";
  
  const { state, canPublish, createCourse, saveCourse, togglePublished } = useCourseCreation();

  // Get store data
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  const navigateToStep = (step: string) => {
    router.push(`/store/${storeId}/course/create?step=${step}`);
  };

  const handleCreateCourse = async () => {
    const result = await createCourse();
    if (result.success) {
      router.push(`/store/${storeId}/products`);
    }
  };

  const getStepStatus = (stepId: string) => {
    if (state.stepCompletion[stepId as keyof typeof state.stepCompletion]) {
      return "complete";
    }
    return currentStep === stepId ? "current" : "pending";
  };

  const getStepIcon = (stepId: string, Icon: any) => {
    const status = getStepStatus(stepId);
    if (status === "complete") {
      return <Check className="w-4 h-4" />;
    }
    if (status === "current") {
      return <Clock className="w-4 h-4" />;
    }
    return <Icon className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="h-12 bg-muted rounded mb-8"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/store/${storeId}/products`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Button>
          </Link>
        </div>
        
        <div className="border-b border-border pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create New Course
              </h1>
              <p className="text-muted-foreground">
                Build an engaging online course with modules, lessons, and interactive content
              </p>
            </div>
            
            {/* Draft Status & Actions */}
            <div className="flex items-center gap-4">
              {state.lastSaved && (
                <div className="text-sm text-muted-foreground">
                  Last saved: {state.lastSaved.toLocaleTimeString()}
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={saveCourse}
                disabled={state.isSaving}
                className="gap-2"
              >
                {state.isSaving ? "Saving..." : "Save Course"}
              </Button>
              
              <Button 
                onClick={handleCreateCourse}
                disabled={!canPublish()}
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {canPublish() ? "Create Course" : "Complete All Steps"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Course Creation Progress</h3>
            <div className="text-sm text-muted-foreground">
              {Object.values(state.stepCompletion).filter(Boolean).length} of {steps.length} steps complete
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    status === "complete" 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : status === "current"
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {getStepIcon(step.id, Icon)}
                  <div>
                    <div className="font-medium text-sm">{step.label}</div>
                    <div className="text-xs opacity-75">
                      {status === "complete" ? "Complete" : status === "current" ? "In Progress" : "Pending"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {!canPublish() && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Complete all steps to publish your course</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const status = getStepStatus(step.id);
              
              return (
                <button
                  key={step.id}
                  onClick={() => navigateToStep(step.id)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors relative ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {getStepIcon(step.id, Icon)}
                  {step.label}
                  {status === "complete" && (
                    <Badge variant="default" className="ml-2 h-2 w-2 p-0 bg-green-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="lg:flex lg:gap-20">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {children}
        </div>

        {/* Phone Preview - Show for relevant steps */}
        {(currentStep === "course" || currentStep === "checkout") && (
          <div className="sticky top-32 hidden lg:block">
            <PhonePreview 
              user={user}
              store={store || undefined}
              mode="store"
            />
          </div>
        )}
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