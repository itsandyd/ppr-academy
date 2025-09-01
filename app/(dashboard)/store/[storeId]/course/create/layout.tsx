"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhonePreview } from "@/app/(dashboard)/store/components/PhonePreview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CreditCard, Settings, Save, ArrowRight } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 lg:flex lg:gap-20">
        <div className="flex-1 space-y-10">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
        <div className="w-[356px] h-[678px] bg-gray-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 lg:flex lg:gap-20">
      <div className="flex-1 space-y-10">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isComplete = state.stepCompletion[step.id as keyof typeof state.stepCompletion];
                
                return (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive
                        ? "bg-white border border-[#6356FF] text-[#6356FF] font-bold data-[state=active]:bg-white data-[state=active]:text-[#6356FF]"
                        : isComplete
                        ? "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                        : "text-[#4B4E68] hover:text-[#6356FF] data-[state=active]:bg-transparent"
                    }`}
                    asChild={!isActive}
                  >
                    {isActive ? (
                      <div>
                        <Icon className="w-[18px] h-[18px]" />
                        {step.label}
                      </div>
                    ) : (
                      <button onClick={() => navigateToStep(step.id)}>
                        <Icon className="w-[18px] h-[18px]" />
                        {step.label}
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
        <div className="max-w-[640px]">
          {children}
        </div>

        {/* Action Bar */}
        <div className="max-w-[640px] flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>
          <Button 
            variant="outline" 
            type="button"
            onClick={handleSaveDraft}
            disabled={state.isSaving}
            className="flex items-center gap-2 h-10 rounded-lg px-4"
          >
            <Save size={16} />
            {state.isSaving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            onClick={handleCreateCourse}
            disabled={!canPublish()}
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg px-8 flex items-center gap-2"
          >
            <ArrowRight size={16} />
            {canPublish() ? "Create Course" : "Complete Steps"}
          </Button>
        </div>
      </div>

      {/* Phone Preview */}
      <div className="sticky top-32">
        <PhonePreview 
          user={user}
          store={store || undefined}
          mode="store"
        />
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