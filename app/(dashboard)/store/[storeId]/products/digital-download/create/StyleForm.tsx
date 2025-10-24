"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, CreditCard, Settings, Save, ArrowRight } from "lucide-react";
import Link from "next/link";
import { schema, ThumbnailStyleSchema } from "./schema";
import { StylePicker } from "./StylePicker";
import { ImagePicker } from "./ImagePicker";
import { TextInputs } from "./TextInputs";
import { usePreview } from "./PreviewContext";

interface FormSectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function FormSection({ index, title, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 rounded-full bg-[#6B6E85] text-white font-medium flex items-center justify-center text-sm">
          {index}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="ml-11">{children}</div>
    </div>
  );
}

export function StyleForm() {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentStep = searchParams.get("step") || "thumbnail";
  const storeId = params.storeId as string;
  const productId = searchParams.get("productId");
  const { setImageFile, setImagePreviewUrl } = usePreview();

  // Convex mutations and queries
  const createProduct = useMutation(api.digitalProducts.createProduct);
  const updateProduct = useMutation(api.digitalProducts.updateProduct);
  // Only query if productId is valid (starts with 'k' for Convex IDs)
  const isValidProductId = productId && productId.startsWith("k");
  const existingProduct = useQuery(
    api.digitalProducts.getProductById,
    isValidProductId ? { productId: productId as any } : "skip"
  );
  
  // Initialize form with existing product data or URL params
  const form = useForm<ThumbnailStyleSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      style: (searchParams.get("style") as "button" | "callout" | "preview") || 
             (existingProduct?.style as "button" | "callout" | "preview") || "button", 
      title: searchParams.get("title") || existingProduct?.title || "", 
      subtitle: searchParams.get("subtitle") || existingProduct?.description || "", 
      buttonLabel: searchParams.get("buttonLabel") || existingProduct?.buttonLabel || "Get Now"
    },
  });

  const { register, watch, setValue, formState, handleSubmit, reset } = form;
  
  // Update form when existing product loads
  useEffect(() => {
    if (existingProduct && !searchParams.get("title")) {
      reset({
        style: (existingProduct.style as "button" | "callout" | "preview") || "button",
        title: existingProduct.title || "",
        subtitle: existingProduct.description || "",
        buttonLabel: existingProduct.buttonLabel || "Get Now",
      });
    }
  }, [existingProduct, reset, searchParams]);
  
  const char = {
    title: watch("title").length,
    subtitle: watch("subtitle")?.length || 0,
    button: watch("buttonLabel").length,
  };

  // Update URL params when form values change
  const updatePreview = (values: Partial<ThumbnailStyleSchema>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Save as draft functionality
  const handleSaveAsDraft = async () => {
    if (!user?.id) return;

    const formData = form.getValues();
    
    try {
      if (productId && existingProduct) {
        // Update existing product
        await updateProduct({
          id: productId as any,
          title: formData.title || undefined,
          description: formData.subtitle || undefined,
          buttonLabel: formData.buttonLabel || undefined,
          style: formData.style,
        });
      } else {
        // Create new product
        const newProductId = await createProduct({
          title: formData.title || "Untitled Product",
          description: formData.subtitle || undefined,
          price: 9.99, // Default price, can be changed in checkout step
          storeId,
          userId: user.id,
          buttonLabel: formData.buttonLabel || undefined,
          style: formData.style,
        });
        
        // Add productId to URL for future saves
        const params = new URLSearchParams(searchParams.toString());
        params.set("productId", newProductId);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
      
      // Show success feedback (you could add a toast here)
      console.log("Product saved as draft successfully");
    } catch (error) {
      console.error("Failed to save draft:", error);
      // Show error feedback (you could add a toast here)
    }
  };

  const onSubmit = (data: ThumbnailStyleSchema) => {
    console.log("Style form submitted:", data);
    // Navigate to checkout step
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("step", "checkout");
    window.location.href = currentUrl.toString();
  };

  const steps = [
    { 
      label: "Thumbnail", 
      href: "?step=thumbnail", 
      icon: Image, 
      active: currentStep === "thumbnail"
    },
    { 
      label: "Checkout Page", 
      href: "?step=checkout", 
      icon: CreditCard, 
      active: currentStep === "checkout"
    },
    { 
      label: "Options", 
      href: "?step=options", 
      icon: Settings, 
      active: currentStep === "options"
    },
  ];

  return (
    <div className="max-w-[640px]">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.label}
                  value={step.label.toLowerCase().replace(' page', '').replace(' ', '-')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step.active
                      ? "bg-white border border-[#6356FF] text-[#6356FF] font-bold data-[state=active]:bg-white data-[state=active]:text-[#6356FF]"
                      : "text-[#4B4E68] hover:text-[#6356FF] data-[state=active]:bg-transparent"
                  }`}
                  asChild={!step.active}
                >
                  {step.active ? (
                    <div>
                      <Icon className="w-[18px] h-[18px]" />
                      {step.label}
                    </div>
                  ) : (
                    <Link href={step.href}>
                      <Icon className="w-[18px] h-[18px]" />
                      {step.label}
                    </Link>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
        {/* Step 1 - Pick a style */}
        <FormSection index={1} title="Pick a style">
          <StylePicker 
            value={watch("style")} 
            onSelect={(style) => {
              setValue("style", style, { shouldDirty: true });
              updatePreview({ style });
            }} 
          />
        </FormSection>

        {/* Step 2 - Select image */}
        <FormSection index={2} title="Select image">
          <ImagePicker 
            onChange={(file) => {
              setValue("image", file || undefined, { shouldDirty: true });
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
          <TextInputs 
            register={register} 
            char={char} 
            onUpdate={(field, value) => updatePreview({ [field]: value })}
          />
        </FormSection>

        {/* Action Bar */}
        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>
          <Button 
            variant="outline" 
            type="button"
            onClick={handleSaveAsDraft}
            className="flex items-center gap-2 h-10 rounded-lg px-4"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg px-8 flex items-center gap-2"
            disabled={!formState.isDirty || !formState.isValid}
          >
            <ArrowRight size={16} />
            Next
          </Button>
        </div>
      </form>
    </div>
  );
} 