"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhonePreview } from "@/app/(dashboard)/store/components/PhonePreview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, CreditCard, Settings, Save, ArrowRight, Smartphone } from "lucide-react";
import Link from "next/link";
import { CourseCreationProvider, useCourseCreation } from "./context";
import { useState } from "react";

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
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  const { state, canPublish, createCourse, saveCourse } = useCourseCreation();

  // Get store data
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  const navigateToStep = (step: string) => {
    router.push(`/store/${storeId}/course/create?step=${step}`);
  };

  const handleSaveDraft = async () => {
    await saveCourse();
  };

  const handleCreateCourse = async () => {
    const result = await createCourse();
    if (result.success) {
      router.push(`/store/${storeId}/products`);
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
            <div className="hidden lg:block w-[356px] h-[678px] bg-gray-200 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24">
        <div className="lg:flex lg:gap-8 xl:gap-20">
          <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Navigation Tabs */}
            <div className="mb-6 sm:mb-8">
              <Tabs value={currentStep} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto gap-2 sm:gap-0">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isComplete = state.stepCompletion[step.id as keyof typeof state.stepCompletion];
                    
                    return (
                      <TabsTrigger
                        key={step.id}
                        value={step.id}
                        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors relative min-h-[44px] ${
                          isActive
                            ? "bg-white border border-[#6356FF] text-[#6356FF] font-bold data-[state=active]:bg-white data-[state=active]:text-[#6356FF]"
                            : isComplete
                            ? "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                            : "text-[#4B4E68] hover:text-[#6356FF] data-[state=active]:bg-transparent"
                        }`}
                        asChild={!isActive}
                      >
                        {isActive ? (
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                            <span className="text-center leading-tight">{step.label}</span>
                          </div>
                        ) : (
                          <button onClick={() => navigateToStep(step.id)} className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                            <span className="text-center leading-tight">{step.label}</span>
                            {isComplete && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </button>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>

            {/* Form Content */}
            <div className="w-full max-w-[640px]">
              {children}
            </div>

            {/* Action Bar */}
            <div className="w-full max-w-[640px] relative">
              <span className="hidden sm:block absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
                Improve this page
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 sm:justify-end">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={state.isSaving}
                  className="flex items-center justify-center gap-2 h-12 sm:h-10 rounded-lg px-4 order-2 sm:order-1"
                >
                  <Save size={16} />
                  {state.isSaving ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  onClick={handleCreateCourse}
                  disabled={!canPublish()}
                  className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-12 sm:h-10 rounded-lg px-8 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  <ArrowRight size={16} />
                  {canPublish() ? "Create Course" : "Complete Steps"}
                </Button>
              </div>
            </div>
          </div>

          {/* Phone Preview - Hidden on mobile, sticky on desktop */}
          <div className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
            <PhonePreview 
              user={user}
              store={store || undefined}
              mode="store"
            />
          </div>
        </div>

        {/* Mobile Preview FAB */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="rounded-full w-14 h-14 shadow-lg bg-[#6356FF] hover:bg-[#5248E6] text-white"
              >
                <Smartphone className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-semibold text-center">Store Preview</h3>
                <div className="w-full flex justify-center">
                  <PhonePreview 
                    user={user}
                    store={store || undefined}
                    mode="store"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
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