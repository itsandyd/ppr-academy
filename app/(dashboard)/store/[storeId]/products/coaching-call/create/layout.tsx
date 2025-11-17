'use client';

import React, { useState } from 'react';
import { usePathname, useSearchParams, useRouter, useParams } from 'next/navigation';
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Image, ShoppingCart, Calendar, Sliders, Save, Sparkles, Clock, CheckCircle, Users, Smartphone, DollarSign, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { CoachingCallPhonePreview } from './CoachingCallPhonePreview';
import { CheckoutPhonePreview } from './checkout/CheckoutPhonePreview';
import { CoachingPreviewProvider, useCoachingPreview } from './CoachingPreviewContext';

// Prevent static generation
export const dynamic = 'force-dynamic';

const steps = [
  { 
    id: 'details', 
    label: 'Session Details', 
    icon: Users,
    description: 'Basic session info & thumbnail',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'pricing', 
    label: 'Pricing Model', 
    icon: DollarSign,
    description: 'Free or paid session',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'checkout', 
    label: 'Checkout Page', 
    icon: ShoppingCart,
    description: 'Payment settings',
    color: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'availability', 
    label: 'Availability', 
    icon: Calendar,
    description: 'Schedule & booking',
    color: 'from-orange-500 to-red-500'
  },
  { 
    id: 'options', 
    label: 'Options', 
    icon: Sliders,
    description: 'Advanced features',
    color: 'from-pink-500 to-rose-500'
  },
];

interface WizardLayoutProps {
  children: React.ReactNode;
}

function WizardLayoutInner({ children }: WizardLayoutProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routerParams = useParams();
  const router = useRouter();
  const currentStep = searchParams.get('step') ?? 'thumbnail';
  const storeId = routerParams.storeId as string;
  const { formData, imagePreviewUrl } = useCoachingPreview();
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  const isCheckoutPage = currentStep === "checkout";
  const isAvailabilityPage = currentStep === "availability";
  const isOptionsPage = currentStep === "options";

  // Get store and user data
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get display name and avatar
  const displayName = convexUser?.name || 
    (user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.lastName || "Coach");
    
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = convexUser?.imageUrl || user?.imageUrl || "";

  const navigateToStep = (step: string) => {
    router.push(`${pathname}?step=${step}`, { scroll: false });
  };

  // Dynamic steps based on pricing model (matches course pattern)
  const isPaid = formData.pricingModel === "paid";
  const isFree = formData.pricingModel === "free_with_gate";
  
  const dynamicSteps = [
    steps[0], // details
    steps[1], // pricing
    ...(isPaid ? [steps[2]] : []), // checkout (if paid)
    ...(isFree ? [{ 
      id: 'followGate', 
      label: 'Download Gate', 
      icon: Lock,
      description: 'Require follows',
      color: 'from-purple-500 to-pink-500'
    }] : []),
    steps[3], // availability
    steps[4], // options
  ];

  // Calculate progress
  const currentStepIndex = dynamicSteps.findIndex(s => s.id === currentStep);
  const completedSteps = currentStepIndex;
  const progressPercentage = ((currentStepIndex + 1) / dynamicSteps.length) * 100;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24">
          <div className="lg:flex lg:gap-8 xl:gap-20">
            <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="animate-pulse">
                <div className="h-6 sm:h-8 bg-muted rounded w-1/3 sm:w-1/4 mb-6 sm:mb-8"></div>
                <div className="h-64 sm:h-96 bg-muted rounded"></div>
              </div>
            </div>
            <div className="hidden lg:block w-[356px] h-[678px] bg-muted rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Coaching Session Creation</h1>
                <p className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {dynamicSteps.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Auto-saving</span>
              </div>
              <Progress value={progressPercentage} className="w-24 h-2" />
              <span className="text-sm font-medium text-foreground">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2">
            {/* Step Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center bg-card rounded-full p-2 shadow-lg border border-border">
                  {dynamicSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isComplete = currentStepIndex > index;
                    const isPrevious = currentStepIndex > index;
                    
                    return (
                      <div key={step.id} className="flex items-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigateToStep(step.id)}
                          className={`relative p-3 rounded-full transition-all duration-300 ${
                            isActive 
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                              : isComplete || isPrevious
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {isComplete && !isActive && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.button>
                        {index < dynamicSteps.length - 1 && (
                          <div className={`w-8 h-0.5 mx-2 ${
                            isPrevious || isComplete ? "bg-green-300 dark:bg-green-700" : "bg-border"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Step Info */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full shadow-sm border border-border mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${dynamicSteps.find(s => s.id === currentStep)?.color} text-white`}>
                    {React.createElement(dynamicSteps.find(s => s.id === currentStep)?.icon || Image, { className: "w-4 h-4" })}
                  </div>
                  <span className="font-semibold text-foreground">
                    {dynamicSteps.find(s => s.id === currentStep)?.label}
                  </span>
                </div>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {dynamicSteps.find(s => s.id === currentStep)?.description}
                </p>
              </div>
            </motion.div>

            {/* Form Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mb-8"
            >
              <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
                <div className="p-8 lg:p-12">
                  {children}
                </div>
              </div>
            </motion.div>

            {/* Action Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl shadow-lg border border-border/50 p-6"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Changes saved automatically
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Progress:</span>
                    <div className="flex gap-1">
                      {dynamicSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index <= currentStepIndex ? "bg-green-500" : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline"
                    className="h-12 px-6 rounded-xl hover:shadow-md transition-all"
                    onClick={() => router.push(`/store/${storeId}/products`)}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Handle publish logic here
                      router.push(`/store/${storeId}/products`);
                    }}
                    className="h-12 px-8 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Publish Session
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Preview Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl shadow-lg border border-border/50 p-3"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Live Preview</h3>
                </div>
                <div className="hidden lg:block flex justify-center -mx-1">
                  {isCheckoutPage || isAvailabilityPage || isOptionsPage ? (
                    <CheckoutPhonePreview 
                      title={formData.title}
                      description={formData.description}
                      price={formData.price}
                      duration={formData.duration}
                      imageUrl={imagePreviewUrl}
                      user={{
                        displayName,
                        initials,
                        avatarUrl,
                        storeSlug: store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"
                      }}
                    />
                  ) : (
                    <CoachingCallPhonePreview 
                      style={formData.style}
                      title={formData.title}
                      price={formData.price}
                      duration={formData.duration}
                      imageUrl={imagePreviewUrl}
                      user={{
                        displayName,
                        initials,
                        avatarUrl,
                        storeSlug: store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"
                      }}
                    />
                  )}
                </div>
                <div className="lg:hidden">
                  <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Smartphone className="w-4 h-4 mr-2" />
                        View Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <div className="p-4">
                        {isCheckoutPage || isAvailabilityPage || isOptionsPage ? (
                          <CheckoutPhonePreview 
                            title={formData.title}
                            description={formData.description}
                            price={formData.price}
                            duration={formData.duration}
                            imageUrl={imagePreviewUrl}
                            user={{
                              displayName,
                              initials,
                              avatarUrl,
                              storeSlug: store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"
                            }}
                          />
                        ) : (
                          <CoachingCallPhonePreview 
                            style={formData.style}
                            title={formData.title}
                            price={formData.price}
                            duration={formData.duration}
                            imageUrl={imagePreviewUrl}
                            user={{
                              displayName,
                              initials,
                              avatarUrl,
                              storeSlug: store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"
                            }}
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </motion.div>

              {/* Progress Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
              >
                <h3 className="font-semibold text-foreground mb-4">Your Progress</h3>
                <div className="space-y-3">
                  {dynamicSteps.map((step, index) => {
                    const isComplete = currentStepIndex > index;
                    const isActive = currentStep === step.id;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isComplete 
                            ? "bg-green-500 text-white" 
                            : isActive 
                            ? `bg-gradient-to-r ${step.color} text-white`
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            isActive ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        {isComplete && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WizardLayout({ children }: WizardLayoutProps) {
  return (
    <CoachingPreviewProvider>
      <WizardLayoutInner>{children}</WizardLayoutInner>
    </CoachingPreviewProvider>
  );
} 