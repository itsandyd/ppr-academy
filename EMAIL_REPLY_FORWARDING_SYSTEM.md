# 📧 Email Reply Forwarding System

## 🎯 Overview

A centralized email reply management system that allows you to monitor customer responses and forward them to the appropriate creators.

---

## 🏗️ Architecture

### **Email Flow**

```
Customer receives campaign email:
├─ From: beatmaker@pauseplayrepeat.com
├─ From Name: "Beat Maker Academy"
└─ Reply-To: support@pauseplayrepeat.com

Customer clicks "Reply"
├─ Email goes to: support@pauseplayrepeat.com (NOT beatmaker@...)
└─ You receive it in centralized inbox

You review and forward:
├─ Spam? Delete
├─ Question? Forward to creator
└─ Track all interactions
```

---

## 📊 Benefits

### **For Platform (You)**
1. ✅ **Spam Protection** - Filter out spam before it reaches creators
2. ✅ **Quality Control** - Review customer complaints/issues
3. ✅ **Support Metrics** - Track response rates and satisfaction
4. ✅ **Creator Protection** - Keep creator's personal emails private
5. ✅ **Future: Ticketing** - Can build a support ticket system later

### **For Creators**
1. ✅ **Professional Emails** - `creatorname@pauseplayrepeat.com`
2. ✅ **Privacy** - Personal email stays hidden
3. ✅ **Spam-Free** - Only legitimate replies get forwarded
4. ✅ **Consistent Branding** - All emails from verified domain

### **For Customers**
1. ✅ **Trust** - Verified domain emails
2. ✅ **Consistency** - Professional appearance
3. ✅ **Better Deliverability** - Emails don't go to spam

---

## 🔧 Technical Setup

### **1. Resend Configuration** ✅ (Already Done!)

Your domain `pauseplayrepeat.com` is verified with:
- ✅ SPF record
- ✅ DKIM records (3)
- ✅ DMARC record

This means **ANY** email `@pauseplayrepeat.com` can send:
- `support@pauseplayrepeat.com` ✅
- `noreply@pauseplayrepeat.com` ✅
- `beatmaker@pauseplayrepeat.com` ✅
- `{anything}@pauseplayrepeat.com` ✅

### **2. Email Address Format**

**Pattern:** `{store-slug}@pauseplayrepeat.com`

Examples:
```
Store: "Beat Maker Academy"
Slug: beatmaker
Email: beatmaker@pauseplayrepeat.com

Store: "Producer Pro"
Slug: producer-pro
Email: producer-pro@pauseplayrepeat.com
```

### **3. Reply-To Setup**

**Default Reply-To:** `support@pauseplayrepeat.com`

All campaign emails will have:
```
From: {slug}@pauseplayrepeat.com
From Name: {Store Name}
Reply-To: support@pauseplayrepeat.com
```

When customers click "Reply", it goes to `support@pauseplayrepeat.com`.

---

## 📥 Managing the Support Inbox

### **Option 1: Gmail Forwarding** (Quick Start)

1. Set up Gmail account: `support@pauseplayrepeat.com`
2. Configure auto-forwarding to your personal email
3. Use Gmail filters to organize by creator

**Gmail Filter Example:**
```
Subject contains: "Re: Beat Maker Academy"
→ Label: "Creator: Beat Maker"
→ Forward to: beatmaker@creator-email.com
```

### **Option 2: Email Service** (Recommended)

Use a service like:
- **Front** - Team inbox with assignment
- **Help Scout** - Customer support platform
- **Zendesk** - Full ticketing system

### **Option 3: Custom Dashboard** (Future)

Build into PPR Academy:
```
/admin/support-inbox
├─ View all replies
├─ Assign to creators
├─ Track response times
└─ Analytics on customer satisfaction
```

---

## 🗄️ Database Schema for Reply Tracking

Add to `convex/schema.ts`:

```typescript
emailReplies: defineTable({
  // Email metadata
  messageId: v.string(), // From email headers
  inReplyTo: v.optional(v.string()), // Original campaign message ID
  fromEmail: v.string(), // Customer email
  toEmail: v.string(), // support@pauseplayrepeat.com
  subject: v.string(),
  body: v.string(),
  receivedAt: v.number(),
  
  // Creator tracking
  storeId: v.optional(v.id("stores")), // Which store this reply is for
  creatorId: v.optional(v.string()), // Clerk user ID
  campaignId: v.optional(v.id("emailCampaigns")), // Original campaign
  
  // Status tracking
  status: v.union(
    v.literal("new"),
    v.literal("spam"),
    v.literal("forwarded"),
    v.literal("resolved")
  ),
  forwardedTo: v.optional(v.string()), // Creator's personal email
  forwardedAt: v.optional(v.number()),
  
  // Admin notes
  adminNotes: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
})
.index("by_storeId", ["storeId"])
.index("by_status", ["status"])
.index("by_receivedAt", ["receivedAt"]);
```

---

## 🔄 Automatic Reply Detection

### **Using Resend Webhooks**

Set up webhook endpoint: `/api/webhooks/resend/replies`

```typescript
// app/api/webhooks/resend/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  
  // Resend sends webhook when email is received
  if (payload.type === "email.received") {
    const { to, from, subject, html, messageId, inReplyTo } = payload.data;
    
    // Extract store from original "from" email
    // e.g., "beatmaker@pauseplayrepeat.com" → find store with slug "beatmaker"
    const storeSlug = extractSlugFromEmail(inReplyTo?.from);
    
    // Save to database
    await saveEmailReply({
      messageId,
      inReplyTo,
      fromEmail: from,
      toEmail: to,
      subject,
      body: html,
      storeSlug,
      status: "new",
    });
    
    // Optional: Notify admin
    await sendAdminNotification({
      title: "New customer reply",
      message: `Reply from ${from} about ${storeSlug}`,
    });
  }
  
  return NextResponse.json({ success: true });
}
```

---

## 📋 Workflow

### **Daily Reply Management**

**Morning:**
1. Check `support@pauseplayrepeat.com` inbox
2. Review new replies (marked "new" in database)
3. Categorize:
   - 🗑️ Spam → Mark as spam, delete
   - ❓ Question → Forward to creator
   - 🎯 Important → Flag for immediate attention

**Forwarding to Creator:**
```
Original Reply:
From: customer@email.com
To: support@pauseplayrepeat.com
Subject: Re: Your new course is live!

Forwarded Email:
From: support@pauseplayrepeat.com
To: creator@personal-email.com
Subject: [Customer Reply] Re: Your new course is live!

Hi Beat Maker,

You received a reply to your email campaign:

---
From: customer@email.com
Date: Oct 21, 2025 10:30 AM

[original message]
---

Reply directly to customer@email.com if needed.
```

---

## 📈 Future Enhancements

### **Phase 1: Basic Tracking** (Week 1)
- [ ] Add emailReplies table to schema
- [ ] Set up Resend webhook for incoming emails
- [ ] Build admin page to view replies
- [ ] Manual forwarding to creators

### **Phase 2: Automation** (Week 2-3)
- [ ] Auto-detect which creator reply belongs to
- [ ] Auto-forward to creator's personal email
- [ ] Track forwarded status
- [ ] Weekly digest of replies

### **Phase 3: Creator Dashboard** (Month 2)
- [ ] Let creators view their replies in dashboard
- [ ] Direct reply functionality (without email)
- [ ] Analytics: response rate, common questions
- [ ] Auto-responses for common questions

### **Phase 4: Smart Features** (Month 3+)
- [ ] AI categorization (spam, question, complaint)
- [ ] Auto-response suggestions
- [ ] Sentiment analysis
- [ ] Integration with customer support tools

---

## 🧪 Testing the System

### **Step 1: Send Test Campaign**

1. Creator configures email:
   - From: `teststore@pauseplayrepeat.com`
   - Reply-To: `support@pauseplayrepeat.com`
2. Send campaign to your test email
3. Check inbox - should receive from `teststore@pauseplayrepeat.com`

### **Step 2: Test Reply**

1. Click "Reply" in test email
2. Send a reply message
3. Check `support@pauseplayrepeat.com` inbox
4. Reply should arrive there (NOT at teststore@...)

### **Step 3: Forward to Creator**

1. Forward the reply to creator's personal email
2. Mark as "forwarded" in tracking system
3. Creator receives customer message

---

## 🎯 Quick Start Checklist

- [ ] Set up `support@pauseplayrepeat.com` Gmail account
- [ ] Configure email forwarding to your admin email
- [ ] Update email settings page (already done!)
- [ ] Update campaign creation with new defaults (already done!)
- [ ] Send test campaign with new email format
- [ ] Test reply flow end-to-end
- [ ] Document process for creators
- [ ] Set up daily reply check reminder

---

## 📞 Support Contact

**Reply Inbox:** support@pauseplayrepeat.com  
**Admin Email:** [your admin email]  
**Purpose:** Central hub for all customer replies from campaigns

---

## 🎉 Summary

This system gives you:
1. ✅ Professional emails for all creators
2. ✅ Centralized reply management
3. ✅ Spam protection
4. ✅ Privacy for creators
5. ✅ Foundation for future ticketing system

Next step: Test the full flow with a real campaign!

