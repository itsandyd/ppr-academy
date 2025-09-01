"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ArrowRight } from "lucide-react";
import { schema, CheckoutSchema } from "./schema";
import { DescriptionEditor } from "./DescriptionEditor";
import { SessionSettings } from "./SessionSettings";
import { InfoFields } from "./InfoFields";
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

export default function CheckoutForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { updateFormData } = useCoachingPreview();
  
  const form = useForm<CheckoutSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      title: "",
      description: "",
      duration: 60,
      price: 99,
      sessionType: "video",
      fields: []
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;
  
  const titleLength = watch("title").length;
  const descriptionLength = watch("description").length;
  const isValid = formState.isValid;

  const onSubmit = (data: CheckoutSchema) => {
    console.log("Checkout form submitted:", data);
    // Navigate to availability step
    const qs = new URLSearchParams(searchParams);
    qs.set('step', 'availability');
    router.push(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-[640px]">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
        {/* Step 1 - Call Title */}
        <FormSection index={1} title="Call title">
          <div className="space-y-3">
            <Input
              {...register("title")}
              placeholder="Enter your coaching call title..."
              className="h-12 rounded-xl border-[#E5E7F5] px-4 text-base"
              maxLength={80}
              onChange={(e) => {
                register("title").onChange(e);
                updateFormData({ title: e.target.value });
              }}
            />
            <div className="flex justify-end">
              <span 
                className={`text-xs ${
                  titleLength > 70 ? "text-red-500" : "text-[#6B6E85]"
                }`}
              >
                {titleLength}/80
              </span>
            </div>
          </div>
        </FormSection>

        {/* Step 2 - Description */}
        <FormSection index={2} title="Description">
          <DescriptionEditor
            value={watch("description")}
            onChange={(value) => setValue("description", value)}
          />
        </FormSection>

        {/* Step 3 - Session Settings */}
        <FormSection index={3} title="Session settings">
          <SessionSettings
            duration={watch("duration")}
            price={watch("price")}
            sessionType={watch("sessionType")}
            onDurationChange={(duration) => {
              setValue("duration", duration);
              updateFormData({ duration });
            }}
            onPriceChange={(price) => {
              setValue("price", price);
              updateFormData({ price });
            }}
            onSessionTypeChange={(type) => setValue("sessionType", type)}
          />
        </FormSection>

        {/* Step 4 - Custom Info Fields */}
        <FormSection index={4} title="Collect customer info">
          <InfoFields
            fields={watch("fields") || []}
            onChange={(fields) => setValue("fields", fields)}
          />
        </FormSection>

        {/* Action bar */}
        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>
          <Button 
            variant="outline" 
            type="button"
            className="flex items-center gap-2 h-10 rounded-lg border-[#E5E7F5] text-[#6B6E85] hover:border-[#6356FF] hover:text-[#6356FF]"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg flex items-center gap-2"
            disabled={!isValid}
          >
            <ArrowRight size={16} />
            Next
          </Button>
        </div>
      </form>
    </div>
  );
} 