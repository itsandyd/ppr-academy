"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useProjectFileCreation } from "./context";
import { ProjectBasicsForm } from "./steps/ProjectBasicsForm";
import { ProjectFilesForm } from "./steps/ProjectFilesForm";
import { ProjectPricingForm } from "./steps/ProjectPricingForm";
import { ProjectFollowGateForm } from "./steps/ProjectFollowGateForm";

function ProjectFileCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useProjectFileCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <ProjectBasicsForm />;
      case "files":
        return <ProjectFilesForm />;
      case "pricing":
        return <ProjectPricingForm />;
      case "followGate":
        return state.data.pricingModel === "free_with_gate" ? <ProjectFollowGateForm /> : <ProjectPricingForm />;
      default:
        return <ProjectBasicsForm />;
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

export default function ProjectFileCreatePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    }>
      <ProjectFileCreateContent />
    </Suspense>
  );
}
