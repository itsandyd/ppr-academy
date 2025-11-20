"use client";

import { ThumbnailForm } from "./steps/ThumbnailForm";
import { CheckoutForm } from "./steps/CheckoutForm";
import { CourseContentForm } from "./steps/CourseContentForm";
import { OptionsForm } from "./steps/OptionsForm";
import { PricingModelForm } from "./steps/PricingModelForm";
import { FollowGateForm } from "./steps/FollowGateForm";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCourseCreation } from "./context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CreditCard, Settings, Sparkles, Clock, CheckCircle, DollarSign, Lock } from "lucide-react";
import { Suspense } from "react";
import { StepProgressIndicator, StepProgressCompact } from "@/components/ui/step-progress-indicator";

// Step metadata for enhanced UI
const stepMetadata = {
  course: {
    title: "Course Information",
    description: "Set up your course basics and content structure",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "5-10 min"
  },
  pricing: {
    title: "Pricing Model",
    description: "Choose free with download gate or paid",
    icon: DollarSign,
    color: "from-purple-500 to-pink-500",
    estimatedTime: "2 min"
  },
  checkout: {
    title: "Checkout Configuration",
    description: "Configure pricing and payment options",
    icon: CreditCard,
    color: "from-emerald-500 to-teal-500",
    estimatedTime: "3-5 min"
  },
  followGate: {
    title: "Download Gate",
    description: "Require follows to unlock free course",
    icon: Lock,
    color: "from-purple-500 to-pink-500",
    estimatedTime: "2-3 min"
  },
  options: {
    title: "Advanced Options",
    description: "Customize course settings and features",
    icon: Settings,
    color: "from-orange-500 to-red-500",
    estimatedTime: "5-8 min"
  }
};

function CreateCourseContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "course";
  const { state } = useCourseCreation();
  
  const currentStepMeta = stepMetadata[step as keyof typeof stepMetadata] || stepMetadata.course;
  const Icon = currentStepMeta.icon;
  const isCompleted = state.stepCompletion[step as keyof typeof state.stepCompletion];

  // Prepare steps for progress indicator (dynamic based on pricing model)
  const isPaid = state.data.pricingModel === "paid";
  const isFree = state.data.pricingModel === "free_with_gate";
  
  const progressSteps = [
    {
      id: "course",
      title: "Course Info",
      description: "Basics & content",
      icon: BookOpen
    },
    {
      id: "pricing",
      title: "Pricing",
      description: "Free or paid",
      icon: DollarSign
    },
    // Conditional steps based on pricing model
    ...(isPaid ? [{
      id: "checkout",
      title: "Checkout",
      description: "Payment setup",
      icon: CreditCard
    }] : []),
    ...(isFree ? [{
      id: "followGate",
      title: "Download Gate",
      description: "Require follows",
      icon: Lock
    }] : []),
    {
      id: "options",
      title: "Options",
      description: "Settings & features",
      icon: Settings
    }
  ];

  const completedSteps = Object.entries(state.stepCompletion)
    .filter(([_, completed]) => completed)
    .map(([stepKey, _]) => stepKey);

  const renderStep = () => {
    switch (step) {
      case "course":
      case "thumbnail": // Redirect old thumbnail step to course
        return <CourseContentForm />;
      case "pricing":
        return <PricingModelForm />;
      case "checkout":
        return <CheckoutForm />;
      case "followGate":
        return <FollowGateForm />;
      case "options":
        return <OptionsForm />;
      default:
        return <CourseContentForm />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Indicator - Desktop */}
      <div className="hidden md:block">
        <StepProgressIndicator
          steps={progressSteps}
          currentStep={step}
          completedSteps={completedSteps}
        />
      </div>

      {/* Progress Indicator - Mobile */}
      <div className="md:hidden">
        <StepProgressCompact
          steps={progressSteps}
          currentStep={step}
          completedSteps={completedSteps}
        />
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    }>
      <CreateCourseContent />
    </Suspense>
  );
} 