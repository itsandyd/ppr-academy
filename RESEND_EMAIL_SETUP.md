# 📧 Resend Email Configuration Guide

This guide will walk you through setting up Resend for automated email functionality in your lead generation system.

## 🚀 **Quick Setup Overview**

1. **Sign up for Resend** (free tier available)
2. **Get your API key** from Resend dashboard
3. **Configure environment variables**
4. **Set up your domain** (optional but recommended)
5. **Test the integration**

---

## 📝 **Step 1: Sign Up for Resend**

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

**Free Tier Includes:**
- 3,000 emails/month
- 100 emails/day
- Basic email analytics
- No credit card required

---

## 🔑 **Step 2: Get Your API Key**

1. Log into your [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **API Keys** section
3. Click **"Create API Key"**
4. Give it a name like `ppr-academy-production`
5. **Copy the API key** (starts with `re_`)

⚠️ **Important:** Save this key immediately - you won't be able to see it again!

---

## ⚙️ **Step 3: Configure Environment Variables**

Add these variables to your `.env.local` file:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@yourdomain.com
REPLY_TO_EMAIL=admin@yourdomain.com

# Optional: Custom domain for emails
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Environment Variables Explained:**

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `RESEND_API_KEY` | Your Resend API key | ✅ Yes | `re_123abc456def789` |
| `FROM_EMAIL` | Email address emails are sent from | ✅ Yes | `noreply@yourdomain.com` |
| `REPLY_TO_EMAIL` | Where replies go (optional) | ❌ No | `admin@yourdomain.com` |

---

## 🌐 **Step 4: Domain Setup (Recommended)**

For better deliverability and branding, set up your own domain:

### **Option A: Use Resend's Domain (Quick)**
- Use `onboarding@resend.dev` as your `FROM_EMAIL`
- Good for testing, limited for production

### **Option B: Add Your Own Domain (Recommended)**

1. In Resend Dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. **Add DNS Records** to your domain provider:

```dns
# Add these records to your DNS:
Type: TXT
Name: @
Value: [Provided by Resend]

Type: CNAME  
Name: [subdomain]
Value: [Provided by Resend]
```

5. Wait for verification (usually 5-10 minutes)
6. Update your `FROM_EMAIL` to use your domain

---

## 🧪 **Step 5: Test Your Setup**

### **Method 1: Using the Test API Route**

Create a test API route to verify your configuration:

```typescript
// app/api/test-email/route.ts
import { sendLeadMagnetEmail } from '@/lib/email';

export async function POST() {
  try {
    const result = await sendLeadMagnetEmail({
      customerName: "Test User",
      customerEmail: "test@example.com", // Replace with your email
      leadMagnetTitle: "Test Lead Magnet",
      downloadUrl: "https://example.com/download",
      adminName: "Admin",
      adminEmail: "admin@yourdomain.com",
      storeName: "Test Store"
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### **Method 2: Check Configuration**

Visit `/api/test-email-config` to check if your setup is working.

---

## 📬 **Email Features Included**

### **✅ Automated Emails**

1. **Lead Magnet Welcome Email**
   - Sent when someone downloads a lead magnet
   - Includes download link and branding
   - Professional HTML template

2. **Admin Notifications**
   - Sent when new leads are generated
   - Contains lead details and source
   - Helps you follow up quickly

3. **Welcome Emails**
   - For new customers and subscribers
   - Customizable templates
   - Branded messaging

### **📧 Email Templates**

All emails include:
- **Professional HTML design** with your branding
- **Mobile-responsive** layouts
- **Clear call-to-action** buttons
- **Proper unsubscribe** handling
- **Reply-to** functionality

---

## 🔍 **Troubleshooting**

### **Common Issues:**

**❌ "RESEND_API_KEY not found"**
- Check your `.env.local` file has the correct variable name
- Restart your development server after adding environment variables
- Make sure there are no spaces around the `=` sign

**❌ "Email sending failed"**
- Verify your API key is correct and active
- Check if your domain is verified (if using custom domain)
- Ensure `FROM_EMAIL` matches your verified domain

**❌ "Emails not being received"**
- Check spam/junk folders
- Verify the recipient email address is correct
- Try using a different email address for testing

### **Debug Mode:**

When `RESEND_API_KEY` is not configured, the system runs in **simulation mode**:
- No actual emails are sent
- All email attempts are logged to console
- Perfect for development and testing

---

## 💰 **Pricing & Limits**

### **Free Tier:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day  
- ✅ Basic analytics
- ✅ No credit card required

### **Paid Plans:**
- **Pro**: $20/month for 50,000 emails
- **Business**: $80/month for 100,000 emails
- **Enterprise**: Custom pricing

---

## 🚀 **Going Live**

### **Before Production:**

1. ✅ **Verify your domain** in Resend
2. ✅ **Test all email templates** thoroughly
3. ✅ **Set up proper `FROM_EMAIL`** with your domain
4. ✅ **Configure `REPLY_TO_EMAIL`** for customer service
5. ✅ **Monitor email analytics** in Resend dashboard

### **Production Environment Variables:**

```bash
# Production .env
RESEND_API_KEY=re_your_production_api_key
FROM_EMAIL=noreply@yourdomain.com
REPLY_TO_EMAIL=support@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 📊 **Analytics & Monitoring**

Resend provides:
- **Delivery rates** and open rates
- **Bounce and complaint** tracking
- **Click tracking** for links
- **Real-time logs** of all email activity

Access these in your [Resend Dashboard](https://resend.com/dashboard).

---

## 🛟 **Support**

- **Resend Documentation**: [docs.resend.com](https://docs.resend.com)
- **Resend Support**: [resend.com/support](https://resend.com/support)
- **Community Discord**: Available via Resend website

---

## ✅ **Verification Checklist**

- [ ] Resend account created and verified
- [ ] API key added to `.env.local`
- [ ] Domain configured (if using custom domain)
- [ ] Test email sent successfully
- [ ] Lead magnet emails working
- [ ] Admin notifications working
- [ ] Production environment configured

**🎉 Your email system is now ready to enhance your lead generation!** 