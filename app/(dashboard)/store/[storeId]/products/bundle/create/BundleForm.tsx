"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Layers,
  GraduationCap,
  Box,
  Save,
  ArrowRight,
  Plus,
  X,
  Calculator,
  Package,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const bundleSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  category: z.string().optional(),
});

type BundleSchema = z.infer<typeof bundleSchema>;

interface FormSectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function FormSection({ index, title, children }: FormSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white">
          {index}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="ml-11">{children}</div>
    </div>
  );
}

export function BundleForm() {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const storeId = params.storeId as string;
  const bundleId = searchParams.get("bundleId");

  const [selectedProducts, setSelectedProducts] = useState<
    Array<{
      id: string;
      type: "course" | "digitalProduct";
      title: string;
      price: number;
      description?: string;
    }>
  >([]);

  // Fetch available products
  const courses = useQuery(api.courses.getCoursesByStore, storeId ? { storeId } : "skip");

  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : "skip"
  );

  const form = useForm<BundleSchema>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });

  const { register, watch, setValue, formState, handleSubmit } = form;

  const char = {
    title: watch("title").length,
    description: watch("description")?.length || 0,
  };

  // Calculate bundle pricing
  const individualTotal = selectedProducts.reduce((sum, product) => sum + product.price, 0);
  const suggestedBundlePrice = Math.round(individualTotal * 0.75); // 25% discount
  const savings = individualTotal - suggestedBundlePrice;

  const onSubmit = (data: BundleSchema) => {
    console.log("Bundle form submitted:", {
      ...data,
      selectedProducts,
      individualTotal,
      suggestedBundlePrice,
      savings,
    });
    // TODO: Create bundle in database
    toast({
      title: "Coming Soon! 🚀",
      description: `Bundle creation is currently in development. Your bundle "${data.title}" with ${selectedProducts.length} products will be available soon.`,
      className: "bg-white dark:bg-black",
    });
  };

  const addProduct = (product: any, type: "course" | "digitalProduct") => {
    const newProduct = {
      id: product._id,
      type,
      title: product.title,
      price: product.price || 0,
      description: product.description,
    };

    setSelectedProducts((prev) => {
      if (prev.some((p) => p.id === product._id)) {
        return prev; // Already added
      }
      return [...prev, newProduct];
    });
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const steps = [
    {
      label: "Bundle Info",
      href: "?step=info",
      icon: Layers,
      active: true,
    },
    {
      label: "Add Products",
      href: "?step=products",
      icon: Package,
      active: false,
    },
    {
      label: "Pricing",
      href: "?step=pricing",
      icon: Calculator,
      active: false,
    },
  ];

  return (
    <div className="max-w-[640px]">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <Tabs value="info" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 bg-transparent p-0">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.label}
                  value={step.label.toLowerCase().replace(" ", "-")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    step.active
                      ? "border border-emerald-500 bg-white font-bold text-emerald-600 data-[state=active]:bg-white data-[state=active]:text-emerald-600"
                      : "text-[#4B4E68] hover:text-emerald-600 data-[state=active]:bg-transparent"
                  }`}
                  disabled={!step.active}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {step.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-16">
        {/* Step 1 - Bundle Info */}
        <FormSection index={1} title="Bundle Information">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Bundle Title</label>
                <span
                  className={`text-xs ${char.title >= 100 ? "text-red-500" : "text-[#6B6E85]"}`}
                >
                  {char.title}/100
                </span>
              </div>
              <Input
                {...register("title")}
                placeholder="e.g., Ableton Complete Bundle"
                className="h-12 rounded-xl border-emerald-200 px-4 focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <span
                  className={`text-xs ${char.description >= 500 ? "text-red-500" : "text-[#6B6E85]"}`}
                >
                  {char.description}/500
                </span>
              </div>
              <Textarea
                {...register("description")}
                placeholder="Describe what's included in this bundle and the value it provides..."
                className="min-h-[100px] rounded-xl border-emerald-200 px-4 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Category</label>
              <Input
                {...register("category")}
                placeholder="e.g., Music Production, Ableton, Mixing"
                className="h-12 rounded-xl border-emerald-200 px-4 focus:border-emerald-500"
              />
            </div>
          </div>
        </FormSection>

        {/* Step 2 - Add Products */}
        <FormSection index={2} title="Add Products to Bundle">
          <div className="space-y-6">
            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">
                  Selected Products ({selectedProducts.length})
                </h4>
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <Card key={product.id} className="border-emerald-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              product.type === "course" ? "bg-emerald-100" : "bg-blue-100"
                            }`}
                          >
                            {product.type === "course" ? (
                              <GraduationCap className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Box className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="text-sm font-medium">{product.title}</h5>
                            <p className="text-xs text-muted-foreground">
                              {product.type === "course" ? "Course" : "Digital Product"} • $
                              {product.price}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pricing Summary */}
                <Card className="border-emerald-200 bg-emerald-50 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Individual Total:</span>
                      <span>${individualTotal}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-emerald-700">
                      <span>Suggested Bundle Price:</span>
                      <span>${suggestedBundlePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Customer Savings:</span>
                      <span>
                        ${savings} ({Math.round((savings / individualTotal) * 100)}% off)
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Available Courses */}
            <div>
              <h4 className="mb-3 font-medium text-foreground">Available Courses</h4>
              <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto">
                {courses
                  ?.filter(
                    (course: any) =>
                      course.isPublished && !selectedProducts.some((p: any) => p.id === course._id)
                  )
                  .map((course: any) => (
                    <Card
                      key={course._id}
                      className="cursor-pointer border-emerald-200 p-3 transition-all hover:bg-emerald-50 hover:shadow-md"
                      onClick={() => addProduct(course, "course")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                          <GraduationCap className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium">{course.title}</h5>
                          <p className="text-xs text-muted-foreground">
                            Course • ${course.price || 0}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-emerald-600" />
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Available Digital Products */}
            <div>
              <h4 className="mb-3 font-medium text-foreground">Available Digital Products</h4>
              <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto">
                {digitalProducts
                  ?.filter(
                    (product: any) =>
                      product.isPublished &&
                      !selectedProducts.some((p: any) => p.id === product._id)
                  )
                  .map((product: any) => (
                    <Card
                      key={product._id}
                      className="cursor-pointer border-blue-200 p-3 transition-all hover:bg-blue-50 hover:shadow-md"
                      onClick={() => addProduct(product, "digitalProduct")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                          <Box className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-medium">{product.title}</h5>
                          <p className="text-xs text-muted-foreground">
                            Digital Product • ${product.price}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </FormSection>

        {/* Action Bar */}
        <div className="relative flex items-center justify-end gap-6">
          <span className="absolute -top-6 right-0 text-xs italic text-[#6B6E85]">
            Create your bundle
          </span>
          <Button
            variant="outline"
            type="button"
            className="flex h-10 items-center gap-2 rounded-lg px-4"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="submit"
            className="flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-8 text-white hover:bg-emerald-700"
            disabled={!formState.isValid || selectedProducts.length === 0}
          >
            <ArrowRight size={16} />
            Create Bundle
          </Button>
        </div>
      </form>
    </div>
  );
}
