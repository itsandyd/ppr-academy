# PPR Academy Architecture

## Overview

PPR Academy is a multi-tenant music production learning platform built with Next.js 15, Convex (real-time backend), and a microservices-inspired architecture.

## Multi-Tenant Pattern

### Store-Based Tenancy

Each creator has a **Store** that acts as their tenant boundary:

```
┌─────────────────────────────────────────────────────────┐
│                    PPR Academy                          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Store A    │  │   Store B    │  │   Store C    │  │
│  │ (Creator 1)  │  │ (Creator 2)  │  │ (Creator 3)  │  │
│  │              │  │              │  │              │  │
│  │ - Courses    │  │ - Courses    │  │ - Courses    │  │
│  │ - Products   │  │ - Products   │  │ - Products   │  │
│  │ - Customers  │  │ - Customers  │  │ - Customers  │  │
│  │ - Analytics  │  │ - Analytics  │  │ - Analytics  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Tables

- **stores**: Creator storefronts with branding, custom domains, settings
- **courses**: Linked to store via `storeId` and creator via `userId`
- **digitalProducts**: All products linked to stores
- **customers**: Scoped per store (a user can be a customer of multiple stores)
- **purchases**: Track transactions per store for revenue splitting

### Data Isolation

Queries filter by `storeId` to ensure data isolation:

```typescript
// Example: Get products for a specific store
const products = await ctx.db
  .query("digitalProducts")
  .withIndex("by_storeId", q => q.eq("storeId", storeId))
  .collect();
```

## Directory Structure

```
ppr-academy/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Creator dashboard (protected)
│   │   ├── home/           # Creator home/analytics
│   │   ├── music/          # Music management
│   │   └── settings/       # Creator settings
│   ├── [slug]/             # Public storefronts (dynamic)
│   ├── admin/              # Platform admin pages
│   ├── api/                # API routes
│   │   ├── webhooks/       # Stripe, Clerk, Resend webhooks
│   │   └── ...
│   ├── courses/            # Course viewing/purchasing
│   ├── dashboard/          # Student dashboard
│   └── marketplace/        # Discovery/browse
│
├── convex/                 # Convex Backend (Real-time)
│   ├── schema.ts           # Database schema (60+ tables)
│   ├── _generated/         # Auto-generated types
│   │
│   │── Core Functions
│   ├── courses.ts          # Course CRUD
│   ├── users.ts            # User management
│   ├── stores.ts           # Store management
│   ├── library.ts          # User purchases/access
│   │
│   │── Email System
│   ├── emails.ts           # Email sending
│   ├── emailWorkflows.ts   # Automation workflows
│   ├── emailQueries.ts     # Campaign management
│   │
│   │── AI Features
│   ├── masterAI/           # AI course builder, generators
│   ├── aiCourseBuilder.ts  # Course generation
│   │
│   └── webhooks/           # Webhook handlers
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── dashboard/          # Dashboard-specific components
│
├── lib/                    # Shared utilities
└── emails/                 # React Email templates
```

## Data Flow

### Course Purchase Flow

```
1. User views course on store → /[slug]/courses/[courseSlug]
2. Clicks "Enroll" → Creates Stripe Checkout Session
3. Stripe webhook → /api/webhooks/stripe
4. Webhook calls → convex/library.createCourseEnrollment
5. User redirected to → /dashboard?mode=learn
6. Course appears in → User's library
```

### Real-Time Updates

Convex provides real-time subscriptions:

```typescript
// Frontend automatically updates when data changes
const courses = useQuery(api.courses.getCoursesByStore, { storeId });
```

## Authentication

Clerk handles authentication with webhooks syncing to Convex:

```
Clerk User Created → /api/webhooks/clerk → convex/users.createOrUpdateUserFromClerk
```

## Revenue Model

- Platform takes 10% fee on transactions
- Creators receive 90% via Stripe Connect
- Credits system for internal purchases

## Indexes Strategy

All frequently-queried fields have indexes in `schema.ts`:

```typescript
courses: defineTable({...})
  .index("by_userId", ["userId"])
  .index("by_storeId", ["storeId"])
  .index("by_slug", ["slug"])
  .index("by_published", ["isPublished"])
```

## Environment Requirements

- Node.js 18+
- Convex (real-time backend)
- Clerk (authentication)
- Stripe + Stripe Connect (payments)
- Resend (email)
- UploadThing (file storage)
- OpenAI (AI features)
