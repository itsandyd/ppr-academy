"use client";

import React, { useState } from "react";
import { usePathname, useSearchParams, useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Image,
  ShoppingCart,
  Calendar,
  Sliders,
  Save,
  Sparkles,
  Clock,
  CheckCircle,
  Users,
  Smartphone,
  DollarSign,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { CoachingCallPhonePreview } from "./CoachingCallPhonePreview";
import { CheckoutPhonePreview } from "./checkout/CheckoutPhonePreview";
import { CoachingPreviewProvider, useCoachingPreview } from "./CoachingPreviewContext";

// Prevent static generation
export const dynamic = "force-dynamic";

const steps = [
  {
    id: "details",
    label: "Session Details",
    icon: Users,
    description: "Basic session info & thumbnail",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "pricing",
    label: "Pricing Model",
    icon: DollarSign,
    description: "Free or paid session",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "checkout",
    label: "Checkout Page",
    icon: ShoppingCart,
    description: "Payment settings",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "availability",
    label: "Availability",
    icon: Calendar,
    description: "Schedule & booking",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "options",
    label: "Options",
    icon: Sliders,
    description: "Advanced features",
    color: "from-pink-500 to-rose-500",
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
  const currentStep = searchParams.get("step") ?? "thumbnail";
  const storeId = routerParams.storeId as string;
  const { formData, imagePreviewUrl } = useCoachingPreview();
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const isCheckoutPage = currentStep === "checkout";
  const isAvailabilityPage = currentStep === "availability";
  const isOptionsPage = currentStep === "options";

  // Get store and user data
  const store = useQuery(api.stores.getStoreById, storeId ? { storeId: storeId as any } : "skip");

  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // Get display name and avatar
  const displayName =
    convexUser?.name ||
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.lastName || "Coach");

  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
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
    ...(isFree
      ? [
          {
            id: "followGate",
            label: "Download Gate",
            icon: Lock,
            description: "Require follows",
            color: "from-purple-500 to-pink-500",
          },
        ]
      : []),
    steps[3], // availability
    steps[4], // options
  ];

  // Calculate progress
  const currentStepIndex = dynamicSteps.findIndex((s) => s.id === currentStep);
  const completedSteps = currentStepIndex;
  const progressPercentage = ((currentStepIndex + 1) / dynamicSteps.length) * 100;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
          <div className="lg:flex lg:gap-8 xl:gap-20">
            <div className="flex-1 space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="animate-pulse">
                <div className="mb-6 h-6 w-1/3 rounded bg-muted sm:mb-8 sm:h-8 sm:w-1/4"></div>
                <div className="h-64 rounded bg-muted sm:h-96"></div>
              </div>
            </div>
            <div className="hidden h-[678px] w-[356px] animate-pulse rounded-3xl bg-muted lg:block" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Coaching Session Creation</h1>
                <p className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {dynamicSteps.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1 sm:flex">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Auto-saving</span>
              </div>
              <Progress value={progressPercentage} className="h-2 w-24" />
              <span className="text-sm font-medium text-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Main Content Area */}
          <div className="xl:col-span-2">
            {/* Step Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="mb-6 flex items-center justify-center">
                <div className="flex items-center rounded-full border border-border bg-card p-2 shadow-lg">
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
                          className={`relative rounded-full p-3 transition-all duration-300 ${
                            isActive
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                              : isComplete || isPrevious
                                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {isComplete && !isActive && (
                            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </motion.button>
                        {index < dynamicSteps.length - 1 && (
                          <div
                            className={`mx-2 h-0.5 w-8 ${
                              isPrevious || isComplete
                                ? "bg-green-300 dark:bg-green-700"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Step Info */}
              <div className="text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                  <div
                    className={`rounded-lg bg-gradient-to-r p-2 ${dynamicSteps.find((s) => s.id === currentStep)?.color} text-white`}
                  >
                    {React.createElement(
                      dynamicSteps.find((s) => s.id === currentStep)?.icon || Image,
                      { className: "w-4 h-4" }
                    )}
                  </div>
                  <span className="font-semibold text-foreground">
                    {dynamicSteps.find((s) => s.id === currentStep)?.label}
                  </span>
                </div>
                <p className="mx-auto max-w-md text-muted-foreground">
                  {dynamicSteps.find((s) => s.id === currentStep)?.description}
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
              <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl">
                <div className="p-8 lg:p-12">{children}</div>
              </div>
            </motion.div>

            {/* Action Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
            >
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Changes saved automatically
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Progress:</span>
                    <div className="flex gap-1">
                      {dynamicSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 w-2 rounded-full ${
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
                    className="h-12 rounded-xl px-6 transition-all hover:shadow-md"
                    onClick={() => router.push(`/store/${storeId}/products`)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>

                  <Button
                    onClick={() => {
                      // Handle publish logic here
                      router.push(`/store/${storeId}/products`);
                    }}
                    className="h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
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
                className="rounded-2xl border border-border/50 bg-card p-3 shadow-lg"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Live Preview</h3>
                </div>
                <div className="-mx-1 flex hidden justify-center lg:block">
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
                        storeSlug:
                          store?.slug || store?.name?.toLowerCase().replace(/\s+/g, "") || "store",
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
                        storeSlug:
                          store?.slug || store?.name?.toLowerCase().replace(/\s+/g, "") || "store",
                      }}
                    />
                  )}
                </div>
                <div className="lg:hidden">
                  <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Smartphone className="mr-2 h-4 w-4" />
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
                              storeSlug:
                                store?.slug ||
                                store?.name?.toLowerCase().replace(/\s+/g, "") ||
                                "store",
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
                              storeSlug:
                                store?.slug ||
                                store?.name?.toLowerCase().replace(/\s+/g, "") ||
                                "store",
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
                className="rounded-2xl border border-border/50 bg-card p-6"
              >
                <h3 className="mb-4 font-semibold text-foreground">Your Progress</h3>
                <div className="space-y-3">
                  {dynamicSteps.map((step, index) => {
                    const isComplete = currentStepIndex > index;
                    const isActive = currentStep === step.id;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            isComplete
                              ? "bg-green-500 text-white"
                              : isActive
                                ? `bg-gradient-to-r ${step.color} text-white`
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              isActive ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                        {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
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
