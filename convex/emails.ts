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

// Send lead magnet confirmation email using centralized Resend
export const sendLeadMagnetConfirmation = action({
  args: {
    storeId: v.id("stores"),
    customerEmail: v.string(),
    customerName: v.string(),
    productName: v.string(),
    downloadUrl: v.string(),
    confirmationSubject: v.string(),
    confirmationBody: v.string(),
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

      // Get store's email configuration
      const emailConfig = await ctx.runQuery((internal as any).stores.getStoreEmailConfigInternal, {
        storeId: args.storeId,
      });

      if (!emailConfig) {
        return {
          success: false,
          error: "Store email configuration not found",
        };
      }

      // Replace personalization tokens in subject
      let personalizedSubject = args.confirmationSubject
        .replace(/\{\{\s*customer[_\s]name\s*\}\}/gi, args.customerName)
        .replace(/\{\{\s*product[_\s]name\s*\}\}/gi, args.productName);

      // Replace personalization tokens in body
      let personalizedBody = args.confirmationBody
        .replace(/\{\{\s*customer[_\s]name\s*\}\}/gi, args.customerName)
        .replace(/\{\{\s*product[_\s]name\s*\}\}/gi, args.productName)
        .replace(/\{\{\s*download[_\s]link\s*\}\}/gi, `<a href="${args.downloadUrl}" style="color: #6356FF; text-decoration: underline;">Download Your Resource</a>`);

      // Add download button to the email
      const emailWithDownloadButton = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${personalizedBody}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${args.downloadUrl}" 
               style="display: inline-block; background: #6356FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              📥 Download Your Resource
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
            <p>This email was sent because you opted in to receive this resource. The download link will remain active.</p>
          </div>
        </div>
      `;

      // Send email using centralized Resend
      const result = await resend.emails.send({
        from: emailConfig.fromName ? `${emailConfig.fromName} <${emailConfig.fromEmail}>` : emailConfig.fromEmail,
        to: args.customerEmail,
        replyTo: emailConfig.replyToEmail || emailConfig.fromEmail,
        subject: personalizedSubject,
        html: emailWithDownloadButton,
      });

      if (result.data?.id) {
        return {
          success: true,
          emailId: result.data.id,
        };
      } else {
        return {
          success: false,
          error: "Failed to send confirmation email",
        };
      }
    } catch (error: any) {
      console.error("Lead magnet confirmation email failed:", error);
      return {
        success: false,
        error: error.message || "Failed to send confirmation email",
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

// Send admin notification for new lead signup
export const sendNewLeadAdminNotification = action({
  args: {
    storeId: v.id("stores"),
    customerName: v.string(),
    customerEmail: v.string(),
    productName: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log("📧 Starting admin notification process for new lead:", args.customerEmail);
      
      const resend = getResendClient();
      if (!resend) {
        console.log("⚠️ RESEND_API_KEY not configured. Admin notification simulation mode.");
        return {
          success: true,
          error: "Email service not configured - simulation mode",
        };
      }

      // Get store information
      const store = await ctx.runQuery((internal as any).stores.getStoreById, {
        storeId: args.storeId,
      });

      if (!store) {
        return {
          success: false,
          error: "Store not found",
        };
      }

      // Check if admin notifications are enabled
      const notificationSettings = store.emailConfig?.adminNotifications;
      const isReturningUser = args.source?.includes("returning user");
      
      // Check if notifications are disabled globally
      if (notificationSettings?.enabled === false) {
        console.log("📧 Admin notifications disabled for store:", store.name);
        return {
          success: true,
          error: "Admin notifications disabled",
        };
      }

      // Check specific notification types
      if (isReturningUser && notificationSettings?.emailOnReturningUser === false) {
        console.log("📧 Returning user notifications disabled for store:", store.name);
        return {
          success: true,
          error: "Returning user notifications disabled",
        };
      }

      if (!isReturningUser && notificationSettings?.emailOnNewLead === false) {
        console.log("📧 New lead notifications disabled for store:", store.name);
        return {
          success: true,
          error: "New lead notifications disabled",
        };
      }

      // Get admin user information
      const adminUser = await ctx.runQuery((internal as any).users.getUserById, {
        userId: store.userId,
      });

      if (!adminUser?.email) {
        return {
          success: false,
          error: "Admin user email not found",
        };
      }

      // Use store's email configuration if available, otherwise use defaults
      const fromEmail = store.emailConfig?.fromEmail || 'noreply@ppr-academy.com';
      const fromName = store.emailConfig?.fromName || store.name;
      const replyToEmail = store.emailConfig?.replyToEmail || adminUser.email;

      // Use custom notification email if specified, otherwise use admin's email
      const notificationEmail = notificationSettings?.notificationEmail || adminUser.email;

      // Build custom subject with prefix if specified
      const subjectPrefix = notificationSettings?.customSubjectPrefix || '🎯';
      const baseSubject = isReturningUser 
        ? `Returning User: ${args.customerName} re-downloaded ${args.productName}`
        : `New Lead: ${args.customerName} downloaded ${args.productName}`;
      const subject = `${subjectPrefix} ${baseSubject}`;

      // Include lead details based on preferences
      const includeDetails = notificationSettings?.includeLeadDetails !== false; // Default to true

      // Send admin notification email
      const result = await resend.emails.send({
        from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        to: notificationEmail,
        replyTo: replyToEmail,
        subject: subject,
        html: getAdminNotificationEmailTemplate({
          customerName: args.customerName,
          customerEmail: args.customerEmail,
          productName: args.productName,
          source: args.source || "Lead Magnet",
          storeName: store.name,
          adminName: adminUser.name || adminUser.firstName || "Admin",
          includeDetails: includeDetails,
          isReturningUser: isReturningUser,
        }),
      });

      console.log("✅ Admin notification email sent successfully:", result.data?.id);
      return {
        success: true,
        emailId: result.data?.id,
      };
    } catch (error: any) {
      console.error("❌ Failed to send admin notification:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  },
});

// Admin notification email template
function getAdminNotificationEmailTemplate(data: {
  customerName: string;
  customerEmail: string;
  productName: string;
  source: string;
  storeName: string;
  adminName: string;
  includeDetails?: boolean;
  isReturningUser?: boolean;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead: ${data.customerName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #22c55e; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎯 New Lead Generated!</h1>
  </div>
  
  <div style="background: #f0fdf4; padding: 25px; border-radius: 0 0 8px 8px; border: 1px solid #bbf7d0;">
    <h2 style="color: #14532d; margin-top: 0;">Hi ${data.adminName},</h2>
    <p style="color: #374151; margin-bottom: 20px;">
      ${data.isReturningUser 
        ? `A previous customer has re-engaged with your <strong>${data.storeName}</strong> store!`
        : `Great news! You have a new lead from your <strong>${data.storeName}</strong> store.`
      }
    </p>
    
    ${data.includeDetails !== false ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <h3 style="color: #14532d; margin-top: 0;">${data.isReturningUser ? 'Customer' : 'Lead'} Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
          <td style="padding: 8px 0; color: #1f2937;"><a href="mailto:${data.customerEmail}" style="color: #2563eb; text-decoration: none;">${data.customerEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Product:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.productName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Source:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.source}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
          <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
    ` : `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e; text-align: center;">
      <p style="color: #374151; margin: 0;">
        <strong>${data.customerName}</strong> ${data.isReturningUser ? 're-downloaded' : 'downloaded'} <strong>${data.productName}</strong>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
        Check your dashboard for full details
      </p>
    </div>
    `}</div>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #1d4ed8; margin-top: 0;">🚀 Next Steps:</h3>
      <ul style="color: #374151; margin: 0; padding-left: 20px;">
        <li>Follow up with a personalized email within 24 hours</li>
        <li>Check your dashboard for more lead details</li>
        <li>Consider adding them to your email sequence</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        This notification was sent from your ${data.storeName} store.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send workflow email using centralized Resend - optimized for automation
export const sendWorkflowEmail = action({
  args: {
    storeId: v.id("stores"),
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    downloadUrl: v.optional(v.string()),
    executionData: v.optional(v.any()),
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

      // Get store's email configuration
      const emailConfig = await ctx.runQuery((internal as any).stores.getStoreEmailConfigInternal, {
        storeId: args.storeId,
      });

      if (!emailConfig) {
        return {
          success: false,
          error: "Store email configuration not found",
        };
      }

      // Enhanced personalization with more tokens
      const customerName = args.customerName || "Customer";
      const tokens = {
        customer_name: customerName,
        customer_email: args.customerEmail,
        ...args.executionData, // Include any additional data from the workflow
      };

      // Replace personalization tokens in subject
      let personalizedSubject = args.subject;
      Object.entries(tokens).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}[_\\s]*\\}\\}`, 'gi');
        personalizedSubject = personalizedSubject.replace(regex, String(value || ''));
      });

      // Replace personalization tokens in body
      let personalizedBody = args.body;
      Object.entries(tokens).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}[_\\s]*\\}\\}`, 'gi');
        personalizedBody = personalizedBody.replace(regex, String(value || ''));
      });

      // Add download button if URL provided
      const emailWithFormatting = args.downloadUrl ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${personalizedBody}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${args.downloadUrl}" 
               style="display: inline-block; background: #6356FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              📥 Download Your Resource
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
            <p>This email is part of an automated sequence. You're receiving this because of your interest in our content.</p>
          </div>
        </div>
      ` : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${personalizedBody}
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
            <p>This email is part of an automated sequence. You're receiving this because of your interest in our content.</p>
          </div>
        </div>
      `;

      // Send email using centralized Resend
      const result = await resend.emails.send({
        from: emailConfig.fromName ? `${emailConfig.fromName} <${emailConfig.fromEmail}>` : emailConfig.fromEmail,
        to: args.customerEmail,
        replyTo: emailConfig.replyToEmail || emailConfig.fromEmail,
        subject: personalizedSubject,
        html: emailWithFormatting,
      });

      if (result.data?.id) {
        return {
          success: true,
          emailId: result.data.id,
        };
      } else {
        return {
          success: false,
          error: result.error?.message || "Failed to send email",
        };
      }
    } catch (error) {
      console.error("Workflow email error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
}); 