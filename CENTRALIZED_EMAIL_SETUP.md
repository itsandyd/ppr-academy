# Centralized Email System Setup

This guide explains how to configure the centralized email system that uses a single Resend account for all store owners.

## ✅ **Benefits of Centralized Approach**

- **Simple Setup**: No need for each store owner to create Resend accounts
- **Cost Effective**: Single Resend subscription covers all stores  
- **Easier Management**: Centralized monitoring and configuration
- **Better Deliverability**: Single, well-maintained sending domain

## 🔧 **Environment Configuration**

### Step 1: Create `.env.local` file

Create a `.env.local` file in your project root:

```bash
# Convex deployment configuration (auto-generated)
CONVEX_DEPLOYMENT=your_deployment_id

# Resend Email Service Configuration
RESEND_API_KEY=re_your_api_key_here
```

### Step 2: Get Resend API Key

1. **Sign up at [Resend.com](https://resend.com)**
   - Free tier: 3,000 emails/month
   - Paid plans available for higher volumes

2. **Generate API Key**
   - Go to [API Keys](https://resend.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Update `.env.local`**
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

### Step 3: Domain Setup (Optional but Recommended)

1. **Add Your Domain**
   - Go to [Domains](https://resend.com/domains) in Resend
   - Add your sending domain (e.g., `mail.yourplatform.com`)
   - Follow DNS verification steps

2. **Benefits**
   - Better email deliverability
   - Professional sender reputation
   - Custom "from" addresses

## 🎯 **How It Works**

### Store Owner Experience

1. **Configure Sender Settings**
   - From Email: `store@yourplatform.com`
   - From Name: `Store Name`
   - Reply-To: `support@store.com`

2. **Test Configuration**
   - Send test email to verify setup
   - System validates format and deliverability

3. **Send Campaigns**
   - Create email campaigns
   - Target customer segments
   - Track opens, clicks, deliverability

### Technical Flow

1. **Centralized Sending**
   ```
   Store Owner → Platform UI → Centralized Resend → Customer
   ```

2. **Email Headers**
   ```
   From: Store Name <store@yourplatform.com>
   Reply-To: support@store.com
   ```

3. **Personalization**
   - Customer name: `{{customer.name}}`
   - Store-specific branding
   - Custom email templates

## 📊 **Email Usage Tracking**

Each store tracks:
- ✉️ **Emails sent this month**
- 📈 **Delivery rates**
- 📊 **Open/click rates**
- 🎯 **Campaign performance**

## 🚀 **Deployment**

After configuring your `.env.local`:

```bash
# Deploy Convex functions
npx convex dev

# Test email functionality
# Visit: /store/[storeId]/settings/email
```

## 📝 **Configuration Examples**

### Example Store Configuration

```javascript
{
  fromEmail: "noreply@yourplatform.com",
  fromName: "Amazing Store",
  replyToEmail: "support@amazingstore.com",
  isConfigured: true
}
```

### Example Email Headers

```
From: Amazing Store <noreply@yourplatform.com>
Reply-To: support@amazingstore.com
Subject: Welcome to Amazing Store!
```

## 🔒 **Security Notes**

- ✅ **API key stored server-side only**
- ✅ **Store owners can't access API key**
- ✅ **Rate limiting per store**
- ✅ **Usage monitoring and alerts**

## 🆘 **Troubleshooting**

### Common Issues

1. **"Email service not configured"**
   - Check `RESEND_API_KEY` in `.env.local`
   - Restart your development server

2. **"Domain not verified"**
   - Add your domain in Resend dashboard
   - Complete DNS verification

3. **High bounce rates**
   - Use verified domain for sending
   - Implement proper SPF/DKIM records

### Testing Commands

```bash
# Test environment variables
echo $RESEND_API_KEY

# Test Convex deployment
npx convex dev

# Check function logs
# Visit Convex dashboard for detailed logs
```

## 📞 **Support**

For issues with email delivery or configuration:
1. Check Convex function logs
2. Verify Resend dashboard for delivery status
3. Review DNS settings for your sending domain 