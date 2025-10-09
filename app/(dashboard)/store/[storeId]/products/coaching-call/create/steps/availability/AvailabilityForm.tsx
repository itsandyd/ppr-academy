"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Save, Send } from "lucide-react";
import Link from "next/link";
import { schema, AvailabilitySchema } from "./schema";
import { ConfigSection } from "./ConfigSection";
import { DaysGrid } from "./DaysGrid";
import { useCoachingPreview } from "../../CoachingPreviewContext";

interface FormSectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function FormSection({ index, title, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 rounded-full bg-[#D8DBF0] text-[#6B6E85] font-medium flex items-center justify-center text-sm">
          {index}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="ml-11">{children}</div>
    </div>
  );
}

export function AvailabilityForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { formData, updateFormData } = useCoachingPreview();

  const form = useForm<AvailabilitySchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      template: 'Default', 
      duration: 30, 
      timezone: formData.timezone || 'America/Chicago', 
      leadTimeHours: formData.leadTimeHours || 2, 
      maxAttendees: formData.maxAttendees || 1, 
      advanceDays: formData.advanceDays || 60, 
      availability: formData.availability || {} 
    },
  });
  
  const { control, register, watch, setValue, formState, handleSubmit } = form;

  const goToNext = () => {
    const qs = new URLSearchParams(searchParams);
    qs.set('step', 'options');
    router.push(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const onSubmit = (data: AvailabilitySchema) => {
    console.log('Availability form data:', data);
    
    // Save availability data to context
    updateFormData({
      availability: data.availability,
      timezone: data.timezone,
      leadTimeHours: data.leadTimeHours,
      maxAttendees: data.maxAttendees,
      advanceDays: data.advanceDays,
    });
    
    goToNext();
  };

  return (
    <div className="max-w-[820px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
        <FormSection index={1} title="Configure settings">
          <ConfigSection control={control} register={register} watch={watch} />
        </FormSection>

        <FormSection index={2} title="Select available times">
          <DaysGrid control={control} name="availability" />
          <Link 
            className="text-sm text-[#6356FF] mt-4 inline-block hover:text-[#5145E6] transition-colors" 
            href="#"
          >
            Block off specific dates →
          </Link>
        </FormSection>

        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>

          <Button 
            variant="outline" 
            type="button"
            className="h-10 px-4 rounded-lg border-[#E5E7F5] text-[#6B6E85] hover:text-[#6356FF] hover:border-[#6356FF]"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          
          <Button 
            type="submit"
            className="h-10 px-4 rounded-lg bg-[#6356FF] hover:bg-[#5145E6] text-white"
            disabled={!formState.isDirty || !formState.isValid}
          >
            <Send className="h-4 w-4 mr-2" />
            Next
          </Button>
        </div>
      </form>
    </div>
  );
} 