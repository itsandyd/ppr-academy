import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Course Completion Certificates Schema
 * 
 * Generates and tracks certificates for students who complete courses.
 * Includes verification system for authenticity.
 */

export const certificatesTable = defineTable({
  // Student Info
  userId: v.string(), // Clerk user ID
  userName: v.string(), // Student's full name
  userEmail: v.string(), // For verification
  
  // Course Info
  courseId: v.id("courses"),
  courseTitle: v.string(), // Cached for display
  instructorName: v.string(), // Course creator's name
  instructorId: v.string(), // Course creator's ID
  
  // Certificate Details
  certificateId: v.string(), // Unique verification ID (UUID)
  completionDate: v.number(), // When course was completed
  issueDate: v.number(), // When certificate was issued
  
  // Progress Metrics
  totalChapters: v.number(),
  completedChapters: v.number(),
  completionPercentage: v.number(),
  timeSpent: v.optional(v.number()), // Total time in minutes
  
  // Certificate File
  pdfUrl: v.optional(v.string()), // URL to generated PDF (Convex storage)
  pdfStorageId: v.optional(v.id("_storage")), // Storage ID for PDF
  
  // Verification
  verificationCode: v.string(), // Short code for quick verification (e.g., "ABC-123-XYZ")
  isValid: v.boolean(), // Can be revoked if needed
  
  // Metadata
  createdAt: v.number(),
  lastVerifiedAt: v.optional(v.number()), // Last time someone verified this cert
  verificationCount: v.number(), // How many times verified
})
  .index("by_user", ["userId", "createdAt"])
  .index("by_course", ["courseId", "issueDate"])
  .index("by_certificate_id", ["certificateId"])
  .index("by_verification_code", ["verificationCode"])
  .index("by_user_and_course", ["userId", "courseId"]);

export const certificateVerificationsTable = defineTable({
  // What's being verified
  certificateId: v.string(), // The certificate being verified
  
  // Who verified it
  verifierIp: v.optional(v.string()), // IP address of verifier
  verifierUserAgent: v.optional(v.string()), // Browser info
  
  // Verification result
  isValid: v.boolean(),
  
  // Timestamp
  verifiedAt: v.number(),
})
  .index("by_certificate", ["certificateId", "verifiedAt"])
  .index("by_date", ["verifiedAt"]);
