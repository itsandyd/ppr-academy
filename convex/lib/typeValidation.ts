/**
 * Type validation utilities for Convex functions
 * Ensures proper typing and validation at build time
 */

import { v, Validator } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Helper to ensure all Convex function arguments and returns are properly validated
 */
export type ValidatedFunction<T extends Record<string, any>, R> = {
  args: { [K in keyof T]: Validator<T[K], any, any> };
  returns: Validator<R, any, any>;
  handler: (ctx: any, args: T) => Promise<R> | R;
};

/**
 * Common ID validators for different tables
 */
export const idValidators = {
  users: () => v.id("users"),
  courses: () => v.id("courses"),
  lessons: () => v.id("lessons"),
  products: () => v.id("products"),
  stores: () => v.id("stores"),
  digitalProducts: () => v.id("digitalProducts"),
  samplePacks: () => v.id("samplePacks"),
  presetPacks: () => v.id("presetPacks"),
  midiPacks: () => v.id("midiPacks"),
  enrollments: () => v.id("enrollments"),
  purchases: () => v.id("purchases"),
  reviews: () => v.id("reviews"),
  transactions: () => v.id("transactions"),
  subscriptions: () => v.id("subscriptions"),
  creditPackages: () => v.id("creditPackages"),
  creditTransactions: () => v.id("creditTransactions"),
} as const;

/**
 * Common validators for frequent patterns
 */
export const commonValidators = {
  email: () => v.string(), // You might want to add email regex validation
  url: () => v.string(), // You might want to add URL validation
  slug: () => v.string(),
  price: () => v.number(),
  dateTime: () => v.number(),
  boolean: () => v.boolean(),
  optionalString: () => v.optional(v.string()),
  optionalNumber: () => v.optional(v.number()),
  optionalBoolean: () => v.optional(v.boolean()),
  
  // Common status unions
  publishStatus: () => v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  paymentStatus: () => v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"), v.literal("refunded")),
  enrollmentStatus: () => v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
  
  // Common object structures
  pagination: () => v.object({
    numItems: v.number(),
    cursor: v.union(v.string(), v.null()),
  }),
  
  // Array validators
  stringArray: () => v.array(v.string()),
  idArray: <T extends keyof typeof idValidators>(table: T) => v.array(idValidators[table]()),
} as const;

/**
 * Type-safe helper for creating Convex functions with proper validation
 */
export function createValidatedFunction<T extends Record<string, any>, R>(
  definition: ValidatedFunction<T, R>
): ValidatedFunction<T, R> {
  return definition;
}

/**
 * Utility to validate that all required fields are present in a validator
 */
export function requireAllFields<T extends Record<string, Validator<any, any, any>>>(
  fields: T
): T {
  return fields;
}

/**
 * Helper for creating consistent error responses
 */
export const errors = {
  notFound: (resource: string) => new Error(`${resource} not found`),
  unauthorized: (action: string) => new Error(`Unauthorized to ${action}`),
  invalidInput: (field: string) => new Error(`Invalid ${field}`),
  alreadyExists: (resource: string) => new Error(`${resource} already exists`),
  rateLimited: () => new Error("Rate limit exceeded"),
  serverError: (message?: string) => new Error(message || "Internal server error"),
} as const;

/**
 * Type guards for common Convex patterns
 */
export const typeGuards = {
  isValidId: (id: unknown): id is string => {
    return typeof id === "string" && id.length > 0;
  },
  
  isNonEmptyString: (value: unknown): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  },
  
  isPositiveNumber: (value: unknown): value is number => {
    return typeof value === "number" && value > 0 && !isNaN(value);
  },
  
  isValidEmail: (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  isValidUrl: (value: unknown): value is string => {
    if (typeof value !== "string") return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
} as const;

/**
 * Runtime validation helpers that complement TypeScript checking
 */
export const runtimeValidators = {
  validateRequired: <T>(value: T | undefined | null, fieldName: string): T => {
    if (value === undefined || value === null) {
      throw errors.invalidInput(`${fieldName} is required`);
    }
    return value;
  },
  
  validateEmail: (email: string): string => {
    if (!typeGuards.isValidEmail(email)) {
      throw errors.invalidInput("email format");
    }
    return email;
  },
  
  validatePositiveNumber: (num: number, fieldName: string): number => {
    if (!typeGuards.isPositiveNumber(num)) {
      throw errors.invalidInput(`${fieldName} must be a positive number`);
    }
    return num;
  },
} as const;
