import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) {
    throw new Error("Unauthorized: Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || user.admin !== true) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

export const submitCopyrightClaim = mutation({
  args: {
    contentId: v.string(),
    contentType: v.union(v.literal("sample"), v.literal("product"), v.literal("course")),
    contentTitle: v.string(),
    storeId: v.optional(v.string()),
    reportedUserName: v.optional(v.string()),
    claimantName: v.string(),
    claimantEmail: v.string(),
    claimantAddress: v.optional(v.string()),
    claimantPhone: v.optional(v.string()),
    originalWorkDescription: v.string(),
    originalWorkUrl: v.optional(v.string()),
    infringementDescription: v.string(),
    goodFaithStatement: v.boolean(),
    accuracyStatement: v.boolean(),
    digitalSignature: v.string(),
  },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    if (!args.goodFaithStatement || !args.accuracyStatement) {
      throw new Error("You must agree to both legal statements to submit a DMCA claim");
    }

    if (!args.digitalSignature.trim()) {
      throw new Error("Digital signature (typed name) is required");
    }

    const reportId = await ctx.db.insert("reports", {
      type: "copyright" as const,
      status: "pending" as const,
      reportedBy: args.claimantEmail,
      reportedAt: Date.now(),
      reason: "DMCA Copyright Infringement Claim",
      contentId: args.contentId,
      contentTitle: args.contentTitle,
      contentPreview: args.infringementDescription.substring(0, 200),
      reporterName: args.claimantName,
      reportedUserName: args.reportedUserName,
      storeId: args.storeId,
      contentType: args.contentType,
      copyrightClaim: {
        claimantName: args.claimantName,
        claimantEmail: args.claimantEmail,
        claimantAddress: args.claimantAddress,
        claimantPhone: args.claimantPhone,
        originalWorkDescription: args.originalWorkDescription,
        originalWorkUrl: args.originalWorkUrl,
        infringementDescription: args.infringementDescription,
        goodFaithStatement: args.goodFaithStatement,
        accuracyStatement: args.accuracyStatement,
        signatureDate: Date.now(),
        digitalSignature: args.digitalSignature,
      },
    });

    await ctx.scheduler.runAfter(0, internal.copyrightEmails.sendClaimReceivedEmail, {
      claimantName: args.claimantName,
      claimantEmail: args.claimantEmail,
      contentTitle: args.contentTitle,
      claimId: reportId,
    });

    if (args.storeId) {
      try {
        const store = await ctx.db.get(args.storeId as Id<"stores">);
        if (store?.userId) {
          const storeOwner = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", store.userId))
            .unique();

          if (storeOwner?.email) {
            await ctx.scheduler.runAfter(0, internal.copyrightEmails.sendClaimNoticeEmail, {
              creatorName: storeOwner.name || store.name || "Creator",
              creatorEmail: storeOwner.email,
              contentTitle: args.contentTitle,
              claimantName: args.claimantName,
              claimId: reportId,
            });
          }
        }
      } catch (e) {
        // Don't fail the claim submission if notification fails
        console.error("Failed to notify accused creator:", e);
      }
    }

    return reportId;
  },
});

export const submitCounterNotice = mutation({
  args: {
    reportId: v.id("reports"),
    respondentName: v.string(),
    respondentEmail: v.string(),
    respondentAddress: v.string(),
    explanation: v.string(),
    statementOfGoodFaith: v.boolean(),
    consentToJurisdiction: v.boolean(),
    digitalSignature: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to submit a counter-notice");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    if (report.type !== "copyright") {
      throw new Error("Counter-notices can only be submitted for copyright claims");
    }

    if (!args.statementOfGoodFaith || !args.consentToJurisdiction) {
      throw new Error("You must agree to both legal statements");
    }

    await ctx.db.patch(args.reportId, {
      status: "counter_notice" as const,
      counterNotice: {
        respondentName: args.respondentName,
        respondentEmail: args.respondentEmail,
        respondentAddress: args.respondentAddress,
        explanation: args.explanation,
        statementOfGoodFaith: args.statementOfGoodFaith,
        consentToJurisdiction: args.consentToJurisdiction,
        signatureDate: Date.now(),
        digitalSignature: args.digitalSignature,
      },
    });

    return null;
  },
});

export const issueCopyrightStrike = mutation({
  args: {
    clerkId: v.string(),
    storeId: v.id("stores"),
    reportId: v.id("reports"),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    totalStrikes: v.number(),
    suspended: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    const report = await ctx.db.get(args.reportId);

    const currentStrikes = store.copyrightStrikes || 0;
    const newStrikeCount = currentStrikes + 1;
    const strikeHistory = store.strikeHistory || [];

    strikeHistory.push({
      strikeNumber: newStrikeCount,
      reportId: args.reportId as string,
      reason: args.reason,
      issuedAt: Date.now(),
      issuedBy: args.clerkId,
    });

    const updates: {
      copyrightStrikes: number;
      lastStrikeAt: number;
      strikeHistory: typeof strikeHistory;
      suspendedAt?: number;
      suspensionReason?: string;
      isPublic?: boolean;
    } = {
      copyrightStrikes: newStrikeCount,
      lastStrikeAt: Date.now(),
      strikeHistory,
    };

    let suspended = false;
    if (newStrikeCount >= 3) {
      updates.suspendedAt = Date.now();
      updates.suspensionReason =
        "Account suspended due to repeated copyright violations (3 strikes)";
      updates.isPublic = false;
      suspended = true;
    }

    await ctx.db.patch(args.storeId, updates);

    const storeOwner = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", store.userId))
      .unique();

    if (storeOwner?.email) {
      await ctx.scheduler.runAfter(0, internal.copyrightEmails.sendStrikeEmail, {
        creatorName: storeOwner.name || store.name || "Creator",
        creatorEmail: storeOwner.email,
        contentTitle: report?.contentTitle || "Content",
        strikeNumber: newStrikeCount,
        totalStrikes: newStrikeCount,
        isSuspended: suspended,
      });
    }

    return {
      success: true,
      totalStrikes: newStrikeCount,
      suspended,
    };
  },
});

export const takedownContent = mutation({
  args: {
    clerkId: v.string(),
    reportId: v.id("reports"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    const contentType = report.contentType;

    if (contentType === "product") {
      try {
        const productId = report.contentId as Id<"digitalProducts">;
        const product = await ctx.db.get(productId);
        if (product) {
          await ctx.db.patch(productId, {
            isPublished: false,
          });
        }
      } catch (e) {
        console.error("Failed to unpublish product:", e);
      }
    }

    await ctx.db.patch(args.reportId, {
      status: "resolved" as const,
      resolution: args.reason || "Content removed due to valid DMCA claim",
      reviewedBy: args.clerkId,
      reviewedAt: Date.now(),
      takenDownAt: Date.now(),
    });

    if (report.copyrightClaim?.claimantEmail) {
      await ctx.scheduler.runAfter(0, internal.copyrightEmails.sendClaimResolvedEmail, {
        recipientName: report.copyrightClaim.claimantName || "Claimant",
        recipientEmail: report.copyrightClaim.claimantEmail,
        contentTitle: report.contentTitle || "Content",
        claimId: args.reportId,
        resolution: "upheld" as const,
        resolutionDetails:
          "The copyright claim was found to be valid. The content has been removed from the platform.",
      });
    }

    return {
      success: true,
      message: "Content has been taken down",
    };
  },
});

export const getStoreCopyrightClaims = query({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const store = await ctx.db.get(args.storeId);
    if (!store || store.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("reports")
      .withIndex("by_store_id", (q) => q.eq("storeId", args.storeId as string))
      .filter((q) => q.eq(q.field("type"), "copyright"))
      .order("desc")
      .take(500);
  },
});

export const getStoreStrikeStatus = query({
  args: {
    storeId: v.id("stores"),
  },
  returns: v.object({
    strikes: v.number(),
    isSuspended: v.boolean(),
    strikeHistory: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    return {
      strikes: store.copyrightStrikes || 0,
      isSuspended: !!store.suspendedAt,
      strikeHistory: store.strikeHistory || [],
    };
  },
});

export const getCopyrightReports = query({
  args: {
    clerkId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("resolved"),
        v.literal("dismissed"),
        v.literal("counter_notice")
      )
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await verifyAdmin(ctx, args.clerkId);

    if (args.status) {
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(500);
      return reports.filter((r) => r.type === "copyright");
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_type", (q) => q.eq("type", "copyright"))
      .order("desc")
      .take(500);
    return reports;
  },
});
