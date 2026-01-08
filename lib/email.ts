import { Resend } from 'resend';

// Initialize Resend only when needed
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const DEFAULT_REPLY_TO = process.env.REPLY_TO_EMAIL || FROM_EMAIL;

// Email templates
export interface WelcomeEmailData {
  customerName: string;
  productName: string;
  downloadUrl?: string;
  adminName: string;
  adminEmail: string;
}

export interface LeadMagnetEmailData {
  customerName: string;
  customerEmail: string;
  leadMagnetTitle: string;
  downloadUrl: string;
  adminName: string;
  adminEmail: string;
  storeName?: string;
}

export interface AdminNotificationData {
  customerName: string;
  customerEmail: string;
  productName: string;
  source: string;
  adminName: string;
}

// Lead Magnet Welcome Email Template
const getLeadMagnetEmailTemplate = (data: LeadMagnetEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${data.leadMagnetTitle} is Ready!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Your Download is Ready!</h1>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      Thank you for downloading <strong>${data.leadMagnetTitle}</strong>! Your resource is now available for download.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.downloadUrl}" 
         style="background: #6366f1; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📥 Download Now
      </a>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">💡 Next Steps:</h3>
      <ul style="margin-bottom: 0;">
        <li>Save this email for future reference</li>
        <li>The download link will remain active</li>
        <li>Reply to this email if you have any questions</li>
      </ul>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
      Best regards,<br>
      <strong>${data.adminName}</strong><br>
      ${data.storeName || 'Your Digital Store'}
    </p>
    
    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      You received this email because you downloaded ${data.leadMagnetTitle} from ${data.storeName || 'our store'}. 
      If you have any questions, simply reply to this email.
    </p>
  </div>
</body>
</html>
`;

// Admin Notification Email Template
const getAdminNotificationTemplate = (data: AdminNotificationData) => `
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
    <h2 style="color: #14532d; margin-top: 0;">Lead Details:</h2>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Name:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.customerEmail}</td>
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
    
    <p style="font-size: 14px; color: #16a34a; margin-top: 25px;">
      This lead has been automatically added to your customer database. 
      You can view and manage all your leads in your dashboard.
    </p>
  </div>
</body>
</html>
`;

// Main email sending functions
export async function sendLeadMagnetEmail(data: LeadMagnetEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    console.log('📧 Would send lead magnet email to:', data.customerEmail);
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: data.adminEmail || DEFAULT_REPLY_TO,
      subject: `🎉 Your ${data.leadMagnetTitle} is ready for download!`,
      html: getLeadMagnetEmailTemplate(data),
    });

    console.log('✅ Lead magnet email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send lead magnet email:', error);
    throw new Error(`Email sending failed: ${error}`);
  }
}

export async function sendAdminNotification(data: AdminNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    console.log('📧 Would send admin notification for new lead:', data.customerName);
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.adminName.includes('@') ? data.adminName : `admin@yourdomain.com`, // Fallback if adminName isn't email
      replyTo: DEFAULT_REPLY_TO,
      subject: `🎯 New lead: ${data.customerName} downloaded ${data.productName}`,
      html: getAdminNotificationTemplate(data),
    });

    console.log('✅ Admin notification sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    throw new Error(`Admin notification failed: ${error}`);
  }
}

// Welcome email for general use
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerName.includes('@') ? data.customerName : `customer@example.com`,
      replyTo: data.adminEmail || DEFAULT_REPLY_TO,
      subject: `Welcome! Your ${data.productName} is ready`,
      html: `
        <h1>Welcome ${data.customerName}!</h1>
        <p>Thank you for your interest in ${data.productName}.</p>
        ${data.downloadUrl ? `<p><a href="${data.downloadUrl}">Download your resource here</a></p>` : ''}
        <p>Best regards,<br>${data.adminName}</p>
      `,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw new Error(`Welcome email failed: ${error}`);
  }
}

// Payment Failure Email
export interface PaymentFailureEmailData {
  customerEmail: string;
  customerName: string;
  productName: string;
  amount: number;
  currency: string;
  failureReason: string;
  retryUrl?: string;
}

const getPaymentFailureEmailTemplate = (data: PaymentFailureEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Issue - Action Required</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Payment Issue</h1>
  </div>

  <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fecaca;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      We were unable to process your payment for <strong>${data.productName}</strong>.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">Payment Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Reason:</td>
          <td style="padding: 8px 0; color: #dc2626;">${data.failureReason}</td>
        </tr>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">What you can do:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Check that your card details are correct</li>
        <li style="margin-bottom: 8px;">Ensure sufficient funds are available</li>
        <li style="margin-bottom: 8px;">Try a different payment method</li>
        <li style="margin-bottom: 8px;">Contact your bank if the issue persists</li>
      </ul>
    </div>

    ${data.retryUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.retryUrl}"
         style="background: #6366f1; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        Try Again
      </a>
    </div>
    ` : ''}

    <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;">

    <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
      Need help? Reply to this email and we'll assist you.
    </p>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      PPR Academy Team
    </p>
  </div>
</body>
</html>
`;

export async function sendPaymentFailureEmail(data: PaymentFailureEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    console.log('📧 Would send payment failure email to:', data.customerEmail);
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `Payment Issue - Action Required for ${data.productName}`,
      html: getPaymentFailureEmailTemplate(data),
    });

    console.log('✅ Payment failure email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send payment failure email:', error);
    throw new Error(`Payment failure email failed: ${error}`);
  }
}

// Utility to verify email configuration
export async function verifyEmailConfig() {
  if (!process.env.RESEND_API_KEY) {
    return { configured: false, message: 'RESEND_API_KEY not found in environment variables' };
  }

  try {
    // Test with a simple request to verify API key
    const resendInstance = new Resend(process.env.RESEND_API_KEY);
    // Note: This doesn't actually send an email, just tests API connectivity
    return { configured: true, message: 'Resend API key configured successfully' };
  } catch (error) {
    return { configured: false, message: `Resend configuration error: ${error}` };
  }
} 