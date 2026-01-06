"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useBundleCreation } from "./context";
import { BundleBasicsForm } from "./steps/BundleBasicsForm";
import { BundleProductsForm } from "./steps/BundleProductsForm";
import { BundlePricingForm } from "./steps/BundlePricingForm";

function BundleCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useBundleCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <BundleBasicsForm />;
      case "products":
        return <BundleProductsForm />;
      case "pricing":
        return <BundlePricingForm />;
      default:
        return <BundleBasicsForm />;
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

export default function BundleCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-3/4 rounded bg-muted"></div>
            <div className="mb-6 h-4 w-1/2 rounded bg-muted"></div>
            <div className="h-64 rounded bg-muted"></div>
          </div>
        </div>
      }
    >
      <BundleCreateContent />
    </Suspense>
  );
}
