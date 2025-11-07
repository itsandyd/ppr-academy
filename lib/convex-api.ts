/**
 * Helper module to work around TypeScript's "Type instantiation is excessively deep" error
 * with large Convex APIs.
 * 
 * This re-exports the api and internal objects without triggering deep type instantiation.
 */

// @ts-nocheck
// Disable type checking for this entire file to bypass deep instantiation errors

export { api, internal } from "@/convex/_generated/api";
