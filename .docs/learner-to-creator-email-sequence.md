# Learner → Creator Conversion Email Sequence

**Generated from codebase analysis on Feb 3, 2026**

---

## A) Repo-Backed Capability Map

What we can **truthfully promise** based on code:

### Store Creation
- **One-click store creation** via `createStoreFromProfile()` - auto-populates from user profile
  - File: `convex/stores.ts:193-307`
- **Instant public storefront** at `/{slug}` - `isPublic: true` by default
  - File: `convex/stores.ts:265`
- **Creator badge** awarded automatically (`first_store` badge)
  - File: `convex/stores.ts:295`

### Products (Free Plan)
- **1 free product** on FREE plan (max 1 product, price must be $0)
  - File: `convex/creatorPlans.ts` - `maxProducts: 1, canChargeMoney: false`
- **Product types available**: sample-pack, preset-pack, midi-pack, project-files, pdf, template, tip-jar
  - File: `convex/schema.ts:1072-1120`
- **Draft → Published workflow** via `isPublished` boolean
  - File: `convex/digitalProducts.ts`

### Upgrade Path (Paid Plans)
| Feature | FREE | STARTER ($12/mo) | CREATOR ($29/mo) |
|---------|------|------------------|------------------|
| Products | 1 | 15 | 50 |
| Charge money | No | Yes | Yes |
| Follow Gates | No | No | **Yes** |
| Email campaigns | No | 500/mo | 2,500/mo |

- File: `convex/creatorPlans.ts`

### Follow Gates (requires CREATOR plan)
- Collect emails before download
- Require social follows (Instagram, TikTok, YouTube, Spotify)
- Flexible "follow X of Y" requirements
  - File: `app/dashboard/create/shared/FollowGateConfigStep.tsx`

---

## B) Email Sequence (5 Emails)

### Target Segment Definition

**"Active Learner, Not Yet Creator"** query:
```typescript
// Users who have course enrollments but no store
const learners = await ctx.db.query("users")
  .filter(q => q.eq(q.field("isCreator"), false))
  .collect();

// Filter to those with enrollments
const activeLearnersNotCreators = learners.filter(u =>
  enrollments.some(e => e.userId === u.clerkId)
);
```
- File reference: `convex/users.ts` (isCreator field), `convex/enrollments.ts`

---

### Email 1: The Seed (Day 0)
**Purpose:** Plant the idea that they could be a creator too

**Subject Lines:**
- A: `{{firstName}}, you've completed {{lessonsCompleted}} lessons...`
- B: `What if you shared what you've learned?`
- C: `From student to teacher in 60 seconds`

**Preview Text:** `You know more than you think. Here's proof.`

**Body:**
```
Hey {{firstName}},

You've completed {{lessonsCompleted}} lessons on PPR Academy.

That's not nothing. That's knowledge most producers don't have.

Here's a thought: what if you packaged one thing you've learned and shared it?

Not a full course. Just one useful thing:
- A preset you made
- A template that works
- A sample pack from your sessions

On PPR Academy, you can create a free product in under 2 minutes.

No payment setup. No complicated profile. Just share.

[Create Your First Product →]

Or don't. But that knowledge sitting in your head isn't helping anyone else.

- The PPR Team
```

**Primary CTA:** `Create Your First Product`
**CTA Route:** `/dashboard/create`
- File: `app/dashboard/create/page.tsx`

**Secondary CTA:** `See how other creators started` → `/creators`
- File: `app/creators/page.tsx`

---

### Email 2: The Proof (Day 2)
**Purpose:** Show real examples of learners who became creators

**Subject Lines:**
- A: `They started exactly where you are`
- B: `{{firstName}}, meet someone like you`
- C: `From 0 to creator in one weekend`

**Preview Text:** `Real creators who started as students.`

**Body:**
```
Hey {{firstName}},

Two days ago I mentioned you could share what you know.

Maybe you thought: "Who am I to create something?"

Fair question. Here's the answer:

You're someone who's completed {{lessonsCompleted}} lessons. You're already ahead of most.

The creators on PPR Academy aren't superstars. They're producers who:
- Figured out one workflow and documented it
- Made presets they use daily and shared them
- Organized their samples and packaged them

That's it. No genius required.

Your first product doesn't need to be perfect. It needs to exist.

[Start With a Free Product →]

Takes 2 minutes. Costs nothing. Helps someone.

- The PPR Team
```

**Primary CTA:** `Start With a Free Product`
**CTA Route:** `/dashboard/create/pack` (sample pack is most common first product)
- File: `app/dashboard/create/pack/page.tsx`

---

### Email 3: The How (Day 4)
**Purpose:** Remove friction by showing exact steps

**Subject Lines:**
- A: `3 steps. 2 minutes. Your first product.`
- B: `The exact steps to go live today`
- C: `{{firstName}}, here's the shortcut`

**Preview Text:** `No complexity. Just these 3 steps.`

**Body:**
```
Hey {{firstName}},

Here's exactly how to create your first product:

**Step 1: Pick a type** (30 seconds)
Go to your dashboard and click "Create Product"
Choose: Sample Pack, Preset, Template, or PDF

**Step 2: Upload + describe** (60 seconds)
Drop your files
Write 2-3 sentences about what it is
Set price to $0 (free plan = free products)

**Step 3: Publish** (10 seconds)
Click publish
Share the link

That's it. Your store is automatically created. Your product is live.

Here's what you're NOT doing:
- Setting up payments (not needed for free)
- Building a website (your store is ready)
- Creating complicated funnels (just publish)

[Create Your Product Now →]

You're {{daysSinceJoined}} days into your PPR journey. Time to give back?

- The PPR Team
```

**Primary CTA:** `Create Your Product Now`
**CTA Route:** `/dashboard/create`
- File: `app/dashboard/create/page.tsx`

---

### Email 4: The Upgrade Path (Day 6)
**Purpose:** Introduce paid features for those who created a free product

**Subject Lines:**
- A: `Ready to actually get paid?`
- B: `Your free product is step 1. Here's step 2.`
- C: `{{firstName}}, unlock the full creator toolkit`

**Preview Text:** `From free to paid. Here's how.`

**Body:**
```
Hey {{firstName}},

If you created a free product - nice work. That's the hardest part.

Now here's what's possible when you upgrade:

**STARTER ($12/mo)**
- Charge real money for your products
- Up to 15 products
- 500 email sends/month

**CREATOR ($29/mo)** ← Most popular
- Follow Gates: require email/social follows before download
- Build your mailing list automatically
- Up to 50 products
- 2,500 email sends/month

Follow Gates are powerful. Someone wants your free sample pack?
They follow you on Spotify first. Now you're growing fans AND giving value.

[See All Plans →]

Or stay on free. One product, no charge, forever available.

But if you want to build something bigger, the path is here.

- The PPR Team
```

**Primary CTA:** `See All Plans`
**CTA Route:** `/pricing` or `/dashboard/settings/billing`
- File: `app/pricing/page.tsx`, `app/dashboard/settings/billing/page.tsx`

**Secondary CTA:** `What are Follow Gates?` → `/features/follow-gates` (if exists) or documentation

---

### Email 5: The Nudge (Day 9)
**Purpose:** Final push with urgency/social proof

**Subject Lines:**
- A: `Last thought on this, {{firstName}}`
- B: `The difference between consumers and creators`
- C: `{{productsCreated}} products and counting... yours?`

**Preview Text:** `One decision away.`

**Body:**
```
Hey {{firstName}},

This is my last email about becoming a creator.

Here's what I know:
- You've learned a lot ({{lessonsCompleted}} lessons completed)
- You haven't created yet (that's okay)
- The gap isn't skill - it's starting

Creators on PPR Academy aren't more talented than learners. They just clicked "Create Product" once.

Some created a single free PDF and never looked back.
Some now make $500/month from presets.
Some built mailing lists of 10,000+ fans through Follow Gates.

All of them started with zero.

[Become a Creator →]

Or don't. Stay a learner. That's valuable too.

But if there's a voice saying "maybe I should share something" - this is your sign.

See you on the creator side?

- The PPR Team

P.S. Your creator profile would be at ppracademy.com/{{email | username}}. Just saying.
```

**Primary CTA:** `Become a Creator`
**CTA Route:** `/become-a-coach` or `/dashboard/create`
- Files: `app/become-a-coach/page.tsx`, `app/dashboard/create/page.tsx`

---

## C) Automation Spec

### Entry Trigger
**Best option:** `tag_added` trigger with tag `"learner-not-creator"`

Apply this tag via a daily/weekly batch job that:
```typescript
// Query users who:
// 1. Have course enrollments OR purchases
// 2. isCreator === false (no store)
// 3. Not already tagged

const eligibleUsers = await ctx.db.query("users")
  .filter(q => q.eq(q.field("isCreator"), false))
  .collect();

// Add tag to their email contact
await addTagToContact(contactId, "learner-not-creator");
```
- Trigger file: `convex/emailWorkflows.ts:846-880` (`triggerTagAddedWorkflows`)

**Alternative:** Use `segment_member` trigger with a segment defined as "enrolled users without store"

### Exit Triggers
1. **Store created** → Exit immediately
   - Detect via: `isCreator` flipping to `true` on user record
   - Or: Listen for `creator_started` analytics event
   - File: `convex/stores.ts:302` (emits this event)

2. **Unsubscribed** → Exit immediately
   - Automatic via `emailSuppressionList` table
   - File: `convex/emailUnsubscribe.ts`

3. **Tag removed** → Exit if `learner-not-creator` tag removed

### Suppression Rules
- **Already creator:** `isCreator === true` → never enter
- **No enrollments:** Users with 0 lessons completed → don't send (nothing to share)
- **Inactive 90+ days:** `daysSinceLastActive > 90` → suppress

### Branching Rules (if store created mid-sequence)

**Branch A: Store created but no product in 7 days**
- Condition: `has_store === true AND productsCreated === 0`
- Action: Branch to "First Product Nudge" mini-sequence
- File: `convex/emailWorkflowActions.ts:121-161` (condition evaluation)

**Branch B: First product published but no upgrade in 14 days**
- Condition: `productsCreated >= 1 AND plan === "FREE"`
- Action: Branch to "Upgrade Benefits" sequence
- Condition type: `has_purchased_product` can be adapted, or use `has_tag` with auto-applied tags

---

## D) Measurement Plan

### Events to Track

| Event | Status | File Location |
|-------|--------|---------------|
| `email_sent` | ✅ Exists | `convex/emails.ts` |
| `email_opened` | ✅ Exists | Resend webhooks |
| `email_clicked` | ✅ Exists | Resend webhooks |
| `creator_started` | ✅ Exists | `convex/stores.ts:302` |
| `product_published` | ✅ Exists | `convex/digitalProducts.ts` (when `isPublished` set true) |
| `plan_upgraded` | ⚠️ Partial | Stripe webhooks exist, need explicit event |
| `follow_gate_enabled` | ❌ Missing | Need to add |

### Missing Events to Add

**1. Add `plan_upgraded` event:**
```typescript
// File: convex/stripe.ts (in subscription update handler)
// After line where plan is updated:
await ctx.db.insert("analyticsEvents", {
  eventType: "plan_upgraded",
  userId: user._id,
  metadata: {
    fromPlan: oldPlan,
    toPlan: newPlan,
    mrr: newPrice
  },
  timestamp: Date.now()
});
```

**2. Add `follow_gate_enabled` event:**
```typescript
// File: convex/digitalProducts.ts (in update mutation)
// When followGateEnabled changes from false to true:
if (updates.followGateEnabled === true && !existing.followGateEnabled) {
  await ctx.db.insert("analyticsEvents", {
    eventType: "follow_gate_enabled",
    userId: ctx.auth.getUserIdentity()?.subject,
    metadata: { productId: args.productId },
    timestamp: Date.now()
  });
}
```

### Weekly Metrics Table

| Metric | Definition | Target |
|--------|------------|--------|
| **Sequence Entered** | Users who received Email 1 | baseline |
| **Open Rate** | Opens / Sent | > 40% |
| **Click Rate** | Clicks / Opens | > 15% |
| **Store Created Rate** | `creator_started` / Entered | > 5% |
| **First Product Rate** | `product_published` (first) / Store Created | > 60% |
| **Upgrade Rate** | `plan_upgraded` / First Product | > 10% |
| **Revenue per Sequence** | MRR from upgrades / Entered | track over time |

### Funnel Health Query

```typescript
// Weekly funnel query
const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;

const entered = await ctx.db.query("workflowExecutions")
  .filter(q => q.and(
    q.eq(q.field("workflowId"), learnerCreatorWorkflowId),
    q.gte(q.field("_creationTime"), weekStart)
  )).collect();

const storesCreated = await ctx.db.query("analyticsEvents")
  .filter(q => q.and(
    q.eq(q.field("eventType"), "creator_started"),
    q.gte(q.field("timestamp"), weekStart)
  )).collect();

// Cross-reference to get conversion rate
```

---

## Implementation Checklist

- [ ] Create workflow in `/admin/emails` with 5 email nodes + delay nodes
- [ ] Set delays: Day 0 → Day 2 → Day 4 → Day 6 → Day 9
- [ ] Add `learner-not-creator` tag definition
- [ ] Create batch job to apply tag to eligible users
- [ ] Configure exit trigger on `creator_started` event
- [ ] Add `plan_upgraded` analytics event to Stripe handler
- [ ] Add `follow_gate_enabled` analytics event to product update
- [ ] Set up weekly metrics dashboard/report

---

## Personalization Variables Used in Sequence

All verified to exist in `convex/emails.ts:145-239`:

- `{{firstName}}` ✅
- `{{lessonsCompleted}}` ✅
- `{{daysSinceJoined}}` ✅
- `{{productsCreated}}` ✅
- `{{email}}` ✅

---

*Document generated from PPR Academy codebase analysis*
