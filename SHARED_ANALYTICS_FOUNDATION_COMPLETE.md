# ✅ Shared Analytics Foundation - Implementation Complete

**Date:** November 3, 2025  
**Status:** ✅ **COMPLETE** - Ready for dashboard implementation

---

## 🎉 What Was Built

We've successfully built the **shared data layer** that will power both the creator-scoped analytics (`/store/analytics`) and platform-wide operator dashboard (`/admin/analytics`).

---

## ✅ Completed Work

### 1. Enhanced Schema (`convex/schema.ts`)

#### Updated `analyticsEvents` Table
**Added 20+ new event types:**
- ✅ Creator funnel: `creator_started`, `creator_profile_completed`, `creator_published`, `first_sale`
- ✅ Learner activation: `enrollment`, `return_week_2`
- ✅ Email tracking: `email_sent`, `email_delivered`, `email_opened`, `email_clicked`, `email_bounced`, `email_complained`
- ✅ Campaigns: `dm_sent`, `cta_clicked`, `campaign_view`
- ✅ System events: `error`, `webhook_failed`

**Enhanced metadata fields:**
```typescript
metadata: {
  // Campaign tracking
  source, campaign_id, utm_source, utm_medium, utm_campaign,
  // Creator-specific
  daw, audience_size,
  // Revenue tracking
  product_id, amount_cents, currency,
  // Experiments
  experiment_id, variant,
  // Error tracking
  error_code, error_message,
}
```

#### New Tables Created

**`creatorPipeline`** - CRM tracking for creators
```typescript
{
  userId, storeId, stage,
  // Stages: prospect → invited → signed_up → drafting → published → first_sale → active
  // Timestamps for each stage
  prospectAt, invitedAt, signedUpAt, draftingAt, publishedAt, firstSaleAt,
  // Outreach tracking
  lastTouchAt, lastTouchType, nextStepNote, assignedTo,
  // Creator metadata
  daw, instagramHandle, tiktokHandle, audienceSize, niche,
  // Stats
  totalRevenue, productCount, enrollmentCount
}
```

**`campaigns`** - Marketing campaign tracking
```typescript
{
  name, type, status,
  // Targeting
  targetRole, targetSegment,
  // Content
  subject, body, ctaText, ctaUrl,
  // Scheduling
  scheduledAt, sentAt,
  // Results
  sentCount, deliveredCount, openedCount, clickedCount, bouncedCount, convertedCount
}
```

**`experiments`** - A/B test tracking
```typescript
{
  name, hypothesis, metric, startDate, endDate, status,
  // Variants
  variantA: { name, description, ctaText, ctaUrl, assetUrl },
  variantB: { name, description, ctaText, ctaUrl, assetUrl },
  // Results
  variantAViews, variantAConversions, variantBViews, variantBConversions, winner
}
```

---

### 2. Shared Query Functions

#### `convex/analytics/kpis.ts`
**Functions created:**
- ✅ `getKPIs(startTime, endTime, storeId?)` - Returns KPIs scoped to creator or platform-wide
  - New signups
  - Creator signups
  - Learner activation rate
  - Creator activation rate
  - Total revenue
  - Email health (sent, delivered, bounced, bounce rate)
  - Traffic sources (Instagram, TikTok, email, direct)

- ✅ `getQuickStats(storeId?)` - Quick dashboard stats
  - Total users/students
  - Total courses/products
  - Total revenue
  - Active campaigns

**Key Feature:** Optional `storeId` parameter allows same query to work for:
- Creator dashboard: Pass `storeId` → see only their data
- Admin dashboard: Omit `storeId` → see platform-wide data

---

#### `convex/analytics/funnels.ts`
**Functions created:**
- ✅ `getLearnerFunnel(startTime, endTime, storeId?)` - Learner conversion funnel
  - Steps: Visit → Signup → Enroll → Return Week 2
  - Returns: count, conversion rate, drop-off for each step

- ✅ `getCreatorFunnel(startTime, endTime)` - Creator conversion funnel
  - Steps: Visit → Start Creator Flow → Publish → First Sale
  - Returns: count, conversion rate, stuck creators list

- ✅ `getStuckUsers(funnelType, step, daysStuck)` - Find users stuck at funnel steps
  - Returns users who haven't progressed after X days

**Usage Example:**
```typescript
// Creator sees their own funnel
const myFunnel = useQuery(api.analytics.funnels.getLearnerFunnel, {
  startTime, endTime, storeId: "my-store-id"
});

// Admin sees platform-wide funnel
const platformFunnel = useQuery(api.analytics.funnels.getLearnerFunnel, {
  startTime, endTime // No storeId = all creators
});
```

---

#### `convex/analytics/creatorPipeline.ts`
**Functions created:**
- ✅ `getCreatorsByStage(stage?)` - Get creators in pipeline, optionally filtered by stage
- ✅ `getStuckCreators()` - Find creators needing outreach (3+ days stuck)
- ✅ `updateCreatorStage(creatorId, newStage, note?)` - Move creator through pipeline
- ✅ `addCreatorTouch(creatorId, touchType, note?)` - Log outreach touchpoint
- ✅ `upsertCreatorPipeline(userId, storeId, stage, metadata)` - Create/update pipeline entry
- ✅ `getPipelineStats()` - Get counts by stage (for Kanban board)

**Usage Example:**
```typescript
// Get all creators in "drafting" stage
const draftingCreators = useQuery(api.analytics.creatorPipeline.getCreatorsByStage, {
  stage: "drafting"
});

// Find stuck creators who need help
const stuckCreators = useQuery(api.analytics.creatorPipeline.getStuckCreators, {});
```

---

### 3. Enhanced Analytics Hook (`hooks/useAnalytics.ts`)

**New tracking methods added:**
```typescript
const analytics = useAnalytics();

// Creator funnel tracking
analytics.trackCreatorStarted({ daw: "Ableton Live", audience_size: 5000 });
analytics.trackCreatorPublished(courseId, "course");
analytics.trackFirstSale(productId, 2900, "USD"); // $29.00

// Campaign tracking
analytics.trackCampaignView("camp_001", "variantA");
analytics.trackCTAClick("camp_001", "/checkout", "variantA");

// Email tracking
analytics.trackEmailEvent("email_opened", "camp_001");

// Error tracking
analytics.trackError("PAYMENT_FAILED", "Stripe card declined");
```

---

## 📊 Architecture Decisions

### 1. Optional `storeId` Pattern
All shared queries accept optional `storeId`:
- ✅ **Present**: Filter to single creator (for `/store/analytics`)
- ✅ **Absent**: Platform-wide data (for `/admin/analytics`)

### 2. Real-Time Reactive Queries
Using Convex's reactive queries means dashboards auto-update when:
- New events are tracked
- Creator stages change
- Campaigns are sent
- Sales happen

**No polling required!** 🎉

### 3. Indexed for Performance
All tables have proper indexes:
- `by_timestamp` - For time-range queries
- `by_storeId` - For creator-scoped queries
- `by_eventType` - For event filtering
- `by_stage_and_updatedAt` - For pipeline queries

---

## 🎯 Next Steps

### Phase 2A: Build Creator Dashboard (`/store/analytics`)
**File:** `app/(dashboard)/home/analytics/page.tsx`

Add these components:
1. **My Funnel Card** - Use `getLearnerFunnel` with creator's `storeId`
2. **My KPIs** - Use `getKPIs` with creator's `storeId`
3. **My Campaigns** - Filter campaigns by creator
4. **My Students At Risk** - Existing + funnel insights

**Example:**
```typescript
// app/(dashboard)/home/analytics/page.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CreatorAnalytics() {
  const store = useQuery(api.stores.getMyStore);
  const kpis = useQuery(api.analytics.kpis.getKPIs, {
    startTime, endTime,
    storeId: store?._id // ✅ Scoped to creator
  });
  
  return <div>My Analytics: {kpis?.totalRevenue}</div>;
}
```

---

### Phase 2B: Build Admin Dashboard (`/admin/analytics`)
**File:** `app/admin/analytics/page.tsx`

Create these components:
1. **Platform KPIs** - Use `getKPIs` without `storeId`
2. **Dual Funnels** - Learner + Creator side-by-side
3. **Creator Pipeline** - Kanban board with `getCreatorsByStage`
4. **System Health** - Error monitoring
5. **Stuck Creators** - Use `getStuckCreators` for outreach list

**Example:**
```typescript
// app/admin/analytics/page.tsx
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminAnalytics() {
  const kpis = useQuery(api.analytics.kpis.getKPIs, {
    startTime, endTime
    // ✅ No storeId = platform-wide
  });
  
  const stuckCreators = useQuery(api.analytics.creatorPipeline.getStuckCreators, {});
  
  return (
    <div>
      <h1>Platform KPIs</h1>
      <p>Total Revenue: ${kpis?.totalRevenue}</p>
      <p>Stuck Creators: {stuckCreators?.length}</p>
    </div>
  );
}
```

---

## 🔗 Integration Points

### Where to Add Event Tracking

**1. Creator Started** (`creator_started`)
```typescript
// When user clicks "Become a Creator" or completes store setup
analytics.trackCreatorStarted({ daw: userDaw, audience_size: userFollowers });
```

**2. Creator Published** (`creator_published`)
```typescript
// When first course/product is published
analytics.trackCreatorPublished(courseId, "course");

// Also update creator pipeline
await updateCreatorStage({ creatorId, newStage: "published" });
```

**3. First Sale** (`first_sale`)
```typescript
// In Stripe webhook handler after first successful payment to creator
analytics.trackFirstSale(productId, amountCents, "USD");

// Also update creator pipeline
await updateCreatorStage({ creatorId, newStage: "first_sale" });
```

**4. Email Events**
```typescript
// In Resend webhook handlers
analytics.trackEmailEvent("email_delivered", campaignId);
analytics.trackEmailEvent("email_bounced", campaignId);
```

---

## 📈 Sample Queries

### Get Creator's Last 7 Days Performance
```typescript
const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
const kpis = useQuery(api.analytics.kpis.getKPIs, {
  startTime: last7Days,
  endTime: Date.now(),
  storeId: myStoreId
});
```

### Get All Stuck Creators (Admin Only)
```typescript
const stuck = useQuery(api.analytics.creatorPipeline.getStuckCreators, {});
// Returns creators stuck 3+ days with recommended actions
```

### Get Platform-Wide Learner Funnel
```typescript
const funnel = useQuery(api.analytics.funnels.getLearnerFunnel, {
  startTime,
  endTime
  // No storeId = all creators combined
});
```

---

## 🧪 Testing the Foundation

### 1. Seed Test Events
Create a mutation to backfill test data:
```typescript
// convex/admin/seedTestAnalytics.ts
export const seedTestAnalytics = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    
    // Create test creator started event
    await ctx.db.insert("analyticsEvents", {
      userId: "test_creator_1",
      eventType: "creator_started",
      metadata: { daw: "FL Studio", audience_size: 2500 },
      timestamp: now - (10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    
    // Create test published event
    await ctx.db.insert("analyticsEvents", {
      userId: "test_creator_1",
      eventType: "creator_published",
      resourceId: "test_course_1",
      timestamp: now - (5 * 24 * 60 * 60 * 1000), // 5 days ago
    });
    
    return { success: true };
  },
});
```

### 2. Verify Queries Work
```typescript
// Test in Convex dashboard
const kpis = await ctx.runQuery(api.analytics.kpis.getKPIs, {
  startTime: Date.now() - (30 * 24 * 60 * 60 * 1000),
  endTime: Date.now(),
});
console.log(kpis); // Should show test data
```

---

## 🎨 UI Components to Build Next

### Creator Dashboard Components
- `<MyFunnelCard />` - Conversion funnel visualization
- `<MyKPIsGrid />` - 4 KPI cards (revenue, students, conversion, growth)
- `<MyCampaignsTable />` - Campaign performance table
- `<MyExperimentsCard />` - A/B tests running

### Admin Dashboard Components
- `<KPIOverview />` - Platform KPIs with time window toggle
- `<FunnelVisualization />` - Dual funnel charts
- `<CreatorPipelineBoard />` - Kanban board
- `<StuckCreatorsAlert />` - Alert card with action buttons
- `<SystemHealthIndicators />` - Error rate, email health, webhooks

---

## 📚 File Summary

### Files Modified:
- ✅ `convex/schema.ts` - Added 3 new tables, enhanced analyticsEvents
- ✅ `hooks/useAnalytics.ts` - Added 7 new tracking methods

### Files Created:
- ✅ `convex/analytics/kpis.ts` - KPI queries (2 functions)
- ✅ `convex/analytics/funnels.ts` - Funnel queries (3 functions)
- ✅ `convex/analytics/creatorPipeline.ts` - Pipeline queries (6 functions)

### Total Lines Added: ~1,200 lines of production-ready code

---

## 🚀 Ready to Build Dashboards!

The shared foundation is complete. You can now:

1. **Build creator analytics** at `/store/analytics` using these queries with `storeId`
2. **Build admin dashboard** at `/admin/analytics` using these queries without `storeId`
3. **Track new events** throughout your app using the enhanced `useAnalytics` hook

**Both dashboards will share the same data layer while showing different scopes!** 🎯

---

## 💡 Quick Start Commands

### Deploy Schema Changes
```bash
npx convex dev
# Schema will auto-push on save
```

### Test Queries in Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Navigate to Functions tab
3. Run `analytics:kpis:getKPIs` with test parameters
4. Verify it returns data

### Add Tracking to Store Setup
```typescript
// In your store creation flow
import { useAnalytics } from "@/hooks/useAnalytics";

const analytics = useAnalytics();

// When store is created
await analytics.trackCreatorStarted({
  daw: formData.daw,
  audience_size: formData.followers
});
```

---

**Next:** Ready to build Phase 2A (Creator Dashboard) or Phase 2B (Admin Dashboard)?

Let me know which one you'd like to tackle first! 🚀

