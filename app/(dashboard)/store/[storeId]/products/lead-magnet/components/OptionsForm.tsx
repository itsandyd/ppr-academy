"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
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
  const storeId = params.storeId as string;
  const editProductId = searchParams.get("edit");
  const isEditMode = !!editProductId;
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const updateEmailConfirmation = useMutation(api.digitalProducts?.updateEmailConfirmation);
  
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
    if (!editProductId && !isEditMode) {
      // For new products, we need the product to be created first
      toast({
        title: "Information",
        description: "Please complete the thumbnail and product steps first to save email settings.",
        variant: "destructive",
      });
      return;
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
            window.location.href = `/store/${storeId}`;
          }, 1500);
        } else {
          // In create mode, show completion message
          toast({
            title: "Lead Magnet Complete! 🎉",
            description: "Your lead magnet is now ready to collect leads and send confirmation emails.",
          });
          setTimeout(() => {
            window.location.href = `/store/${storeId}`;
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

  // Memoize steps array to prevent unnecessary re-renders
  const steps = useMemo(() => {
    const editParam = isEditMode ? `&edit=${editProductId}` : '';
    return [
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
  }, [storeId, currentStep, isEditMode, editProductId]);

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Email Flows & Confirmation Email Accordions */}
        <Accordion type="single" collapsible className="space-y-4">
          
          {/* Email Flows */}
          <AccordionItem value="email-flows" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white hover:no-underline">
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
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white hover:no-underline">
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
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={16} />
            {isSaving ? "Saving..." : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
} 