"use client";

import { useBundleCreation } from "../context";
import { useRouter } from "next/navigation";
import { FollowGateConfigStep } from "../../shared/FollowGateConfigStep";
import { FollowGateConfig } from "../../types";
import { useEffect } from "react";

export function BundleFollowGateForm() {
  const { state, updateData, saveBundle, createBundle, canPublish } = useBundleCreation();
  const router = useRouter();

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
    await saveBundle();
    const result = await createBundle();
    if (result.success) {
      router.push(`/dashboard?mode=create`);
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
