"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Package, Sliders, Save, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { schema, ThumbnailSchema } from "./schema";
import { ImagePicker } from "./ImagePicker";
import { TextInputs } from "./TextInputs";
import { CollectInfo } from "./CollectInfo";
import { useLeadMagnetContext } from "../context";

interface FormSectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function FormSection({ index, title, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#F1F2FF] text-[#6356FF] font-medium flex items-center justify-center text-sm">
          {index}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="ml-10">{children}</div>
    </div>
  );
}

export function ThumbnailForm() {
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;
  const editProductId = searchParams.get("edit");
  const isEditMode = !!editProductId;
  
  // Memoize currentStep to prevent infinite re-renders
  const currentStep = useMemo(() => {
    return searchParams.get("step") || "thumbnail";
  }, [searchParams]);
  
  const { toast } = useToast();
  
  // Flag to prevent infinite loop between form reset and context update
  const isResettingFromContext = useRef(false);
  
  // Use context from layout instead of props
  const { leadMagnetData, updateLeadMagnetData } = useLeadMagnetContext();
  
  // Convex mutations
  const createProduct = useMutation(api.digitalProducts.createProduct);
  const updateProduct = useMutation(api.digitalProducts.updateProduct);
  
  const form = useForm<ThumbnailSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      subtitle: "",
      button: "Get Free Resource",
    },
  });

  const { register, watch, formState, handleSubmit, reset } = form;

  // Reset form when leadMagnetData changes (when saved data loads)
  useEffect(() => {
    if (leadMagnetData.title || leadMagnetData.subtitle || leadMagnetData.ctaText !== "Get Free Resource") {
      isResettingFromContext.current = true;
      reset({
        title: leadMagnetData.title,
        subtitle: leadMagnetData.subtitle,
        button: leadMagnetData.ctaText,
      });
      // Reset the flag after a brief delay to allow the reset to complete
      setTimeout(() => {
        isResettingFromContext.current = false;
      }, 10);
    }
  }, [leadMagnetData, reset]);

  // Watch form changes and update context for PhonePreview (but not during reset)
  const watchedValues = watch();
  useEffect(() => {
    // Don't update context if we're in the middle of resetting from context
    if (!isResettingFromContext.current) {
      updateLeadMagnetData({
        title: watchedValues.title || "",
        subtitle: watchedValues.subtitle || "",
        ctaText: watchedValues.button || "Get Free Resource",
      });
    }
  }, [watchedValues.title, watchedValues.subtitle, watchedValues.button, updateLeadMagnetData]);

  // Handle image upload and update context
  const handleImageUpload = (file: File | null, url?: string) => {
    console.log("🔄 handleImageUpload called:", { file: file?.name, url });
    setImage(file);
    
    // Only update context with URL if we have one (after upload completes)
    if (url) {
      console.log("💾 Updating leadMagnetData with imageUrl:", url);
      updateLeadMagnetData({ imageUrl: url });
    }
  };

  const onSubmit = async (data: ThumbnailSchema) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to save your lead magnet",
        variant: "destructive",
      });
      return;
    }

    if (!storeId) {
      toast({
        title: "Error",
        description: "Store ID is required",
        variant: "destructive",
      });
      return;
    }

    if (!data.title?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your lead magnet",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && editProductId) {
        // Update existing product
        await updateProduct({
          id: editProductId as any,
          title: data.title.trim(),
          description: data.subtitle?.trim() || "",
          imageUrl: leadMagnetData.imageUrl || "",
          buttonLabel: data.button || "Get Free Resource",
        });

        toast({
          title: "Success",
          description: "Lead magnet updated successfully!",
        });
      } else {
        // Create new lead magnet as a digital product
        await createProduct({
          title: data.title.trim(),
          description: data.subtitle?.trim() || "",
          price: 0, // Lead magnets are typically free
          imageUrl: leadMagnetData.imageUrl || "",
          storeId: storeId,
          userId: user.id,
          buttonLabel: data.button || "Get Free Resource",
          style: "card", // Lead magnets typically use card style
        });

        toast({
          title: "Success",
          description: "Lead magnet created successfully!",
        });
      }

      // Navigate to the next step (product page)
      const nextUrl = isEditMode 
        ? `/store/${storeId}/products/lead-magnet?step=product&edit=${editProductId}`
        : `/store/${storeId}/products/lead-magnet?step=product`;
      router.push(nextUrl);
      
    } catch (error) {
      console.error("Error saving lead magnet:", error);
      toast({
        title: "Error",
        description: "Failed to save lead magnet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to save your draft",
        variant: "destructive",
      });
      return;
    }

    const formData = form.getValues();
    
    if (!formData.title?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title before saving",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save as unpublished draft
      await createProduct({
        title: formData.title.trim(),
        description: formData.subtitle?.trim() || "",
        price: 0,
        imageUrl: leadMagnetData.imageUrl || "",
        storeId: storeId,
        userId: user.id,
        buttonLabel: formData.button || "Get Free Resource",
        style: "card",
      });

      toast({
        title: "Draft Saved",
        description: "Lead magnet saved as draft successfully!",
      });
      
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editParam = isEditMode ? `&edit=${editProductId}` : '';
  const steps = [
    { 
      label: "Thumbnail", 
      href: `/store/${storeId}/products/lead-magnet?step=thumbnail${editParam}`, 
      icon: Image, 
      active: currentStep === "thumbnail" 
    },
    { 
      label: "Product", 
      href: `/store/${storeId}/products/lead-magnet?step=product${editParam}`, 
      icon: Package, 
      active: currentStep === "product" 
    },
    { 
      label: "Options", 
      href: `/store/${storeId}/products/lead-magnet?step=options${editParam}`, 
      icon: Sliders, 
      active: currentStep === "options" 
    },
  ];

  return (
    <div className="max-w-lg">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {steps.map((step) => (
              <TabsTrigger 
                key={step.label}
                value={step.label.toLowerCase()}
                className={step.active ? "bg-white" : ""}
                asChild
              >
                <Link href={step.href}>
                  <step.icon className="w-4 h-4 mr-2" />
                  {step.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Step 1 - Select Image */}
        <FormSection index={1} title="Select image">
          <ImagePicker file={image} onChange={handleImageUpload} />
        </FormSection>

        {/* Step 2 - Enter Text */}
        <FormSection index={2} title="Enter text">
          <TextInputs 
            register={register}
            errors={formState.errors}
          />
        </FormSection>

        {/* Step 3 - Collect Info */}
        <FormSection index={3} title="Collect info">
          <CollectInfo
            fields={leadMagnetData.formFields}
            onChange={(fields) => updateLeadMagnetData({ formFields: fields })}
          />
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>
          
          <Button 
            variant="outline" 
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isLoading}
            className="flex items-center gap-2 h-10 rounded-lg border-[#E5E7F5] text-[#6B6E85] hover:border-[#6356FF] hover:text-[#6356FF]"
          >
            <Save size={16} />
            {isLoading ? "Saving..." : "Save as Draft"}
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading || !formState.isValid}
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg flex items-center gap-2"
          >
            <ArrowRight size={16} />
            {isLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
} 