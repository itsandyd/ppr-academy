"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Image, Package, Sliders, Mail, Save, Send } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { EmailFlows } from "./EmailFlows";
import { ConfirmationEmail } from "./ConfirmationEmail";
import { useToast } from "@/hooks/use-toast";
import { useLeadMagnetContext } from "../context";
import { useUser } from "@clerk/nextjs";

// Schema for options form
const optionsSchema = z.object({
  flows: z.array(z.object({
    id: z.string(),
    subject: z.string(),
    body: z.string(),
    recipients: z.array(z.any()),
  })),
  confirmationSubject: z.string(),
  confirmationBody: z.string(),
});

type OptionsSchema = z.infer<typeof optionsSchema>;

export function OptionsForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params.storeId as string; // This is actually the store slug from URL
  const editProductId = searchParams.get("edit");
  const isEditMode = !!editProductId;
  const { toast } = useToast();
  const { leadMagnetData } = useLeadMagnetContext();
  const { user } = useUser();

  // Get store data by slug to get the actual store ID
  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );
  const storeId = store?._id; // This is the actual Convex store ID
  
  // Log component mount and data
  console.log("🎯 OptionsForm mounted");
  console.log("📊 Initial leadMagnetData:", leadMagnetData);
  console.log("📊 storeSlug:", storeSlug);
  console.log("📊 storeId (actual):", storeId);
  console.log("📊 editProductId:", editProductId);
  console.log("📊 isEditMode:", isEditMode);
  
  const [isSaving, setIsSaving] = useState(false);
  const updateEmailConfirmation = useMutation(api.digitalProducts?.updateEmailConfirmation);
  const createProduct = useMutation(api.digitalProducts?.createProduct);
  
  // Memoize currentStep to prevent infinite re-renders
  const currentStep = useMemo(() => {
    return searchParams.get("step") || "thumbnail";
  }, [searchParams]);
  
  const form = useForm<OptionsSchema>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      flows: [],
      confirmationSubject: "Thank you for downloading your free resource!",
      confirmationBody: "<p>Hi there!</p><p>Thank you for downloading our free resource. You can access your download using the link below.</p><p>Best regards,<br/>The Team</p>",
    },
  });

  const { control, register, setValue, formState, handleSubmit } = form;

  const onSubmit = async (data: OptionsSchema) => {
    console.log("🚀 OptionsForm onSubmit called");
    console.log("📊 Current leadMagnetData:", leadMagnetData);
    console.log("📊 Form data:", data);
    console.log("📊 Edit mode:", isEditMode, "Product ID:", editProductId);
    
    // Validate that all required steps are completed
    const missingSteps = [];
    
    console.log("🔍 Checking title:", leadMagnetData.title);
    if (!leadMagnetData.title) {
      missingSteps.push("title");
    }
    
    console.log("🔍 Checking imageUrl:", leadMagnetData.imageUrl);
    if (!leadMagnetData.imageUrl) {
      missingSteps.push("thumbnail");
    }
    
    console.log("🔍 Checking downloadUrl:", leadMagnetData.downloadUrl);
    if (!leadMagnetData.downloadUrl) {
      missingSteps.push("product resource");
    }
    
    console.log("❌ Missing steps:", missingSteps);
    
    if (missingSteps.length > 0) {
      console.log("🛑 Validation failed - missing steps:", missingSteps);
      toast({
        title: "Missing Required Information",
        description: `Please complete the following: ${missingSteps.join(", ")}. Make sure to complete the thumbnail and product steps first.`,
        variant: "destructive",
      });
      return;
    }
    
    // If we don't have a product ID but have all the data, create the product first
    if (!editProductId && !isEditMode) {
      console.log("🔨 No product ID found, creating product from context data...");
      
      try {
        // Check if user and store are available
        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        if (!storeId) {
          throw new Error("Store not found");
        }

        // Create the product using the context data
        const newProductId = await createProduct({
          title: leadMagnetData.title,
          description: leadMagnetData.subtitle || "Lead magnet resource",
          price: 0, // Free lead magnet
          imageUrl: leadMagnetData.imageUrl,
          downloadUrl: leadMagnetData.downloadUrl,
          storeId: storeId,
          userId: user.id,
          buttonLabel: leadMagnetData.ctaText || "Get Free Resource",
          style: "card", // Lead magnets use card style
        });

        console.log("🎯 Product creation result:", newProductId);
        console.log("✅ Product created successfully with ID:", newProductId);
        
        // Now continue with updating email confirmation using the new product ID
        const emailResult = await updateEmailConfirmation({
          productId: newProductId,
          confirmationEmailSubject: data.confirmationSubject,
          confirmationEmailBody: data.confirmationBody,
        });

        console.log("📧 Email confirmation result:", emailResult);

        if (emailResult?.success) {
          toast({
            title: "Lead Magnet Published! 🎉",
            description: "Your lead magnet has been created and is ready to collect leads.",
          });
          
          setTimeout(() => {
            window.location.href = `/store`;
          }, 2000);
        } else {
          throw new Error("Failed to update email confirmation");
        }
        
        setIsSaving(false);
        return;
        
      } catch (error) {
        console.error("❌ Error creating product:", error);
        toast({
          title: "Error",
          description: "Failed to create lead magnet. Please try again.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(true);
    
    try {
      const result = await updateEmailConfirmation({
        productId: editProductId as any,
        confirmationEmailSubject: data.confirmationSubject,
        confirmationEmailBody: data.confirmationBody,
      });

      if (result?.success) {
        toast({
          title: "Settings Saved! ✅",
          description: "Email confirmation settings have been updated successfully.",
        });
        
        if (isEditMode) {
          // In edit mode, redirect back to products
          setTimeout(() => {
            window.location.href = `/store`;
          }, 1500);
        } else {
          // In create mode, show completion message
          toast({
            title: "Lead Magnet Complete! 🎉",
            description: "Your lead magnet is now ready to collect leads and send confirmation emails.",
          });
          setTimeout(() => {
            window.location.href = `/store`;
          }, 2000);
        }
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to save email settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save email settings:", error);
      toast({
        title: "Error",
        description: "Failed to save email confirmation settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check step completion status
  const stepCompletion = useMemo(() => {
    const completion = {
      thumbnail: !!(leadMagnetData.title && leadMagnetData.imageUrl),
      product: !!(leadMagnetData.downloadUrl),
      options: true // Options step is always accessible
    };
    
    console.log("📋 Step completion check:");
    console.log("  📊 leadMagnetData:", leadMagnetData);
    console.log("  ✅ thumbnail complete:", completion.thumbnail, "(title:", !!leadMagnetData.title, "imageUrl:", !!leadMagnetData.imageUrl, ")");
    console.log("  ✅ product complete:", completion.product, "(downloadUrl:", !!leadMagnetData.downloadUrl, ")");
    console.log("  ✅ options complete:", completion.options);
    
    return completion;
  }, [leadMagnetData]);
  
  // Memoize steps array to prevent unnecessary re-renders
  const steps = useMemo(() => {
    const editParam = isEditMode ? `&edit=${editProductId}` : '';
    return [
    { 
      label: "Thumbnail", 
        href: `/store/${storeId}/products/lead-magnet?step=thumbnail${editParam}`, 
      icon: Image, 
      active: currentStep === "thumbnail",
      completed: stepCompletion.thumbnail
    },
    { 
      label: "Product", 
        href: `/store/${storeId}/products/lead-magnet?step=product${editParam}`, 
      icon: Package, 
      active: currentStep === "product",
      completed: stepCompletion.product
    },
    { 
      label: "Options", 
        href: `/store/${storeId}/products/lead-magnet?step=options${editParam}`, 
      icon: Sliders, 
      active: currentStep === "options",
      completed: stepCompletion.options
    },
    ];
  }, [storeId, currentStep, isEditMode, editProductId, stepCompletion]);

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
                className={step.active ? "bg-background" : ""}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Email Flows & Confirmation Email Accordions */}
        <Accordion type="single" collapsible className="space-y-4">
          
          {/* Email Flows */}
          <AccordionItem value="email-flows" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-border transition-colors bg-card hover:no-underline">
              <div className="flex items-center">
                <Mail size={20} className="mr-5 text-muted-foreground" />
                <span className="text-base font-semibold">Email Flows</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <EmailFlows control={control} />
            </AccordionContent>
          </AccordionItem>

          {/* Confirmation Email */}
          <AccordionItem value="confirmation-email" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-border transition-colors bg-card hover:no-underline">
              <div className="flex items-center">
                <Mail size={20} className="mr-5 text-muted-foreground" />
                <span className="text-base font-semibold">Confirmation Email</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <ConfirmationEmail control={control} register={register} setValue={setValue} />
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        {/* Form Actions */}
        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-muted-foreground">
            Improve this page
          </span>
          
          <Button 
            variant="outline" 
            type="button"
            className="flex items-center gap-2 h-10 rounded-lg border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          
          <Button
            type="submit"
            disabled={isSaving || !stepCompletion.thumbnail || !stepCompletion.product}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-lg flex items-center gap-2 disabled:opacity-50"
            onClick={() => {
              console.log("🔘 Publish button clicked");
              console.log("📊 Button disabled:", isSaving || !stepCompletion.thumbnail || !stepCompletion.product);
              console.log("📊 isSaving:", isSaving);
              console.log("📊 stepCompletion:", stepCompletion);
            }}
          >
            <Send size={16} />
            {isSaving ? "Saving..." : "Publish"}
          </Button>
          
          {(!stepCompletion.thumbnail || !stepCompletion.product) && (
            <div className="absolute -bottom-8 right-0 text-xs text-muted-foreground">
              Complete all steps to publish
            </div>
          )}
        </div>
      </form>
    </div>
  );
} 