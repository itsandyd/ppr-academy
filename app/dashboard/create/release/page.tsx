"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useReleaseCreation } from "./context";
import { ReleaseBasicsForm } from "./steps/ReleaseBasicsForm";
import { ReleasePlatformsForm } from "./steps/ReleasePlatformsForm";
import { ReleasePresaveForm } from "./steps/ReleasePresaveForm";
import { ReleaseDripForm } from "./steps/ReleaseDripForm";

function ReleaseCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useReleaseCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <ReleaseBasicsForm />;
      case "platforms":
        return <ReleasePlatformsForm />;
      case "presave":
        return <ReleasePresaveForm />;
      case "drip":
        return <ReleaseDripForm />;
      default:
        return <ReleaseBasicsForm />;
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

export default function ReleaseCreatePage() {
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
      <ReleaseCreateContent />
    </Suspense>
  );
}
