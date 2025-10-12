# Resend Domain Setup Guide

## 🚀 Quick Fix Applied

The notification system now uses **Resend's testing email** (`onboarding@resend.dev`) as a fallback, so emails work immediately without domain verification!

## ✅ Current Status

- ✅ **Emails now working** with `onboarding@resend.dev`
- ⚠️ **Domain verification pending** for `ppracademy.com`

## 📧 Email Sender Configuration

### Testing/Development (Current Setup)
```
From: PPR Academy <onboarding@resend.dev>
Status: ✅ Works immediately
Limit: 100 emails/day on free plan
```

### Production (After Domain Verification)
```
From: PPR Academy <notifications@ppracademy.com>
Status: ⏳ Requires domain verification
Limit: Based on your Resend plan
```

## 🔧 How to Verify Your Domain (Production)

### Step 1: Add Domain in Resend
1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `ppracademy.com`

### Step 2: Add DNS Records
Resend will provide you with DNS records to add. You'll need to add:

**SPF Record (TXT)**
```
Host: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records (3 CNAME records)**
```
Host: resend._domainkey
Value: [provided by Resend]

Host: resend2._domainkey
Value: [provided by Resend]

Host: resend3._domainkey
Value: [provided by Resend]
```

**DMARC Record (TXT) - Optional but recommended**
```
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@ppracademy.com
```

### Step 3: Verify in Resend
1. After adding DNS records, click "Verify" in Resend dashboard
2. DNS propagation can take up to 48 hours (usually faster)
3. Once verified, the checkmark will turn green ✅

### Step 4: Update Environment Variable
Once verified, add to your Convex environment variables:

```bash
RESEND_FROM_EMAIL="PPR Academy <notifications@ppracademy.com>"
```

## 🎯 Where to Add DNS Records

Depending on where your domain is hosted:

### Cloudflare
1. Go to DNS settings
2. Click "Add record"
3. Select record type (TXT or CNAME)
4. Add the values from Resend

### Namecheap
1. Go to Domain List → Manage
2. Advanced DNS tab
3. Add new record
4. Enter values from Resend

### GoDaddy
1. DNS Management
2. Add record
3. Enter values from Resend

### Other Providers
Look for "DNS Management" or "DNS Settings" in your domain provider's dashboard

## 📊 Email Sending Limits

### Free Plan (Current)
- 100 emails/day
- 3,000 emails/month
- Uses `onboarding@resend.dev`

### Pro Plan ($20/month)
- 50,000 emails/month
- Custom domain required
- Better deliverability
- Email analytics

### Scale Plan ($100/month)
- 100,000 emails/month
- Custom domain
- Priority support
- Advanced analytics

## 🔍 Testing Email Delivery

### Current Setup (Testing Email)
Emails are being sent successfully with `onboarding@resend.dev`. Check your users' inboxes (and spam folders) to see them.

### After Domain Verification
1. Send a test notification from `/admin/notifications`
2. Check recipient inbox
3. Verify "From" shows your custom domain
4. Check email headers for proper SPF/DKIM

## 🛠️ Troubleshooting

### Issue: Emails going to spam
**Solution:** 
- Verify domain (adds SPF/DKIM)
- Add DMARC record
- Warm up your domain gradually
- Ensure recipients have opted in

### Issue: DNS not propagating
**Solution:**
- Wait 24-48 hours
- Check DNS with: `nslookup -type=TXT ppracademy.com`
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Issue: Verification failing
**Solution:**
- Double-check DNS records exactly match Resend's values
- Remove any extra spaces in DNS values
- Ensure no conflicting records exist
- Contact Resend support if stuck

## 📈 Best Practices

### Email Deliverability
1. ✅ **Verify domain** - Adds SPF/DKIM authentication
2. ✅ **Add DMARC** - Protects against email spoofing
3. ✅ **Warm up gradually** - Start with small batches
4. ✅ **Monitor bounces** - Keep bounce rate under 5%
5. ✅ **Honor opt-outs** - Respect user preferences (already built-in!)

### Sender Reputation
- Don't send to purchased lists
- Use double opt-in for subscribers
- Include easy unsubscribe links (included in templates)
- Monitor spam complaints
- Keep clean email lists

## 🎉 What's Working Now

Even without domain verification, the system is fully functional:

✅ Admin can send notifications
✅ Users receive in-app notifications
✅ Emails sent via Resend testing domain
✅ User preferences respected
✅ Email templates render correctly
✅ Tracking working (emailSent status)

## 🔮 Next Steps

1. **Immediate** - Test current setup with `onboarding@resend.dev`
2. **This Week** - Verify ppracademy.com domain in Resend
3. **After Verification** - Update `RESEND_FROM_EMAIL` env variable
4. **Ongoing** - Monitor email deliverability and user engagement

## 📞 Need Help?

- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **Resend Support:** support@resend.com
- **DNS Checker:** [mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx)
- **SPF Checker:** [mxtoolbox.com/spf.aspx](https://mxtoolbox.com/spf.aspx)

The notification system is now working with Resend's testing email! Users will receive emails immediately while you work on domain verification. 🚀📧

