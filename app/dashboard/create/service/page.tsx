"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useServiceCreation } from "./context";
import { BasicsForm } from "./steps/BasicsForm";
import { PricingForm } from "./steps/PricingForm";
import { RequirementsForm } from "./steps/RequirementsForm";
import { DeliveryForm } from "./steps/DeliveryForm";

function ServiceCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useServiceCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <BasicsForm />;
      case "pricing":
        return <PricingForm />;
      case "requirements":
        return <RequirementsForm />;
      case "delivery":
        return <DeliveryForm />;
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

export default function ServiceCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-3/4 rounded bg-muted"></div>
            <div className="mb-6 h-4 w-1/2 rounded bg-muted"></div>
            <div className="h-64 rounded bg-muted"></div>
          </div>
        </div>
      }
    >
      <ServiceCreateContent />
    </Suspense>
  );
}
