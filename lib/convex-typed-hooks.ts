"use client";

/**
 * Typed Convex Hooks
 *
 * This module provides type-safe wrappers for Convex queries and mutations
 * that avoid TypeScript's "Type instantiation is excessively deep" error (TS2589).
 *
 * We use explicit type annotations with permissive types at the boundary
 * to maintain usability while avoiding deep type instantiation.
 */

import { useQuery as useConvexQuery, useMutation as useConvexMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// TYPE DEFINITIONS - Permissive interfaces for flexibility
// ============================================================================

export interface Store {
  _id: Id<"stores">;
  _creationTime: number;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;
  [key: string]: unknown;
}

export interface DigitalProduct {
  _id: Id<"digitalProducts">;
  _creationTime: number;
  storeId: Id<"stores">;
  userId: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  downloadUrl?: string;
  productType?: string;
  productCategory?: string;
  pricingModel?: "free_with_gate" | "paid";
  isPublished?: boolean;
  tags?: string[];
  genre?: string[];
  bpm?: number;
  musicalKey?: string;
  followGateEnabled?: boolean;
  followGateRequirements?: Record<string, unknown>;
  followGateSocialLinks?: Record<string, string>;
  followGateMessage?: string;
  packFiles?: string;
  targetPlugin?: string;
  dawType?: string;
  targetPluginVersion?: string;
  slug?: string;
  // Allow additional properties for specialized product types
  [key: string]: unknown;
}

export interface Course {
  _id: Id<"courses">;
  _creationTime: number;
  storeId: Id<"stores">;
  userId: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  subcategory?: string;
  skillLevel?: string;
  tags?: string[];
  isPublished?: boolean;
  checkoutHeadline?: string;
  checkoutDescription?: string;
  paymentDescription?: string;
  guaranteeText?: string;
  showGuarantee?: boolean;
  acceptsPayPal?: boolean;
  acceptsStripe?: boolean;
  modules?: CourseModule[];
  slug?: string;
  [key: string]: unknown;
}

export interface CourseModule {
  title: string;
  description: string;
  orderIndex: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  title: string;
  description: string;
  orderIndex: number;
  chapters: CourseChapter[];
}

export interface CourseChapter {
  _id?: string;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  orderIndex: number;
  [key: string]: unknown;
}

export interface ConvexUser {
  _id: Id<"users">;
  clerkId: string;
  email?: string;
  name?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

// ============================================================================
// QUERY HOOKS - Using type assertions to avoid deep instantiation
// ============================================================================

/**
 * Get stores by user ID
 */
export function useStoresByUser(userId: string | undefined): Store[] | undefined {
  const result = useConvexQuery(
    api.stores.getStoresByUser,
    userId ? { userId } : "skip"
  );
  return result as Store[] | undefined;
}

/**
 * Get digital product by ID
 */
export function useDigitalProductById(productId: Id<"digitalProducts"> | undefined): DigitalProduct | null | undefined {
  const result = useConvexQuery(
    api.digitalProducts.getProductById,
    productId ? { productId } : "skip"
  );
  return result as DigitalProduct | null | undefined;
}

/**
 * Get digital products by store
 */
export function useDigitalProductsByStore(storeId: Id<"stores"> | undefined): DigitalProduct[] | undefined {
  const result = useConvexQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : "skip"
  );
  return result as DigitalProduct[] | undefined;
}

/**
 * Get course for editing
 */
export function useCourseForEdit(courseId: Id<"courses"> | undefined, userId: string | undefined): (Course & { modules?: CourseModule[] }) | null | undefined {
  const result = useConvexQuery(
    api.courses.getCourseForEdit,
    courseId && userId ? { courseId, userId } : "skip"
  );
  return result as (Course & { modules?: CourseModule[] }) | null | undefined;
}

/**
 * Get courses by store
 */
export function useCoursesByStore(storeId: Id<"stores"> | undefined): Course[] | undefined {
  const result = useConvexQuery(
    api.courses.getCoursesByStore,
    storeId ? { storeId } : "skip"
  );
  return result as Course[] | undefined;
}

/**
 * Get user from Clerk ID
 */
export function useUserFromClerk(clerkId: string | undefined): ConvexUser | null | undefined {
  const result = useConvexQuery(
    api.users.getUserFromClerk,
    clerkId ? { clerkId } : "skip"
  );
  return result as ConvexUser | null | undefined;
}

// ============================================================================
// MUTATION HOOKS - Using function wrappers to avoid deep instantiation
// ============================================================================

type CreateProductArgs = {
  title: string;
  description?: string;
  storeId: Id<"stores">;
  userId: string;
  productType: string;
  productCategory: string;
  pricingModel?: "free_with_gate" | "paid";
  price?: number;
  imageUrl?: string;
  downloadUrl?: string;
  tags?: string[];
  followGateConfig?: Record<string, unknown>;
  [key: string]: unknown;
};

type UpdateProductArgs = {
  id: Id<"digitalProducts">;
  [key: string]: unknown;
};

/**
 * Create universal product mutation
 */
export function useCreateUniversalProduct(): (args: CreateProductArgs) => Promise<Id<"digitalProducts">> {
  const mutation = useConvexMutation(api.universalProducts.createUniversalProduct);
  return mutation as unknown as (args: CreateProductArgs) => Promise<Id<"digitalProducts">>;
}

/**
 * Update digital product mutation
 */
export function useUpdateDigitalProduct(): (args: UpdateProductArgs) => Promise<unknown> {
  const mutation = useConvexMutation(api.digitalProducts.updateProduct);
  return mutation as unknown as (args: UpdateProductArgs) => Promise<unknown>;
}

/**
 * Generate upload URL mutation
 */
export function useGenerateUploadUrl(): () => Promise<string> {
  const mutation = useConvexMutation(api.files.generateUploadUrl);
  return mutation as unknown as () => Promise<string>;
}

/**
 * Get file URL mutation
 */
export function useGetFileUrl(): (args: { storageId: string }) => Promise<string | null> {
  const mutation = useConvexMutation(api.files.getUrl);
  return mutation as unknown as (args: { storageId: string }) => Promise<string | null>;
}

/**
 * Create course with data mutation
 */
export function useCreateCourseWithData(): (args: {
  userId: string;
  storeId: Id<"stores">;
  data: Record<string, unknown>;
}) => Promise<{ success: boolean; courseId?: Id<"courses">; slug?: string; error?: string }> {
  const mutation = useConvexMutation(api.courses.createCourseWithData);
  return mutation as unknown as (args: {
    userId: string;
    storeId: Id<"stores">;
    data: Record<string, unknown>;
  }) => Promise<{ success: boolean; courseId?: Id<"courses">; slug?: string; error?: string }>;
}

/**
 * Update course with modules mutation
 */
export function useUpdateCourseWithModules(): (args: {
  courseId: Id<"courses">;
  courseData: Record<string, unknown>;
  modules?: CourseModule[];
}) => Promise<{ success: boolean; error?: string }> {
  const mutation = useConvexMutation(api.courses.updateCourseWithModules);
  return mutation as unknown as (args: {
    courseId: Id<"courses">;
    courseData: Record<string, unknown>;
    modules?: CourseModule[];
  }) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Toggle course published status
 */
export function useToggleCoursePublished(): (args: { courseId: Id<"courses">; userId: string }) => Promise<{ success: boolean; isPublished?: boolean }> {
  const mutation = useConvexMutation(api.courses.togglePublished);
  return mutation as unknown as (args: { courseId: Id<"courses">; userId: string }) => Promise<{ success: boolean; isPublished?: boolean }>;
}

/**
 * Create bundle mutation
 */
export function useCreateBundle(): (args: Record<string, unknown>) => Promise<{ success: boolean; bundleId: Id<"bundles"> }> {
  const mutation = useConvexMutation(api.bundles.createBundle);
  return mutation as unknown as (args: Record<string, unknown>) => Promise<{ success: boolean; bundleId: Id<"bundles"> }>;
}

/**
 * Update bundle mutation
 */
export function useUpdateBundle(): (args: Record<string, unknown>) => Promise<unknown> {
  const mutation = useConvexMutation(api.bundles.updateBundle);
  return mutation as unknown as (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Publish bundle mutation
 */
export function usePublishBundle(): (args: { bundleId: Id<"bundles"> }) => Promise<unknown> {
  const mutation = useConvexMutation(api.bundles.publishBundle);
  return mutation as unknown as (args: { bundleId: Id<"bundles"> }) => Promise<unknown>;
}

// ============================================================================
// DRAFT MUTATIONS - Save products as drafts before publishing
// ============================================================================

type SaveDraftArgs = {
  productId?: Id<"digitalProducts">;
  title?: string;
  description?: string;
  storeId?: string;
  userId?: string;
  productType?: string;
  productCategory?: string;
  pricingModel?: "free_with_gate" | "paid";
  price?: number;
  imageUrl?: string;
  downloadUrl?: string;
  tags?: string[];
  followGateConfig?: Record<string, unknown>;
  dawType?: string;
  dawVersion?: string;
  effectTypes?: string[];
  thirdPartyPlugins?: string[];
  cpuLoad?: "low" | "medium" | "high";
  complexity?: "beginner" | "intermediate" | "advanced";
  abletonVersion?: string;
  rackType?: string;
  duration?: number;
  sessionType?: string;
  [key: string]: unknown;
};

type SaveDraftResult = {
  success: boolean;
  productId?: Id<"digitalProducts">;
  message: string;
};

/**
 * Save product as draft mutation
 * Allows saving incomplete products for later editing
 */
export function useSaveDraft(): (args: SaveDraftArgs) => Promise<SaveDraftResult> {
  const mutation = useConvexMutation(api.universalProducts.saveDraft);
  return mutation as unknown as (args: SaveDraftArgs) => Promise<SaveDraftResult>;
}

type PublishDraftResult = {
  success: boolean;
  message: string;
};

/**
 * Publish draft mutation
 * Validates and publishes a saved draft
 */
export function usePublishDraft(): (args: { productId: Id<"digitalProducts"> }) => Promise<PublishDraftResult> {
  const mutation = useConvexMutation(api.universalProducts.publishDraft);
  return mutation as unknown as (args: { productId: Id<"digitalProducts"> }) => Promise<PublishDraftResult>;
}
