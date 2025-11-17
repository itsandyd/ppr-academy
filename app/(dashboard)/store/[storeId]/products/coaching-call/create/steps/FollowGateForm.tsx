"use client";

import { useCoachingPreview } from "../CoachingPreviewContext";
import { FollowGateConfigStep } from "../../../create/components/FollowGateConfigStep";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import type { FollowGateConfig } from "../../../create/types";

export function FollowGateForm() {
  const { formData, updateFormData } = useCoachingPreview();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;

  const currentConfig: FollowGateConfig | undefined = formData.followGateRequirements ? {
    requireEmail: formData.followGateRequirements.requireEmail || false,
    requireInstagram: formData.followGateRequirements.requireInstagram || false,
    requireTiktok: formData.followGateRequirements.requireTiktok || false,
    requireYoutube: formData.followGateRequirements.requireYoutube || false,
    requireSpotify: formData.followGateRequirements.requireSpotify || false,
    minFollowsRequired: formData.followGateRequirements.minFollowsRequired || 0,
    socialLinks: formData.followGateSocialLinks || {},
    customMessage: formData.followGateMessage,
  } : undefined;

  const handleConfigChange = (config: FollowGateConfig) => {
    updateFormData({
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

  const handleContinue = () => {
    const qs = new URLSearchParams(searchParams);
    qs.set('step', 'availability');
    router.push(`/store/${storeId}/products/coaching-call/create?${qs.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const qs = new URLSearchParams(searchParams);
    qs.set('step', 'pricing');
    router.push(`/store/${storeId}/products/coaching-call/create?${qs.toString()}`, { scroll: false });
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

