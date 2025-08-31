"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Image, Package, Sliders, Mail, ChevronDown, Save, Send } from "lucide-react";
import Link from "next/link";
import { schema, OptionsSchema } from "./schema";

export function OptionsForm() {
  const form = useForm<OptionsSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      emailFlows: true, 
      confirmationSubject: "", 
      confirmationBody: "" 
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;

  const onSubmit = (data: OptionsSchema) => {
    console.log("Options submitted:", data);
    // TODO: Handle form submission
  };

  const steps = [
    { 
      label: "Thumbnail", 
      href: "/store/776048/page/create/lead-magnet", 
      icon: Image, 
      active: false 
    },
    { 
      label: "Product", 
      href: "/store/776048/page/create/lead-magnet/product", 
      icon: Package, 
      active: false 
    },
    { 
      label: "Options", 
      href: "/store/776048/page/create/lead-magnet/options", 
      icon: Sliders, 
      active: true 
    },
  ];

  return (
    <div className="max-w-lg">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <Tabs value="options" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.label}
                  value={step.label.toLowerCase()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step.active
                      ? "bg-background border border-primary text-primary font-bold data-[state=active]:bg-background data-[state=active]:text-primary"
                      : "text-muted-foreground hover:text-primary data-[state=active]:bg-transparent"
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
        {/* Accordion Blocks */}
        <Accordion type="single" collapsible className="space-y-8">
          {/* Email Flows */}
          <AccordionItem value="flows" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-border transition-colors bg-card data-[state=open]:border-border hover:no-underline">
              <div className="flex items-center flex-1">
                <Mail size={20} className="mr-4 text-muted-foreground" />
                <span className="flex-1 text-base font-semibold text-left">Email Flows</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={watch("emailFlows")}
                  onCheckedChange={(v: boolean) => setValue("emailFlows", v, { shouldDirty: true })}
                />
                <span className="text-sm">Automatically send welcome + delivery emails</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Confirmation Email */}
          <AccordionItem value="confirmation" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-border transition-colors bg-card data-[state=open]:border-border hover:no-underline">
              <div className="flex items-center flex-1">
                <Mail size={20} className="mr-4 text-muted-foreground" />
                <span className="flex-1 text-base font-semibold text-left">Confirmation Email</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 space-y-4">
              <Input
                placeholder="Subject line"
                {...register("confirmationSubject")}
                className="h-10"
              />
              <Textarea
                rows={6}
                placeholder="Email body..."
                {...register("confirmationBody")}
                className="resize-none"
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Row */}
        <div className="pt-20">
          <div className="flex items-center gap-6 justify-center relative">
            <span className="absolute -top-6 right-0 italic text-xs text-muted-foreground">
              Improve this page
            </span>
            <Button 
              variant="outline" 
              type="button"
              className="flex items-center gap-2 rounded-lg px-4 py-2"
            >
              <Save size={16} />
              Save As Draft
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-8 py-2 flex items-center gap-2"
              disabled={!formState.isDirty || !formState.isValid}
            >
              <Send size={16} />
              Publish
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 