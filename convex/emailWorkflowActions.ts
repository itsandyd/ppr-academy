"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Send email from a workflow using a template
 * Used by the durable workflow system
 */
export const sendWorkflowEmail = internalAction({
  args: {
    contactId: v.optional(v.id("emailContacts")),
    templateId: v.id("emailTemplates"),
    storeId: v.string(),
    customerEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { Resend } = await import("resend");
    const crypto = await import("crypto");

    // Get the template
    const template = await ctx.runQuery(internal.emailWorkflows.getEmailTemplateInternal, {
      templateId: args.templateId,
    });

    if (!template) {
      console.error(`[WorkflowEmail] Template ${args.templateId} not found`);
      return null;
    }

    // Get contact info if available
    let firstName = "there";
    let name = "";
    if (args.contactId) {
      const contact = await ctx.runQuery(internal.emailWorkflows.getContactInternal, {
        contactId: args.contactId,
      });
      if (contact) {
        firstName = contact.firstName || contact.email.split("@")[0];
        name = contact.firstName && contact.lastName
          ? `${contact.firstName} ${contact.lastName}`
          : contact.firstName || "";
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate unsubscribe URL
    const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CLERK_SECRET_KEY || "fallback";
    const emailBase64 = Buffer.from(args.customerEmail).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(args.customerEmail).digest("base64url");
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com"}/unsubscribe/${emailBase64}.${signature}`;

    // Personalize content
    const htmlContent = (template.htmlContent || template.content || "")
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there")
      .replace(/\{\{email\}\}/g, args.customerEmail)
      .replace(/\{\{unsubscribeLink\}\}/g, unsubscribeUrl)
      .replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

    const subject = template.subject
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{name\}\}/g, name || "there");

    const fromEmail = process.env.FROM_EMAIL || "noreply@ppracademy.com";
    const fromName = process.env.FROM_NAME || "PPR Academy";

    try {
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: args.customerEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[WorkflowEmail] Sent email to ${args.customerEmail}: ${subject}`);
    } catch (error) {
      console.error(`[WorkflowEmail] Failed to send email:`, error);
      throw error;
    }

    return null;
  },
});
