'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CreationShell } from '../components/CreationShell';
import { ProductCategory } from '../types';
import { Coffee, Sparkles, ArrowLeft, ArrowRight, Heart, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useValidStoreId } from '@/hooks/useStoreId';
import { useToast } from '@/hooks/use-toast';
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct, useGenerateUploadUrl, useGetFileUrl } from '@/lib/convex-typed-hooks';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ValidatedField } from '@/shared/components/ValidatedField';
import { validationRules } from '@/hooks/useFieldValidation';
import { ProductAIAssistant } from '@/components/ai/ProductAIAssistant';
import { toast as sonnerToast } from 'sonner';

interface TipJarFormData {
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  suggestedAmount: number;
}

export default function TipJarCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const storeId = useValidStoreId();
  const { toast } = useToast();

  // Mutations
  const createProduct = useCreateUniversalProduct();
  const updateProduct = useUpdateDigitalProduct();
  const generateUploadUrl = useGenerateUploadUrl();
  const getFileUrl = useGetFileUrl();

  // Get productId from URL for editing
  const productId = searchParams.get('productId') as Id<"digitalProducts"> | null;
  const step = searchParams.get('step') || 'basics';
  const isEditing = !!productId;

  // Fetch existing product if editing
  const existingProduct = useDigitalProductById(productId ?? undefined);

  // Form state
  const [formData, setFormData] = useState<TipJarFormData>({
    title: '',
    description: '',
    imageUrl: '',
    tags: [],
    suggestedAmount: 5,
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing product data when editing
  useEffect(() => {
    if (existingProduct && !isInitialized) {
      setFormData({
        title: existingProduct.title || '',
        description: existingProduct.description || '',
        imageUrl: existingProduct.imageUrl || '',
        tags: existingProduct.tags || [],
        suggestedAmount: existingProduct.price || 5,
      });
      setIsInitialized(true);
    }
  }, [existingProduct, isInitialized]);

  // Placeholder component for StepConfig type requirement (not actually rendered)
  const PlaceholderStep = () => null;

  // Define simplified 2-step flow
  const steps = [
    {
      id: 'basics',
      label: 'Basics',
      description: 'Title, description & image',
      icon: Coffee,
      color: 'from-amber-500 to-orange-500',
      component: PlaceholderStep,
      estimatedTime: '2 min',
    },
    {
      id: 'publish',
      label: 'Publish',
      description: 'Set amount & go live',
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500',
      component: PlaceholderStep,
      estimatedTime: '1 min',
    },
  ];

  const navigateToStep = (stepId: string) => {
    const params = new URLSearchParams();
    params.set('step', stepId);
    if (productId) {
      params.set('productId', productId);
    }
    router.push(`/dashboard/create/tip-jar?${params.toString()}`);
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === step);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (!completedSteps.includes(step)) {
        setCompletedSteps([...completedSteps, step]);
      }
      navigateToStep(nextStep.id);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === step);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      navigateToStep(prevStep.id);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      sonnerToast.error("Please select an image file (PNG, JPG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      sonnerToast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Failed to upload image");

      const { storageId } = await result.json();
      const publicUrl = await getFileUrl({ storageId });

      if (publicUrl) {
        setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
        sonnerToast.success("Image uploaded successfully!");
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      console.error("Upload error:", error);
      sonnerToast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const [draftId, setDraftId] = useState<string | null>(productId || null);

  const handleSaveDraft = async () => {
    if (!storeId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing store or user information. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
      return;
    }

    try {
      if (isEditing && productId) {
        await updateProduct({
          id: productId,
          title: formData.title || 'Untitled Tip Jar',
          description: formData.description || '',
          price: formData.suggestedAmount || 5,
          imageUrl: formData.imageUrl || undefined,
          isPublished: false,
        });
        toast({
          title: "Draft saved!",
          description: "Your changes have been saved.",
          className: "bg-white dark:bg-black",
        });
      } else if (draftId) {
        await updateProduct({
          id: draftId as Id<"digitalProducts">,
          title: formData.title || 'Untitled Tip Jar',
          description: formData.description || '',
          price: formData.suggestedAmount || 5,
          imageUrl: formData.imageUrl || undefined,
          isPublished: false,
        });
        toast({
          title: "Draft saved!",
          description: "Your changes have been saved.",
          className: "bg-white dark:bg-black",
        });
      } else {
        const newProductId = await createProduct({
          title: formData.title || 'Untitled Tip Jar',
          description: formData.description || '',
          storeId: storeId,
          userId: user.id,
          productType: "digital",
          productCategory: "tip-jar" as ProductCategory,
          pricingModel: 'paid',
          price: formData.suggestedAmount || 5,
          imageUrl: formData.imageUrl || undefined,
          tags: formData.tags || [],
          isPublished: false,
        });
        setDraftId(newProductId);
        toast({
          title: "Draft created!",
          description: "Your tip jar has been saved as a draft.",
          className: "bg-white dark:bg-black",
        });
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      toast({
        title: "Error saving draft",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    }
  };

  const handlePublish = async () => {
    if (!storeId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing store or user information. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
      return;
    }

    try {
      if (isEditing && productId) {
        await updateProduct({
          id: productId,
          title: formData.title || 'Untitled Tip Jar',
          description: formData.description || '',
          price: formData.suggestedAmount || 5,
          imageUrl: formData.imageUrl || undefined,
          isPublished: true,
        });
        toast({
          title: "Tip Jar updated!",
          description: `"${formData.title}" has been updated successfully.`,
          className: "bg-white dark:bg-black",
        });
      } else {
        await createProduct({
          title: formData.title || 'Untitled Tip Jar',
          description: formData.description || '',
          storeId: storeId,
          userId: user.id,
          productType: "digital",
          productCategory: "tip-jar" as ProductCategory,
          pricingModel: 'paid',
          price: formData.suggestedAmount || 5,
          imageUrl: formData.imageUrl || undefined,
          tags: formData.tags || [],
        });
        toast({
          title: "Tip Jar created!",
          description: `"${formData.title}" is now live.`,
          className: "bg-white dark:bg-black",
        });
      }
      router.push('/dashboard?mode=create');
    } catch (error: any) {
      console.error('Failed to publish:', error);
      toast({
        title: isEditing ? "Error updating tip jar" : "Error creating tip jar",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    }
  };

  const canPublish = Boolean(
    formData.title &&
    formData.description &&
    formData.suggestedAmount >= 1
  );

  // Render Basics Step
  const renderBasicsStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Create Your Tip Jar</h2>
          <p className="text-sm text-muted-foreground">Let fans support your work with tips</p>
        </div>
      </div>

      {/* Title */}
      <ValidatedField
        id="title"
        label="Title"
        value={formData.title}
        onChange={(title) => setFormData(prev => ({ ...prev, title }))}
        required
        rules={[validationRules.minLength(3, "Title must be at least 3 characters")]}
        placeholder="e.g., Support My Music, Buy Me a Coffee"
        description="What should fans see when they tip you?"
        className="text-lg"
      />

      {/* Description */}
      <div className="space-y-2">
        <ValidatedField
          id="description"
          label="Description"
          type="textarea"
          value={formData.description}
          onChange={(description) => setFormData(prev => ({ ...prev, description }))}
          required
          rules={[validationRules.minLength(10, "Description must be at least 10 characters")]}
          placeholder="Tell supporters what their tips help you create - new music, better equipment, more free content..."
          rows={4}
          maxLength={500}
          showCharCount
        />
        <div className="flex justify-end">
          <ProductAIAssistant
            title={formData.title}
            description={formData.description}
            category="tip-jar"
            onDescriptionUpdate={(description) => setFormData(prev => ({ ...prev, description }))}
            onTagsUpdate={(tags) => setFormData(prev => ({ ...prev, tags }))}
            onTitleUpdate={(title) => setFormData(prev => ({ ...prev, title }))}
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Cover Image (Optional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {formData.imageUrl ? (
          <div className="relative">
            <img
              src={formData.imageUrl}
              alt="Thumbnail preview"
              className="h-48 w-full rounded-lg object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Change Image"
              )}
            </Button>
          </div>
        ) : (
          <Card
            className={`cursor-pointer border-2 border-dashed transition-colors hover:border-primary/50 ${
              isUploading ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <div
              className="p-8 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 font-medium">Upload a cover image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/create')}>
          Cancel
        </Button>
        <Button
          onClick={handleNext}
          disabled={!formData.title || !formData.description}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render Publish Step (includes suggested amount)
  const renderPublishStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ready to Launch?</h2>
        <p className="text-muted-foreground">
          Set your suggested tip amount and publish your tip jar
        </p>
      </div>

      {/* Suggested Amount Card */}
      <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Pay What You Want</h3>
              <p className="text-sm text-muted-foreground">
                Supporters can tip any amount. You set the suggested default.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                Fans choose how much to give
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                One-time support payments
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                Instant Stripe checkout
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-pink-500" />
                Thank supporters with a custom message
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="suggestedAmount" className="text-lg font-semibold">
                Suggested Tip Amount (USD)
              </Label>
              <div className="relative max-w-xs mt-2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </div>
                <Input
                  id="suggestedAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.suggestedAmount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    suggestedAmount: Math.max(1, Number(e.target.value))
                  }))}
                  className="pl-8 text-2xl font-bold h-14"
                  placeholder="5"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is the default shown to supporters. They can adjust up or down.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Preview</h3>
          <div className="flex items-start gap-4">
            {formData.imageUrl ? (
              <img
                src={formData.imageUrl}
                alt="Tip jar thumbnail"
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Coffee className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-lg">{formData.title || 'Untitled Tip Jar'}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {formData.description || 'No description'}
              </p>
              <p className="text-lg font-bold text-green-600 mt-2">
                ${formData.suggestedAmount} suggested
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handlePublish}
          disabled={!canPublish}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isEditing ? 'Update Tip Jar' : 'Publish Tip Jar'}
        </Button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'basics':
        return renderBasicsStep();
      case 'publish':
        return renderPublishStep();
      default:
        return <div>Step not found</div>;
    }
  };

  // Loading state
  if (isEditing && existingProduct === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tip jar...</p>
        </div>
      </div>
    );
  }

  return (
    <CreationShell
      productLabel={`${isEditing ? 'Edit' : 'Create'} Tip Jar`}
      productIcon="☕"
      steps={steps}
      currentStepId={step}
      completedSteps={completedSteps}
      onNavigateToStep={navigateToStep}
      onSaveDraft={handleSaveDraft}
      onPublish={step === 'publish' ? handlePublish : undefined}
      canPublish={canPublish}
    >
      {renderStep()}
    </CreationShell>
  );
}
