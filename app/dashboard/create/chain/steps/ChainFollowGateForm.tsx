"use client";

import { useEffectChainCreation } from "../context";
import { useRouter } from "next/navigation";
import { FollowGateConfigStep } from "../../shared/FollowGateConfigStep";
import type { FollowGateConfig } from "../../types";

export function ChainFollowGateForm() {
  const { state, updateData, saveChain } = useEffectChainCreation();
  const router = useRouter();

  const currentConfig: FollowGateConfig | undefined = state.data.followGateRequirements ? {
    requireEmail: state.data.followGateRequirements.requireEmail || false,
    requireInstagram: state.data.followGateRequirements.requireInstagram || false,
    requireTiktok: state.data.followGateRequirements.requireTiktok || false,
    requireYoutube: state.data.followGateRequirements.requireYoutube || false,
    requireSpotify: state.data.followGateRequirements.requireSpotify || false,
    minFollowsRequired: state.data.followGateRequirements.minFollowsRequired || 0,
    socialLinks: state.data.followGateSocialLinks || {},
    customMessage: state.data.followGateMessage,
  } : undefined;

  const handleConfigChange = (config: FollowGateConfig) => {
    updateData("followGate", {
      followGateEnabled: true,
      followGateRequirements: {
        requireEmail: config.requireEmail,
        requireInstagram: config.requireInstagram,
        requireTiktok: config.requireTiktok,
        requireYoutube: config.requireYoutube,
        requireSpotify: config.requireSpotify,
        minFollowsRequired: config.minFollowsRequired,
      },
      followGateSocialLinks: config.socialLinks,
      followGateMessage: config.customMessage,
    });
  };

  const handleContinue = async () => {
    await saveChain();
    // FollowGate is last step, ActionBar will show publish button
  };

  const handleBack = () => {
    const dawType = state.data.dawType || "ableton";
    router.push(`/dashboard/create/chain?daw=${dawType}&step=pricing${state.chainId ? `&chainId=${state.chainId}` : ''}`);
  };

  return (
    <FollowGateConfigStep
      config={currentConfig}
      onConfigChange={handleConfigChange}
      onContinue={handleContinue}
      onBack={handleBack}
    />
  );
}
