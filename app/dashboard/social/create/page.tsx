"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSocialPost } from "./context";
import { StepContentSelection } from "./steps/StepContentSelection";
import { StepPlatformScripts } from "./steps/StepPlatformScripts";
import { StepCombineScript } from "./steps/StepCombineScript";
import { StepGenerateImages } from "./steps/StepGenerateImages";
import { StepGenerateAudio } from "./steps/StepGenerateAudio";
import { StepReview } from "./steps/StepReview";

function CreateSocialPostContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "content";
  const { state } = useSocialPost();

  const renderStep = () => {
    switch (step) {
      case "content":
        return <StepContentSelection />;
      case "scripts":
        return <StepPlatformScripts />;
      case "combine":
        return <StepCombineScript />;
      case "images":
        return <StepGenerateImages />;
      case "audio":
        return <StepGenerateAudio />;
      case "review":
        return <StepReview />;
      default:
        return <StepContentSelection />;
    }
  };

  return (
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
  );
}

export default function CreateSocialPostPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 space-y-6">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="mb-6 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800"></div>
            <div className="h-64 rounded bg-gray-200 dark:bg-gray-800"></div>
          </div>
        </div>
      }
    >
      <CreateSocialPostContent />
    </Suspense>
  );
}
