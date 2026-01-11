"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useMixingTemplateCreation } from "./context";
import { TemplateBasicsForm } from "./steps/TemplateBasicsForm";
import { TemplateFilesForm } from "./steps/TemplateFilesForm";
import { TemplatePricingForm } from "./steps/TemplatePricingForm";
import { TemplateFollowGateForm } from "./steps/TemplateFollowGateForm";

function MixingTemplateCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useMixingTemplateCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <TemplateBasicsForm />;
      case "files":
        return <TemplateFilesForm />;
      case "pricing":
        return <TemplatePricingForm />;
      case "followGate":
        return state.data.pricingModel === "free_with_gate" ? <TemplateFollowGateForm /> : <TemplatePricingForm />;
      default:
        return <TemplateBasicsForm />;
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

export default function MixingTemplateCreatePage() {
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
      <MixingTemplateCreateContent />
    </Suspense>
  );
}
