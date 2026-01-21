"use client";

import { useMixingTemplateCreation } from "../context";
import { useRouter } from "next/navigation";
import { FollowGateConfigStep } from "../../shared/FollowGateConfigStep";
import type { FollowGateConfig } from "../../types";

export function TemplateFollowGateForm() {
  const { state, updateData, saveTemplate, createTemplate } = useMixingTemplateCreation();
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
  } : {
    requireEmail: true,
    requireInstagram: false,
    requireTiktok: false,
    requireYoutube: false,
    requireSpotify: false,
    minFollowsRequired: 0,
    socialLinks: {},
    customMessage: "",
  };

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
    await saveTemplate();
    const result = await createTemplate();
    if (result.success) {
      router.push('/dashboard?mode=create');
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/create/mixing-template?step=pricing${state.templateId ? `&templateId=${state.templateId}` : ''}`);
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
