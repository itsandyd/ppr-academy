"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ArrowRight } from "lucide-react";
import { schema, ThumbnailSchema } from "./schema";
import { StylePicker } from "./StylePicker";
import { ImagePicker } from "./ImagePicker";
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

export default function ThumbnailForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { updateFormData, setImageFile, setImagePreviewUrl } = useCoachingPreview();
  
  const form = useForm<ThumbnailSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      style: "button", 
      title: "",
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;
  
  const titleLength = watch("title").length;
  const isValid = formState.isValid;

  const onSubmit = (data: ThumbnailSchema) => {
    console.log("Thumbnail form submitted:", data);
    // Navigate to checkout step
    const qs = new URLSearchParams(searchParams);
    qs.set('step', 'checkout');
    router.push(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-[640px]">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
        {/* Step 1 - Pick a style */}
        <FormSection index={1} title="Pick a style">
          <StylePicker
            value={watch("style")}
            onSelect={(style) => {
              setValue("style", style);
              updateFormData({ style });
            }}
          />
        </FormSection>

        {/* Step 2 - Select image */}
        <FormSection index={2} title="Select image">
          <ImagePicker
            value={watch("image")}
            onChange={(file) => {
              setValue("image", file);
              setImageFile(file);
              
              // Create preview URL for the phone preview
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setImagePreviewUrl(e.target?.result as string);
                };
                reader.readAsDataURL(file);
              } else {
                setImagePreviewUrl(null);
              }
            }}
          />
        </FormSection>

        {/* Step 3 - Add text */}
        <FormSection index={3} title="Add text">
          <div className="relative">
            <Input
              {...register("title")}
              placeholder="Enter your call title..."
              className="h-12 rounded-xl border-[#E5E7F5] px-4 text-base"
              maxLength={50}
              onChange={(e) => {
                register("title").onChange(e);
                updateFormData({ title: e.target.value });
              }}
            />
            <div className="flex justify-end mt-2">
              <span 
                className={`text-xs ${
                  titleLength > 45 ? "text-red-500" : "text-[#6B6E85]"
                }`}
              >
                {titleLength}/50
              </span>
            </div>
          </div>
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