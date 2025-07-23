"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Image, Package, Sliders, Upload, Link2, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { schema, ProductSchema } from "./schema";
import { useUploadThing } from "@/lib/uploadthing-hooks";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// FormSection component
function FormSection({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#6356FF] text-white flex items-center justify-center text-sm font-medium">
          {index}
        </div>
        <h3 className="text-lg font-semibold text-[#0F0F1C]">{title}</h3>
      </div>
      <div className="ml-11">
        {children}
      </div>
    </div>
  );
}

export function ProductForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;
  const editProductId = searchParams.get("edit");
  const isEditMode = !!editProductId;
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const { toast } = useToast();
  
  // Convex mutations
  const updateProduct = useMutation(api.digitalProducts.updateProduct);
  
  // Memoize currentStep to prevent infinite re-renders
  const currentStep = useMemo(() => {
    return searchParams.get("step") || "thumbnail";
  }, [searchParams]);
  
  const form = useForm<ProductSchema>({
    resolver: zodResolver(schema),
    defaultValues: { 
      resourceType: "file",
      resourceFile: "",
      resourceUrl: ""
    },
  });

  const { register, control, formState, handleSubmit, watch, setValue } = form;
  const resourceType = watch("resourceType");

  // Fetch existing products to load saved resource data
  const existingProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId: storeId } : "skip"
  );

  // Load existing resource data on mount
  useEffect(() => {
    if (existingProducts && existingProducts.length > 0) {
      // Find lead magnets (typically price: 0 and style: "card")
      const leadMagnets = existingProducts.filter((product: any) => 
        product.price === 0 && product.style === "card"
      );
      
      if (leadMagnets.length > 0) {
        // Load the most recent lead magnet
        const latestLeadMagnet = leadMagnets.sort((a: any, b: any) => b._creationTime - a._creationTime)[0];
        
        console.log("📁 Loading saved lead magnet:", latestLeadMagnet);
        
        // Load the saved resource data from downloadUrl
        if (latestLeadMagnet.downloadUrl) {
          console.log("📁 Found saved resource:", latestLeadMagnet.downloadUrl);
          
          // Check if it's a file URL or external URL
          if (latestLeadMagnet.downloadUrl.includes('utfs.io') || latestLeadMagnet.downloadUrl.includes('uploadthing')) {
            // It's an uploaded file
            setUploadedFileUrl(latestLeadMagnet.downloadUrl);
            setUploadedFileName(latestLeadMagnet.title || "saved-file");
            setValue("resourceFile", latestLeadMagnet.downloadUrl, { shouldValidate: true, shouldDirty: true });
            setValue("resourceType", "file");
          } else {
            // It's an external URL
            setValue("resourceUrl", latestLeadMagnet.downloadUrl, { shouldValidate: true, shouldDirty: true });
            setValue("resourceType", "url");
          }
        }
      }
    }
  }, [existingProducts, setValue]);

  // Trigger validation when resourceType changes
  useEffect(() => {
    form.trigger();
  }, [resourceType, form]);

  // UploadThing hook for files
  const { startUpload } = useUploadThing("documentUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        const uploadedUrl = res[0].url;
        console.log("📁 File upload response:", res[0]);
        setUploadedFileUrl(uploadedUrl);
        setUploadedFileName(res[0].name || "uploaded-file");
        
        // Set the form value and force validation
        console.log("🔄 Setting resourceFile to:", uploadedUrl);
        setValue("resourceFile", uploadedUrl, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true 
        });
        
        // Force validation multiple ways
        setTimeout(async () => {
          console.log("🔄 Triggering validation...");
          const isValid1 = await form.trigger("resourceFile");
          console.log("🔄 trigger('resourceFile') result:", isValid1);
          
          const isValid2 = await form.trigger();
          console.log("🔄 trigger() result:", isValid2);
          
          // Force form state update
          console.log("🔍 After triggers - form values:", form.getValues());
          console.log("🔍 After triggers - form valid:", form.formState.isValid);
          console.log("🔍 After triggers - form errors:", form.formState.errors);
        }, 200);
        
        toast({
          title: "Success",
          description: "File uploaded successfully!",
        });
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("📤 Starting file upload:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2) + "MB");
      
      // Check file size before upload
      const fileSizeMB = file.size / 1024 / 1024;
      const isZip = file.type === "application/zip";
      const maxSize = isZip ? 256 : 128;
      
      if (fileSizeMB > maxSize) {
        toast({
          title: "File too large",
          description: `File size (${fileSizeMB.toFixed(2)}MB) exceeds the ${maxSize}MB limit for ${isZip ? 'ZIP' : 'document'} files.`,
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      try {
        await startUpload([file]);
      } catch (error) {
        console.error("Upload failed:", error);
        setIsUploading(false);
      }
    }
  };

  const onSubmit = async (data: ProductSchema) => {
    console.log("✅ Product submitted:", data);
    
    // Validate that we have either file or URL
    if (data.resourceType === "file" && !data.resourceFile) {
      toast({
        title: "Error",
        description: "Please upload a file",
        variant: "destructive",
      });
      return;
    }
    
    if (data.resourceType === "url" && !data.resourceUrl) {
      toast({
        title: "Error", 
        description: "Please provide a URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let productToUpdate: any = null;
      
      if (isEditMode && editProductId) {
        // In edit mode, update the specific product being edited
        productToUpdate = { _id: editProductId as any };
      } else {
        // In create mode, find the most recent lead magnet to update
        if (existingProducts && existingProducts.length > 0) {
          const leadMagnets = existingProducts.filter((product: any) => 
            product.price === 0 && product.style === "card"
          );
          
          if (leadMagnets.length > 0) {
            productToUpdate = leadMagnets.sort((a: any, b: any) => b._creationTime - a._creationTime)[0];
          }
        }
      }

      if (productToUpdate) {
        // Update the lead magnet with the resource URL
        const downloadUrl = data.resourceType === "file" ? data.resourceFile : data.resourceUrl;
        
        await updateProduct({
          id: productToUpdate._id,
          downloadUrl: downloadUrl
        });
        
        console.log("📦 Resource saved to database:", {
          productId: productToUpdate._id,
          type: data.resourceType,
          downloadUrl: downloadUrl
        });
        
        toast({
          title: "Success",
          description: "Lead magnet resource saved!",
        });
        
        // Navigate to options step
        const nextUrl = isEditMode 
          ? `/store/${storeId}/products/lead-magnet?step=options&edit=${editProductId}`
          : `/store/${storeId}/products/lead-magnet?step=options`;
        window.location.href = nextUrl;
      } else {
        toast({
          title: "Error",
          description: "No lead magnet found. Please complete the thumbnail step first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving resource:", error);
      toast({
        title: "Error",
        description: "Failed to save resource. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug form state
  console.log("🔍 Form state:", {
    isValid: formState.isValid,
    errors: formState.errors,
    errorKeys: Object.keys(formState.errors),
    resourceTypeError: formState.errors.resourceType?.message,
    resourceFileError: formState.errors.resourceFile?.message,
    resourceUrlError: formState.errors.resourceUrl?.message,
    values: form.getValues(),
    resourceType,
    uploadedFileUrl,
    resourceFileValue: form.getValues("resourceFile"),
    resourceUrlValue: form.getValues("resourceUrl"),
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    touchedFields: formState.touchedFields,
    dirtyFields: formState.dirtyFields
  });

  // Separate error logging
  if (Object.keys(formState.errors).length > 0) {
    console.log("❌ Form Errors Found:", {
      resourceType: formState.errors.resourceType,
      resourceFile: formState.errors.resourceFile,
      resourceUrl: formState.errors.resourceUrl,
    });
  }

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
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <TabsTrigger
                  key={step.label}
                  value={step.label.toLowerCase()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step.active
                      ? "bg-white border border-[#6356FF] text-[#6356FF] font-bold data-[state=active]:bg-white data-[state=active]:text-[#6356FF]"
                      : "text-[#4B4E68] hover:text-[#6356FF] data-[state=active]:bg-transparent"
                  }`}
                  asChild
                >
                  <Link href={step.href}>
                    <Icon className="w-4 h-4" />
                    {step.label}
                  </Link>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* Lead Magnet File/URL Upload */}
        <FormSection index={1} title="Upload your lead magnet">
          <div className="space-y-4">
            {/* Resource Type Toggle */}
            <Controller
              control={control}
              name="resourceType"
              render={({ field }) => (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === "file" ? "default" : "outline"}
                    onClick={() => field.onChange("file")}
                    className={`flex-1 ${field.value === "file" ? "bg-[#6356FF] text-white" : ""}`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "url" ? "default" : "outline"}
                    onClick={() => field.onChange("url")}
                    className={`flex-1 ${field.value === "url" ? "bg-[#6356FF] text-white" : ""}`}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Provide URL
                  </Button>
                </div>
              )}
            />

            {/* File Upload */}
            {resourceType === "file" && (
              <Card className="border-dashed border-2 border-[#DDE1F7] p-6">
                {uploadedFileUrl ? (
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#6356FF]" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{uploadedFileName}</p>
                      <p className="text-xs text-muted-foreground">File uploaded successfully</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-[#6356FF] mx-auto mb-4" />
                    <p className="font-medium mb-2">Upload your lead magnet file</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      PDF ebooks, Word docs, guides, templates, checklists (max 128MB)<br/>
                      ZIP archives (max 256MB)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                      className="border-[#6356FF] text-[#6356FF]"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.zip,.epub,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip,application/epub+zip"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </Card>
            )}

            {/* URL Input */}
            {resourceType === "url" && (
              <div>
                <Input
                  {...register("resourceUrl")}
                  placeholder="https://example.com/your-lead-magnet"
                  className="h-12 rounded-xl border-[#E5E7F5] px-4 text-base"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Provide a direct link to your lead magnet resource
                </p>
              </div>
            )}
            
            {/* Hidden field to ensure resourceFile is registered */}
            <input
              type="hidden"
              {...register("resourceFile")}
            />
          </div>
        </FormSection>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-8">
          {/* Debug Info */}
          {/* <div className="text-xs text-gray-500 mr-4">
            <div>Valid: {formState.isValid ? "✅" : "❌"}</div>
            <div>Uploading: {isUploading ? "⏳" : "✅"}</div>
            <div>Resource: {resourceType}</div>
            {resourceType === "file" && <div>File: {form.getValues("resourceFile") ? "✅" : "❌"}</div>}
            {resourceType === "url" && <div>URL: {form.getValues("resourceUrl") ? "✅" : "❌"}</div>}
            {formState.errors.resourceType && <div className="text-red-500">Type Error: {formState.errors.resourceType.message}</div>}
            {formState.errors.resourceFile && <div className="text-red-500">File Error: {formState.errors.resourceFile.message}</div>}
            {formState.errors.resourceUrl && <div className="text-red-500">URL Error: {formState.errors.resourceUrl.message}</div>}
          </div> */}
          
          {/* <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("🧪 Manual test - setting resourceFile");
              setValue("resourceFile", "test-file-url.pdf", { shouldValidate: true, shouldDirty: true });
              form.trigger();
            }}
            className="mr-2 text-xs"
          >
            Test File
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              console.log("🔄 Force Validate - current values:", form.getValues());
              const result = await form.trigger();
              console.log("🔄 Force Validate - result:", result);
              console.log("🔄 Force Validate - errors:", formState.errors);
            }}
            className="mr-2 text-xs"
          >
            Force Validate
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("🧹 Clearing all form errors");
              form.clearErrors();
              form.trigger();
              console.log("🧹 After clear errors - form state:", formState);
            }}
            className="mr-2 text-xs bg-blue-100 hover:bg-blue-200"
          >
            Clear Errors
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("🚀 Force Submit - bypassing validation");
              const currentValues = form.getValues();
              console.log("📦 Current form values:", currentValues);
              if (currentValues.resourceFile || currentValues.resourceUrl) {
                onSubmit(currentValues);
              } else {
                console.log("❌ No file or URL found");
              }
            }}
            className="mr-2 text-xs bg-green-100 hover:bg-green-200"
          >
            Force Submit
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("🔍 Debug Submit - current form values:", form.getValues());
              console.log("🔍 Debug Submit - form errors:", formState.errors);
              onSubmit(form.getValues());
            }}
            className="mr-2 text-xs"
          >
            Debug Submit
          </Button> */}
          
          <Button
            type="submit"
            className="bg-[#6356FF] hover:bg-[#5248E6] text-white px-8 py-2 rounded-lg"
            disabled={!formState.isValid || isUploading || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
          
          {/* Manual override when file is uploaded but form validation is stuck
          {(resourceType === "file" && form.getValues("resourceFile")) || 
           (resourceType === "url" && form.getValues("resourceUrl")) ? (
            <Button
              type="button"
              onClick={() => onSubmit(form.getValues())}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg ml-2"
              disabled={isUploading}
            >
              Continue Anyway ✅
            </Button>
          ) : null} */}
        </div>
      </form>
    </div>
  );
} 