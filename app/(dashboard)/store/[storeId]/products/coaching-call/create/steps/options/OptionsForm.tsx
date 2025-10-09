"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Mail, ChevronDown, Save, Send, Package, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { schema, OptionsSchema } from "./schema";
import { Reviews } from "./Reviews";
import { EmailFlows } from "./EmailFlows";
import { OrderBump } from "./OrderBump";
import { AffiliateShare } from "./AffiliateShare";
import { useCoachingPreview } from "../../CoachingPreviewContext";
import { useUpdateCoachingProduct, usePublishCoachingProduct } from "@/hooks/use-coaching-products";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function OptionsForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const storeId = params.storeId as string;
  const { toast } = useToast();
  
  const { formData, updateFormData } = useCoachingPreview();
  const { updateProduct } = useUpdateCoachingProduct();
  const { publishProduct } = usePublishCoachingProduct();
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OptionsSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      reviews: [],
      flows: [],
      confirmationSubject: "Your coaching session is confirmed", 
      confirmationBody: "Thank you for booking your coaching session. Here are the details of your upcoming call...",
      orderBump: { enabled: false },
      affiliateShare: { enabled: false }
    },
  });

  const { control, register, watch, setValue, formState, handleSubmit } = form;

  const handleSaveAsDraft = async () => {
    const values = form.getValues();
    setIsSaving(true);
    
    try {
      // Save to context
      updateFormData({
        orderBump: values.orderBump,
        affiliate: values.affiliateShare,
        emailFlows: values.flows,
      });

      // Update product if it exists
      if (formData.productId) {
        await updateProduct(formData.productId, {
          // Options data would be stored in product metadata
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: OptionsSchema) => {
    console.log("Options submitted:", data);
    
    if (!formData.productId) {
      toast({
        title: "Error",
        description: "Product not found. Please go back and complete previous steps.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      // Save options data to context
      updateFormData({
        orderBump: data.orderBump,
        affiliate: data.affiliateShare,
        emailFlows: data.flows,
      });

      // Update product with final settings
      await updateProduct(formData.productId, {
        // Options would be saved as product metadata
      });

      // Publish the product
      const success = await publishProduct(formData.productId);
      
      if (success) {
        toast({
          title: "Success!",
          description: "Your coaching product has been published successfully.",
          className: "bg-white dark:bg-black",
        });
        
        // Redirect to products page
        router.push(`/store/${storeId}/products`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-[920px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Accordion Blocks */}
        <Accordion type="single" collapsible className="space-y-4">
          {/* Add Reviews */}
          <AccordionItem value="reviews" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Star size={20} className="mr-4 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Add Reviews</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <Reviews control={control} register={register} />
            </AccordionContent>
          </AccordionItem>

          {/* Email Flows */}
          <AccordionItem value="flows" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Mail size={20} className="mr-4 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Email Flows</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <EmailFlows control={control} register={register} />
            </AccordionContent>
          </AccordionItem>

          {/* Order Bump */}
          <AccordionItem value="orderbump" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Package size={20} className="mr-4 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Order Bump</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <OrderBump control={control} register={register} watch={watch} />
            </AccordionContent>
          </AccordionItem>

          {/* Affiliate Share */}
          <AccordionItem value="affiliate" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Users size={20} className="mr-4 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Affiliate Share</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4">
              <AffiliateShare control={control} register={register} watch={watch} />
            </AccordionContent>
          </AccordionItem>

          {/* Confirmation Email */}
          <AccordionItem value="confirmation" className="border-none">
            <AccordionTrigger className="h-16 rounded-xl px-6 shadow-sm border border-transparent hover:border-[#E8EAF8] transition-colors bg-white data-[state=open]:border-[#E8EAF8] hover:no-underline">
              <div className="flex items-center flex-1">
                <Mail size={20} className="mr-4 text-[#4B4E68]" />
                <span className="flex-1 text-base font-semibold text-left">Confirmation Email</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <div></div>
                <Link href="#" className="text-xs text-[#6356FF] hover:text-[#5145E6]">
                  Restore Default
                </Link>
              </div>
              <Input
                placeholder="Email subject line"
                {...register("confirmationSubject")}
                className="h-9"
              />
              <div className="space-y-2">
                <div className="border border-[#E5E7F5] rounded-lg bg-white">
                  <div className="bg-[#F3F3FF] px-3 py-2 border-b border-[#E5E7F5] flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <span className="font-bold text-xs">B</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <span className="italic text-xs">I</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <span className="text-xs">•</span>
                    </Button>
                  </div>
                  <div className="p-3">
                    <textarea
                      {...register("confirmationBody")}
                      placeholder="Email body content..."
                      className="w-full h-[200px] border-none resize-none bg-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="#" className="text-xs text-[#6356FF] hover:text-[#5145E6]">
                  Restore Default
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Row */}
        <div className="flex items-center gap-6 justify-end relative pt-8">
          <span className="absolute -top-2 right-0 italic text-xs text-[#6B6E85]">
            Improve this page
          </span>
          
          <Button 
            variant="outline" 
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isSaving || isPublishing}
            className="h-10 px-4 rounded-lg border-[#E5E7F5] text-[#6B6E85] hover:text-[#6356FF] hover:border-[#6356FF]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </>
            )}
          </Button>
          
          <Button
            type="submit"
            disabled={isPublishing || isSaving}
            className="h-10 px-4 rounded-lg bg-[#6356FF] hover:bg-[#5145E6] text-white"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 