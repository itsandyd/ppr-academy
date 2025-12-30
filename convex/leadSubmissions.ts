import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Helper function to send confirmation email
async function sendConfirmationEmailHelper(ctx: any, args: any, product: any) {
  console.log("🚀 STARTING EMAIL PROCESS - this should always appear");

  try {
    console.log("📧 Checking email configuration for product:", {
      productId: args.productId,
      productTitle: product?.title,
      hasDownloadUrl: !!product?.downloadUrl,
      hasEmailSubject: !!product?.confirmationEmailSubject,
      hasEmailBody: !!product?.confirmationEmailBody,
      emailSubject: product?.confirmationEmailSubject,
      emailBody: product?.confirmationEmailBody?.slice(0, 100) + "...", // First 100 chars
    });

    // Send confirmation email to customer with download link
    if (product?.downloadUrl && product.confirmationEmailSubject && product.confirmationEmailBody) {
      console.log("📧 ✅ All email requirements met! Sending confirmation email for:", args.email);

      try {
        // Use the centralized email action to send confirmation email
        console.log("🔄 About to schedule email action...");
        const emailResult = await ctx.scheduler.runAfter(
          0,
          (internal as any).emails.sendLeadMagnetConfirmation,
          {
            storeId: args.storeId as any,
            customerEmail: args.email,
            customerName: args.name,
            productName: product.title,
            downloadUrl: product.downloadUrl,
            confirmationSubject: product.confirmationEmailSubject,
            confirmationBody: product.confirmationEmailBody,
          }
        );

        console.log("✅ Lead magnet confirmation email scheduled successfully:", emailResult);
      } catch (scheduleError) {
        console.error("❌ Failed to schedule email:", scheduleError);
      }
    } else {
      console.log("❌ Cannot send confirmation email - missing requirements:", {
        hasDownloadUrl: !!product?.downloadUrl,
        hasEmailSubject: !!product?.confirmationEmailSubject,
        hasEmailBody: !!product?.confirmationEmailBody,
        productTitle: product?.title,
      });
    }
  } catch (emailError) {
    console.error("⚠️ Email sending failed, but lead was still recorded:", emailError);
  }

  console.log("🏁 EMAIL PROCESS COMPLETE - this should always appear");
}

// Submit a lead magnet opt-in
export const submitLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    productId: v.id("digitalProducts"),
    storeId: v.string(),
    adminUserId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  returns: v.object({
    submissionId: v.id("leadSubmissions"),
    hasAccess: v.boolean(),
    downloadUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check if this email has already opted in for this product
    const existingSubmission = await ctx.db
      .query("leadSubmissions")
      .withIndex("by_email_and_product", (q) =>
        q.eq("email", args.email).eq("productId", args.productId)
      )
      .unique();

    if (existingSubmission) {
      // User already opted in - send email again and return existing submission
      const product = await ctx.db.get(args.productId);

      // Send email even for returning users
      console.log("🔄 Returning user - sending confirmation email again");
      await sendConfirmationEmailHelper(ctx, args, product);

      // Send admin notification for returning user engagement
      try {
        console.log("📧 Scheduling admin notification for returning user...");
        await ctx.scheduler.runAfter(0, (internal as any).emails.sendNewLeadAdminNotification, {
          storeId: args.storeId as any,
          customerName: args.name,
          customerEmail: args.email,
          productName: product?.title || "Lead Magnet",
          source: (args.source || "storefront") + " (returning user)",
        });
        console.log("✅ Admin notification for returning user scheduled successfully");
      } catch (adminNotificationError) {
        console.error("⚠️ Admin notification failed for returning user:", adminNotificationError);
      }

      // Trigger workflows for returning user activity
      try {
        console.log("🔄 Checking for returning user workflows to trigger...");
        await ctx.scheduler.runAfter(
          0,
          (internal as any).emailWorkflows.triggerLeadSignupWorkflows,
          {
            storeId: args.storeId,
            customerEmail: args.email,
            customerName: args.name,
            productId: args.productId,
            productName: product?.title || "Lead Magnet",
            source: (args.source || "storefront") + " (returning user)",
            isReturningUser: true,
          }
        );
        console.log("✅ Returning user workflow triggers scheduled successfully");
      } catch (workflowError) {
        console.error("⚠️ Returning user workflow triggering failed:", workflowError);
      }

      return {
        submissionId: existingSubmission._id,
        hasAccess: true,
        downloadUrl: product?.downloadUrl,
      };
    }

    // Create new lead submission
    const submissionId = await ctx.db.insert("leadSubmissions", {
      name: args.name,
      email: args.email,
      productId: args.productId,
      storeId: args.storeId,
      adminUserId: args.adminUserId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      hasDownloaded: false,
      downloadCount: 0,
      source: args.source,
    });

    // Get the product to determine the source name
    const product = await ctx.db.get(args.productId);

    // Create or update customer record automatically
    try {
      // Check if customer already exists for this store
      const existingCustomer = await ctx.db
        .query("customers")
        .withIndex("by_email_and_store", (q) =>
          q.eq("email", args.email).eq("storeId", args.storeId)
        )
        .unique();

      if (existingCustomer) {
        // Update existing customer with latest activity
        await ctx.db.patch(existingCustomer._id, {
          name: args.name, // Update name in case it changed
          lastActivity: Date.now(),
          status: "active",
          source: existingCustomer.source || product?.title || args.source,
        });
      } else {
        // Create new customer record
        await ctx.db.insert("customers", {
          name: args.name,
          email: args.email,
          storeId: args.storeId,
          adminUserId: args.adminUserId,
          type: "lead",
          status: "active",
          totalSpent: 0,
          lastActivity: Date.now(),
          source: product?.title || args.source || "Lead Magnet",
        });
      }
    } catch (error) {
      // Log error but don't fail the lead submission
      console.error("Failed to create/update customer record:", error);
    }

    // Send automated emails (if Resend is configured)
    await sendConfirmationEmailHelper(ctx, args, product);

    // Send admin notification for new lead
    try {
      console.log("📧 Scheduling admin notification for new lead...");
      await ctx.scheduler.runAfter(0, (internal as any).emails.sendNewLeadAdminNotification, {
        storeId: args.storeId as any,
        customerName: args.name,
        customerEmail: args.email,
        productName: product?.title || "Lead Magnet",
        source: args.source || "storefront",
      });
      console.log("✅ Admin notification scheduled successfully");
    } catch (adminNotificationError) {
      console.error(
        "⚠️ Admin notification failed, but lead was still recorded:",
        adminNotificationError
      );
    }

    // Trigger email automation workflows
    try {
      console.log("🔄 Checking for automation workflows to trigger...");
      await ctx.scheduler.runAfter(0, (internal as any).emailWorkflows.triggerLeadSignupWorkflows, {
        storeId: args.storeId,
        customerEmail: args.email,
        customerName: args.name,
        productId: args.productId,
        productName: product?.title || "Lead Magnet",
        source: args.source || "storefront",
      });
      console.log("✅ Workflow triggers scheduled successfully");
    } catch (workflowError) {
      console.error("⚠️ Workflow triggering failed, but lead was still recorded:", workflowError);
    }

    // Trigger drip campaigns for lead signup
    try {
      console.log("🔄 Checking for drip campaigns to trigger...");
      await ctx.scheduler.runAfter(
        0,
        (internal as any).dripCampaignActions.triggerCampaignsForEvent,
        {
          storeId: args.storeId,
          triggerType: "lead_signup",
          email: args.email,
          name: args.name,
          metadata: {
            productId: args.productId,
            productName: product?.title,
            source: args.source || "storefront",
          },
        }
      );
      console.log("✅ Drip campaign triggers scheduled successfully");
    } catch (dripError) {
      console.error("⚠️ Drip campaign triggering failed, but lead was still recorded:", dripError);
    }

    return {
      submissionId,
      hasAccess: true,
      downloadUrl: product?.downloadUrl,
    };
  },
});

// Check if a user has access to download a lead magnet
export const checkDownloadAccess = query({
  args: {
    email: v.string(),
    productId: v.id("digitalProducts"),
  },
  returns: v.object({
    hasAccess: v.boolean(),
    downloadUrl: v.optional(v.string()),
    submissionInfo: v.optional(
      v.object({
        _id: v.id("leadSubmissions"),
        name: v.string(),
        downloadCount: v.optional(v.number()),
        lastDownloadAt: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const submission = await ctx.db
      .query("leadSubmissions")
      .withIndex("by_email_and_product", (q) =>
        q.eq("email", args.email).eq("productId", args.productId)
      )
      .unique();

    if (!submission) {
      return {
        hasAccess: false,
      };
    }

    const product = await ctx.db.get(args.productId);

    return {
      hasAccess: true,
      downloadUrl: product?.downloadUrl,
      submissionInfo: {
        _id: submission._id,
        name: submission.name,
        downloadCount: submission.downloadCount,
        lastDownloadAt: submission.lastDownloadAt,
      },
    };
  },
});

// Track a download
export const trackDownload = mutation({
  args: {
    submissionId: v.id("leadSubmissions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);

    if (submission) {
      await ctx.db.patch(args.submissionId, {
        hasDownloaded: true,
        downloadCount: (submission.downloadCount || 0) + 1,
        lastDownloadAt: Date.now(),
      });
    }

    return null;
  },
});

// Get all leads for an admin
export const getLeadsForAdmin = query({
  args: { adminUserId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("leadSubmissions"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      productId: v.id("digitalProducts"),
      storeId: v.string(),
      adminUserId: v.string(),
      hasDownloaded: v.optional(v.boolean()),
      downloadCount: v.optional(v.number()),
      lastDownloadAt: v.optional(v.number()),
      source: v.optional(v.string()),
      productTitle: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("leadSubmissions")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .order("desc")
      .collect();

    // Enrich with product information
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const product = await ctx.db.get(submission.productId);
        return {
          ...submission,
          productTitle: product?.title,
        };
      })
    );

    return enrichedSubmissions;
  },
});

// Get leads for a specific product
export const getLeadsForProduct = query({
  args: { productId: v.id("digitalProducts") },
  returns: v.array(
    v.object({
      _id: v.id("leadSubmissions"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      hasDownloaded: v.optional(v.boolean()),
      downloadCount: v.optional(v.number()),
      lastDownloadAt: v.optional(v.number()),
      source: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leadSubmissions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .order("desc")
      .collect();
  },
});

// Get leads for a specific store
export const getLeadsForStore = query({
  args: { storeId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("leadSubmissions"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      productId: v.id("digitalProducts"),
      hasDownloaded: v.optional(v.boolean()),
      downloadCount: v.optional(v.number()),
      lastDownloadAt: v.optional(v.number()),
      source: v.optional(v.string()),
      productTitle: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("leadSubmissions")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();

    // Enrich with product information
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (submission) => {
        const product = await ctx.db.get(submission.productId);
        return {
          ...submission,
          productTitle: product?.title,
        };
      })
    );

    return enrichedSubmissions;
  },
});

// Get lead statistics for an admin
export const getLeadStats = query({
  args: { adminUserId: v.string() },
  returns: v.object({
    totalLeads: v.number(),
    totalDownloads: v.number(),
    uniqueDownloaders: v.number(),
    conversionRate: v.number(),
  }),
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("leadSubmissions")
      .withIndex("by_adminUserId", (q) => q.eq("adminUserId", args.adminUserId))
      .collect();

    const totalLeads = submissions.length;
    const totalDownloads = submissions.reduce((sum, sub) => sum + (sub.downloadCount || 0), 0);
    const uniqueDownloaders = submissions.filter((sub) => sub.hasDownloaded).length;
    const conversionRate = totalLeads > 0 ? (uniqueDownloaders / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalDownloads,
      uniqueDownloaders,
      conversionRate,
    };
  },
});
