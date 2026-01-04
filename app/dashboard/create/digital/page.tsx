'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CreationShell } from '../components/CreationShell';
import { BasicsStep } from '../steps/BasicsStep';
import { PricingStep } from '../steps/PricingStep';
import { PublishStep } from '../steps/PublishStep';
import { ProductCategory, getProductInfo, BaseProductFormData } from '../types';
import { Package, DollarSign, Sparkles } from 'lucide-react';
import { useValidStoreId } from '@/hooks/useStoreId';
import { useToast } from '@/hooks/use-toast';

export default function DigitalProductCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const storeId = useValidStoreId();
  const { toast } = useToast();

  // Mutation to create the product
  // @ts-ignore - Type instantiation depth issue
  const createProduct = useMutation(api.universalProducts.createUniversalProduct as any);

  // Get category from URL
  const category = searchParams.get('category') as ProductCategory || 'sample-pack';
  const step = searchParams.get('step') || 'basics';
  
  const productInfo = getProductInfo(category);

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

  // Update category if URL changes
  useEffect(() => {
    if (category) {
      setFormData(prev => ({ ...prev, productCategory: category }));
    }
  }, [category]);

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
    router.push(`/dashboard/create/digital?category=${category}&step=${stepId}`);
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

  const handleSaveDraft = async () => {
    console.log('Saving draft:', formData);
    // TODO: Implement save draft mutation
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
      // Determine productType based on category
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

      console.log('Creating product:', productData);
      
      const productId = await createProduct(productData);
      
      toast({
        title: "Product created! 🎉",
        description: `"${formData.title}" has been published successfully.`,
        className: "bg-white dark:bg-black",
      });

      // Navigate to the products page
      router.push('/dashboard?mode=create');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast({
        title: "Error creating product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    }
  };

  const canPublish = 
    formData.title && 
    formData.description && 
    (formData.pricingModel === 'free_with_gate' || (formData.pricingModel === 'paid' && formData.price && formData.price > 0));

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

  return (
    <CreationShell
      productLabel={productInfo?.label || 'Digital Product'}
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


