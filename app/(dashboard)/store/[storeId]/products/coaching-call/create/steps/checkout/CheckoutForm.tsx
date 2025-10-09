"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ArrowRight, Loader2 } from "lucide-react";
import { schema, CheckoutSchema } from "./schema";
import { DescriptionEditor } from "./DescriptionEditor";
import { SessionSettings } from "./SessionSettings";
import { InfoFields } from "./InfoFields";
import { useCoachingPreview } from "../../CoachingPreviewContext";
import { DiscordVerificationCard } from "@/components/coaching/DiscordVerificationCard";
import { useCreateCoachingProduct } from "@/hooks/use-coaching-products";
import { useState } from "react";

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
  const params = useParams();
  const storeId = params.storeId as string;
  
  const { formData, updateFormData } = useCoachingPreview();
  const { createProduct } = useCreateCoachingProduct();
  
  const [isDiscordVerified, setIsDiscordVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const form = useForm<CheckoutSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      title: formData.title || "",
      description: formData.description || "",
      duration: formData.duration || 60,
      price: formData.price || 99,
      sessionType: formData.sessionType || "video",
      fields: formData.customFields || []
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;
  
  const titleLength = watch("title").length;
  const descriptionLength = watch("description").length;
  const isValid = formState.isValid;

  const handleSaveAsDraft = async () => {
    const values = form.getValues();
    setIsSaving(true);
    
    try {
      // Save form data to context
      updateFormData({
        title: values.title,
        description: values.description,
        duration: values.duration,
        price: values.price,
        sessionType: values.sessionType,
        customFields: values.fields,
      });

      // If we already have a product ID, update it
      if (formData.productId) {
        // TODO: Add update product functionality
        console.log("Update existing product:", formData.productId);
      } else {
        // Create a new draft product
        const productId = await createProduct(storeId, {
          title: values.title,
          description: values.description,
          price: values.price,
          duration: values.duration,
          sessionType: values.sessionType,
          customFields: values.fields,
          imageUrl: formData.thumbnail,
          thumbnailStyle: formData.thumbnailStyle,
        });

        if (productId) {
          updateFormData({ productId });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: CheckoutSchema) => {
    setIsCreating(true);
    
    try {
      // Save form data to context
      updateFormData({
        title: data.title,
        description: data.description,
        duration: data.duration,
        price: data.price,
        sessionType: data.sessionType,
        customFields: data.fields,
        isDiscordVerified,
      });

      // Create or update product
      let productId = formData.productId;
      
      if (!productId) {
        productId = await createProduct(storeId, {
          title: data.title,
          description: data.description,
          price: data.price,
          duration: data.duration,
          sessionType: data.sessionType,
          customFields: data.fields,
          imageUrl: formData.thumbnail,
          thumbnailStyle: formData.thumbnailStyle,
        });

        if (productId) {
          updateFormData({ productId });
        }
      }

      // Navigate to availability step
      const qs = new URLSearchParams(searchParams);
      qs.set('step', 'availability');
      router.push(`${pathname}?${qs.toString()}`, { scroll: false });
    } finally {
      setIsCreating(false);
    }
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
            onChange={(value) => {
              setValue("description", value);
              updateFormData({ description: value });
            }}
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
            onSessionTypeChange={(type) => {
              setValue("sessionType", type);
              updateFormData({ sessionType: type });
            }}
          />
        </FormSection>

        {/* Step 4 - Custom Info Fields */}
        <FormSection index={4} title="Collect customer info">
          <InfoFields
            fields={watch("fields") || []}
            onChange={(fields) => {
              setValue("fields", fields);
              updateFormData({ customFields: fields });
            }}
          />
        </FormSection>

        {/* Step 5 - Discord Verification */}
        <FormSection index={5} title="Discord integration">
          <div className="space-y-4">
            <p className="text-sm text-[#6B6E85]">
              Coaching sessions require Discord for communication. Students will automatically get access to 
              coaching channels when they book a session.
            </p>
            <DiscordVerificationCard onVerificationChange={setIsDiscordVerified} />
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
            onClick={handleSaveAsDraft}
            disabled={isSaving || isCreating}
            className="flex items-center gap-2 h-10 rounded-lg border-[#E5E7F5] text-[#6B6E85] hover:border-[#6356FF] hover:text-[#6356FF]"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save as Draft
              </>
            )}
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isCreating || isSaving}
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                Next
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 