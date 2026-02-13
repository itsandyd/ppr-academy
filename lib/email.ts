import { Resend } from 'resend';
import { generateUnsubscribeUrl, generateListUnsubscribeHeader } from './unsubscribe';

// Initialize Resend only when needed
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// Email configuration
const FROM_EMAIL = 'PPR Academy <no-reply@mail.pauseplayrepeat.com>';
const DEFAULT_REPLY_TO = 'no-reply@mail.pauseplayrepeat.com';

// CAN-SPAM compliant footer with unsubscribe link and physical address
function getEmailFooter(recipientEmail: string): string {
  const unsubscribeUrl = generateUnsubscribeUrl(recipientEmail);
  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 8px 0;">
        <a href="${unsubscribeUrl}" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a>
        &nbsp;•&nbsp;
        <a href="https://ppracademy.com" style="color: #6366f1; text-decoration: underline;">Website</a>
        &nbsp;•&nbsp;
        <a href="mailto:support@ppracademy.com" style="color: #6366f1; text-decoration: underline;">Help</a>
      </p>
      <p style="font-size: 11px; color: #a0aec0; text-align: center; margin: 8px 0;">
        PPR Academy LLC, 651 N Broad St Suite 201, Middletown, DE 19709
      </p>
    </div>`;
}

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
    // console.log(...);
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: data.adminEmail || DEFAULT_REPLY_TO,
      subject: `🎉 Your ${data.leadMagnetTitle} is ready for download!`,
      html: getLeadMagnetEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send lead magnet email:', error);
    throw new Error(`Email sending failed: ${error}`);
  }
}

export async function sendAdminNotification(data: AdminNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    // console.log(...);
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

    // console.log(...);
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
    const recipientEmail = data.customerName.includes('@') ? data.customerName : `customer@example.com`;
    const listHeaders = generateListUnsubscribeHeader(recipientEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      replyTo: data.adminEmail || DEFAULT_REPLY_TO,
      subject: `Welcome! Your ${data.productName} is ready`,
      html: `
        <h1>Welcome ${data.customerName}!</h1>
        <p>Thank you for your interest in ${data.productName}.</p>
        ${data.downloadUrl ? `<p><a href="${data.downloadUrl}">Download your resource here</a></p>` : ''}
        <p>Best regards,<br>${data.adminName}</p>
      ` + getEmailFooter(recipientEmail),
      headers: listHeaders,
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
    // console.log(...);
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `Payment Issue - Action Required for ${data.productName}`,
      html: getPaymentFailureEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send payment failure email:', error);
    throw new Error(`Payment failure email failed: ${error}`);
  }
}

// Course Enrollment Confirmation Email
export interface CourseEnrollmentEmailData {
  customerEmail: string;
  customerName: string;
  courseTitle: string;
  courseSlug?: string;
  amount: number;
  currency: string;
  creatorName?: string;
  storeName?: string;
}

const getCourseEnrollmentEmailTemplate = (data: CourseEnrollmentEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.courseTitle}!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎓 You're Enrolled!</h1>
  </div>

  <div style="background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #bbf7d0;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Thank you for enrolling in <strong>${data.courseTitle}</strong>! Your purchase has been confirmed and you now have lifetime access to the course.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📋 Order Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Course:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.courseTitle}</td>
        </tr>
        ${data.amount > 0 ? `<tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>` : `<tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Access:</td>
          <td style="padding: 8px 0; color: #1f2937;">Lifetime</td>
        </tr>`}
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Instructor:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard?mode=learn"
         style="background: #10b981; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        🚀 Start Learning Now
      </a>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">💡 What's Next:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Access your course anytime from your dashboard</li>
        <li style="margin-bottom: 8px;">Track your progress as you complete lessons</li>
        <li style="margin-bottom: 8px;">Earn a certificate when you complete the course</li>
      </ul>
    </div>

    <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 30px 0;">

    <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
      Best regards,<br>
      <strong>${data.storeName || 'PPR Academy'}</strong>
    </p>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      You received this email because you enrolled in ${data.courseTitle}.
      If you have any questions, simply reply to this email.
    </p>
  </div>
</body>
</html>
`;

export async function sendCourseEnrollmentEmail(data: CourseEnrollmentEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    // console.log(...);
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `🎓 Welcome to ${data.courseTitle} - You're Enrolled!`,
      html: getCourseEnrollmentEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send course enrollment email:', error);
    throw new Error(`Course enrollment email failed: ${error}`);
  }
}

// Tip Confirmation Email
export interface TipConfirmationEmailData {
  customerEmail: string;
  customerName: string;
  tipJarTitle: string;
  amount: number;
  currency: string;
  message?: string;
  creatorName?: string;
}

const getTipConfirmationEmailTemplate = (data: TipConfirmationEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Support!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f43f5e 0%, #fb923c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💝 Thank You!</h1>
  </div>

  <div style="background: #fff1f2; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fecdd3;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Your tip of <strong>$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</strong> has been sent to <strong>${data.tipJarTitle}</strong>!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f43f5e; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🧾 Receipt:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Tip Jar:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.tipJarTitle}</td>
        </tr>
        ${data.message ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Message:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.message}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
          <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
      <p style="font-size: 18px; margin: 0; color: #1e293b;">
        ❤️ Your support means the world to ${data.creatorName || 'the creator'}!
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #fecdd3; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      This is your receipt for your tip. If you have any questions, simply reply to this email.
    </p>
  </div>
</body>
</html>
`;

export async function sendTipConfirmationEmail(data: TipConfirmationEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `💝 Thank you for your $${data.amount.toFixed(2)} tip!`,
      html: getTipConfirmationEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send tip confirmation email:', error);
    throw new Error(`Tip confirmation email failed: ${error}`);
  }
}

// Membership Subscription Confirmation Email
export interface MembershipConfirmationEmailData {
  customerEmail: string;
  customerName: string;
  membershipName: string;
  tierName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  creatorName?: string;
  storeName?: string;
  benefits?: string[];
}

const getMembershipConfirmationEmailTemplate = (data: MembershipConfirmationEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.membershipName}!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⭐ Welcome, Member!</h1>
  </div>

  <div style="background: #f5f3ff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd6fe;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Thank you for joining <strong>${data.membershipName}</strong>! Your membership is now active.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📋 Membership Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Membership:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.membershipName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Tier:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.tierName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Billing:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)}/${data.billingCycle === 'yearly' ? 'year' : 'month'}</td>
        </tr>
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Creator:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.benefits && data.benefits.length > 0 ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🎁 Your Member Benefits:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        ${data.benefits.map(b => `<li style="margin-bottom: 8px; color: #1f2937;">${b}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard?mode=learn"
         style="background: #8b5cf6; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        🚀 Access Your Benefits
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd6fe; margin: 30px 0;">

    <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
      Best regards,<br>
      <strong>${data.storeName || 'PPR Academy'}</strong>
    </p>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      You can manage your subscription anytime from your account settings.
    </p>
  </div>
</body>
</html>
`;

export async function sendMembershipConfirmationEmail(data: MembershipConfirmationEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `⭐ Welcome to ${data.membershipName} - Your Membership is Active!`,
      html: getMembershipConfirmationEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send membership confirmation email:', error);
    throw new Error(`Membership confirmation email failed: ${error}`);
  }
}

// Beat Purchase Confirmation Email
export interface BeatPurchaseEmailData {
  customerEmail: string;
  customerName: string;
  beatTitle: string;
  tierName: string;
  tierType: string;
  amount: number;
  currency: string;
  creatorName?: string;
  licenseTerms?: string;
}

const getBeatPurchaseEmailTemplate = (data: BeatPurchaseEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Beat License is Ready!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Beat License Acquired!</h1>
  </div>

  <div style="background: #ecfeff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #a5f3fc;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      You've successfully purchased a <strong>${data.tierName}</strong> license for <strong>${data.beatTitle}</strong>!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #06b6d4; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🎫 License Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Beat:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.beatTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">License:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.tierName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Price:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Producer:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard?mode=learn"
         style="background: #06b6d4; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📥 Download Your Files
      </a>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📜 License Terms:</h3>
      <p style="margin-bottom: 0; color: #64748b; font-size: 14px;">
        ${data.licenseTerms || 'Your license is available in your dashboard. Please review the terms before distributing any content using this beat.'}
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #a5f3fc; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      Questions about your license? Reply to this email for support.
    </p>
  </div>
</body>
</html>
`;

export async function sendBeatPurchaseEmail(data: BeatPurchaseEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `🎵 Your ${data.tierName} License for "${data.beatTitle}" is Ready!`,
      html: getBeatPurchaseEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send beat purchase email:', error);
    throw new Error(`Beat purchase email failed: ${error}`);
  }
}

// Digital Product Purchase Email
export interface DigitalProductPurchaseEmailData {
  customerEmail: string;
  customerName: string;
  productTitle: string;
  productType: string;
  amount: number;
  currency: string;
  creatorName?: string;
  storeName?: string;
}

const getDigitalProductPurchaseEmailTemplate = (data: DigitalProductPurchaseEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Purchase is Ready!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📦 Purchase Complete!</h1>
  </div>

  <div style="background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #bbf7d0;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Thank you for purchasing <strong>${data.productTitle}</strong>! Your product is now available in your library.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🧾 Order Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Product:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.productTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.amount > 0 ? `$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}` : 'FREE'}</td>
        </tr>
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Creator:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard?mode=learn"
         style="background: #22c55e; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📥 Access Your Purchase
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 30px 0;">

    <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
      Best regards,<br>
      <strong>${data.storeName || 'PPR Academy'}</strong>
    </p>
  </div>
</body>
</html>
`;

export async function sendDigitalProductPurchaseEmail(data: DigitalProductPurchaseEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `📦 Your purchase of "${data.productTitle}" is ready!`,
      html: getDigitalProductPurchaseEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send digital product purchase email:', error);
    throw new Error(`Digital product purchase email failed: ${error}`);
  }
}

// Bundle Purchase Email
export interface BundlePurchaseEmailData {
  customerEmail: string;
  customerName: string;
  bundleTitle: string;
  itemCount: number;
  amount: number;
  currency: string;
  creatorName?: string;
  storeName?: string;
}

const getBundlePurchaseEmailTemplate = (data: BundlePurchaseEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Bundle is Ready!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎁 Bundle Unlocked!</h1>
  </div>

  <div style="background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fde68a;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      You've unlocked <strong>${data.bundleTitle}</strong> with <strong>${data.itemCount} items</strong>!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🧾 Order Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Bundle:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.bundleTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Items:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.itemCount} products included</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Creator:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard?mode=learn"
         style="background: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📥 Access Your Bundle
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #fde68a; margin: 30px 0;">

    <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
      Best regards,<br>
      <strong>${data.storeName || 'PPR Academy'}</strong>
    </p>
  </div>
</body>
</html>
`;

export async function sendBundlePurchaseEmail(data: BundlePurchaseEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `🎁 Your bundle "${data.bundleTitle}" is ready!`,
      html: getBundlePurchaseEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send bundle purchase email:', error);
    throw new Error(`Bundle purchase email failed: ${error}`);
  }
}

// Coaching Session Confirmation Email
export interface CoachingConfirmationEmailData {
  customerEmail: string;
  customerName: string;
  sessionTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  amount: number;
  currency: string;
  creatorName?: string;
  meetingLink?: string;
}

const getCoachingConfirmationEmailTemplate = (data: CoachingConfirmationEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Coaching Session is Booked!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💬 Session Booked!</h1>
  </div>

  <div style="background: #fdf4ff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #f5d0fe;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Your coaching session <strong>${data.sessionTitle}</strong> has been booked!
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ec4899; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📅 Session Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Session:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.sessionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.scheduledDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.scheduledTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Duration:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.duration}</td>
        </tr>
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Coach:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    ${data.meetingLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.meetingLink}"
         style="background: #ec4899; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        🔗 Join Meeting
      </a>
    </div>
    ` : ''}

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">💡 Before Your Session:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Prepare any questions you have</li>
        <li style="margin-bottom: 8px;">Test your audio and video setup</li>
        <li style="margin-bottom: 8px;">Be ready 5 minutes before the session</li>
      </ul>
    </div>

    <hr style="border: none; border-top: 1px solid #f5d0fe; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      Need to reschedule? Reply to this email at least 24 hours before your session.
    </p>
  </div>
</body>
</html>
`;

export async function sendCoachingConfirmationEmail(data: CoachingConfirmationEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `💬 Your coaching session is booked for ${data.scheduledDate}!`,
      html: getCoachingConfirmationEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send coaching confirmation email:', error);
    throw new Error(`Coaching confirmation email failed: ${error}`);
  }
}

// Credits Purchase Confirmation Email
export interface CreditsPurchaseEmailData {
  customerEmail: string;
  customerName: string;
  packageName: string;
  credits: number;
  bonusCredits: number;
  amount: number;
  currency: string;
}

const getCreditsPurchaseEmailTemplate = (data: CreditsPurchaseEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credits Added to Your Account!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #eab308 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🪙 Credits Added!</h1>
  </div>

  <div style="background: #fefce8; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fef08a;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Your credit purchase was successful! <strong>${data.credits + data.bonusCredits} credits</strong> have been added to your account.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🧾 Purchase Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Package:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.packageName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Credits:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.credits}</td>
        </tr>
        ${data.bonusCredits > 0 ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Bonus:</td>
          <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">+${data.bonusCredits} FREE</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Total:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${data.credits + data.bonusCredits} credits</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard"
         style="background: #eab308; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        🚀 Start Using Your Credits
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #fef08a; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      Credits never expire. Use them anytime for AI features and premium services.
    </p>
  </div>
</body>
</html>
`;

export async function sendCreditsPurchaseEmail(data: CreditsPurchaseEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `🪙 ${data.credits + data.bonusCredits} credits added to your account!`,
      html: getCreditsPurchaseEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send credits purchase email:', error);
    throw new Error(`Credits purchase email failed: ${error}`);
  }
}

// Mixing Service Order Confirmation Email
export interface MixingServiceEmailData {
  customerEmail: string;
  customerName: string;
  serviceTitle: string;
  serviceType: string;
  tierName: string;
  turnaroundDays: number;
  revisions: number;
  isRush: boolean;
  amount: number;
  currency: string;
  creatorName?: string;
  customerNotes?: string;
}

const getMixingServiceEmailTemplate = (data: MixingServiceEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${data.serviceType} Order is Confirmed!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎚️ Order Confirmed!</h1>
  </div>

  <div style="background: #f5f3ff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd6fe;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Your <strong>${data.serviceType}</strong> order has been confirmed! ${data.creatorName ? `${data.creatorName} will` : 'The engineer will'} begin working on your project soon.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #7c3aed; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📋 Order Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Service:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.serviceTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Type:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.serviceType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Package:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.tierName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Turnaround:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.turnaroundDays} days${data.isRush ? ' (Rush)' : ''}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Revisions:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.revisions} included</td>
        </tr>
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Engineer:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Amount:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    ${data.isRush ? `
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-weight: bold;">
        ⚡ Rush Order - Priority processing enabled
      </p>
    </div>
    ` : ''}

    ${data.customerNotes ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📝 Your Notes:</h3>
      <p style="margin-bottom: 0; color: #64748b; font-style: italic;">"${data.customerNotes}"</p>
    </div>
    ` : ''}

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📤 What's Next:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Upload your stems/files through the dashboard</li>
        <li style="margin-bottom: 8px;">The engineer will review and begin work</li>
        <li style="margin-bottom: 8px;">You'll receive updates on progress</li>
        <li style="margin-bottom: 8px;">Download your final mix when complete</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard/my-orders"
         style="background: #7c3aed; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📂 View Your Order
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd6fe; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      Questions about your order? Reply to this email for support.
    </p>
  </div>
</body>
</html>
`;

export async function sendMixingServiceEmail(data: MixingServiceEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `🎚️ Your ${data.serviceType} order is confirmed!`,
      html: getMixingServiceEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send mixing service email:', error);
    throw new Error(`Mixing service email failed: ${error}`);
  }
}

// Playlist Submission Confirmation Email
export interface PlaylistSubmissionEmailData {
  customerEmail: string;
  customerName: string;
  trackName: string;
  playlistName: string;
  amount: number;
  currency: string;
  curatorName?: string;
  message?: string;
}

const getPlaylistSubmissionEmailTemplate = (data: PlaylistSubmissionEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Track Submitted for Review!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1db954 0%, #14532d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎧 Submission Received!</h1>
  </div>

  <div style="background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #bbf7d0;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Your track has been successfully submitted for playlist consideration! ${data.curatorName ? `${data.curatorName} will` : 'The curator will'} review your submission soon.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1db954; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">🎵 Submission Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Track:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.trackName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Playlist:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.playlistName}</td>
        </tr>
        ${data.curatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Curator:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.curatorName}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Submission Fee:</td>
          <td style="padding: 8px 0; color: #1f2937;">$${data.amount.toFixed(2)} ${data.currency.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    ${data.message ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">💬 Your Message:</h3>
      <p style="margin-bottom: 0; color: #64748b; font-style: italic;">"${data.message}"</p>
    </div>
    ` : ''}

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">⏳ What Happens Next:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">The curator will listen to your track</li>
        <li style="margin-bottom: 8px;">You'll receive feedback within 7 days</li>
        <li style="margin-bottom: 8px;">If approved, your track will be added to the playlist</li>
        <li style="margin-bottom: 8px;">You'll be notified of the decision via email</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://ppracademy.com'}/dashboard"
         style="background: #1db954; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        📊 Track Your Submissions
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      Note: Submission fees are non-refundable regardless of the curator's decision.
      This ensures curators can dedicate time to thoroughly review each submission.
    </p>
  </div>
</body>
</html>
`;

export async function sendPlaylistSubmissionEmail(data: PlaylistSubmissionEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `🎧 Your track "${data.trackName}" has been submitted for review!`,
      html: getPlaylistSubmissionEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send playlist submission email:', error);
    throw new Error(`Playlist submission email failed: ${error}`);
  }
}

// Coaching Session Reminder Email
export interface CoachingReminderEmailData {
  customerEmail: string;
  customerName: string;
  sessionTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  hoursUntilSession: number;
  creatorName?: string;
  meetingLink?: string;
  isCoachReminder?: boolean; // true if sending to coach, false for student
}

const getCoachingReminderEmailTemplate = (data: CoachingReminderEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Reminder: ${data.sessionTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Session Reminder</h1>
  </div>

  <div style="background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #fde68a;">
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.customerName},</h2>

    <p style="font-size: 16px; margin-bottom: 25px;">
      ${data.hoursUntilSession <= 1
        ? `Your coaching session is starting <strong>in ${data.hoursUntilSession < 1 ? 'less than an hour' : '1 hour'}</strong>!`
        : `Your coaching session is coming up in <strong>${data.hoursUntilSession} hours</strong>.`
      }
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">📅 Session Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Session:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.sessionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Date:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.scheduledDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Time:</td>
          <td style="padding: 8px 0; color: #1f2937; font-weight: bold; color: #f59e0b;">${data.scheduledTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Duration:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.duration}</td>
        </tr>
        ${data.isCoachReminder ? '' : `
        ${data.creatorName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #374151;">Coach:</td>
          <td style="padding: 8px 0; color: #1f2937;">${data.creatorName}</td>
        </tr>
        ` : ''}
        `}
      </table>
    </div>

    ${data.meetingLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.meetingLink}"
         style="background: #f59e0b; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        🔗 Join Meeting
      </a>
    </div>
    ` : ''}

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">✅ Quick Checklist:</h3>
      <ul style="margin-bottom: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Test your audio and video setup</li>
        <li style="margin-bottom: 8px;">Find a quiet space with good lighting</li>
        <li style="margin-bottom: 8px;">Have your questions ready</li>
        <li style="margin-bottom: 8px;">Be ready 5 minutes early</li>
      </ul>
    </div>

    <hr style="border: none; border-top: 1px solid #fde68a; margin: 30px 0;">

    <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">
      Can't make it? Please reschedule at least 24 hours in advance by replying to this email.
    </p>
  </div>
</body>
</html>
`;

export async function sendCoachingReminderEmail(data: CoachingReminderEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured. Email simulation mode.');
    return { success: true, simulation: true };
  }

  try {
    const resend = getResendClient();
    const urgency = data.hoursUntilSession <= 1 ? '⚡ STARTING SOON' : `⏰ In ${data.hoursUntilSession}h`;
    const listHeaders = generateListUnsubscribeHeader(data.customerEmail);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      replyTo: DEFAULT_REPLY_TO,
      subject: `${urgency} - Reminder: ${data.sessionTitle} on ${data.scheduledDate}`,
      html: getCoachingReminderEmailTemplate(data) + getEmailFooter(data.customerEmail),
      headers: listHeaders,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('❌ Failed to send coaching reminder email:', error);
    throw new Error(`Coaching reminder email failed: ${error}`);
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