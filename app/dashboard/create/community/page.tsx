"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { CommunityBasicsForm } from "./steps/CommunityBasicsForm";
import { CommunityAccessForm } from "./steps/CommunityAccessForm";
import { CommunityPublishForm } from "./steps/CommunityPublishForm";

function CommunityCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <CommunityBasicsForm />;
      case "access":
        return <CommunityAccessForm />;
      case "publish":
        return <CommunityPublishForm />;
      default:
        return <CommunityBasicsForm />;
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

export default function CommunityCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      }
    >
      <CommunityCreateContent />
    </Suspense>
  );
}
