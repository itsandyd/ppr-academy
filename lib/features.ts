/**
 * Feature flags for gradual migration to creator marketplace
 * This allows us to control the rollout of new features and maintain
 * backwards compatibility during the transition period.
 */

// Environment-based feature flags
export const features = {
  // Core marketplace features
  useNewMarketplace: process.env.NEXT_PUBLIC_USE_NEW_MARKETPLACE === 'true',
  useSimplifiedSchema: process.env.USE_SIMPLIFIED_SCHEMA === 'true',
  
  // Legacy system toggles
  legacyCoursesEnabled: process.env.LEGACY_COURSES_ENABLED !== 'false', // Default true
  legacyCoachingEnabled: process.env.LEGACY_COACHING_ENABLED !== 'false', // Default true
  
  // New features
  creatorStorefronts: process.env.NEXT_PUBLIC_CREATOR_STOREFRONTS === 'true',
  creatorSubscriptions: process.env.NEXT_PUBLIC_CREATOR_SUBSCRIPTIONS === 'true',
  unifiedProductModel: process.env.UNIFIED_PRODUCT_MODEL === 'true',
  
  // Migration controls
  enableDataMigration: process.env.ENABLE_DATA_MIGRATION === 'true',
  parallelSystemRun: process.env.PARALLEL_SYSTEM_RUN === 'true',
  
  // Performance features
  useOptimizedQueries: process.env.USE_OPTIMIZED_QUERIES === 'true',
  enableCaching: process.env.ENABLE_CACHING === 'true',
  
  // UI/UX features
  newDashboardLayout: process.env.NEXT_PUBLIC_NEW_DASHBOARD_LAYOUT === 'true',
  simplifiedOnboarding: process.env.NEXT_PUBLIC_SIMPLIFIED_ONBOARDING === 'true',
  
  // Revenue features
  platformFees: process.env.PLATFORM_FEES === 'true',
  creatorPayouts: process.env.CREATOR_PAYOUTS === 'true',
};

// User-specific feature flags (can be stored in database)
export interface UserFeatureFlags {
  betaAccess?: boolean;
  earlyAdopter?: boolean;
  testGroup?: 'control' | 'variant_a' | 'variant_b';
}

// Feature flag utilities
export function isFeatureEnabled(
  featureName: keyof typeof features,
  userFlags?: UserFeatureFlags
): boolean {
  // Check environment flag first
  const envFlag = features[featureName];
  
  // Override with user-specific flags if needed
  if (userFlags?.betaAccess && featureName.includes('new')) {
    return true;
  }
  
  return envFlag;
}

// Gradual rollout utilities
export function getFeatureRolloutPercentage(featureName: string): number {
  const key = `ROLLOUT_${featureName.toUpperCase()}_PERCENTAGE`;
  const percentage = process.env[key];
  return percentage ? parseInt(percentage, 10) : 0;
}

export function isUserInRollout(userId: string, featureName: string): boolean {
  const percentage = getFeatureRolloutPercentage(featureName);
  if (percentage === 0) return false;
  if (percentage === 100) return true;
  
  // Simple hash-based distribution
  const hash = userId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  return (Math.abs(hash) % 100) < percentage;
}

// Feature flag React hook
export function useFeatureFlag(featureName: keyof typeof features): boolean {
  // This could be enhanced to fetch user-specific flags from the database
  return isFeatureEnabled(featureName);
}

// Development helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Log feature flags in development
if (isDevelopment) {
  console.log('🚩 Feature Flags:', features);
}