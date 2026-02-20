# User Types & Permissions

> **Last Updated:** 2026-02-19
> **Pass:** 1 — Foundation

---

## Table of Contents

- [1. User Type Overview](#1-user-type-overview)
- [2. Learner (Learn Mode)](#2-learner-learn-mode)
- [3. Creator (Create Mode)](#3-creator-create-mode)
- [4. Hybrid User](#4-hybrid-user)
- [5. Platform Admin](#5-platform-admin)
- [6. Affiliate](#6-affiliate)
- [7. Role Switching Mechanism](#7-role-switching-mechanism)
- [8. Onboarding Flows](#8-onboarding-flows)
- [9. Subscription Tiers](#9-subscription-tiers)
- [10. Permission Matrix](#10-permission-matrix)

---

## 1. User Type Overview

PPR Academy has a fluid user model. Rather than rigid, mutually exclusive roles, users exist on a spectrum:

```
New User → Learner → Hybrid (Learner + Creator) → Full Creator
                ↓                                      ↑
            Admin (overlays any user type)              │
                                                       │
            Affiliate (overlays any user type) ────────┘
```

### Database Representation (`users` table)

```typescript
{
  clerkId: string,              // Primary identifier (from Clerk)
  email: string,
  name: string,

  // Role flags
  admin: boolean,               // Platform admin
  isCreator: boolean,           // Has created a store
  dashboardPreference: "learn" | "create",  // Current mode

  // Agency roles (future/partial)
  role: "AGENCY_OWNER" | "AGENCY_ADMIN" | "SUBACCOUNT_USER" | "SUBACCOUNT_GUEST",

  // Creator progression
  creatorLevel: number,         // 1-10+
  creatorXP: number,
  creatorBadges: string[],
  creatorSince: number,

  // Stripe Connect
  stripeConnectAccountId: string,
  stripeAccountStatus: "pending" | "restricted" | "enabled",
  stripeOnboardingComplete: boolean,
}
```

## 2. Learner (Learn Mode)

### Who They Are
Users who selected "I want to learn" during onboarding or users who have not yet created a store.

### Capabilities

| Action | Access |
|--------|--------|
| Browse marketplace | Public |
| Enroll in free courses | Requires account |
| Purchase courses / products | Requires account + payment |
| Track course progress | Requires enrollment |
| Complete quizzes | Requires enrollment |
| Earn certificates | Requires course completion |
| Submit Q&A questions | Requires enrollment |
| Take timestamped notes | Requires enrollment |
| Download purchased products | Requires purchase |
| Browse sample marketplace | Requires account |
| Purchase credits | Requires account |
| Send/receive messages | Requires account |
| View leaderboards | Public |

### Learner Preferences (onboarding data)

```typescript
{
  skillLevel: "beginner" | "intermediate" | "advanced",
  interests: string[],  // ["mixing", "mastering", "sound_design"]
  goal: "hobby" | "career" | "skills" | "certification",
  weeklyHours: number,
}
```

### Dashboard Navigation (Learn Mode)
- Dashboard (overview)
- My Courses (enrolled courses)
- My Products (purchased digital products)
- Downloads
- My Samples
- My Sessions (coaching)
- Messages
- My Notes
- My Memberships
- Certificates

## 3. Creator (Create Mode)

### Who They Are
Users who created a store. The `isCreator` flag is set to `true` and `creatorSince` timestamp is recorded.

### Store Setup
Each creator gets exactly one `store` record with:
- Custom slug (`/[slug]`)
- Optional custom domain
- Creator plan tier (determines feature access)
- Email configuration
- Stripe Connect account (for payouts)

### Capabilities

| Action | Access |
|--------|--------|
| All learner capabilities | Inherited |
| Create/manage store | Requires store |
| Create/publish courses | Requires store |
| Create/sell digital products | Requires store |
| Manage beat leases | Requires store |
| Run email campaigns | Requires store + email config |
| Build email automations | Requires store |
| Manage contacts/subscribers | Requires store |
| View analytics | Requires store |
| Set up affiliates | Requires store |
| Publish social media content | Requires store + OAuth connections |
| Create landing pages | Requires store |
| Manage memberships | Requires store |
| Offer coaching sessions | Requires store |
| Run marketing campaigns | Requires store |
| Access AI content tools | Requires store |
| Configure follow gates | Requires store |

### Creator Progression System

Creators earn XP and level up through:
- Creating courses
- Publishing products
- Making sales
- Growing subscriber lists
- Completing platform milestones

Levels unlock badges and are displayed on profiles/storefronts.

### Dashboard Navigation (Create Mode)
**Core:** Dashboard, Create Course, Create Product, New Beat
**Growth:** Analytics, Affiliates, Marketing, Referrals
**Content:** Courses, Products, Samples, Notes, Team
**Monetization:** Payments, Pricing, Memberships, Coaching
**Management:** Settings, Integrations, Messages

## 4. Hybrid User

### Who They Are
Users who have both:
- At least one enrollment (learner activity)
- At least one store (creator activity)

### Special UI Treatment
- Mode switcher dropdown is visible in the sidebar
- "Become a Creator" button is hidden (already a creator)
- Can toggle between learn and create modes
- Default mode preference is persisted

## 5. Platform Admin

### How Admin Status Is Determined

Admin access is checked through multiple sources (in priority order):

1. **ADMIN_EMAILS environment variable** — Email-based allowlist
2. **Clerk public metadata** — `isAdmin: true` or `role: "admin"`
3. **Clerk private metadata** — `role: "admin"`
4. **Convex `admin` field** — `users.admin === true`

### Admin Role Hierarchy

```
admin > AGENCY_OWNER > AGENCY_ADMIN > MODERATOR
```

### Admin Capabilities

| Area | Actions |
|------|---------|
| **Users** | View all users, make admin, manage roles |
| **Courses** | View all courses, generate courses with AI, manage content |
| **Products** | View all products, moderate content |
| **Finance** | Revenue overview, payout management, conversion tracking |
| **Email** | Platform-wide email campaigns, deliverability monitoring, suppression management |
| **AI** | AI flywheel management, content generation, embeddings |
| **Analytics** | Platform metrics, user growth, category distribution |
| **Moderation** | DMCA reports, copyright strikes, store suspensions |
| **System** | Settings, database management, sync operations, migrations |
| **Creators** | Creator management, approval workflows (coaching profiles) |

### Admin Route Protection

All routes under `/admin/*` are protected by:
1. Clerk middleware (authentication)
2. `requireAdmin()` function in API routes
3. Server-side admin checks in page components

### Admin Dashboard Pages (30+)

Activity, AI management, AI flywheel, Analytics, Changelog, Communications, Content generation, Conversions, Course builder, Courses, Creators, Drip campaigns, Email analytics, Email monitoring, Emails, Embeddings, Feature discovery, Finance, Lead magnets, Management, Migrations, Moderation, Notifications, Plugins, Products, Revenue, Settings (5 sub-pages), Sync, Users

## 6. Affiliate

### How It Works
- Users apply for the affiliate program via `/affiliate/apply`
- Approved affiliates get a unique referral code
- Affiliates earn commission on referred sales
- Tracked via `affiliates` and `referrals` tables

### Capabilities
- View affiliate dashboard (`/affiliate/dashboard`)
- Track clicks, sales, and earnings
- Access referral links
- View payout information

### Affiliate Fields

```typescript
{
  affiliateCode: string,
  storeId: string,
  status: "pending" | "approved" | "rejected",
  commissionRate: number,
  totalClicks: number,
  totalSales: number,
  totalEarnings: number,
  payoutStatus: string,
}
```

## 7. Role Switching Mechanism

### Mode Toggle Flow

```
User clicks mode toggle
    ↓
Set URL param (?mode=learn|create)
    ↓
Set localStorage (dashboard-mode)
    ↓
Call Convex mutation (users.updateDashboardPreference)
    ↓
Sidebar re-renders with mode-specific navigation
    ↓
Dashboard content switches to mode-specific view
```

### Mode Resolution Priority

1. **URL query parameter** `?mode=learn` or `?mode=create`
2. **localStorage** key `dashboard-mode`
3. **Convex user preference** `user.dashboardPreference`
4. **Auto-detection**: Has stores → `create`, has enrollments → `learn`
5. **Fallback**: Redirect to `/onboarding`

### Conversion Nudges (Learner → Creator)

The platform includes contextual nudges to encourage learners to become creators:

| Trigger Point | Nudge |
|---------------|-------|
| First course enrolled | Subtle "You could teach this" prompt |
| 5+ lessons completed | "Share your progress" prompt |
| Course completed | "Ready to teach?" modal |
| Certificate earned | "Showcase credentials" CTA |
| Expert level (L8+) | "Your expertise is valuable" prompt |
| Viewed 3+ creator profiles | "Start your store" banner |
| Leaderboard visit | "Join Top Creators" CTA |
| BecomeCreatorCard component | Shows at multiple touchpoints |

## 8. Onboarding Flows

### New User Onboarding

```
Sign up (Clerk)
    ↓
/onboarding page
    ↓
Choose: "I want to learn" | "I want to create & sell"
    ↓
Learner path:                Creator path:
  - Skill level select         - Store creation
  - Interests multi-select     - Store name & slug
  - Goal selection             - Stripe Connect setup
  - Weekly hours               - Email configuration
    ↓                             ↓
Set dashboardPreference       Set isCreator = true
    ↓                         Set creatorSince
Redirect to /dashboard?mode=learn    ↓
                              Redirect to /dashboard?mode=create
```

### Components
- `LearnerOnboarding.tsx` — Multi-step learner preference collector
- `getting-started-modal.tsx` — First-time user guide
- `onboarding-hints.tsx` — Contextual hints for new users

### Creator Onboarding (from Learner)
When a learner decides to become a creator:
1. Click "Become a Creator" in sidebar
2. Create a store (name, slug, description)
3. Set up Stripe Connect for payouts
4. Configure email sender
5. `isCreator` flag set, `creatorSince` timestamp recorded

## 9. Subscription Tiers

### PPR Pro (Learner Subscription)

Platform-wide learner membership providing access to all courses.

| Plan | Price | Access |
|------|-------|--------|
| Monthly | Dynamic (from DB) | All published courses |
| Yearly | Dynamic (from DB) | All published courses |

Tables: `pprProPlans`, `pprProSubscriptions`

### Creator Plans (SaaS Tiers)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic link-in-bio only |
| **Starter** | $12/mo | Entry tier — basic store |
| **Creator** | $29/mo | Most features — standard tier |
| **Creator Pro** | $79/mo | Power user features |
| **Business** | $149/mo | Team features |
| **Early Access** | Free | Grandfathered unlimited (legacy) |

Managed via `stores.plan` field with Stripe subscription tracking.

### Creator-Specific Subscription Tiers (Patreon-style)

Creators can define their own subscription tiers for fans/students:

```typescript
{
  tierName: string,       // "Basic", "Pro", "VIP"
  priceMonthly: number,
  priceYearly: number,
  benefits: string[],
  maxCourses: number,     // null = unlimited
  trialDays: number,
}
```

Tables: `creatorSubscriptionTiers`, `userCreatorSubscriptions`

## 10. Permission Matrix

| Action | Unauthenticated | Learner | Creator | Admin |
|--------|:-:|:-:|:-:|:-:|
| Browse marketplace | Y | Y | Y | Y |
| View course details | Y | Y | Y | Y |
| Enroll in course | — | Y | Y | Y |
| Track progress | — | Y | Y | Y |
| Purchase products | — | Y | Y | Y |
| Create store | — | Y* | Y | Y |
| Publish courses | — | — | Y | Y |
| Sell products | — | — | Y | Y |
| Send email campaigns | — | — | Y | Y |
| View creator analytics | — | — | Y | Y |
| Access admin panel | — | — | — | Y |
| Manage users | — | — | — | Y |
| Platform email campaigns | — | — | — | Y |
| Financial overview | — | — | — | Y |
| Content moderation | — | — | — | Y |

*Learners can become creators by creating a store (transitions them to hybrid user)

---

*NEEDS EXPANSION IN PASS 2: Detailed permission checks per Convex function, store-level access control patterns (requireStoreOwner), agency/team role implementation status, copyright strike escalation flow.*
