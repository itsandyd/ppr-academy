"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";

// Initialize Resend with environment variable
let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Test email configuration using centralized Resend
export const testStoreEmailConfig = action({
  args: {
    storeId: v.id("stores"),
    testEmail: v.string(),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    details: v.optional(v.object({
      emailId: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    try {
      const resend = getResendClient();
      
      if (!resend) {
        return {
          success: false,
          message: "Email service not configured. Please contact support.",
        };
      }

      // Send test email using centralized Resend with store's sender settings
      const result = await resend.emails.send({
        from: args.fromName ? `${args.fromName} <${args.fromEmail}>` : args.fromEmail,
        to: args.testEmail,
        replyTo: args.replyToEmail || args.fromEmail,
        subject: "✅ Email Configuration Test - Success!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">🎉 Email Setup Complete!</h1>
            </div>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #059669; margin: 0 0 10px 0;">Configuration Test Successful</h2>
              <p style="color: #047857; margin: 0;">Your email configuration is working perfectly!</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0;">Verified Settings:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>From Email:</strong> ${args.fromEmail}</li>
                ${args.fromName ? `<li><strong>From Name:</strong> ${args.fromName}</li>` : ''}
                ${args.replyToEmail ? `<li><strong>Reply-to:</strong> ${args.replyToEmail}</li>` : ''}
              </ul>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px;">
              <h3 style="color: #1d4ed8; margin: 0 0 10px 0;">🚀 You're ready to send campaigns!</h3>
              <p style="color: #1e40af; margin: 0;">
                Your store can now send professional email campaigns to your customers.
                Visit your Email Campaigns dashboard to create your first campaign.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This test email was sent from your store's email configuration.
              </p>
            </div>
          </div>
        `,
      });

      if (result.data?.id) {
        return {
          success: true,
          message: "Test email sent successfully! Check your inbox.",
          details: {
            emailId: result.data.id,
          },
        };
      } else {
        return {
          success: false,
          message: "Failed to send test email. Please check your configuration.",
        };
      }
    } catch (error: any) {
      console.error("Email test failed:", error);
      
      let errorMessage = "Failed to send test email. ";
      
      if (error.message?.includes("from")) {
        errorMessage += "Please verify your 'from' email address format.";
      } else if (error.message?.includes("domain")) {
        errorMessage += "Please verify your domain is allowed for sending.";
      } else {
        errorMessage += `Error: ${error.message}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  },
});

// Send campaign email using centralized Resend
export const sendCampaignEmail = action({
  args: {
    storeId: v.id("stores"),
    to: v.string(),
    subject: v.string(),
    content: v.string(),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const resend = getResendClient();
      
      if (!resend) {
        return {
          success: false,
          error: "Email service not configured",
        };
      }

      // Replace personalization tokens
      let personalizedContent = args.content;
      if (args.customerName) {
        personalizedContent = personalizedContent.replace(
          /\{\{customer\.name\}\}/g, 
          args.customerName
        );
      }

      // Send email using centralized Resend
      const result = await resend.emails.send({
        from: args.fromName ? `${args.fromName} <${args.fromEmail}>` : args.fromEmail,
        to: args.to,
        replyTo: args.replyToEmail || args.fromEmail,
        subject: args.subject,
        html: personalizedContent,
      });

      if (result.data?.id) {
        return {
          success: true,
          emailId: result.data.id,
        };
      } else {
        return {
          success: false,
          error: "Failed to send email",
        };
      }
    } catch (error: any) {
      console.error("Campaign email failed:", error);
      return {
        success: false,
        error: error.message || "Failed to send campaign email",
      };
    }
  },
});

// Legacy functions for backwards compatibility (can be removed later)
export const sendLeadMagnetEmail = action({
  args: {
    to: v.string(),
    customerName: v.string(),
    leadMagnetName: v.string(),
    downloadUrl: v.string(),
    storeName: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log("📧 Legacy lead magnet email - consider migrating to store-specific configuration");
    return { success: false, error: "Please configure store-specific email settings" };
  },
});

export const sendAdminNotification = action({
  args: {
    to: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    leadMagnetName: v.string(),
    storeName: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log("📧 Legacy admin notification - consider migrating to store-specific configuration");
    return { success: false, error: "Please configure store-specific email settings" };
  },
});

export const sendWelcomeEmail = action({
  args: {
    to: v.string(),
    name: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    console.log("📧 Legacy welcome email - consider migrating to store-specific configuration");
    return { success: false, error: "Please configure store-specific email settings" };
  },
});

export const testEmailConfig = action({
  args: {
    testEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    return { 
      success: false, 
      message: "Please use store-specific email testing instead" 
    };
  },
});

// Send email campaign using store's Resend configuration
export const sendCampaign = action({
  args: { campaignId: v.id("emailCampaigns") },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    sentCount: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    // TODO: Implement actual store-specific campaign sending once API is regenerated
    console.log("📧 Store-specific campaign sending ready for implementation");
    
    return { 
      success: true, 
      message: "Campaign system ready - will implement store-specific Resend integration",
      sentCount: 0,
    };
  },
}); 