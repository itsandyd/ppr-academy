// Export all individual templates
export {
  samplePackLaunchTemplate,
  courseLaunchTemplate,
  presetPackLaunchTemplate,
  bundleLaunchTemplate,
  productLaunchTemplates,
} from "./product-launch";

export {
  flashSale24HourTemplate,
  weekendSaleTemplate,
  lastChanceTemplate,
  flashSaleTemplates,
} from "./flash-sale";

export {
  newSubscriberWelcomeTemplate,
  freeDownloadDeliveryTemplate,
  getToKnowYouTemplate,
  welcomeOnboardingTemplates,
} from "./welcome-onboarding";

export {
  winBackInactiveTemplate,
  weMissYouTemplate,
  reengagementTemplates,
} from "./reengagement";

export {
  courseCompletionTemplate,
  moduleCompletionTemplate,
  certificateEarnedTemplate,
  courseMilestoneTemplates,
} from "./course-milestone";

export {
  blackFridayTemplate,
  newYearSaleTemplate,
  summerSaleTemplate,
  anniversaryTemplate,
  backToSchoolTemplate,
  seasonalHolidayTemplates,
} from "./seasonal-holiday";

// Import types
import { MarketingCampaignTemplate, CampaignType } from "../types";

// Import template arrays
import { productLaunchTemplates } from "./product-launch";
import { flashSaleTemplates } from "./flash-sale";
import { welcomeOnboardingTemplates } from "./welcome-onboarding";
import { reengagementTemplates } from "./reengagement";
import { courseMilestoneTemplates } from "./course-milestone";
import { seasonalHolidayTemplates } from "./seasonal-holiday";

// All templates combined (20 total)
export const allMarketingTemplates: MarketingCampaignTemplate[] = [
  ...productLaunchTemplates,
  ...flashSaleTemplates,
  ...welcomeOnboardingTemplates,
  ...reengagementTemplates,
  ...courseMilestoneTemplates,
  ...seasonalHolidayTemplates,
];

// Get templates by campaign type
export const templatesByType: Record<CampaignType, MarketingCampaignTemplate[]> = {
  product_launch: productLaunchTemplates,
  flash_sale: flashSaleTemplates,
  welcome_onboarding: welcomeOnboardingTemplates,
  reengagement: reengagementTemplates,
  course_milestone: courseMilestoneTemplates,
  seasonal_holiday: seasonalHolidayTemplates,
};

// Helper function to get template by ID
export function getTemplateById(id: string): MarketingCampaignTemplate | undefined {
  return allMarketingTemplates.find((t) => t.id === id);
}

// Helper function to get templates for a specific product type
export function getTemplatesForProductType(
  productType: "sample_pack" | "course" | "preset_pack" | "bundle" | "masterclass"
): MarketingCampaignTemplate[] {
  return allMarketingTemplates.filter((t) => t.productTypes.includes(productType));
}

// Helper function to get templates by campaign type
export function getTemplatesByCampaignType(
  campaignType: CampaignType
): MarketingCampaignTemplate[] {
  return templatesByType[campaignType] || [];
}

// Template counts for UI
export const templateCounts = {
  product_launch: productLaunchTemplates.length,
  flash_sale: flashSaleTemplates.length,
  welcome_onboarding: welcomeOnboardingTemplates.length,
  reengagement: reengagementTemplates.length,
  course_milestone: courseMilestoneTemplates.length,
  seasonal_holiday: seasonalHolidayTemplates.length,
  total: allMarketingTemplates.length,
};
