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

// Type exports
export type PackData = z.infer<typeof packDataSchema>;
export type CourseData = z.infer<typeof courseDataSchema>;
export type PDFData = z.infer<typeof pdfDataSchema>;
export type PricingModel = z.infer<typeof pricingModelSchema>;
export type FollowGateRequirements = z.infer<typeof followGateRequirementsSchema>;
