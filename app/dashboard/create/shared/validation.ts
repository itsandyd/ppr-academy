import { z } from "zod";

// ============================================================================
// SHARED SCHEMAS
// ============================================================================

/** Pricing model - applies to all product types */
export const pricingModelSchema = z.enum(["free_with_gate", "paid"]);

/** Follow gate requirements schema */
export const followGateRequirementsSchema = z.object({
  requireEmail: z.boolean().optional(),
  requireInstagram: z.boolean().optional(),
  requireTiktok: z.boolean().optional(),
  requireYoutube: z.boolean().optional(),
  requireSpotify: z.boolean().optional(),
  minFollowsRequired: z.number().min(0).optional(),
});

/** Follow gate social links schema */
export const followGateSocialLinksSchema = z.object({
  instagram: z.string().url().optional().or(z.literal("")),
  tiktok: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  spotify: z.string().url().optional().or(z.literal("")),
});

/** Base file schema */
export const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  storageId: z.string().optional(),
  size: z.number().optional(),
  type: z.string().optional(),
});

// ============================================================================
// PACK VALIDATION SCHEMAS
// ============================================================================

export const packTypeSchema = z.enum(["sample-pack", "midi-pack", "preset-pack"]);

export const packBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters"),
  packType: packTypeSchema,
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  genre: z.string().optional(),
  bpm: z.number().min(1).max(300).optional(),
  key: z.string().optional(),
  // Preset pack specific
  targetPlugin: z.string().optional(),
  dawType: z.string().optional(),
  targetPluginVersion: z.string().optional(),
});

export const packPricingSchema = z.discriminatedUnion("pricingModel", [
  z.object({
    pricingModel: z.literal("paid"),
    price: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Price must be greater than 0 for paid products"
    ),
  }),
  z.object({
    pricingModel: z.literal("free_with_gate"),
    price: z.string().optional(),
  }),
]);

export const packFollowGateSchema = z.object({
  followGateEnabled: z.boolean(),
  followGateRequirements: followGateRequirementsSchema,
  followGateSocialLinks: followGateSocialLinksSchema.optional(),
  followGateMessage: z.string().max(500).optional(),
});

export const packFilesSchema = z.object({
  files: z.array(uploadedFileSchema).optional(),
  downloadUrl: z.string().url().optional().or(z.literal("")),
});

/** Complete pack data schema */
export const packDataSchema = packBasicsSchema
  .merge(packPricingSchema.options[0].omit({ pricingModel: true }))
  .merge(packPricingSchema.options[1].omit({ pricingModel: true }))
  .extend({
    pricingModel: pricingModelSchema.optional(),
  })
  .merge(packFollowGateSchema.partial())
  .merge(packFilesSchema);

// ============================================================================
// COURSE VALIDATION SCHEMAS
// ============================================================================

export const chapterSchema = z.object({
  title: z.string().min(1, "Chapter title is required"),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  duration: z.number().optional(),
  orderIndex: z.number(),
});

export const lessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  description: z.string().optional(),
  orderIndex: z.number(),
  chapters: z.array(chapterSchema),
});

export const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  description: z.string().optional(),
  orderIndex: z.number(),
  lessons: z.array(lessonSchema),
});

export const courseBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(5000, "Description must be less than 5000 characters"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
  tags: z.array(z.string()).optional(),
  skillLevel: z.string().min(1, "Skill level is required"),
  thumbnail: z.string().url().optional().or(z.literal("")),
});

export const coursePricingSchema = z.discriminatedUnion("pricingModel", [
  z.object({
    pricingModel: z.literal("paid"),
    price: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Price must be greater than 0 for paid courses"
    ),
    originalPrice: z.string().optional(),
    hasDiscount: z.boolean().optional(),
  }),
  z.object({
    pricingModel: z.literal("free_with_gate"),
  }),
]);

export const courseCheckoutSchema = z.object({
  checkoutHeadline: z.string().min(1, "Checkout headline is required").max(200),
  checkoutDescription: z.string().max(1000).optional(),
  paymentDescription: z.string().max(500).optional(),
  guaranteeText: z.string().max(500).optional(),
  showGuarantee: z.boolean().optional(),
  acceptsPayPal: z.boolean().optional(),
  acceptsStripe: z.boolean().optional(),
});

export const courseContentSchema = z.object({
  modules: z.array(moduleSchema).optional(),
});

export const courseOptionsSchema = z.object({
  enableSharing: z.boolean().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  enableComments: z.boolean().optional(),
  enableProgress: z.boolean().optional(),
  enableCertificates: z.boolean().optional(),
  certificateTemplate: z.string().optional(),
  drippingEnabled: z.boolean().optional(),
  drippingDays: z.string().optional(),
  accessDuration: z.string().optional(),
  welcomeEmail: z.boolean().optional(),
  completionEmail: z.boolean().optional(),
  reminderEmails: z.boolean().optional(),
  enableDownloads: z.boolean().optional(),
  enableMobileApp: z.boolean().optional(),
  enableDiscussions: z.boolean().optional(),
});

/** Complete course data schema */
export const courseDataSchema = courseBasicsSchema
  .merge(courseContentSchema)
  .merge(courseCheckoutSchema.partial())
  .merge(courseOptionsSchema)
  .extend({
    pricingModel: pricingModelSchema.optional(),
    price: z.string().optional(),
    originalPrice: z.string().optional(),
    hasDiscount: z.boolean().optional(),
    followGateEnabled: z.boolean().optional(),
    followGateRequirements: followGateRequirementsSchema.optional(),
    followGateSocialLinks: followGateSocialLinksSchema.optional(),
    followGateMessage: z.string().max(500).optional(),
  });

// ============================================================================
// PDF VALIDATION SCHEMAS
// ============================================================================

export const pdfTypeSchema = z.enum([
  "cheat-sheet",
  "guide",
  "ebook",
  "workbook",
  "template",
  "other",
]);

export const pdfBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters"),
  pdfType: pdfTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  pageCount: z.number().positive().optional(),
});

export const pdfPricingSchema = z.discriminatedUnion("pricingModel", [
  z.object({
    pricingModel: z.literal("paid"),
    price: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Price must be greater than 0 for paid PDFs"
    ),
  }),
  z.object({
    pricingModel: z.literal("free_with_gate"),
  }),
]);

export const pdfFilesSchema = z.object({
  files: z.array(uploadedFileSchema).optional(),
  downloadUrl: z.string().url().optional().or(z.literal("")),
});

/** Complete PDF data schema */
export const pdfDataSchema = pdfBasicsSchema
  .merge(pdfFilesSchema)
  .extend({
    pricingModel: pricingModelSchema.optional(),
    price: z.string().optional(),
    followGateEnabled: z.boolean().optional(),
    followGateRequirements: followGateRequirementsSchema.optional(),
    followGateSocialLinks: followGateSocialLinksSchema.optional(),
    followGateMessage: z.string().max(500).optional(),
  });

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate pack basics step
 */
export function validatePackBasics(data: unknown) {
  return packBasicsSchema.safeParse(data);
}

/**
 * Validate pack pricing step
 */
export function validatePackPricing(data: unknown) {
  return packPricingSchema.safeParse(data);
}

/**
 * Validate course basics step
 */
export function validateCourseBasics(data: unknown) {
  return courseBasicsSchema.safeParse(data);
}

/**
 * Validate course checkout step
 */
export function validateCourseCheckout(data: unknown) {
  return courseCheckoutSchema.safeParse(data);
}

/**
 * Validate PDF basics step
 */
export function validatePDFBasics(data: unknown) {
  return pdfBasicsSchema.safeParse(data);
}

/**
 * Get validation errors as a record for form display
 */
export function getValidationErrors(result: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  }
  return errors;
}

// ============================================================================
// BEAT LEASE VALIDATION SCHEMAS
// ============================================================================

export const leaseOptionSchema = z.object({
  type: z.enum(["free", "basic", "premium", "exclusive"]),
  enabled: z.boolean(),
  price: z.number().min(0),
  distributionLimit: z.number().optional(),
  commercialUse: z.boolean().optional(),
  stemsIncluded: z.boolean().optional(),
});

export const beatLeaseMetadataSchema = z.object({
  bpm: z.number().min(1, "BPM is required").max(300),
  key: z.string().min(1, "Key is required"),
  genre: z.string().min(1, "Genre is required"),
  tagged: z.boolean().optional(),
  duration: z.number().optional(),
});

export const beatLeaseFilesSchema = z.object({
  mp3Url: z.string().url().optional().or(z.literal("")),
  wavUrl: z.string().url().optional().or(z.literal("")),
  stemsUrl: z.string().url().optional().or(z.literal("")),
  trackoutsUrl: z.string().url().optional().or(z.literal("")),
});

export const beatLeaseBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  thumbnail: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const beatLeaseDataSchema = beatLeaseBasicsSchema.extend({
  metadata: beatLeaseMetadataSchema.optional(),
  files: beatLeaseFilesSchema.optional(),
  leaseOptions: z.array(leaseOptionSchema).optional(),
  producerTag: z.string().optional(),
});

// ============================================================================
// SERVICE VALIDATION SCHEMAS (mixing, mastering)
// ============================================================================

export const serviceTypeSchema = z.enum(["mixing", "mastering"]);

export const pricingTierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  price: z.number().min(0),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  turnaround: z.number().optional(),
});

export const serviceRequirementsSchema = z.object({
  acceptedFormats: z.array(z.string()).min(1, "At least one format required"),
  requireDryVocals: z.boolean().optional(),
  requireReferenceTrack: z.boolean().optional(),
  requireProjectNotes: z.boolean().optional(),
  maxFileSize: z.number().optional(),
});

export const serviceDeliverySchema = z.object({
  formats: z.array(z.string()).min(1, "At least one delivery format required"),
  includeProjectFile: z.boolean().optional(),
  includeStemBounces: z.boolean().optional(),
  deliveryMethod: z.enum(["download", "email", "wetransfer"]).optional(),
  standardTurnaround: z.number().min(1, "Turnaround time required"),
  rushTurnaround: z.number().optional(),
});

export const serviceBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  serviceType: serviceTypeSchema,
  thumbnail: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const serviceDataSchema = serviceBasicsSchema.extend({
  pricingTiers: z.array(pricingTierSchema).min(1, "At least one pricing tier required"),
  rushAvailable: z.boolean().optional(),
  rushMultiplier: z.number().optional(),
  requirements: serviceRequirementsSchema.optional(),
  delivery: serviceDeliverySchema.optional(),
});

// ============================================================================
// COACHING VALIDATION SCHEMAS
// ============================================================================

export const sessionTypeSchema = z.enum([
  "production-coaching",
  "mixing-coaching",
  "songwriting",
  "career-advice",
  "feedback-session",
  "other",
]);

export const sessionFormatSchema = z.enum(["video", "audio", "screen-share"]);

export const discordConfigSchema = z.object({
  requireDiscord: z.boolean().optional(),
  autoCreateChannel: z.boolean().optional(),
  notifyOnBooking: z.boolean().optional(),
});

export const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  slots: z.array(timeSlotSchema),
});

export const weekScheduleSchema = z.record(dayScheduleSchema);

export const coachingBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  sessionType: z.string().min(1, "Session type is required"),
  duration: z.number().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours"),
  thumbnail: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const coachingPricingSchema = z.discriminatedUnion("pricingModel", [
  z.object({
    pricingModel: z.literal("paid"),
    price: z.string().refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Price must be greater than 0"
    ),
  }),
  z.object({
    pricingModel: z.literal("free_with_gate"),
  }),
]);

export const coachingDataSchema = coachingBasicsSchema.extend({
  pricingModel: pricingModelSchema.optional(),
  price: z.string().optional(),
  discordConfig: discordConfigSchema.optional(),
  bufferTime: z.number().min(0).max(60).optional(),
  maxBookingsPerDay: z.number().min(1).max(20).optional(),
  advanceBookingDays: z.number().min(1).max(90).optional(),
  sessionFormat: sessionFormatSchema.optional(),
  weekSchedule: weekScheduleSchema.optional(),
  followGateEnabled: z.boolean().optional(),
  followGateRequirements: followGateRequirementsSchema.optional(),
  followGateSocialLinks: followGateSocialLinksSchema.optional(),
  followGateMessage: z.string().max(500).optional(),
});

// ============================================================================
// BUNDLE VALIDATION SCHEMAS
// ============================================================================

export const bundleProductSchema = z.object({
  id: z.string(),
  type: z.enum(["digital", "course"]),
  title: z.string(),
  price: z.number(),
  imageUrl: z.string().optional(),
  productCategory: z.string().optional(),
});

export const bundleBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  thumbnail: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const bundleDataSchema = bundleBasicsSchema.extend({
  products: z.array(bundleProductSchema).min(2, "Bundle must contain at least 2 products"),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Price must be greater than 0"
  ),
  originalPrice: z.string().optional(),
  discountPercentage: z.number().optional(),
  showSavings: z.boolean().optional(),
});

// ============================================================================
// MEMBERSHIP VALIDATION SCHEMAS
// ============================================================================

export const includedContentSchema = z.object({
  id: z.string(),
  type: z.enum(["course", "product"]),
  title: z.string(),
  imageUrl: z.string().optional(),
});

export const membershipBasicsSchema = z.object({
  tierName: z.string().min(1, "Tier name is required").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
});

export const membershipPricingSchema = z.object({
  priceMonthly: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Monthly price is required"
  ),
  priceYearly: z.string().optional(),
  trialDays: z.number().min(0).max(30).optional(),
});

export const membershipDataSchema = membershipBasicsSchema.merge(membershipPricingSchema.partial()).extend({
  benefits: z.array(z.string()).optional(),
  includedContent: z.array(includedContentSchema).optional(),
  includeAllContent: z.boolean().optional(),
});

// ============================================================================
// EFFECT CHAIN VALIDATION SCHEMAS
// ============================================================================

export const dawTypeSchema = z.enum([
  "ableton",
  "fl-studio",
  "logic",
  "bitwig",
  "studio-one",
  "reason",
  "cubase",
  "multi-daw",
]);

export const chainTypeSchema = z.enum([
  "audioEffect",
  "instrument",
  "midiEffect",
  "drumRack",
  "mixer",
]);

export const cpuLoadSchema = z.enum(["low", "medium", "high"]);

export const effectChainBasicsSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  dawType: dawTypeSchema,
  dawVersion: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const effectChainDataSchema = effectChainBasicsSchema.extend({
  pricingModel: pricingModelSchema.optional(),
  price: z.string().optional(),
  chainType: chainTypeSchema.optional(),
  effectType: z.array(z.string()).optional(),
  cpuLoad: cpuLoadSchema.optional(),
  requiresPlugins: z.array(z.string()).optional(),
  demoAudioUrl: z.string().url().optional().or(z.literal("")),
  installationNotes: z.string().max(2000).optional(),
  files: z.array(uploadedFileSchema).optional(),
  downloadUrl: z.string().url().optional().or(z.literal("")),
  followGateEnabled: z.boolean().optional(),
  followGateRequirements: followGateRequirementsSchema.optional(),
  followGateSocialLinks: followGateSocialLinksSchema.optional(),
  followGateMessage: z.string().max(500).optional(),
});

// ============================================================================
// PLAYLIST CURATION VALIDATION SCHEMAS
// ============================================================================

export const submissionRulesSchema = z.object({
  requiresMessage: z.boolean().optional(),
  minFollowers: z.number().optional(),
  allowedGenres: z.array(z.string()).optional(),
});

export const playlistPricingModelSchema = z.enum(["free", "paid"]);

export const playlistBasicsSchema = z.object({
  name: z.string().min(3, "Playlist name is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  coverUrl: z.string().url().optional().or(z.literal("")),
  genres: z.array(z.string()).optional(),
  customSlug: z.string().optional(),
});

export const playlistDataSchema = playlistBasicsSchema.extend({
  isPublic: z.boolean().optional(),
  acceptsSubmissions: z.boolean().optional(),
  submissionRules: submissionRulesSchema.optional(),
  submissionSLA: z.number().min(1).max(30).optional(),
  pricingModel: playlistPricingModelSchema.optional(),
  submissionFee: z.number().min(0).optional(),
  currency: z.string().optional(),
});

// ============================================================================
// STEP VALIDATORS - Used by context providers
// ============================================================================

export const stepValidators = {
  pack: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string; packType?: string };
      return !!(parsed?.title && parsed?.description && parsed?.packType);
    },
    pricing: (data: unknown) => {
      const parsed = data as { pricingModel?: string };
      return !!parsed?.pricingModel;
    },
    followGate: (data: unknown) => {
      const parsed = data as { pricingModel?: string; followGateEnabled?: boolean; followGateRequirements?: unknown };
      if (parsed?.pricingModel === "free_with_gate") {
        return !!(parsed.followGateEnabled && parsed.followGateRequirements);
      }
      return true;
    },
    files: () => true,
  },

  beatLease: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string };
      return !!(parsed?.title && parsed?.description);
    },
    metadata: (data: unknown) => {
      const parsed = data as { metadata?: { bpm?: number; key?: string; genre?: string } };
      return !!(parsed?.metadata?.bpm && parsed?.metadata?.key && parsed?.metadata?.genre);
    },
    files: (data: unknown) => {
      const parsed = data as { files?: { mp3Url?: string; wavUrl?: string } };
      return !!(parsed?.files?.mp3Url || parsed?.files?.wavUrl);
    },
    licensing: (data: unknown) => {
      const parsed = data as { leaseOptions?: Array<{ enabled: boolean }> };
      return !!(parsed?.leaseOptions?.some((opt) => opt.enabled));
    },
  },

  course: {
    course: (data: unknown) => {
      const parsed = data as {
        title?: string;
        description?: string;
        category?: string;
        subcategory?: string;
        skillLevel?: string;
      };
      return !!(
        parsed?.title &&
        parsed?.description &&
        parsed?.category &&
        parsed?.subcategory &&
        parsed?.skillLevel
      );
    },
    pricing: (data: unknown) => {
      const parsed = data as { pricingModel?: string };
      return !!parsed?.pricingModel;
    },
    checkout: (data: unknown) => {
      const parsed = data as { pricingModel?: string; price?: string; checkoutHeadline?: string };
      if (parsed?.pricingModel === "paid") {
        return !!(parsed.price && parsed.checkoutHeadline);
      }
      return true;
    },
    followGate: (data: unknown) => {
      const parsed = data as { pricingModel?: string; followGateEnabled?: boolean; followGateRequirements?: unknown };
      if (parsed?.pricingModel === "free_with_gate") {
        return !!(parsed.followGateEnabled && parsed.followGateRequirements);
      }
      return true;
    },
    options: () => true,
  },

  service: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string; serviceType?: string };
      return !!(parsed?.title && parsed?.description && parsed?.serviceType);
    },
    pricing: (data: unknown) => {
      const parsed = data as { pricingTiers?: unknown[] };
      return !!(parsed?.pricingTiers && parsed.pricingTiers.length > 0);
    },
    requirements: (data: unknown) => {
      const parsed = data as { requirements?: { acceptedFormats?: string[] } };
      return !!(parsed?.requirements?.acceptedFormats?.length);
    },
    delivery: (data: unknown) => {
      const parsed = data as { delivery?: { formats?: string[]; standardTurnaround?: number } };
      return !!(parsed?.delivery?.formats?.length && parsed?.delivery?.standardTurnaround);
    },
  },

  coaching: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string; sessionType?: string; duration?: number };
      return !!(parsed?.title && parsed?.description && parsed?.sessionType && parsed?.duration);
    },
    pricing: (data: unknown) => {
      const parsed = data as { pricingModel?: string };
      return !!parsed?.pricingModel;
    },
    followGate: (data: unknown) => {
      const parsed = data as { pricingModel?: string; followGateEnabled?: boolean; followGateRequirements?: unknown };
      if (parsed?.pricingModel === "free_with_gate") {
        return !!(parsed.followGateEnabled && parsed.followGateRequirements);
      }
      return true;
    },
    discord: () => true,
    availability: (data: unknown) => {
      const parsed = data as { weekSchedule?: unknown };
      return !!parsed?.weekSchedule;
    },
  },

  pdf: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string };
      return !!(parsed?.title && parsed?.description);
    },
    pricing: (data: unknown) => {
      const parsed = data as { pricingModel?: string };
      return !!parsed?.pricingModel;
    },
    followGate: (data: unknown) => {
      const parsed = data as { pricingModel?: string; followGateEnabled?: boolean; followGateRequirements?: unknown };
      if (parsed?.pricingModel === "free_with_gate") {
        return !!(parsed.followGateEnabled && parsed.followGateRequirements);
      }
      return true;
    },
    files: () => true,
  },

  bundle: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string };
      return !!(parsed?.title && parsed?.description);
    },
    products: (data: unknown) => {
      const parsed = data as { products?: unknown[] };
      return !!(parsed?.products && parsed.products.length >= 2);
    },
    pricing: (data: unknown) => {
      const parsed = data as { price?: string };
      return !!(parsed?.price && parseFloat(parsed.price) > 0);
    },
  },

  membership: {
    basics: (data: unknown) => {
      const parsed = data as { tierName?: string; description?: string };
      return !!(parsed?.tierName && parsed?.description);
    },
    pricing: (data: unknown) => {
      const parsed = data as { priceMonthly?: string };
      return !!(parsed?.priceMonthly && parseFloat(parsed.priceMonthly) > 0);
    },
    content: (data: unknown) => {
      const parsed = data as { includeAllContent?: boolean; includedContent?: unknown[] };
      return !!(parsed?.includeAllContent || (parsed?.includedContent && parsed.includedContent.length > 0));
    },
  },

  effectChain: {
    basics: (data: unknown) => {
      const parsed = data as { title?: string; description?: string; dawType?: string };
      return !!(parsed?.title && parsed?.description && parsed?.dawType);
    },
    files: () => true,
    pricing: (data: unknown) => {
      const parsed = data as { pricingModel?: string };
      return !!parsed?.pricingModel;
    },
    followGate: (data: unknown) => {
      const parsed = data as { pricingModel?: string; followGateEnabled?: boolean; followGateRequirements?: unknown };
      if (parsed?.pricingModel === "free_with_gate") {
        return !!(parsed.followGateEnabled && parsed.followGateRequirements);
      }
      return true;
    },
  },

  playlistCuration: {
    basics: (data: unknown) => {
      const parsed = data as { name?: string; description?: string };
      return !!(parsed?.name && parsed?.description);
    },
    submissionSettings: (data: unknown) => {
      const parsed = data as { acceptsSubmissions?: boolean };
      return parsed?.acceptsSubmissions !== undefined;
    },
    pricing: (data: unknown) => {
      const parsed = data as { pricingModel?: string; submissionFee?: number };
      if (parsed?.pricingModel === "paid") {
        return !!(parsed.submissionFee && parsed.submissionFee > 0);
      }
      return true;
    },
  },
} as const;

/**
 * Get step validator for a product type
 */
export function getStepValidator(
  productType: keyof typeof stepValidators,
  step: string
): ((data: unknown) => boolean) | undefined {
  const validators = stepValidators[productType];
  if (!validators) return undefined;
  return (validators as Record<string, (data: unknown) => boolean>)[step];
}

/**
 * Validate all steps for a product type
 */
export function validateAllSteps(
  productType: keyof typeof stepValidators,
  data: unknown
): Record<string, boolean> {
  const validators = stepValidators[productType];
  if (!validators) return {};

  const results: Record<string, boolean> = {};
  for (const [step, validator] of Object.entries(validators)) {
    results[step] = (validator as (data: unknown) => boolean)(data);
  }
  return results;
}

// Type exports
export type PackData = z.infer<typeof packDataSchema>;
export type CourseData = z.infer<typeof courseDataSchema>;
export type PDFData = z.infer<typeof pdfDataSchema>;
export type BeatLeaseData = z.infer<typeof beatLeaseDataSchema>;
export type ServiceData = z.infer<typeof serviceDataSchema>;
export type CoachingData = z.infer<typeof coachingDataSchema>;
export type BundleData = z.infer<typeof bundleDataSchema>;
export type MembershipData = z.infer<typeof membershipDataSchema>;
export type EffectChainData = z.infer<typeof effectChainDataSchema>;
export type PlaylistData = z.infer<typeof playlistDataSchema>;
export type PricingModel = z.infer<typeof pricingModelSchema>;
export type FollowGateRequirements = z.infer<typeof followGateRequirementsSchema>;
export type DAWType = z.infer<typeof dawTypeSchema>;
