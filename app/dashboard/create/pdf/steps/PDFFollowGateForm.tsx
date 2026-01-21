"use client";

import { usePDFCreation } from "../context";
import { useRouter } from "next/navigation";
import { FollowGateConfigStep } from "../../shared/FollowGateConfigStep";
import type { FollowGateConfig } from "../../types";

export function PDFFollowGateForm() {
  const { state, updateData, savePDF } = usePDFCreation();
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
    await savePDF();
    const pdfType = state.data.pdfType || "sample-pdf";
    router.push(`/dashboard/create/pdf?type=${pdfType}&step=files${state.pdfId ? `&pdfId=${state.pdfId}` : ''}`);
  };

  const handleBack = () => {
    const pdfType = state.data.pdfType || "sample-pdf";
    router.push(`/dashboard/create/pdf?type=${pdfType}&step=pricing${state.pdfId ? `&pdfId=${state.pdfId}` : ''}`);
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
