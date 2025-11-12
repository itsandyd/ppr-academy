"use client";

import { useCourseCreation } from "../context";
import { FollowGateConfigStep } from "../../../products/create/components/FollowGateConfigStep";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import type { FollowGateConfig } from "../../../products/create/types";

export function FollowGateForm() {
  const { state, updateData } = useCourseCreation();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;

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

  const handleContinue = () => {
    const courseId = searchParams.get("courseId");
    router.push(`/store/${storeId}/course/create?step=options${courseId ? `&courseId=${courseId}` : ""}`);
  };

  const handleBack = () => {
    const courseId = searchParams.get("courseId");
    router.push(`/store/${storeId}/course/create?step=pricing${courseId ? `&courseId=${courseId}` : ""}`);
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

