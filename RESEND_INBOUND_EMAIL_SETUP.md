# 📨 Resend Inbound Email Setup Guide

## 🎯 Goal

Configure Resend to forward customer replies from `inbox@pauseplayrepeat.com` to your webhook endpoint so they appear in creator dashboards automatically.

---

## ⚠️ Important Note

As of October 2025, **Resend doesn't have built-in inbound email** like SendGrid or Mailgun.

You have **2 options**:

---

## Option 1: Use Email Forwarding Service (Recommended)

### **Use CloudMailin** (Free for 10K emails/month)

**Step 1: Sign up for CloudMailin**
1. Go to [cloudmailin.com](https://www.cloudmailin.com)
2. Create free account
3. Create new email address

**Step 2: Configure Target**
1. Set target address: `inbox@pauseplayrepeat.com`
2. Set webhook URL: `https://academy.pauseplayrepeat.com/api/webhooks/resend/inbox`
3. Select format: JSON (HTTP POST)

**Step 3: Add DNS Records**

Add these to your domain (pauseplayrepeat.com):

```
Type: MX
Host: inbox
Value: mx.cloudmailin.net
Priority: 10
```

**Step 4: Test**
1. Send email to: `inbox@pauseplayrepeat.com`
2. Check webhook logs
3. Check creator dashboard inbox
4. ✅ Should appear!

---

## Option 2: Use Gmail + Zapier (Quick & Easy)

**Step 1: Create Gmail**
1. Create: `inbox@pauseplayrepeat.com` on Gmail
2. Enable IMAP access

**Step 2: Set up Zapier**
1. Trigger: Gmail - New Email
2. Filter: Only emails to `inbox@pauseplayrepeat.com`
3. Action: Webhook POST to your endpoint
4. Map fields: from, subject, body, headers

**Step 3: Configure Webhook**
```
URL: https://academy.pauseplayrepeat.com/api/webhooks/resend/inbox
Method: POST
Body: JSON with email data
```

**Cost:** Free for < 100 replies/month

---

## Option 3: Use SendGrid Inbound Parse (Enterprise)

If you're willing to use SendGrid for inbound (Resend for outbound):

**Step 1:** Sign up for SendGrid (free tier available)

**Step 2:** Configure Inbound Parse
1. Go to Settings → Inbound Parse
2. Add hostname: `inbox.pauseplayrepeat.com`
3. Set destination URL: your webhook
4. Add MX record to DNS

**Step 3:** DNS Configuration
```
Type: MX
Host: inbox
Value: mx.sendgrid.net
Priority: 10
```

---

## Option 4: Manual Forwarding (Development)

For testing without setting up external service:

**Step 1:** Set up Gmail forwarding
1. Create Gmail: `inbox.ppr@gmail.com`
2. Forward all emails to test webhook
3. Use Zapier (above) or manual checking

**Step 2:** Test with webhook.site
1. Go to webhook.site
2. Get unique URL
3. Test inbox webhooks
4. View payloads
5. Once working, point to your real endpoint

---

## 🧪 Testing Your Setup

### **Quick Test:**

1. **Send a campaign:**
   ```
   From: ppr@mail.pauseplayrepeat.com
   Reply-To: inbox@pauseplayrepeat.com
   To: your-test-email@gmail.com
   ```

2. **Reply to the campaign email**

3. **Check:**
   - CloudMailin/Zapier logs (webhook fired?)
   - Your webhook endpoint logs
   - Creator inbox dashboard
   - Should see reply! ✅

---

## 📊 Webhook Payload Format

Your webhook receives this format:

```json
{
  "from": "customer@email.com",
  "to": "inbox@pauseplayrepeat.com",
  "subject": "Re: Your New Course",
  "text": "Text version of message",
  "html": "<p>HTML version</p>",
  "headers": {
    "in-reply-to": "<original-message-id>",
    "message-id": "<this-message-id>",
    "references": "<thread-references>"
  },
  "attachments": []
}
```

---

## 🎯 Recommended Setup

**For Production (Best):**
- Use **CloudMailin** for inbound emails
- Use **Resend** for outbound emails
- Best of both worlds!

**Why:**
- CloudMailin specializes in inbound
- Resend specializes in outbound
- Both have great APIs
- Total cost: $0-20/month

---

## 💰 Cost Comparison

| Service | Free Tier | Paid Tier | Best For |
|---------|-----------|-----------|----------|
| **CloudMailin** | 10K/month | $9/month (100K) | Inbound emails |
| **Zapier** | 100 tasks/month | $19.99/month | Low volume |
| **SendGrid** | 100 emails/day | $19.95/month | Full solution |
| **Gmail + Manual** | Free | Free | Development only |

**Recommended:** Start with CloudMailin free tier (10K/month is plenty!)

---

## 🚀 Quick Start (CloudMailin)

**5-Minute Setup:**

```bash
1. Go to cloudmailin.com → Sign up (free)
2. Create address → inbox@pauseplayrepeat.com
3. Set webhook: https://academy.pauseplayrepeat.com/api/webhooks/resend/inbox
4. Add MX record to DNS:
   Host: inbox
   Value: mx.cloudmailin.net
   Priority: 10
5. Wait 15 mins for DNS
6. Test by sending email to inbox@pauseplayrepeat.com
7. Check creator dashboard inbox
8. ✅ Done!
```

---

## 🔍 Troubleshooting

### **Replies not appearing in dashboard:**

Check:
- [ ] Inbound service configured? (CloudMailin/Zapier)
- [ ] Webhook URL correct?
- [ ] Webhook firing? (check service logs)
- [ ] DNS records added?
- [ ] DNS propagated? (can take 1-2 hours)

### **Replies not matching to correct creator:**

Check:
- [ ] Original campaign includes Message-ID header?
- [ ] Customer exists in customers table?
- [ ] Store name in subject line?
- [ ] Check `/admin/email-monitoring` for unmatched
- [ ] Review `replyMatchingLog` table

### **Can't send replies from dashboard:**

Check:
- [ ] Creator email configured?
- [ ] Using verified domain?
- [ ] Resend API key valid?
- [ ] Check browser console for errors

---

## 📈 What's Next

Once live, you can track:
- **Reply rates** - Which campaigns get most engagement
- **Response times** - How fast creators reply
- **Customer satisfaction** - Based on follow-up replies
- **Common questions** - Build FAQ/knowledge base

---

## 🎉 Summary

You've built a **complete customer inbox system** that rivals Help Scout and Front!

**Ready to use:** ✅ Code deployed  
**Pending:** ⏳ Configure inbound email service (CloudMailin recommended)  
**Time to live:** 15 minutes (just DNS + CloudMailin setup)

---

**Need help with CloudMailin setup? Let me know!**

