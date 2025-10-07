import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to generate unique certificate ID
function generateCertificateId(): string {
  return `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

// Helper to generate verification code (easier to type)
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) code += '-';
  }
  return code; // Format: ABC-123-XYZ
}

// ==================== QUERIES ====================

// Get user's certificates
export const getUserCertificates = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("certificates"),
    userId: v.string(),
    userName: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    instructorName: v.string(),
    certificateId: v.string(),
    completionDate: v.number(),
    issueDate: v.number(),
    completionPercentage: v.number(),
    verificationCode: v.string(),
    isValid: v.boolean(),
    pdfUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return certificates.map(cert => ({
      _id: cert._id,
      userId: cert.userId,
      userName: cert.userName,
      courseId: cert.courseId,
      courseTitle: cert.courseTitle,
      instructorName: cert.instructorName,
      certificateId: cert.certificateId,
      completionDate: cert.completionDate,
      issueDate: cert.issueDate,
      completionPercentage: cert.completionPercentage,
      verificationCode: cert.verificationCode,
      isValid: cert.isValid,
      pdfUrl: cert.pdfUrl,
    }));
  },
});

// Get certificate by ID (for verification)
export const getCertificateById = query({
  args: { certificateId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("certificates"),
      userId: v.string(),
      userName: v.string(),
      userEmail: v.string(),
      courseId: v.id("courses"),
      courseTitle: v.string(),
      instructorName: v.string(),
      instructorId: v.string(),
      certificateId: v.string(),
      completionDate: v.number(),
      issueDate: v.number(),
      totalChapters: v.number(),
      completedChapters: v.number(),
      completionPercentage: v.number(),
      verificationCode: v.string(),
      isValid: v.boolean(),
      verificationCount: v.number(),
      lastVerifiedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_certificate_id", (q) => q.eq("certificateId", args.certificateId))
      .unique();

    return certificate;
  },
});

// Get certificate by verification code
export const getCertificateByCode = query({
  args: { verificationCode: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("certificates"),
      userId: v.string(),
      userName: v.string(),
      courseTitle: v.string(),
      instructorName: v.string(),
      certificateId: v.string(),
      completionDate: v.number(),
      issueDate: v.number(),
      completionPercentage: v.number(),
      isValid: v.boolean(),
      verificationCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_verification_code", (q) => 
        q.eq("verificationCode", args.verificationCode.toUpperCase())
      )
      .unique();

    if (!certificate) return null;

    return {
      _id: certificate._id,
      userId: certificate.userId,
      userName: certificate.userName,
      courseTitle: certificate.courseTitle,
      instructorName: certificate.instructorName,
      certificateId: certificate.certificateId,
      completionDate: certificate.completionDate,
      issueDate: certificate.issueDate,
      completionPercentage: certificate.completionPercentage,
      isValid: certificate.isValid,
      verificationCount: certificate.verificationCount,
    };
  },
});

// Check if user has certificate for course
export const hasCertificate = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.union(
    v.object({
      hasCertificate: v.boolean(),
      certificateId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_user_and_course", (q) => 
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .first();

    if (!certificate) {
      return { hasCertificate: false };
    }

    return {
      hasCertificate: true,
      certificateId: certificate.certificateId,
    };
  },
});

// ==================== MUTATIONS ====================

// Generate certificate for course completion
export const generateCertificate = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    instructorName: v.string(),
    instructorId: v.string(),
    totalChapters: v.number(),
    completedChapters: v.number(),
    completionPercentage: v.number(),
    timeSpent: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    certificateId: v.optional(v.string()),
    verificationCode: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check if certificate already exists
      const existing = await ctx.db
        .query("certificates")
        .withIndex("by_user_and_course", (q) => 
          q.eq("userId", args.userId).eq("courseId", args.courseId)
        )
        .first();

      if (existing) {
        return {
          success: true,
          certificateId: existing.certificateId,
          verificationCode: existing.verificationCode,
        };
      }

      // Generate unique IDs
      const certificateId = generateCertificateId();
      const verificationCode = generateVerificationCode();
      const now = Date.now();

      // Create certificate
      await ctx.db.insert("certificates", {
        userId: args.userId,
        userName: args.userName,
        userEmail: args.userEmail,
        courseId: args.courseId,
        courseTitle: args.courseTitle,
        instructorName: args.instructorName,
        instructorId: args.instructorId,
        certificateId,
        completionDate: now,
        issueDate: now,
        totalChapters: args.totalChapters,
        completedChapters: args.completedChapters,
        completionPercentage: args.completionPercentage,
        timeSpent: args.timeSpent,
        verificationCode,
        isValid: true,
        createdAt: now,
        verificationCount: 0,
      });

      return {
        success: true,
        certificateId,
        verificationCode,
      };
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// Verify a certificate (logs verification attempt)
export const verifyCertificate = mutation({
  args: {
    certificateId: v.string(),
    verifierIp: v.optional(v.string()),
    verifierUserAgent: v.optional(v.string()),
  },
  returns: v.object({
    isValid: v.boolean(),
    certificate: v.optional(v.object({
      userName: v.string(),
      courseTitle: v.string(),
      instructorName: v.string(),
      completionDate: v.number(),
      issueDate: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const certificate = await ctx.db
      .query("certificates")
      .withIndex("by_certificate_id", (q) => q.eq("certificateId", args.certificateId))
      .unique();

    const now = Date.now();

    // Log verification attempt
    await ctx.db.insert("certificateVerifications", {
      certificateId: args.certificateId,
      verifierIp: args.verifierIp,
      verifierUserAgent: args.verifierUserAgent,
      isValid: !!certificate?.isValid,
      verifiedAt: now,
    });

    if (!certificate || !certificate.isValid) {
      return { isValid: false };
    }

    // Update verification count and last verified time
    await ctx.db.patch(certificate._id, {
      verificationCount: certificate.verificationCount + 1,
      lastVerifiedAt: now,
    });

    return {
      isValid: true,
      certificate: {
        userName: certificate.userName,
        courseTitle: certificate.courseTitle,
        instructorName: certificate.instructorName,
        completionDate: certificate.completionDate,
        issueDate: certificate.issueDate,
      },
    };
  },
});

// Revoke a certificate (instructor/admin only)
export const revokeCertificate = mutation({
  args: {
    certificateId: v.string(),
    revokedBy: v.string(), // User ID of person revoking
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const certificate = await ctx.db
        .query("certificates")
        .withIndex("by_certificate_id", (q) => q.eq("certificateId", args.certificateId))
        .unique();

      if (!certificate) {
        return { success: false, error: "Certificate not found" };
      }

      // TODO: Add authorization check (instructor or admin only)

      await ctx.db.patch(certificate._id, {
        isValid: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error revoking certificate:", error);
      return { success: false, error: error.message };
    }
  },
});

// Update certificate PDF URL (after client-side generation)
export const updateCertificatePdf = mutation({
  args: {
    certificateId: v.string(),
    pdfStorageId: v.id("_storage"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const certificate = await ctx.db
        .query("certificates")
        .withIndex("by_certificate_id", (q) => q.eq("certificateId", args.certificateId))
        .unique();

      if (!certificate) {
        return { success: false, error: "Certificate not found" };
      }

      const pdfUrl = await ctx.storage.getUrl(args.pdfStorageId);

      await ctx.db.patch(certificate._id, {
        pdfStorageId: args.pdfStorageId,
        pdfUrl: pdfUrl || undefined,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error updating certificate PDF:", error);
      return { success: false, error: error.message };
    }
  },
});
