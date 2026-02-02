"use client";

import { useBundleCreation } from "../context";
import { useRouter } from "next/navigation";
import { FollowGateConfigStep } from "../../shared/FollowGateConfigStep";
import { FollowGateConfig } from "../../types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function BundleFollowGateForm() {
  const { state, updateData, saveBundle, createBundle, canPublish } = useBundleCreation();
  const router = useRouter();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);

  // Initialize Follow Gate as enabled when landing on this step
  useEffect(() => {
    if (!state.data.followGateEnabled) {
      updateData("followGate", { followGateEnabled: true });
    }
  }, []);

  const handleConfigChange = (config: FollowGateConfig) => {
    updateData("followGate", {
      followGateConfig: config,
      followGateEnabled: true,
    });
  };

  const handleBack = () => {
    router.push(
      `/dashboard/create/bundle?step=pricing${state.bundleId ? `&bundleId=${state.bundleId}` : ""}`
    );
  };

  const handleContinue = async () => {
    setIsPublishing(true);
    try {
      await saveBundle();
      const result = await createBundle();
      if (result.success) {
        toast({ title: "Bundle Published!", description: "Your bundle is now live." });
        router.push(`/dashboard?mode=create`);
      } else {
        toast({
          title: "Publish Failed",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Publish Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <FollowGateConfigStep
      config={state.data.followGateConfig}
      onConfigChange={handleConfigChange}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
}
