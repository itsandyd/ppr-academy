"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Email reply sending actions
 * TRANSACTIONAL: Do not move to marketing API — these are customer support replies.
 */

/**
 * Send reply to customer
 */
export const sendReplyEmail = internalAction({
  args: {
    replyId: v.id("emailReplies"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get reply details
    const reply: any = await ctx.runQuery(
      "inboxQueries:getReplyDetails" as any,
      { replyId: args.replyId }
    );
    
    if (!reply || !reply.storeId) {
      console.error("[Inbox Actions] Reply not found or not matched to store");
      return null;
    }
    
    // Get store details
    const store: any = await ctx.runQuery(
      "stores:getStoreById" as any,
      { storeId: reply.storeId }
    );
    
    if (!store?.emailConfig) {
      console.error("[Inbox Actions] Store email not configured");
      return null;
    }
    
    try {
      const { sendEmailViaProvider } = await import("./lib/emailProvider");
      await sendEmailViaProvider({
        from: store.emailConfig.fromName
          ? `${store.emailConfig.fromName} <${store.emailConfig.fromEmail}>`
          : store.emailConfig.fromEmail,
        to: reply.fromEmail,
        replyTo: "inbox@pauseplayrepeat.com",
        subject: reply.subject.startsWith("Re:") ? reply.subject : `Re: ${reply.subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; white-space: pre-wrap;">${args.message}</p>
            </div>
            
            <div style="border-top: 2px solid #e5e7eb; margin-top: 30px; padding-top: 15px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                <strong>From:</strong> ${reply.fromName || reply.fromEmail}
              </p>
              <div style="color: #9ca3af; font-size: 13px;">
                ${reply.textBody || reply.htmlBody || ''}
              </div>
            </div>
          </div>
        `,
        headers: {
          "In-Reply-To": reply.messageId,
          "References": reply.references?.join(" ") || reply.messageId,
        },
      });
      
    } catch (error) {
      console.error("[Inbox Actions] Failed to send reply:", error);
      throw error;
    }
    
    return null;
  },
});

