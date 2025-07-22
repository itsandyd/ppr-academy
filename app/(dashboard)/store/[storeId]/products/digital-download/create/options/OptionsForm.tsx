"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Image, CreditCard, Settings, Star, Mail, TrendingUp, Users, CheckSquare, Save, Send } from "lucide-react";
import Link from "next/link";
import { schema, OptionsProSchema } from "./schema";
import { Reviews } from "./Reviews";
import { EmailFlows } from "./EmailFlows";
import { OrderBump } from "./OrderBump";
import { AffiliateShare } from "./AffiliateShare";
import { ConfirmationEmail } from "./ConfirmationEmail";

export function OptionsForm() {
  const searchParams = useSearchParams();
  const currentStep = searchParams.get("step") || "thumbnail";
  
  const form = useForm<OptionsProSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      confirmationSubject: "Thank you for your purchase!", 
      confirmationBody: "<p>Hi there!</p><p>Thank you for purchasing our digital product. You can download your files using the link below.</p><p>Best regards,<br/>The Team</p>",
      reviews: [],
      emailFlows: [],
      orderBump: {
        enabled: true,
        productName: "",
        description: "",
        price: 0,
        image: null
      },
      affiliateShare: {
        enabled: true,
        commissionRate: 30,
        minPayout: 50,
        cookieDuration: 30
      }
    },
  });

  const { control, register, formState, handleSubmit } = form;

  const onSubmit = (data: OptionsProSchema) => {
    console.log("Options form submitted:", data);
    // TODO: Handle form submission and publish
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
    <div className="max-w-[720px] space-y-10">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.label}
                  value={step.label.toLowerCase().replace(' ', '-')}
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        <Accordion type="multiple" className="space-y-6" defaultValue={["confirm"]}>
          <AccordionItem value="reviews" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Star size={20} className="mr-3 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Add Reviews</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 bg-[#F8F8FF] mx-6 rounded-b-xl">
              <Reviews control={control} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="flows" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Mail size={20} className="mr-3 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Email Flows</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 bg-[#F8F8FF] mx-6 rounded-b-xl">
              <EmailFlows control={control} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="bump" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <TrendingUp size={20} className="mr-3 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Order Bump</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 bg-[#F8F8FF] mx-6 rounded-b-xl">
              <OrderBump control={control} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="affiliate" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Users size={20} className="mr-3 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Affiliate Share</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 bg-[#F8F8FF] mx-6 rounded-b-xl">
              <AffiliateShare control={control} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="confirm" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <CheckSquare size={20} className="mr-3 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Confirmation Email</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 bg-[#F8F8FF] mx-6 rounded-b-xl">
              <ConfirmationEmail control={control} register={register} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Bar */}
        <div className="flex items-center gap-6 justify-end relative">
          <span className="absolute -top-6 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>
          <Button 
            variant="outline" 
            type="button"
            className="flex items-center gap-2 h-10 rounded-lg"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg flex items-center gap-2"
            disabled={!formState.isDirty || !formState.isValid}
          >
            <Send size={16} />
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
} 