"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useBeatLeaseCreation } from "./context";
import { BasicsForm } from "./steps/BasicsForm";
import { MetadataForm } from "./steps/MetadataForm";
import { FilesForm } from "./steps/FilesForm";
import { LicensingForm } from "./steps/LicensingForm";

function BeatLeaseCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useBeatLeaseCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <BasicsForm />;
      case "metadata":
        return <MetadataForm />;
      case "files":
        return <FilesForm />;
      case "licensing":
        return <LicensingForm />;
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

export default function BeatLeaseCreatePage() {
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
      <BeatLeaseCreateContent />
    </Suspense>
  );
}
