"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useCoachingCreation } from "./context";
import { BasicsForm } from "./steps/BasicsForm";
import { PricingForm } from "./steps/PricingForm";
import { DiscordForm } from "./steps/DiscordForm";
import { AvailabilityForm } from "./steps/AvailabilityForm";
import { CoachingFollowGateForm } from "./steps/FollowGateForm";

function CoachingCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useCoachingCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <BasicsForm />;
      case "pricing":
        return <PricingForm />;
      case "followGate":
        return state.data.pricingModel === "free_with_gate" ? <CoachingFollowGateForm /> : <DiscordForm />;
      case "discord":
        return <DiscordForm />;
      case "availability":
        return <AvailabilityForm />;
      default:
        return <BasicsForm />;
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

export default function CoachingCreatePage() {
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
      <CoachingCreateContent />
    </Suspense>
  );
}
