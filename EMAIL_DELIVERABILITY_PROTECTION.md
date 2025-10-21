# 🛡️ Email Deliverability & Anti-Spam Protection System

## 🎯 Problem Statement

**Risk:** If creators spam their lists, it can:
- ❌ Blacklist our sending domain
- ❌ Damage deliverability for ALL creators
- ❌ Get flagged by ISPs (Gmail, Outlook, etc.)
- ❌ Destroy platform reputation
- ❌ Cost you your Resend account

---

## 🏗️ Multi-Layer Defense Strategy

### **Layer 1: Domain Isolation** ⚠️ CRITICAL

**Current Setup (Risky):**
```
Sending from: creator@pauseplayrepeat.com
Risk: Main domain exposed
```

**Recommended Setup:**
```
Main Domain: pauseplayrepeat.com (website only)
Sending Domain: mail.pauseplayrepeat.com (emails only)

If mail subdomain gets blacklisted:
→ Main site still works ✅
→ Can create new sending domain ✅
```

**Implementation:**

1. **Add new domain in Resend:**
   - Go to Resend → Domains
   - Add: `mail.pauseplayrepeat.com`
   - Get DNS records (same as before)

2. **Update DNS:**
   ```
   Add to your DNS:
   
   MX record:
   mail.pauseplayrepeat.com → feedback-smtp.us-east-1.amazonses.com
   
   TXT (SPF):
   mail.pauseplayrepeat.com → v=spf1 include:_spf.resend.com ~all
   
   CNAME (DKIM - 3 records):
   resend._domainkey.mail.pauseplayrepeat.com → ...
   resend2._domainkey.mail.pauseplayrepeat.com → ...
   resend3._domainkey.mail.pauseplayrepeat.com → ...
   
   TXT (DMARC):
   _dmarc.mail.pauseplayrepeat.com → v=DMARC1; p=quarantine; ...
   ```

3. **Update email format:**
   ```
   From: creator@mail.pauseplayrepeat.com
   Reply-To: support@pauseplayrepeat.com
   ```

---

### **Layer 2: Resend's Built-in Protections** ✅

Resend automatically monitors:

1. **Bounce Rate** - If >5%, flags account
2. **Spam Complaint Rate** - If >0.1%, flags account
3. **Sending Patterns** - Detects sudden spikes
4. **Content Analysis** - Scans for spam keywords
5. **Blocklist Monitoring** - Checks if domain is blacklisted

**Automatic Actions:**
- Pauses sending if bounce rate too high
- Alerts you to spam complaints
- May suspend account if abuse detected

---

### **Layer 3: Platform-Level Controls** (You Implement)

#### **A. Rate Limiting**

```typescript
// convex/emailCampaigns.ts

export const sendCampaign = mutation({
  args: { campaignId: v.id("emailCampaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    const store = await ctx.db.get(campaign.storeId);
    
    // Check daily sending limit
    const today = new Date().setHours(0,0,0,0);
    const sentToday = await ctx.db
      .query("emailCampaigns")
      .filter(q => 
        q.and(
          q.eq(q.field("storeId"), campaign.storeId),
          q.gte(q.field("sentAt"), today),
          q.eq(q.field("status"), "sent")
        )
      )
      .collect();
    
    const emailsSentToday = sentToday.reduce((sum, c) => sum + c.sentCount, 0);
    
    // Limits by creator tier
    const limits = {
      free: 100,      // 100 emails/day
      pro: 1000,      // 1,000 emails/day
      premium: 10000  // 10,000 emails/day
    };
    
    const tier = store.subscriptionTier || "free";
    if (emailsSentToday >= limits[tier]) {
      throw new Error(`Daily limit reached: ${limits[tier]} emails/day for ${tier} tier`);
    }
    
    // Continue with send...
  }
});
```

#### **B. Content Filtering**

```typescript
// lib/spam-detector.ts

export function detectSpam(content: string): {
  isSpam: boolean;
  score: number;
  reasons: string[];
} {
  const spamKeywords = [
    "100% free", "act now", "call now", "click here",
    "congratulations", "dear friend", "earn money",
    "free access", "get paid", "guaranteed",
    "limited time", "make money", "no cost",
    "one time", "urgent", "winner", "!!!",
  ];
  
  let score = 0;
  const reasons = [];
  
  // Check for spam keywords
  const lowerContent = content.toLowerCase();
  spamKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      score += 10;
      reasons.push(`Contains spam keyword: "${keyword}"`);
    }
  });
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3) {
    score += 20;
    reasons.push("Excessive capital letters");
  }
  
  // Check for excessive punctuation
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score += 15;
    reasons.push("Excessive exclamation marks");
  }
  
  // Check for suspicious links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) {
    score += 10;
    reasons.push("Too many links");
  }
  
  return {
    isSpam: score >= 30,
    score,
    reasons
  };
}

// Usage in campaign creation
export const createCampaign = mutation({
  handler: async (ctx, args) => {
    const spamCheck = detectSpam(args.content);
    
    if (spamCheck.isSpam) {
      throw new Error(
        `Campaign flagged as potential spam (score: ${spamCheck.score}/100):\n` +
        spamCheck.reasons.join("\n")
      );
    }
    
    // Continue...
  }
});
```

#### **C. Engagement Tracking**

```typescript
// Track email engagement per creator
emailMetrics: defineTable({
  storeId: v.id("stores"),
  period: v.string(), // "2025-10-21"
  
  // Sending metrics
  sent: v.number(),
  delivered: v.number(),
  bounced: v.number(),
  
  // Engagement metrics
  opened: v.number(),
  clicked: v.number(),
  
  // Negative metrics (WARNING SIGNS!)
  spamComplaints: v.number(),
  unsubscribes: v.number(),
  
  // Calculated rates
  bounceRate: v.number(),      // Should be <5%
  spamRate: v.number(),         // Should be <0.1%
  openRate: v.number(),         // Healthy: >15%
  
  // Reputation score
  reputationScore: v.number(), // 0-100
})
.index("by_storeId", ["storeId"])
.index("by_period", ["period"]);

// Auto-suspend if metrics are bad
export const checkCreatorReputation = mutation({
  handler: async (ctx, { storeId }) => {
    const metrics = await ctx.db
      .query("emailMetrics")
      .filter(q => q.eq(q.field("storeId"), storeId))
      .order("desc")
      .first();
    
    if (!metrics) return { status: "ok" };
    
    // RED FLAGS
    if (metrics.bounceRate > 5) {
      await suspendCreatorEmails(ctx, storeId, "High bounce rate");
      return { status: "suspended", reason: "bounce_rate" };
    }
    
    if (metrics.spamRate > 0.1) {
      await suspendCreatorEmails(ctx, storeId, "Spam complaints");
      return { status: "suspended", reason: "spam_complaints" };
    }
    
    if (metrics.reputationScore < 30) {
      await suspendCreatorEmails(ctx, storeId, "Low reputation score");
      return { status: "suspended", reason: "reputation" };
    }
    
    return { status: "ok" };
  }
});
```

---

### **Layer 4: List Quality Enforcement**

#### **Email Verification on Import**

```typescript
// When creator imports email list
export const importEmailList = mutation({
  args: {
    storeId: v.id("stores"),
    emails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const validEmails = [];
    const invalidEmails = [];
    
    for (const email of args.emails) {
      // Basic validation
      if (!isValidEmail(email)) {
        invalidEmails.push(email);
        continue;
      }
      
      // Check if it's a disposable email
      if (isDisposableEmail(email)) {
        invalidEmails.push(email);
        continue;
      }
      
      validEmails.push(email);
    }
    
    // Reject if too many invalid
    const invalidRate = invalidEmails.length / args.emails.length;
    if (invalidRate > 0.1) { // More than 10% invalid
      throw new Error(
        `List quality too low: ${(invalidRate * 100).toFixed(1)}% invalid emails. ` +
        `Please clean your list before importing.`
      );
    }
    
    // Save only valid emails
    for (const email of validEmails) {
      await ctx.db.insert("contacts", {
        storeId: args.storeId,
        email,
        status: "active",
        source: "import",
      });
    }
    
    return {
      imported: validEmails.length,
      rejected: invalidEmails.length,
      invalidEmails: invalidEmails.slice(0, 10), // Show first 10
    };
  }
});

function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    "tempmail.com", "guerrillamail.com", "10minutemail.com",
    "mailinator.com", "throwaway.email", "temp-mail.org"
  ];
  
  const domain = email.split("@")[1];
  return disposableDomains.includes(domain);
}
```

---

### **Layer 5: Double Opt-In** (Recommended)

```typescript
// Require confirmation before adding to list
export const addSubscriber = mutation({
  args: {
    storeId: v.id("stores"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Create pending subscriber
    const subscriberId = await ctx.db.insert("subscribers", {
      storeId: args.storeId,
      email: args.email,
      status: "pending", // NOT "active" yet!
      confirmationToken: generateToken(),
      createdAt: Date.now(),
    });
    
    // Send confirmation email
    await ctx.scheduler.runAfter(0, internal.emails.sendConfirmationEmail, {
      email: args.email,
      token: confirmationToken,
      storeId: args.storeId,
    });
    
    return { message: "Confirmation email sent" };
  }
});

// Only confirmed subscribers receive campaigns
export const sendCampaign = mutation({
  handler: async (ctx, args) => {
    const recipients = await ctx.db
      .query("subscribers")
      .filter(q => q.and(
        q.eq(q.field("storeId"), args.storeId),
        q.eq(q.field("status"), "active") // Only active!
      ))
      .collect();
    
    // Send to confirmed subscribers only
  }
});
```

---

### **Layer 6: Monitoring Dashboard**

```typescript
// Admin dashboard to monitor platform health
export const getPlatformEmailHealth = query({
  args: {},
  handler: async (ctx) => {
    // Get all stores' metrics for today
    const today = new Date().toISOString().split("T")[0];
    const metrics = await ctx.db
      .query("emailMetrics")
      .filter(q => q.eq(q.field("period"), today))
      .collect();
    
    const platformTotals = {
      sent: 0,
      bounced: 0,
      spamComplaints: 0,
      stores: metrics.length,
    };
    
    const flaggedStores = [];
    
    for (const metric of metrics) {
      platformTotals.sent += metric.sent;
      platformTotals.bounced += metric.bounced;
      platformTotals.spamComplaints += metric.spamComplaints;
      
      // Flag problematic stores
      if (metric.bounceRate > 5 || metric.spamRate > 0.1) {
        const store = await ctx.db.get(metric.storeId);
        flaggedStores.push({
          storeName: store.name,
          bounceRate: metric.bounceRate,
          spamRate: metric.spamRate,
          reputationScore: metric.reputationScore,
        });
      }
    }
    
    return {
      platformTotals,
      platformBounceRate: (platformTotals.bounced / platformTotals.sent) * 100,
      platformSpamRate: (platformTotals.spamComplaints / platformTotals.sent) * 100,
      flaggedStores,
      status: flaggedStores.length > 0 ? "warning" : "healthy",
    };
  }
});
```

---

## 🚦 Action Plan

### **Immediate (This Week)**

1. ✅ **Set up separate sending domain:**
   - Add `mail.pauseplayrepeat.com` in Resend
   - Configure DNS records
   - Update email format to use subdomain

2. ✅ **Implement rate limiting:**
   - 100 emails/day for free tier
   - Higher limits for paid tiers

3. ✅ **Add spam detection:**
   - Check content before sending
   - Block obvious spam keywords

### **Short Term (Next 2 Weeks)**

4. ✅ **Email list validation:**
   - Verify emails on import
   - Block disposable emails
   - Reject lists with >10% invalid

5. ✅ **Engagement tracking:**
   - Track opens, clicks, bounces, spam reports
   - Calculate reputation scores

6. ✅ **Admin monitoring dashboard:**
   - Platform-wide email health
   - Flag problematic creators

### **Medium Term (Next Month)**

7. ✅ **Double opt-in:**
   - Require confirmation emails
   - Only send to confirmed subscribers

8. ✅ **Automated enforcement:**
   - Auto-suspend creators with bad metrics
   - Warning system before suspension

9. ✅ **Email warming:**
   - Start with low volumes
   - Gradually increase sending limits

---

## 📊 Healthy Email Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| **Bounce Rate** | <2% | 2-5% | >5% |
| **Spam Complaint Rate** | <0.01% | 0.01-0.1% | >0.1% |
| **Open Rate** | >20% | 10-20% | <10% |
| **Unsubscribe Rate** | <0.5% | 0.5-2% | >2% |

---

## 💰 Cost of Bad Reputation

**If domain gets blacklisted:**
- ❌ 100% of emails go to spam
- ❌ Cannot fix for 30-90 days minimum
- ❌ May need to buy new domain ($10-15)
- ❌ Lose customer trust
- ❌ Platform revenue drops

**Prevention is worth it!**

---

## 🎯 Summary

**Must Do:**
1. ✅ Use separate subdomain: `mail.pauseplayrepeat.com`
2. ✅ Implement rate limiting
3. ✅ Monitor bounce/spam rates
4. ✅ Auto-suspend bad actors

**Should Do:**
5. ✅ Content filtering
6. ✅ Email verification
7. ✅ Double opt-in

**Nice to Have:**
8. ✅ Advanced analytics
9. ✅ Reputation scoring
10. ✅ Automated warnings

---

This multi-layer approach protects your platform while giving creators freedom to send legitimate emails.

