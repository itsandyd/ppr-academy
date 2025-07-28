"use client";

import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import CreateCourseForm from "@/components/create-course-form";
import { useCourseCreation } from "../context";

export function CourseContentForm() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const { state, saveCourse } = useCourseCreation();

  const handleBack = () => {
    router.push(`/store/${storeId}/course/create?step=checkout`);
  };

  const handleNext = () => {
    router.push(`/store/${storeId}/course/create?step=options`);
  };

  return (
    <div className="space-y-8">
      {/* Course Builder */}
      <CreateCourseForm />

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={handleBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Checkout
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={saveCourse}
            disabled={state.isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {state.isSaving ? "Saving..." : "Save Course"}
          </Button>
          
          <Button onClick={handleNext} className="gap-2">
            Continue to Options
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 