'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CreationShell } from '../components/CreationShell';
import { BasicsStep } from '../steps/BasicsStep';
import { PricingStep } from '../steps/PricingStep';
import { PublishStep } from '../steps/PublishStep';
import { ProductCategory, ProductType, getProductInfo, BaseProductFormData } from '../types';
import { Package, DollarSign, Sparkles } from 'lucide-react';
import { useValidStoreId } from '@/hooks/useStoreId';
import { useToast } from '@/hooks/use-toast';
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct } from '@/lib/convex-typed-hooks';
import { Id } from '@/convex/_generated/dataModel';

export default function DigitalProductCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const storeId = useValidStoreId();
  const { toast } = useToast();

  // Mutation to create/update the product
  const createProduct = useCreateUniversalProduct();
  const updateProduct = useUpdateDigitalProduct();

  // Get category and productId from URL
  const category = searchParams.get('category') as ProductCategory || 'sample-pack';
  const productId = searchParams.get('productId') as Id<"digitalProducts"> | null;
  const step = searchParams.get('step') || 'basics';
  const isEditing = !!productId;

  const productInfo = getProductInfo(category);

  // Fetch existing product if editing
  const existingProduct = useDigitalProductById(productId ?? undefined);

  // Form state
  const [formData, setFormData] = useState<Partial<BaseProductFormData>>({
    productCategory: category,
    productType: 'digital',
    title: '',
    description: '',
    imageUrl: '',
    tags: [],
    pricingModel: 'paid',
    price: 0,
    storeId: storeId || '',
    userId: user?.id || '',
    currentStep: 1,
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load existing product data when editing
  useEffect(() => {
    if (existingProduct && !isInitialized) {
      setFormData({
        productCategory: (existingProduct.productCategory as ProductCategory) || category,
        productType: (existingProduct.productType as ProductType) || 'digital',
        title: existingProduct.title || '',
        description: existingProduct.description || '',
        imageUrl: existingProduct.imageUrl || '',
        tags: existingProduct.tags || [],
        pricingModel: existingProduct.price > 0 ? 'paid' : 'free_with_gate',
        price: existingProduct.price || 0,
        storeId: existingProduct.storeId || storeId || '',
        userId: existingProduct.userId || user?.id || '',
        currentStep: 1,
      });
      setIsInitialized(true);
    }
  }, [existingProduct, isInitialized, category, storeId, user?.id]);

  // Update category if URL changes (only for new products)
  useEffect(() => {
    if (category && !isEditing) {
      setFormData(prev => ({ ...prev, productCategory: category }));
    }
  }, [category, isEditing]);

  // Define steps
  const steps = [
    {
      id: 'basics',
      label: 'Basics',
      description: 'Product details and thumbnail',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      component: BasicsStep,
      estimatedTime: '2-3 min',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      description: 'Free or paid',
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      component: PricingStep,
      estimatedTime: '1 min',
    },
    {
      id: 'publish',
      label: 'Publish',
      description: 'Review and publish',
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500',
      component: PublishStep,
      estimatedTime: '1 min',
    },
  ];

  const navigateToStep = (stepId: string) => {
    const params = new URLSearchParams();
    params.set('category', category);
    params.set('step', stepId);
    if (productId) {
      params.set('productId', productId);
    }
    router.push(`/dashboard/create/digital?${params.toString()}`);
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
        // Update existing product as draft
        const updateData: any = {
          id: productId,
          title: formData.title || 'Untitled Product',
          description: formData.description || '',
          price: formData.price || 0,
          imageUrl: formData.imageUrl || undefined,
          isPublished: false,
        };

        await updateProduct(updateData);

        toast({
          title: "Draft saved!",
          description: "Your changes have been saved.",
          className: "bg-white dark:bg-black",
        });
      } else if (draftId) {
        // Update existing draft
        const updateData: any = {
          id: draftId,
          title: formData.title || 'Untitled Product',
          description: formData.description || '',
          price: formData.price || 0,
          imageUrl: formData.imageUrl || undefined,
          isPublished: false,
        };

        await updateProduct(updateData);

        toast({
          title: "Draft saved!",
          description: "Your changes have been saved.",
          className: "bg-white dark:bg-black",
        });
      } else {
        // Create new draft
        const productData: any = {
          title: formData.title || 'Untitled Product',
          description: formData.description || '',
          storeId: storeId,
          userId: user.id,
          productType: "digital",
          productCategory: formData.productCategory || category,
          pricingModel: formData.pricingModel || 'paid',
          price: formData.price || 0,
          imageUrl: formData.imageUrl || undefined,
          tags: formData.tags || [],
          isPublished: false,
        };

        const newProductId = await createProduct(productData);
        setDraftId(newProductId);

        toast({
          title: "Draft created!",
          description: "Your product has been saved as a draft.",
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
        // Update existing product
        const updateData: any = {
          id: productId,
          title: formData.title || 'Untitled Product',
          description: formData.description || '',
          price: formData.price || 0,
          imageUrl: formData.imageUrl || undefined,
          isPublished: true,
        };

        await updateProduct(updateData);
        
        toast({
          title: "Product updated! 🎉",
          description: `"${formData.title}" has been updated successfully.`,
          className: "bg-white dark:bg-black",
        });
      } else {
        // Create new product
        const productType = "digital";
        
        // Build the product data
        const productData: any = {
          title: formData.title || 'Untitled Product',
          description: formData.description || '',
          storeId: storeId,
          userId: user.id,
          productType: productType,
          productCategory: formData.productCategory || category,
          pricingModel: formData.pricingModel || 'paid',
          price: formData.price || 0,
          imageUrl: formData.imageUrl || undefined,
          tags: formData.tags || [],
        };

        // Add follow gate config for free products
        if (productData.pricingModel === 'free_with_gate') {
          productData.followGateConfig = {
            requireEmail: true,
            requireInstagram: false,
            requireTiktok: false,
            requireYoutube: false,
            requireSpotify: false,
            minFollowsRequired: 0,
            socialLinks: {},
          };
        }

        await createProduct(productData);
        
        toast({
          title: "Product created! 🎉",
          description: `"${formData.title}" has been published successfully.`,
          className: "bg-white dark:bg-black",
        });
      }

      // Navigate to the products page
      router.push('/dashboard?mode=create');
    } catch (error: any) {
      console.error('Failed to save product:', error);
      toast({
        title: isEditing ? "Error updating product" : "Error creating product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    }
  };

  const canPublish = Boolean(
    formData.title &&
    formData.description &&
    (formData.pricingModel === 'free_with_gate' || (formData.pricingModel === 'paid' && formData.price && formData.price > 0)));

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'basics':
        return (
          <BasicsStep
            productCategory={formData.productCategory!}
            title={formData.title || ''}
            description={formData.description || ''}
            imageUrl={formData.imageUrl || ''}
            tags={formData.tags || []}
            onTitleChange={(title) => setFormData({ ...formData, title })}
            onDescriptionChange={(description) => setFormData({ ...formData, description })}
            onImageChange={(imageUrl) => setFormData({ ...formData, imageUrl })}
            onTagsChange={(tags) => setFormData({ ...formData, tags })}
            onNext={handleNext}
          />
        );
      
      case 'pricing':
        return (
          <PricingStep
            productCategory={formData.productCategory}
            pricingModel={formData.pricingModel!}
            price={formData.price || 0}
            onPricingModelChange={(pricingModel) => setFormData({ ...formData, pricingModel })}
            onPriceChange={(price) => setFormData({ ...formData, price })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      
      case 'publish':
        return (
          <PublishStep
            formData={formData}
            onBack={handleBack}
            onPublish={handlePublish}
          />
        );
      
      default:
        return <div>Step not found</div>;
    }
  };

  // Show loading state while fetching existing product
  if (isEditing && existingProduct === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <CreationShell
      productLabel={`${isEditing ? 'Edit' : 'Create'} ${productInfo?.label || 'Digital Product'}`}
      productIcon={productInfo?.icon || '📦'}
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


