import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Email Replies System Schema
 * 
 * Manages customer replies to email campaigns with automatic creator matching
 */

export const emailRepliesTables = {
  // Customer replies to campaigns
  emailReplies: defineTable({
    // Email metadata
    messageId: v.string(), // Unique email message ID
    inReplyTo: v.optional(v.string()), // Original message ID being replied to
    references: v.optional(v.array(v.string())), // Email thread references
    
    // From/To
    fromEmail: v.string(), // Customer email
    fromName: v.optional(v.string()), // Customer name
    toEmail: v.string(), // inbox@pauseplayrepeat.com
    
    // Content
    subject: v.string(),
    textBody: v.optional(v.string()),
    htmlBody: v.optional(v.string()),
    
    // Timestamps
    receivedAt: v.number(),
    sentAt: v.optional(v.number()), // When customer sent it
    
    // Matching to creator
    storeId: v.optional(v.id("stores")), // Matched store
    campaignId: v.optional(v.id("resendCampaigns")), // Original campaign (Resend campaigns)
    matchConfidence: v.optional(v.union(
      v.literal("high"),    // Matched via message ID
      v.literal("medium"),  // Matched via email/store
      v.literal("low"),     // Guessed based on content
      v.literal("manual")   // Manually assigned
    )),
    
    // Status
    status: v.union(
      v.literal("new"),        // Not yet reviewed
      v.literal("read"),       // Creator viewed it
      v.literal("replied"),    // Creator replied
      v.literal("spam"),       // Marked as spam
      v.literal("archived")    // Archived
    ),
    readAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
    
    // Creator reply
    creatorReply: v.optional(v.object({
      message: v.string(),
      sentAt: v.number(),
      sentVia: v.union(
        v.literal("dashboard"), // Replied through platform
        v.literal("email")      // Replied via email directly
      ),
    })),
    
    // Categorization
    category: v.optional(v.union(
      v.literal("question"),
      v.literal("feedback"),
      v.literal("complaint"),
      v.literal("spam"),
      v.literal("other")
    )),
    tags: v.optional(v.array(v.string())),
    
    // Notes
    internalNotes: v.optional(v.string()),
    flagged: v.optional(v.boolean()),
    
    // Attachments
    hasAttachments: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.object({
      filename: v.string(),
      contentType: v.string(),
      size: v.number(),
      url: v.string(), // Convex storage URL
    }))),
  })
  .index("by_storeId", ["storeId"])
  .index("by_status", ["status"])
  .index("by_receivedAt", ["receivedAt"])
  .index("by_campaignId", ["campaignId"])
  .index("by_messageId", ["messageId"])
  .index("by_fromEmail", ["fromEmail"]),

  // Reply matching log (for debugging and improving matching algorithm)
  replyMatchingLog: defineTable({
    replyId: v.id("emailReplies"),
    attemptedAt: v.number(),
    matchingStrategy: v.string(), // "messageId", "email", "content", "manual"
    matched: v.boolean(),
    matchedStoreId: v.optional(v.id("stores")),
    confidence: v.optional(v.string()),
    debug: v.optional(v.string()), // Debugging info
  })
  .index("by_replyId", ["replyId"]),
};

