# 🎯 PPR Academy Operator Dashboard - Optimized Implementation Plan

**Created:** November 3, 2025  
**Status:** 🔄 Ready for Implementation  
**Priority:** HIGH - Operational Visibility & Control

---

## 📊 Executive Summary

This document optimizes the provided operator dashboard specification for your **PPR Academy** platform, taking into account:
- ✅ Existing Convex analytics infrastructure
- ✅ Current admin panel structure
- ✅ Real-time reactive capabilities of Convex
- ✅ Your creator-learner dual funnel model
- ✅ Memory: HOME = creators/admins, LIBRARY = student learning dashboard

### Key Optimizations Made:
1. **Convex-Native Event Schema** - Leverages your existing `analyticsEvents` and `userEvents` tables
2. **Real-Time Reactivity** - Uses Convex queries for auto-updating dashboards (no polling!)
3. **Creator-Specific Tracking** - Tailored for music production education market
4. **Simplified Event Model** - Fits your existing infrastructure without major rewrites
5. **Integration with Existing Admin Panel** - Extends `/admin/analytics` route

---

## 🗂️ Current State Analysis

### ✅ What You Already Have

**1. Analytics Infrastructure** (`convex/analyticsTracking.ts`, `convex/analytics.ts`)
- Event tracking: `page_view`, `signup`, `login`, `purchase`, `course_view`, etc.
- User events: `course_enrolled`, `chapter_completed`, `purchase_completed`
- Session tracking with device/browser metadata
- `hooks/useAnalytics.ts` for client-side tracking

**2. Admin Panel Structure** (`app/admin/`)
- Dashboard at `/admin`
- Users page at `/admin/users`
- Analytics placeholder at `/admin/analytics`
- Sidebar navigation component

**3. Database Schema** (`convex/schema.ts`)
```typescript
analyticsEvents: defineTable({
  userId: string,
  storeId: optional<string>,
  eventType: "page_view" | "signup" | "purchase" | ...,
  resourceId: optional<string>,
  metadata: { page, referrer, value, device, browser, os },
  timestamp: number
})
  .index("by_userId", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_event", ["userId", "eventType"])

userEvents: defineTable({
  userId: string,
  eventType: "course_enrolled" | "chapter_completed" | ...,
  courseId: optional<id>,
  timestamp: number
})
```

### 🔧 What Needs Enhancement

1. **Missing Events** for full funnel tracking:
   - `creator_started` (when user begins creator flow)
   - `creator_published` (first course/product published)
   - `first_sale` (creator's first sale)
   - `email_sent`, `email_bounced`, `email_opened`
   - `cta_clicked` with campaign tracking

2. **Aggregation Queries** for KPIs:
   - Time-window queries (today, 7d, 28d)
   - Activation rate calculations
   - Funnel step tracking
   - Revenue metrics by creator

3. **Creator Pipeline Data**:
   - Creator status tracking (prospect → published → first sale)
   - Last touchpoint tracking
   - Outreach campaign linkage

---

## 🎯 Optimized Event Schema

### Enhanced Event Types (Add to existing `analyticsEvents`)

```typescript
// Add to convex/schema.ts - analyticsEvents eventType union
eventType: v.union(
  // Existing events
  v.literal("page_view"),
  v.literal("signup"),
  v.literal("login"),
  v.literal("purchase"),
  v.literal("course_view"),
  v.literal("product_view"),
  
  // NEW: Creator funnel events
  v.literal("creator_started"),      // User clicks "Become a Creator"
  v.literal("creator_profile_completed"), // Profile setup complete
  v.literal("creator_published"),    // First course/product published
  v.literal("first_sale"),          // Creator's first sale
  
  // NEW: Learner activation events
  v.literal("enrollment"),          // Course enrollment (already exists as course_enrolled in userEvents)
  v.literal("return_week_2"),       // User returns 7-14 days after signup
  
  // NEW: Email & campaign events
  v.literal("email_sent"),
  v.literal("email_delivered"),
  v.literal("email_opened"),
  v.literal("email_clicked"),
  v.literal("email_bounced"),
  v.literal("email_complained"),    // Spam report
  
  // NEW: Campaign & outreach events
  v.literal("dm_sent"),
  v.literal("cta_clicked"),
  v.literal("campaign_view"),
  
  // NEW: System events
  v.literal("error"),
  v.literal("webhook_failed"),
  
  // Existing events continue...
)
```

### Enhanced Metadata Structure

```typescript
metadata: v.optional(v.object({
  // Existing fields
  page: v.optional(v.string()),
  referrer: v.optional(v.string()),
  value: v.optional(v.number()),
  device: v.optional(v.string()),
  browser: v.optional(v.string()),
  
  // NEW: Campaign tracking
  source: v.optional(v.union(
    v.literal("instagram"),
    v.literal("tiktok"),
    v.literal("email"),
    v.literal("direct"),
    v.literal("twitter"),
    v.literal("youtube")
  )),
  campaign_id: v.optional(v.string()),
  utm_source: v.optional(v.string()),
  utm_medium: v.optional(v.string()),
  utm_campaign: v.optional(v.string()),
  
  // NEW: Creator-specific
  daw: v.optional(v.string()),           // Detected DAW preference
  audience_size: v.optional(v.number()), // Social follower count
  
  // NEW: Product/revenue specific
  product_id: v.optional(v.string()),
  amount_cents: v.optional(v.number()),
  currency: v.optional(v.string()),
  
  // NEW: Experiment tracking
  experiment_id: v.optional(v.string()),
  variant: v.optional(v.string()),       // "A" or "B"
  
  // NEW: Error tracking
  error_code: v.optional(v.string()),
  error_message: v.optional(v.string()),
}))
```

### New Table: Creator Status Tracking

```typescript
// Add to convex/schema.ts
creatorPipeline: defineTable({
  userId: v.string(),              // Clerk ID
  storeId: v.optional(v.id("stores")),
  
  // Pipeline stage
  stage: v.union(
    v.literal("prospect"),         // Identified potential creator
    v.literal("invited"),          // Sent invitation
    v.literal("signed_up"),        // Created account
    v.literal("drafting"),         // Working on first content
    v.literal("published"),        // First content published
    v.literal("first_sale"),       // Made first sale
    v.literal("active"),           // Regular sales
    v.literal("churn_risk")        // No activity in 30+ days
  ),
  
  // Timestamps for funnel timing
  prospectAt: v.optional(v.number()),
  invitedAt: v.optional(v.number()),
  signedUpAt: v.optional(v.number()),
  draftingAt: v.optional(v.number()),
  publishedAt: v.optional(v.number()),
  firstSaleAt: v.optional(v.number()),
  
  // Outreach tracking
  lastTouchAt: v.optional(v.number()),
  lastTouchType: v.optional(v.union(
    v.literal("dm"),
    v.literal("email"),
    v.literal("comment"),
    v.literal("call")
  )),
  nextStepNote: v.optional(v.string()),
  assignedTo: v.optional(v.string()),  // Admin/owner handling this creator
  
  // Creator metadata
  daw: v.optional(v.string()),
  instagramHandle: v.optional(v.string()),
  tiktokHandle: v.optional(v.string()),
  audienceSize: v.optional(v.number()),
  niche: v.optional(v.string()),       // "mixing", "production", "mastering"
  
  // Stats
  totalRevenue: v.optional(v.number()),
  productCount: v.optional(v.number()),
  enrollmentCount: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_stage", ["stage", "updatedAt"])
  .index("by_storeId", ["storeId"])
  .index("by_assignedTo", ["assignedTo", "stage"]),
```

### New Table: Campaign Tracking

```typescript
// Add to convex/schema.ts
campaigns: defineTable({
  name: v.string(),
  type: v.union(
    v.literal("email"),
    v.literal("instagram"),
    v.literal("tiktok"),
    v.literal("dm_batch")
  ),
  
  status: v.union(
    v.literal("draft"),
    v.literal("scheduled"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("paused")
  ),
  
  // Targeting
  targetRole: v.optional(v.union(
    v.literal("learner"),
    v.literal("creator"),
    v.literal("both")
  )),
  targetSegment: v.optional(v.string()),  // "stuck_creators", "new_signups", etc.
  
  // Content
  subject: v.optional(v.string()),
  body: v.string(),
  ctaText: v.optional(v.string()),
  ctaUrl: v.optional(v.string()),
  
  // Scheduling
  scheduledAt: v.optional(v.number()),
  sentAt: v.optional(v.number()),
  
  // Results
  sentCount: v.optional(v.number()),
  deliveredCount: v.optional(v.number()),
  openedCount: v.optional(v.number()),
  clickedCount: v.optional(v.number()),
  bouncedCount: v.optional(v.number()),
  convertedCount: v.optional(v.number()),  // clicked CTA + took action
  
  createdBy: v.string(),  // Admin user ID
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_status", ["status", "scheduledAt"])
  .index("by_type", ["type", "createdAt"]),
```

---

## 📊 Core Dashboard Components

### 1️⃣ Top KPIs Card (Time Windows: Today | 7d | 28d)

**File:** `app/admin/analytics/components/kpi-overview.tsx`

**Metrics to Display:**

| Metric | Query Source | Calculation |
|--------|-------------|-------------|
| New Signups | `analyticsEvents` where `eventType="signup"` | Count in time window |
| New Creator Signups | `analyticsEvents` where `eventType="creator_started"` | Count in time window |
| Learner Activation Rate | Complex query | `(enrolled users / new signups) * 100` |
| Creator Activation Rate | Complex query | `(published creators / creator signups) * 100` |
| MRR | `monetization` tables | Sum recurring revenue |
| Email Health | `analyticsEvents` email events | `bounce_rate = bounces / sent` |
| Traffic | `analyticsEvents` page_view + metadata.source | Group by source |
| System Health | Error monitoring | Error rate from logs |

**Query Example:**
```typescript
// convex/analytics/kpis.ts
export const getKPIs = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, { startTime, endTime }) => {
    // New signups
    const signups = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .filter((q) => q.eq(q.field("eventType"), "signup"))
      .collect();
    
    // New creator signups
    const creatorSignups = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .filter((q) => q.eq(q.field("eventType"), "creator_started"))
      .collect();
    
    // Learner activation: users who signed up AND enrolled
    const enrollments = await ctx.db
      .query("userEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .filter((q) => q.eq(q.field("eventType"), "course_enrolled"))
      .collect();
    
    const uniqueEnrolledUsers = new Set(enrollments.map(e => e.userId));
    const learnerActivationRate = signups.length > 0
      ? (uniqueEnrolledUsers.size / signups.length) * 100
      : 0;
    
    // Similar for creator activation...
    
    return {
      newSignups: signups.length,
      newCreatorSignups: creatorSignups.length,
      learnerActivationRate: Math.round(learnerActivationRate * 10) / 10,
      // ... more KPIs
    };
  },
});
```

---

### 2️⃣ Funnel Cards

**File:** `app/admin/analytics/components/funnel-visualization.tsx`

**Learner Funnel:**
```
Visit (page_view) → 
Signup (signup) → 
Enroll (course_enrolled) → 
Return Week 2 (return_week_2 event or page_view 7-14 days later)
```

**Creator Funnel:**
```
Visit (page_view) → 
Start Creator Flow (creator_started) → 
Publish First Item (creator_published) → 
First Sale (first_sale)
```

**Query Example:**
```typescript
// convex/analytics/funnels.ts
export const getLearnerFunnel = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, { startTime, endTime }) => {
    // Step 1: Visits
    const visits = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .filter((q) => q.eq(q.field("eventType"), "page_view"))
      .collect();
    
    const uniqueVisitors = new Set(visits.map(v => v.userId || v.sessionId));
    
    // Step 2: Signups (from those visitors)
    const signups = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .filter((q) => q.eq(q.field("eventType"), "signup"))
      .collect();
    
    const signupUserIds = new Set(signups.map(s => s.userId));
    
    // Step 3: Enrollments (from those signups)
    const enrollments = await ctx.db
      .query("userEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", startTime).lte("timestamp", endTime)
      )
      .filter((q) => q.eq(q.field("eventType"), "course_enrolled"))
      .collect();
    
    const enrolledUsers = enrollments.filter(e => signupUserIds.has(e.userId));
    const uniqueEnrolledUsers = new Set(enrolledUsers.map(e => e.userId));
    
    // Step 4: Week 2 returns
    const week2Start = endTime + (7 * 24 * 60 * 60 * 1000);
    const week2End = endTime + (14 * 24 * 60 * 60 * 1000);
    
    const week2Returns = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) =>
        q.gte("timestamp", week2Start).lte("timestamp", week2End)
      )
      .filter((q) => q.eq(q.field("eventType"), "page_view"))
      .collect();
    
    const returnedUsers = new Set(
      week2Returns
        .filter(v => signupUserIds.has(v.userId))
        .map(v => v.userId)
    );
    
    return {
      steps: [
        {
          name: "Visit",
          count: uniqueVisitors.size,
          conversionRate: 100,
        },
        {
          name: "Signup",
          count: signups.length,
          conversionRate: (signups.length / uniqueVisitors.size) * 100,
        },
        {
          name: "Enroll",
          count: uniqueEnrolledUsers.size,
          conversionRate: (uniqueEnrolledUsers.size / signups.length) * 100,
        },
        {
          name: "Return Week 2",
          count: returnedUsers.size,
          conversionRate: (returnedUsers.size / signups.length) * 100,
        },
      ],
    };
  },
});
```

---

### 3️⃣ Creator Pipeline (CRM Board)

**File:** `app/admin/analytics/components/creator-pipeline.tsx`

**Visual:** Kanban-style board with columns:
- Prospects
- Invited
- Signed Up
- Drafting
- Published
- First Sale
- Churn Risk

**Data Source:** `creatorPipeline` table

**Quick Actions:**
- Send DM template (opens modal with pre-written messages)
- Send email invite
- Generate personal invite link
- Update stage
- Add note

**Query:**
```typescript
// convex/analytics/creatorPipeline.ts
export const getCreatorsByStage = query({
  args: {
    stage: v.optional(v.string()),
  },
  handler: async (ctx, { stage }) => {
    let query = ctx.db.query("creatorPipeline");
    
    if (stage) {
      query = query.withIndex("by_stage", (q) => 
        q.eq("stage", stage)
      );
    }
    
    const creators = await query.collect();
    
    // Enrich with user data
    const enriched = await Promise.all(
      creators.map(async (creator) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", creator.userId))
          .first();
        
        return {
          ...creator,
          userName: user?.name || user?.firstName || "Unknown",
          userEmail: user?.email,
          userAvatar: user?.imageUrl,
        };
      })
    );
    
    return enriched;
  },
});

// Get stuck creators (signed up but not published after 3+ days)
export const getStuckCreators = query({
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    
    const stuckCreators = await ctx.db
      .query("creatorPipeline")
      .withIndex("by_stage", (q) =>
        q.eq("stage", "drafting")
      )
      .filter((q) => 
        q.lt(q.field("draftingAt"), threeDaysAgo)
      )
      .collect();
    
    return stuckCreators;
  },
});
```

---

### 4️⃣ Experiments Tracker

**File:** `app/admin/analytics/components/experiments-tracker.tsx`

**New Table:**
```typescript
experiments: defineTable({
  name: v.string(),
  hypothesis: v.string(),
  metric: v.string(),                    // "conversion_rate", "signup_rate", etc.
  startDate: v.number(),
  endDate: v.optional(v.number()),
  status: v.union(
    v.literal("draft"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  
  // Variants
  variantA: v.object({
    name: v.string(),
    description: v.string(),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    assetUrl: v.optional(v.string()),    // Screenshot/asset
  }),
  variantB: v.object({
    name: v.string(),
    description: v.string(),
    ctaText: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    assetUrl: v.optional(v.string()),
  }),
  
  // Results
  variantAViews: v.optional(v.number()),
  variantAConversions: v.optional(v.number()),
  variantBViews: v.optional(v.number()),
  variantBConversions: v.optional(v.number()),
  
  winner: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("tie"))),
  
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_status", ["status", "startDate"]),
```

**Track experiment views via:**
```typescript
// When showing variant to user
await trackEvent({
  userId: user.id,
  eventType: "campaign_view",
  metadata: {
    experiment_id: "exp_001",
    variant: "A",
  },
});

// When user converts
await trackEvent({
  userId: user.id,
  eventType: "cta_clicked",
  metadata: {
    experiment_id: "exp_001",
    variant: "A",
  },
});
```

---

### 5️⃣ Outreach & Content Queue

**File:** `app/admin/analytics/components/content-calendar.tsx`

**Visual:** Calendar grid showing:
- Instagram Reel posts
- TikTok posts
- Email sends
- DM batches

**Data Source:** `campaigns` table with `scheduledAt` field

**Features:**
- Drag-and-drop to reschedule
- Duplicate last week's winners
- Link to asset library
- One-click publish

---

### 6️⃣ Notifications & Campaign Composer

**File:** `app/admin/analytics/components/campaign-composer.tsx`

**Features:**
- Rich text editor
- Template variables: `{{firstName}}`, `{{courseName}}`, etc.
- Multi-channel: In-app + Email + Push
- Audience segmentation dropdown
- Auto-UTM parameter generation
- Preview before send
- Schedule or send now

**Mutation:**
```typescript
// convex/campaigns/create.ts
export const createCampaign = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    body: v.string(),
    targetRole: v.optional(v.string()),
    targetSegment: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Create campaign
    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      status: args.scheduledAt ? "scheduled" : "active",
      sentCount: 0,
      createdBy: await getCurrentUserId(ctx),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // If not scheduled, send immediately
    if (!args.scheduledAt) {
      await ctx.scheduler.runAfter(0, internal.campaigns.send, {
        campaignId,
      });
    }
    
    return campaignId;
  },
});
```

---

### 7️⃣ Revenue & Payouts

**File:** `app/admin/analytics/components/revenue-dashboard.tsx`

**Data Source:** Existing `monetization` schema (subscriptions, payments, payouts)

**Metrics:**
- Total revenue (all-time, 7d, 30d)
- Revenue by creator (top 10)
- Revenue by product type (course vs. digital product)
- Upcoming payouts (from Stripe Connect)
- Failed payouts
- Average order value
- Refund rate

**Query:**
```typescript
// convex/analytics/revenue.ts
export const getRevenueMetrics = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, { startTime, endTime }) => {
    // Get all payments in time range
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_createdAt", (q) =>
        q.gte("createdAt", startTime).lte("createdAt", endTime)
      )
      .filter((q) => q.eq(q.field("status"), "succeeded"))
      .collect();
    
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Revenue by creator
    const byCreator = new Map<string, number>();
    for (const payment of payments) {
      const current = byCreator.get(payment.sellerId) || 0;
      byCreator.set(payment.sellerId, current + payment.amount);
    }
    
    const topCreators = Array.from(byCreator.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      totalRevenue,
      paymentCount: payments.length,
      averageOrderValue: payments.length > 0 ? totalRevenue / payments.length : 0,
      topCreators,
    };
  },
});
```

---

### 8️⃣ Support & Moderation Inbox

**File:** `app/admin/analytics/components/support-inbox.tsx`

**Data Sources:**
- Contact form submissions
- Report flags
- Refund requests

**Features:**
- Unified inbox view
- Quick macros (pre-written responses)
- One-tap refund approval
- Content review queue for first-time creators
- Tag/categorize issues

**Potential new table:**
```typescript
supportTickets: defineTable({
  type: v.union(
    v.literal("contact"),
    v.literal("report"),
    v.literal("refund_request")
  ),
  status: v.union(
    v.literal("open"),
    v.literal("in_progress"),
    v.literal("resolved"),
    v.literal("closed")
  ),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("urgent")
  ),
  
  userId: v.string(),              // Submitter
  assignedTo: v.optional(v.string()),
  
  subject: v.string(),
  message: v.string(),
  
  // For reports
  reportedUserId: v.optional(v.string()),
  reportedResourceId: v.optional(v.string()),
  reportedResourceType: v.optional(v.string()),
  
  // For refunds
  paymentId: v.optional(v.id("payments")),
  refundAmount: v.optional(v.number()),
  refundReason: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
  resolvedAt: v.optional(v.number()),
})
  .index("by_status", ["status", "createdAt"])
  .index("by_assignedTo", ["assignedTo", "status"]),
```

---

### 9️⃣ System Health Monitor

**File:** `app/admin/analytics/components/system-health.tsx`

**Metrics:**
- Convex function error rate
- Webhook failure count (from `analyticsEvents` where `eventType="webhook_failed"`)
- Email provider status (check Resend API)
- Stripe status (check Stripe API)
- Queue depth (if using Convex scheduled functions)

**Visual:**
- Green/yellow/red status indicators
- Alert rules you can toggle
- Real-time error log

---

## 🚀 Implementation Roadmap

### Phase 1: Enhanced Event Tracking (Week 1)
**Priority: HIGH**

- [ ] Add new event types to `analyticsEvents` schema
- [ ] Enhance metadata structure
- [ ] Create `creatorPipeline` table
- [ ] Create `campaigns` table
- [ ] Create `experiments` table
- [ ] Update `hooks/useAnalytics.ts` to track new events
- [ ] Add tracking calls throughout app:
  - [ ] Track `creator_started` on "/home/setup" or creator onboarding
  - [ ] Track `creator_published` when first course/product published
  - [ ] Track `first_sale` on first successful payment to creator
  - [ ] Track `email_*` events in email sending mutations
  - [ ] Track `cta_clicked` on campaign links

### Phase 2: Core Dashboard Queries (Week 1-2)
**Priority: HIGH**

- [ ] `convex/analytics/kpis.ts` - KPI queries (today, 7d, 28d)
- [ ] `convex/analytics/funnels.ts` - Learner & creator funnel queries
- [ ] `convex/analytics/creatorPipeline.ts` - Creator CRM queries
- [ ] `convex/analytics/revenue.ts` - Revenue metrics queries
- [ ] `convex/analytics/health.ts` - System health queries

### Phase 3: Dashboard UI Components (Week 2-3)
**Priority: HIGH**

- [ ] Create `/app/admin/analytics/page.tsx` (main dashboard)
- [ ] `components/kpi-overview.tsx` - KPI cards with time window toggle
- [ ] `components/funnel-visualization.tsx` - Funnel charts
- [ ] `components/creator-pipeline.tsx` - Kanban board
- [ ] `components/experiments-tracker.tsx` - Experiments table
- [ ] `components/revenue-dashboard.tsx` - Revenue charts
- [ ] `components/system-health.tsx` - Health indicators
- [ ] Update admin sidebar to highlight Analytics

### Phase 4: Campaign & Outreach Tools (Week 3-4)
**Priority: MEDIUM**

- [ ] `components/campaign-composer.tsx` - Campaign creation UI
- [ ] `components/content-calendar.tsx` - Calendar view
- [ ] `convex/campaigns/create.ts` - Campaign creation mutation
- [ ] `convex/campaigns/send.ts` - Campaign sending (scheduled function)
- [ ] DM template library
- [ ] Email template library
- [ ] Auto-UTM generation

### Phase 5: Support & Moderation (Week 4-5)
**Priority: MEDIUM**

- [ ] Create `supportTickets` table
- [ ] `components/support-inbox.tsx` - Unified inbox
- [ ] Quick response macros
- [ ] One-tap refund flow
- [ ] Content review queue

### Phase 6: Alerts & Automation (Week 5-6)
**Priority: LOW**

- [ ] Scheduled function: Check stuck creators (3+ days in drafting)
- [ ] Scheduled function: First sale achieved → congrats email
- [ ] Scheduled function: Email bounce rate > 2% → alert admin
- [ ] Scheduled function: Webhook failures > 5 in 15min → alert
- [ ] In-app notification system for alerts
- [ ] Email alert system

---

## 🎨 UI Layout

### Route Structure
```
/admin/analytics (NEW - Main Operator Dashboard)
  ├── Top KPI strip (today | 7d | 28d toggle)
  ├── Learner Funnel + Creator Funnel (side-by-side)
  ├── Creator Pipeline (Kanban board)
  ├── Today's Alerts section
  ├── Active Campaigns section
  └── System Health strip

/admin/analytics/experiments
  └── Experiments table with create/edit

/admin/analytics/campaigns
  └── Campaign composer + calendar

/admin/analytics/revenue
  └── Revenue deep-dive (existing or enhanced)

/admin/analytics/support
  └── Support inbox
```

### Sidebar Navigation Update
```typescript
// app/admin/components/admin-sidebar.tsx
{
  title: "Analytics",
  href: "/admin/analytics",
  icon: BarChart3,
  description: "Operator dashboard & KPIs",
  badge: alertCount > 0 ? alertCount : undefined,
},
```

---

## 📐 Key Design Decisions

### 1. **Convex-Native Instead of Postgres**
- ✅ Your app already uses Convex
- ✅ Real-time reactive queries (no polling!)
- ✅ Simpler architecture (no second database)
- ✅ Events are already being tracked in `analyticsEvents`
- ⚠️ For extremely high volume (1M+ events/day), consider pre-aggregation

### 2. **Activation Definitions (Tailored to Your Platform)**

**Learner Activation:**
- User visited 2+ pages AND enrolled in 1 course/product
- Time window: Within 7 days of signup

**Creator Activation:**
- User completed creator profile setup AND published 1 item (course or product)
- Time window: Within 14 days of starting creator flow

### 3. **Event Deduplication Strategy**
You have both `analyticsEvents` and `userEvents` tables. Recommendation:
- **`analyticsEvents`**: Low-level events (page views, clicks, email events, system events)
- **`userEvents`**: High-level user journey events (enrollments, completions, purchases)
- Some overlap is OK (e.g., `purchase` exists in both for different use cases)

### 4. **Pre-Aggregation for Performance**
For time-window queries (today, 7d, 28d), consider:
- Scheduled function runs hourly/daily to pre-aggregate metrics
- Store in new `aggregates` table
- Dashboard queries read from aggregates instead of scanning all events
- Trade-off: Real-time accuracy vs. query speed

Example:
```typescript
// convex/crons.ts
export default {
  aggregateHourlyMetrics: {
    schedule: "0 * * * *", // Every hour
    handler: internal.analytics.aggregateHourlyMetrics,
  },
};
```

---

## 🧪 Testing Strategy

### 1. Seed Test Events
Create a mutation to backfill test events:
```typescript
// convex/admin/seedTestEvents.ts
export const seedTestEvents = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const testUserId = "test_user_001";
    
    // Simulate learner funnel
    await ctx.db.insert("analyticsEvents", {
      userId: testUserId,
      eventType: "page_view",
      metadata: { page: "/", source: "instagram" },
      timestamp: now - (10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    
    await ctx.db.insert("analyticsEvents", {
      userId: testUserId,
      eventType: "signup",
      timestamp: now - (9 * 24 * 60 * 60 * 1000),
    });
    
    await ctx.db.insert("userEvents", {
      userId: testUserId,
      eventType: "course_enrolled",
      courseId: await getTestCourseId(ctx),
      timestamp: now - (8 * 24 * 60 * 60 * 1000),
    });
    
    // Add more test events...
    
    return { success: true, message: "Test events seeded" };
  },
});
```

### 2. Manual Testing Checklist
- [ ] KPIs update when changing time window
- [ ] Funnel percentages calculate correctly
- [ ] Creator pipeline drag-and-drop works
- [ ] Campaign composer sends test email
- [ ] Alerts appear in dashboard
- [ ] System health indicators show correct status

### 3. Validation Queries
Create debug queries to validate data:
```typescript
// convex/admin/debugAnalytics.ts
export const validateFunnelData = query({
  handler: async (ctx) => {
    const signups = await ctx.db
      .query("analyticsEvents")
      .filter((q) => q.eq(q.field("eventType"), "signup"))
      .collect();
    
    const enrollments = await ctx.db
      .query("userEvents")
      .filter((q) => q.eq(q.field("eventType"), "course_enrolled"))
      .collect();
    
    return {
      totalSignups: signups.length,
      totalEnrollments: enrollments.length,
      activationRate: (enrollments.length / signups.length) * 100,
    };
  },
});
```

---

## 🔐 Security Considerations

### 1. Admin-Only Access
```typescript
// app/admin/analytics/page.tsx
import { requireAdmin } from "@/lib/auth-helpers";

export default async function AnalyticsDashboard() {
  await requireAdmin();
  // ... rest of component
}
```

### 2. Sensitive Data Masking
When displaying user data in creator pipeline:
- Mask full email addresses (show `j****@example.com`)
- Don't expose internal user IDs in frontend
- Use Clerk IDs for tracking (already doing this)

### 3. Campaign Send Rate Limiting
Prevent accidental spam:
```typescript
// convex/campaigns/send.ts
const recentSends = await ctx.db
  .query("campaigns")
  .filter((q) => 
    q.and(
      q.eq(q.field("createdBy"), userId),
      q.gt(q.field("sentAt"), Date.now() - 3600000) // Last hour
    )
  )
  .collect();

if (recentSends.length >= 5) {
  throw new Error("Rate limit: Maximum 5 campaigns per hour");
}
```

---

## 📊 Success Metrics (How to Know It's Working)

### Week 1 After Launch:
- [ ] All KPIs populating with real data
- [ ] Funnels showing accurate conversion rates
- [ ] At least 3 creators in pipeline view

### Month 1 After Launch:
- [ ] Used campaign composer to send 10+ campaigns
- [ ] Identified and nudged 20+ stuck creators
- [ ] Ran 2+ experiments with tracked results
- [ ] Reduced creator activation time by 10%

### Quarter 1 After Launch:
- [ ] Creator activation rate increased by 15%
- [ ] Learner activation rate increased by 20%
- [ ] Average time to first sale decreased by 20%
- [ ] Dashboard used daily by team

---

## 🔄 Weekly Operating Cadence

### Monday (30 min)
- [ ] Review weekend KPIs (new signups, enrollments, sales)
- [ ] Check stuck creators list → tag 3 for outreach
- [ ] Review last week's top campaign → decide on reuse
- [ ] Choose one experiment to run this week

### Wednesday (20 min)
- [ ] Ship one nudge or feature to help activation
- [ ] Send DM batch to stuck creators
- [ ] Review experiment preliminary results

### Friday (10 min)
- [ ] Post weekly win to community/social
- [ ] Feature one creator (first sale or milestone)
- [ ] Close out support tickets
- [ ] Set next week's focus

---

## 🛠️ Technical Implementation Tips

### 1. Use Reactive Queries for Real-Time Updates
```tsx
// app/admin/analytics/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AnalyticsDashboard() {
  const kpis = useQuery(api.analytics.kpis.getKPIs, {
    startTime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
    endTime: Date.now(),
  });
  
  // This component will automatically re-render when data changes!
  return (
    <div>
      <h1>New Signups (7d): {kpis?.newSignups}</h1>
    </div>
  );
}
```

### 2. Time Window State Management
```tsx
const [timeWindow, setTimeWindow] = useState<"today" | "7d" | "28d">("7d");

const getTimeRange = () => {
  const now = Date.now();
  switch (timeWindow) {
    case "today":
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      return { start: startOfDay, end: now };
    case "7d":
      return { start: now - (7 * 24 * 60 * 60 * 1000), end: now };
    case "28d":
      return { start: now - (28 * 24 * 60 * 60 * 1000), end: now };
  }
};

const { start, end } = getTimeRange();
const kpis = useQuery(api.analytics.kpis.getKPIs, {
  startTime: start,
  endTime: end,
});
```

### 3. Creator Pipeline Drag-and-Drop
Use `@dnd-kit/core` for Kanban board:
```tsx
import { DndContext, closestCenter } from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const updateCreatorStage = useMutation(api.analytics.creatorPipeline.updateStage);

const handleDragEnd = (event: any) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    updateCreatorStage({
      creatorId: active.id,
      newStage: over.id, // Column ID = stage name
    });
  }
};
```

### 4. Chart Visualization
Use Recharts for funnel and time-series charts:
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

<BarChart data={funnelData}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" fill="#8b5cf6" />
</BarChart>
```

---

## 🎯 Next Steps

### Immediate Actions:
1. **Review this document** with your team
2. **Prioritize phases** based on your most urgent needs
3. **Create GitHub issues** for Phase 1 tasks
4. **Set up project board** for tracking

### Questions to Consider:
- Do you want pre-aggregated metrics or real-time queries?
- What's your expected event volume? (determines if pre-aggregation is needed)
- Who will be the primary user of this dashboard? (just you or a team?)
- Do you already have campaign/outreach tools, or build from scratch?

### Resources to Prepare:
- DM templates for creator outreach
- Email templates for campaigns
- List of experiments you want to run
- Alert thresholds (e.g., "email bounce rate > 2%")

---

## 📚 Related Documentation

- [[memory:8588896]] - LIBRARY = student dashboard, HOME = creator dashboard
- [[memory:8563605]] - Using Convex for embeddings/storage
- Existing: `/app/admin/` - Current admin panel structure
- Existing: `convex/analyticsTracking.ts` - Current event tracking
- Existing: `hooks/useAnalytics.ts` - Client-side tracking hook
- Existing: `ANALYTICS_SYSTEM.md` - Previous analytics documentation

---

**Ready to implement?** Start with Phase 1 (Enhanced Event Tracking) and Phase 2 (Core Dashboard Queries) to get the foundation in place. The UI can be iterated on quickly once the data layer is solid.

Would you like me to:
1. Generate the exact Convex schema changes?
2. Create the first dashboard page (`app/admin/analytics/page.tsx`)?
3. Implement the KPI query file (`convex/analytics/kpis.ts`)?
4. Set up tracking calls for new events?

Let me know what you'd like to tackle first! 🚀

