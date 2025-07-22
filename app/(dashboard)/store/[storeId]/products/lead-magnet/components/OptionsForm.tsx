"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Image, Package, Sliders, Mail, Save, Send } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { EmailFlows } from "./EmailFlows";
import { ConfirmationEmail } from "./ConfirmationEmail";

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

  const onSubmit = (data: OptionsSchema) => {
    console.log("Options submitted:", data);
    // TODO: Handle form submission
  };

  // Memoize steps array to prevent unnecessary re-renders
  const steps = useMemo(() => [
    { 
      label: "Thumbnail", 
      href: `/store/${storeId}/products/lead-magnet?step=thumbnail`, 
      icon: Image, 
      active: currentStep === "thumbnail" 
    },
    { 
      label: "Product", 
      href: `/store/${storeId}/products/lead-magnet?step=product`, 
      icon: Package, 
      active: currentStep === "product" 
    },
    { 
      label: "Options", 
      href: `/store/${storeId}/products/lead-magnet?step=options`, 
      icon: Sliders, 
      active: currentStep === "options" 
    },
  ], [storeId, currentStep]);

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
                <Mail size={20} className="mr-5 text-[#4B4E68]" />
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
                <Mail size={20} className="mr-5 text-[#4B4E68]" />
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
          >
            <Send size={16} />
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
} 