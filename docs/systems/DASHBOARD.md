# Dashboard System

> **Last Updated:** 2026-02-19
> **Pass:** 2 — Frontend & UI

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Creator Mode vs Learner Mode](#2-creator-mode-vs-learner-mode)
- [3. Mode Toggle Mechanics](#3-mode-toggle-mechanics)
- [4. State Persistence](#4-state-persistence)
- [5. Sidebar Navigation](#5-sidebar-navigation)
- [6. Dashboard Shell & Layout](#6-dashboard-shell--layout)
- [7. Dashboard Content by Mode](#7-dashboard-content-by-mode)
- [8. Route Map](#8-route-map)
- [9. Protected Routes & Auth](#9-protected-routes--auth)
- [10. Mobile Behavior](#10-mobile-behavior)

---

## 1. Overview

The dashboard is the primary authenticated experience. It operates in two modes — **Learn** and **Create** — with a toggle that switches navigation, content, and available actions. The mode persists across sessions through a multi-layer strategy.

### Key Files

| File | Purpose |
|------|---------|
| `app/dashboard/layout.tsx` | Mode detection, localStorage, Suspense |
| `app/dashboard/page.tsx` | Mode redirect logic, first-time user handling |
| `app/dashboard/components/DashboardShell.tsx` | Main layout wrapper (header + sidebar + content) |
| `app/dashboard/components/DashboardSidebar.tsx` | Mode-aware navigation sidebar |
| `app/dashboard/components/ModeToggle.tsx` | Learn/Create toggle button |
| `app/dashboard/components/LearnModeContent.tsx` | Learner dashboard content |
| `app/dashboard/components/CreateModeContent.tsx` | Creator dashboard content |
| `app/dashboard/components/StoreRequiredGuard.tsx` | Store existence guard for create mode |

---

## 2. Creator Mode vs Learner Mode

| Aspect | Learn Mode | Create Mode |
|--------|-----------|-------------|
| **Header title** | "My Learning" | "Creator Studio" |
| **Sidebar style** | Flat list (10 items) | Collapsible categories (5 groups, 22 items) |
| **Primary content** | Course progress, downloads, certificates | Revenue stats, quick actions, products |
| **Sidebar widgets** | Progress stats (streak, hours, XP) | Quick Create shortcuts |
| **CTA cards** | "Become a Creator" (if no store) | Pro tips |
| **Requires store** | No | Yes (shows setup wizard if missing) |
| **URL parameter** | `?mode=learn` | `?mode=create` |

### Mode Type

```typescript
type DashboardMode = "learn" | "create";
```

---

## 3. Mode Toggle Mechanics

### Toggle Component

**File:** `app/dashboard/components/ModeToggle.tsx`

```typescript
<div className="inline-flex items-center rounded-xl border border-border p-1 bg-muted/50">
  <button onClick={() => onChange('learn')}>
    <BookOpen /> Learn
  </button>
  <button onClick={() => onChange('create')}>
    <Sparkles /> Create
  </button>
</div>
```

Active button gets `bg-background text-foreground shadow-sm` styling. Inactive gets `text-muted-foreground`.

### Mode Change Flow

1. User clicks Learn or Create in `ModeToggle`
2. `onChange` callback fires in `DashboardShell`
3. URL updated immediately: `router.replace(/dashboard?mode=${newMode}, { scroll: false })`
4. localStorage updated: `setStoredMode(newMode)`
5. Convex mutation `setDashboardPreference` fired in background (non-blocking)
6. Component re-renders with new mode

---

## 4. State Persistence

### Multi-Layer Strategy

Mode is persisted across four layers, read in priority order:

| Priority | Source | Scope | Key/Field |
|----------|--------|-------|-----------|
| 1 (highest) | URL parameter | Current page | `?mode=learn` or `?mode=create` |
| 2 | Path detection | Current page | `.startsWith("/dashboard/create")` → `"create"` |
| 3 | localStorage | Cross-session, single device | `dashboard-mode` |
| 4 | Convex database | Cross-device | `users.dashboardPreference` |

### Decision Logic (page load)

```
1. URL has ?mode= → use it
2. On /dashboard/create/* path → "create"
3. localStorage has dashboard-mode → use it
4. User has stores → "create" (existing creator)
5. User has no dashboardPreference and no stores → redirect to /onboarding
6. Fallback → "learn"
```

### localStorage Functions

```typescript
const MODE_STORAGE_KEY = "dashboard-mode";

function getStoredMode(): "learn" | "create" | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(MODE_STORAGE_KEY);
  if (stored === "learn" || stored === "create") return stored;
  return null;
}

function setStoredMode(mode: "learn" | "create") {
  if (typeof window !== "undefined") {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
}
```

### Convex Persistence

```typescript
// convex/users.ts
export const setDashboardPreference = mutation({
  args: {
    clerkId: v.string(),
    preference: v.union(v.literal("learn"), v.literal("create")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      await ctx.db.insert("users", {
        clerkId: args.clerkId,
        dashboardPreference: args.preference,
      });
    } else {
      await ctx.db.patch(user._id, {
        dashboardPreference: args.preference,
      });
    }
  },
});
```

### Sidebar Collapse Persistence

Separate from mode, sidebar category collapsed states persist in localStorage:

```typescript
const SIDEBAR_COLLAPSED_KEY = "ppr-sidebar-collapsed-categories";
// Value: JSON object { "core": true, "content": true, "marketing": false, ... }
```

---

## 5. Sidebar Navigation

### Learn Mode (Flat List)

```
Dashboard          /dashboard?mode=learn
My Courses         /dashboard/courses?mode=learn
My Products        /dashboard/products?mode=learn
Downloads          /dashboard/downloads?mode=learn
My Samples         /dashboard/samples?mode=learn
My Sessions        /dashboard/coaching?mode=learn
Messages           /dashboard/messages?mode=learn
My Notes           /dashboard/notes?mode=learn
My Memberships     /dashboard/memberships?mode=learn
Certificates       /dashboard/certificates?mode=learn
```

**Widget:** Progress card — courses completed, hours learned, current streak, level/XP.

### Create Mode (Collapsible Categories)

```
Core (default: open)
  Dashboard        /dashboard?mode=create
  My Products      /dashboard/products?mode=create
  Create New       /dashboard/create               [highlighted]

Content (default: open)
  My Courses       /dashboard/courses?mode=create
  Coaching         /dashboard/coaching/sessions
  Memberships      /dashboard/memberships?mode=create
  AI Notes         /dashboard/notes?mode=create
  Reference Guides /dashboard/reference-guides?mode=create

Marketing (default: collapsed)
  Social Media     /dashboard/social?mode=create
  Email Campaigns  /dashboard/emails?mode=create
  Campaign Analytics /dashboard/emails/campaigns?mode=create
  Subscribers      /dashboard/emails/subscribers?mode=create
  List Health      /dashboard/emails/health?mode=create

Growth (default: collapsed)
  Analytics        /dashboard/analytics?mode=create
  Students         /dashboard/students?mode=create
  Affiliates       /dashboard/affiliates?mode=create

Account (default: collapsed)
  Profile          /dashboard/profile?mode=create
  Messages         /dashboard/messages?mode=create
  Pricing & Plans  /dashboard/pricing?mode=create
```

**Widget:** Quick Create shortcuts — Sample Pack, Preset, Course, Coaching.

### Sidebar Features

- Active link detection via `usePathname()`
- Category toggle saves to localStorage
- Bottom section: UserButton, theme toggle, settings link
- "Become a Creator" CTA card in learn mode (if no store)

---

## 6. Dashboard Shell & Layout

### Component Tree

```
app/dashboard/layout.tsx
  └─ DashboardShell (mode prop)
       ├─ SidebarProvider
       │   ├─ DashboardSidebar (mode, onModeChange)
       │   │   ├─ Learn links OR Create categories
       │   │   └─ Widgets (progress card / quick create)
       │   │
       │   └─ <main>
       │       ├─ <header>
       │       │   ├─ SidebarTrigger (mobile only)
       │       │   ├─ Title: "My Learning" | "Creator Studio"
       │       │   ├─ ModeToggle (mode, onChange)
       │       │   ├─ Search button
       │       │   ├─ Notifications bell
       │       │   └─ Settings gear
       │       │
       │       └─ <div> (content area)
       │           └─ StoreRequiredGuard (mode)
       │               ├─ Learn mode: passes children through
       │               └─ Create mode:
       │                   ├─ Has store → children
       │                   └─ No store → QuickCreatorSetup wizard
       │
       └─ Content
            ├─ /dashboard → LearnModeContent | CreateModeContent
            └─ /dashboard/[subpage] → Sub-page component
```

### Header Layout

The header is a fixed 64px (`h-16`) bar with:
- Left: SidebarTrigger (hidden on `md:` and up)
- Center: Title text
- Right: ModeToggle, Search, Bell, Settings icons

---

## 7. Dashboard Content by Mode

### Learn Mode Content

**File:** `app/dashboard/components/LearnModeContent.tsx`

| Section | Description |
|---------|-------------|
| **Quick Stats Row** | Day streak (flame), courses completed (award), hours learned (clock), level/XP (star) |
| **Continue Watching** | Primary CTA — course thumbnail, progress bar, resume button, time since last watch |
| **Content Tabs** | Continue (enrolled courses), Favorites (wishlist), Downloads (licenses, packs), Certificates |
| **Sidebar Widgets** | BecomeCreatorCard (if no store), Next Milestone, Recent Activity, Quick Actions, Referral Program |

### Create Mode Content

**File:** `app/dashboard/components/CreateModeContent.tsx`

| Section | Description |
|---------|-------------|
| **Welcome Header** | Store link, "Create New" button |
| **Copyright Alert** | Shown if pending copyright claims |
| **Stats Grid** | Total Revenue, Total Sales, Students, Content count |
| **Quick Actions** | Upload Sample Pack, Create Preset, New Course, Offer Coaching |
| **Recent Products** | Up to 5 recent products |
| **Store Performance** | Conversion rate, avg rating, views |
| **Recent Activity** | Recent purchases |
| **Quick Links** | Analytics, Emails, Social, Store Settings |

---

## 8. Route Map

### Complete Dashboard Routes

```
/dashboard
├── page.tsx                     Main dashboard (mode redirect)
├── layout.tsx                   DashboardShell
│
├── courses/                     Course management
│   ├── page.tsx                 List (learn: enrolled, create: owned)
│   └── [slug]/page.tsx          Course detail/player
│
├── products/                    Product management
│   ├── page.tsx                 Products (learn: purchased, create: catalog)
│   ├── LearnProductsView.tsx    Learner view
│   └── CreateProductsView.tsx   Creator view
│
├── create/                      Creation hub (create mode only)
│   ├── page.tsx                 Type selector
│   ├── course/                  Course creation
│   ├── pack/                    Sample/preset packs
│   ├── sample/                  Individual samples
│   ├── coaching/                Coaching sessions
│   ├── beat-lease/              Beat licensing
│   ├── pdf/                     PDFs
│   ├── blog/                    Blog posts
│   ├── digital/                 Digital products
│   ├── membership/              Memberships
│   ├── service/                 Services
│   ├── project-files/           Project files
│   ├── mixing-template/         Mixing templates
│   ├── playlist-curation/       Playlists
│   ├── cheat-sheet/             Cheat sheets
│   ├── tip-jar/                 Tip jars
│   └── bundle/                  Bundles
│
├── social/                      Social media (create mode)
│   ├── page.tsx                 Social hub
│   ├── create/                  Create posts
│   ├── calendar/                Schedule
│   ├── library/                 Templates
│   ├── profiles/                Connected accounts
│   └── automation/              Automations
│
├── emails/                      Email marketing (create mode)
│   ├── page.tsx                 Email hub
│   ├── setup/                   Setup wizard
│   ├── analytics/               Analytics
│   ├── campaigns/               Campaigns
│   ├── subscribers/             Email list
│   ├── deliverability/          Deliverability
│   ├── health/                  List health
│   ├── leads/                   Lead capture
│   ├── segments/                Segments
│   ├── sequences/               Sequences
│   ├── workflows/               Automations
│   └── preview/                 Email preview
│
├── downloads/                   Downloads (learn mode)
├── samples/                     Sample library (learn mode)
├── my-orders/[orderId]/         Order history (learn mode)
├── certificates/                Certificates (learn mode)
├── memberships/                 Memberships (both modes)
│
├── coaching/                    Coaching
│   ├── page.tsx
│   ├── sessions/
│   └── [productId]/
│
├── messages/                    DMs (both modes)
│   └── [conversationId]/
│
├── notes/                       AI notes (both modes)
│   ├── [noteId]/
│   └── folder/
│
├── analytics/                   Analytics (create mode)
├── students/                    Student management (create mode)
├── affiliates/                  Affiliate program (create mode)
├── reference-guides/            Reference guides (create mode)
│
├── profile/                     User profile
├── settings/                    Account settings
│   ├── domains/                 Custom domains
│   ├── integrations/            Integrations
│   └── payouts/                 Payouts
│
├── pricing/                     Plans (create mode)
├── copyright/                   Copyright (create mode)
│   └── counter-notice/
├── landing-pages/[pageId]/      Landing pages
├── marketing/                   Marketing tools
│   ├── campaigns/
│   └── templates/
├── lead-magnet-ideas/           Lead magnet suggestions
├── automations/[id]/            Workflow automation
└── service-orders/[orderId]/    Service orders
```

Total: **60+ sub-routes**

---

## 9. Protected Routes & Auth

### Middleware Protection

All `/dashboard(.*)` routes are protected by Clerk middleware:

```typescript
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  // ...other protected routes
]);

if (isProtectedRoute(req)) await auth.protect();
```

### Component-Level Auth

Components check auth state before rendering:

```typescript
const { user } = useUser();
if (!user) return <Skeleton />;

const convexUser = useQuery(
  api.users.getUserFromClerk,
  user?.id ? { clerkId: user.id } : "skip"
);
```

### Store Guard

`StoreRequiredGuard` wraps create-mode content:

- **Learn mode:** passes children through (no store needed)
- **Create mode + has store:** passes children through
- **Create mode + no store:** shows `QuickCreatorSetup` wizard

---

## 10. Mobile Behavior

### Responsive Sidebar

- **Desktop (md+):** Fixed sidebar with collapsible categories
- **Mobile (<md):** Sidebar hidden, accessible via hamburger `SidebarTrigger`
- Mobile sidebar opens as a `Sheet` (slide-out drawer from left)
- `SidebarProvider` manages both states

### Header

```typescript
<SidebarTrigger className="-ml-1 md:hidden" />  // Mobile only

<Button className="hidden md:flex">             // Desktop only
  <Search />
</Button>
```

### Content Layout

```typescript
// Responsive padding
<div className="w-full flex-1 overflow-x-hidden bg-background p-4 md:p-6">

// Dashboard stats: stack on mobile, grid on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Mode Toggle

Text labels hidden on smallest screens:

```typescript
<span className="hidden sm:inline">Learn</span>
<span className="hidden sm:inline">Create</span>
```

---

*NEEDS EXPANSION IN PASS 3: Dashboard analytics detail views, notification system architecture, store setup wizard flow, first-time user onboarding journey.*
