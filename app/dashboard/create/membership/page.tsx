"use client";

import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useMembershipCreation } from "./context";
import { MembershipBasicsForm } from "./steps/MembershipBasicsForm";
import { MembershipPricingForm } from "./steps/MembershipPricingForm";
import { MembershipContentForm } from "./steps/MembershipContentForm";

function MembershipCreateContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get("step") || "basics";
  const { state } = useMembershipCreation();

  const renderStep = () => {
    switch (step) {
      case "basics":
        return <MembershipBasicsForm />;
      case "pricing":
        return <MembershipPricingForm />;
      case "content":
        return <MembershipContentForm />;
      default:
        return <MembershipBasicsForm />;
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

export default function MembershipCreatePage() {
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
      <MembershipCreateContent />
    </Suspense>
  );
}
