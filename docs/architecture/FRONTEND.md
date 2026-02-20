# Frontend Architecture

> **Last Updated:** 2026-02-19
> **Pass:** 2 — Frontend & UI

---

## Table of Contents

- [1. Next.js App Router Structure](#1-nextjs-app-router-structure)
- [2. Layout Nesting](#2-layout-nesting)
- [3. Middleware](#3-middleware)
- [4. Client vs Server Components](#4-client-vs-server-components)
- [5. State Management](#5-state-management)
- [6. Styling System](#6-styling-system)
- [7. Component Library](#7-component-library)
- [8. Form Handling](#8-form-handling)
- [9. Error Handling & Error Boundaries](#9-error-handling--error-boundaries)
- [10. Loading States & Suspense](#10-loading-states--suspense)
- [11. Mobile Responsiveness](#11-mobile-responsiveness)
- [12. Dark Mode & Theming](#12-dark-mode--theming)

---

## 1. Next.js App Router Structure

**Stack:** Next.js 15.3.6 (App Router) + React 19 + TypeScript 5.7 + Turbopack (dev)

### Top-Level Route Map

```
app/
├── layout.tsx                 Root layout (metadata, providers, skip-links)
├── page.tsx                   Landing / marketing page
├── globals.css                Design tokens, base styles
│
├── (dashboard)/               Route group — creator sidebar layout
│   ├── layout.tsx             SidebarWrapper shell
│   └── home/page.tsx          Creator home
│
├── dashboard/                 Main dashboard (learn/create modes)
│   ├── layout.tsx             DashboardShell with mode switching
│   ├── page.tsx               Mode redirect logic
│   ├── courses/               Course management
│   ├── products/              Product management
│   ├── create/                Product creation wizard (15+ types)
│   ├── social/                Social media hub
│   ├── emails/                Email marketing
│   ├── analytics/             Analytics dashboard
│   ├── messages/              DM system
│   ├── notes/                 AI notes
│   ├── settings/              Account settings
│   └── ...                    60+ sub-routes total
│
├── [slug]/                    Dynamic creator storefronts
│   ├── layout.tsx             Server-side metadata generation
│   ├── page.tsx               Storefront page (~1,200 lines)
│   ├── courses/[courseSlug]/   Course player
│   ├── products/[productSlug]/ Product detail
│   ├── beats/[beatSlug]/      Beat licensing
│   ├── memberships/           Membership tiers
│   ├── coaching/              Coaching sessions
│   ├── bundles/               Bundle pages
│   └── tips/                  Tip jars
│
├── marketplace/               Public marketplace
│   ├── courses/               Course browsing
│   ├── creators/              Creator directory
│   └── products/              Product browsing
│
├── courses/                   Public course pages
│   └── [slug]/lessons/[lessonId]/chapters/[chapterId]/
│
├── admin/                     Admin panel
│   ├── layout.tsx             Admin wrapper (force-dynamic)
│   └── email-analytics/       Email monitoring
│
├── api/                       40+ API routes
│   ├── webhooks/stripe/       Stripe webhook handler
│   ├── webhooks/clerk/        Clerk user sync
│   ├── webhooks/mux/          Video upload events
│   ├── products/              Checkout session creation
│   ├── follow-gate/           Social follow verification
│   ├── generate-audio/        ElevenLabs TTS
│   ├── generate-content/      AI content generation
│   └── ...
│
├── sign-up/[[...sign-up]]/    Clerk sign-up (catch-all)
├── sign-in/[[...sign-in]]/    Clerk sign-in (catch-all)
├── onboarding/                New user onboarding
└── verify/                    Social verification flows
```

### Dynamic Route Rendering

Most routes export `dynamic = "force-dynamic"` because they depend on:
- Clerk authentication state
- Convex real-time queries
- User-specific data

The `[slug]` storefront layout is an exception — it uses server-side `generateMetadata()` with `fetchQuery()` for SEO, while the page itself is a client component.

---

## 2. Layout Nesting

### Provider Hierarchy

The root layout (`app/layout.tsx`) wraps everything in `BuildProviders`:

```
<html>
  <body>
    <BuildProviders>                    (lib/build-providers.tsx)
      <ClerkProvider>                   Auth context
        <ConvexProviderWithClerk>       Real-time database + auth bridge
          <ThemeProvider>               next-themes (class-based)
            <Toaster />                 Shadcn toast
            <SonnerToaster />           Sonner notifications
            {children}
          </ThemeProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </BuildProviders>
  </body>
</html>
```

**Graceful degradation:** `BuildProviders` renders without Clerk if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing (build-time safety). `ConvexClientProvider` renders children without Convex if `NEXT_PUBLIC_CONVEX_URL` is missing or contains `'dummy'`.

### Layout Files

| Layout | Wraps | Purpose |
|--------|-------|---------|
| `app/layout.tsx` | Everything | Metadata, fonts (Outfit, Inter, Roboto Mono), providers, skip-links |
| `app/(dashboard)/layout.tsx` | Creator sidebar routes | `SidebarWrapper` + `SidebarProvider` |
| `app/dashboard/layout.tsx` | Dashboard pages | `DashboardShell` with learn/create mode toggle |
| `app/[slug]/layout.tsx` | Creator storefronts | Server-side metadata via `fetchQuery` |
| `app/admin/layout.tsx` | Admin panel | Force-dynamic rendering |
| `app/courses/[slug]/layout.tsx` | Course detail | Course-specific metadata |

---

## 3. Middleware

**File:** `middleware.ts`

### Protected Routes (Clerk)

```typescript
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/library(.*)",
  "/home(.*)",
  "/onboarding(.*)",
  "/courses/create(.*)",
  "/api/courses/create(.*)",
  "/api/user(.*)",
  "/profile(.*)",
]);
```

### Middleware Pipeline

1. **Auth check** — `auth.protect()` for protected routes
2. **Dashboard redirects** — `/home` to `/dashboard?mode=create`, `/library/courses/*` to `/dashboard/courses/*`
3. **Custom domain routing** — Non-primary hostnames query Convex for a matching `store.customDomain`, then rewrite to the `[slug]` route
4. **CORS headers** — Applied to all `/api/*` routes (GET, POST, PUT, DELETE, OPTIONS)

### Matcher Config

Excludes Next.js internals (`/_next/`), static files, and images. Always runs for `/api` and `/trpc` routes.

---

## 4. Client vs Server Components

### Pattern

**Server components** are used for:
- Layouts with `generateMetadata()` (e.g., `app/[slug]/layout.tsx`)
- Static/SEO content that can be rendered server-side
- Data fetching with `fetchQuery()` from `convex/nextjs`

**Client components** (`"use client"`) are used for:
- All interactive pages (dashboard, storefront, marketplace)
- All `components/` files that use hooks, event handlers, or browser APIs
- All `components/ui/` primitives (Radix requires client-side rendering)

### Data Fetching Split

| Context | Method | Import |
|---------|--------|--------|
| Server component / API route | `fetchQuery()`, `fetchMutation()` | `convex/nextjs` |
| Client component | `useQuery()`, `useMutation()` | `convex/react` |
| Server action | `ConvexHttpClient` instance | `convex/browser` |

### Skip Pattern

Client components skip Convex queries until dependencies are ready:

```typescript
const store = useQuery(api.stores.getStoreBySlug, { slug });
const products = useQuery(
  api.digitalProducts.getPublishedProductsByStore,
  store ? { storeId: store._id } : "skip"
);
```

### React 19 Params

Next.js 15 passes `params` as a Promise. Components unwrap with `React.use()`:

```typescript
const { slug } = use(params);
```

---

## 5. State Management

### Overview

There is no global state library (no Redux, Zustand, or Jotai). State is managed through:

| Layer | Tool | Scope |
|-------|------|-------|
| **Server state** | Convex `useQuery()` / `useMutation()` | Real-time, reactive, shared across clients |
| **UI state** | React `useState` / `useReducer` | Component-local |
| **URL state** | `useSearchParams()`, `useRouter()` | Bookmarkable, shareable (e.g., `?mode=create`) |
| **Persistent local** | `localStorage` | Cross-session (sidebar collapse, dashboard mode) |
| **Database preference** | Convex `users.dashboardPreference` | Cross-device |
| **Theme** | `next-themes` (cookie + class) | System/user preference |

### Context Providers

| Provider | Source | Purpose |
|----------|--------|---------|
| `ClerkProvider` | `@clerk/nextjs` | Authentication |
| `ConvexProviderWithClerk` | `convex/react-clerk` | Real-time backend with auth bridge |
| `ThemeProvider` | `next-themes` | Dark/light mode |
| `SidebarProvider` | `components/ui/sidebar.tsx` | Sidebar open/close state, cookie persistence, Cmd+B shortcut |

### Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth()` | `hooks/useAuth.ts` | Clerk user + logout, with graceful fallback |
| `useToast()` | `hooks/use-toast.ts` | Reducer-based toast (limit: 1) |
| `useMobile()` | `hooks/use-mobile.tsx` | Breakpoint detection |
| `useStoreId()` | `hooks/useStoreId.tsx` | Extract current store ID |
| `useAnalytics()` | `hooks/useAnalytics.ts` | Event tracking via Convex mutations |
| `useDebounce()` | `hooks/use-debounce.ts` | Debounce utility |
| `useFieldValidation()` | `hooks/useFieldValidation.ts` | Form field validation |
| `useFeatureAccess()` | `hooks/use-feature-access.tsx` | Feature flag / plan gating |
| `useConversionTracking()` | `hooks/useConversionTracking.ts` | Conversion metrics |
| `useProducts()` | `hooks/use-products.ts` | Product query helper |
| `useCoachingProducts()` | `hooks/use-coaching-products.ts` | Coaching product queries |
| `useDiscordAutoSync()` | `hooks/useDiscordAutoSync.ts` | Discord integration |
| `useApplyReferral()` | `hooks/use-apply-referral.tsx` | Referral code handling |

---

## 6. Styling System

### Tailwind Configuration

**File:** `tailwind.config.ts`

| Setting | Value |
|---------|-------|
| Dark mode | `class` strategy |
| Plugins | `tailwindcss-animate`, `@tailwindcss/typography` |
| Content paths | `app/**/*.tsx`, `components/**/*.tsx` |

### Design Tokens (CSS Custom Properties)

Defined in `app/globals.css` using HSL values:

**Light Mode (`:root`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `240 10% 4%` | Primary text |
| `--primary` | `239 84% 67%` | Brand purple |
| `--secondary` | `20 6% 83%` | Muted surfaces |
| `--accent` | `300 43% 94%` | Accent highlights |
| `--destructive` | `0 84% 60%` | Error/danger |
| `--muted` | `240 5% 96%` | Disabled/subtle |
| `--border` | `240 6% 90%` | Borders |
| `--radius` | `1.25rem` | Default border radius |

**Dark Mode (`.dark`):**

| Token | Value |
|-------|-------|
| `--background` | `0 0% 7%` |
| `--foreground` | `214 32% 91%` |
| `--primary` | `199 82% 78%` |

### Fonts

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | Outfit | Primary UI |
| `--font-serif` | Inter | Body text |
| `--font-mono` | Roboto Mono | Code |

### Custom Animations

| Animation | Usage |
|-----------|-------|
| `accordion-down/up` | Accordion expand/collapse |
| `float` | Hero decorative elements |
| `float-slow` | Slower floating variant |

### Utility Pattern

The `cn()` function (`lib/utils.ts`) merges Tailwind classes with conflict resolution:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 7. Component Library

### shadcn/ui Base (33 components)

Standard Radix-based primitives in `components/ui/`:

accordion, alert, alert-dialog, avatar, badge, button, calendar, card, checkbox, collapsible, command, dialog, dropdown-menu, hover-card, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toast, toaster, tooltip

All follow the shadcn pattern: `forwardRef`, `cva` variants, `cn()` styling, Radix primitives.

### Custom UI Components (20 components)

Extended/domain-specific components in `components/ui/`:

| Component | Purpose |
|-----------|---------|
| `audio-player.tsx` | Play/pause, volume, time scrub (default/compact/minimal variants) |
| `audio-waveform.tsx` | Canvas-based waveform visualization with interactive seeking |
| `rich-text-editor.tsx` | Tiptap editor with image upload, formatting toolbar |
| `wysiwyg-editor.tsx` | Full WYSIWYG editor |
| `course-card-enhanced.tsx` | Enhanced course card display |
| `course-player-enhanced.tsx` | Enhanced video course player |
| `dashboard-layout-enhanced.tsx` | Dashboard layout wrapper |
| `metric-card-enhanced.tsx` | Statistics card |
| `empty-state.tsx` / `empty-state-enhanced.tsx` | Empty state displays |
| `form-error-banner.tsx` | Form error display |
| `form-field-with-help.tsx` | Label + field + help text wrapper |
| `hero-flourishes.tsx` | Decorative hero effects |
| `loading-states.tsx` | Loading state variations |
| `masonry-grid.tsx` | Masonry layout |
| `step-progress-indicator.tsx` | Multi-step progress |
| `store-url-display.tsx` | Store URL display |
| `product-type-tooltip.tsx` | Product type tooltip |
| `animated-filter-transitions.tsx` | Filter animations |

### Icon Library

**Package:** `lucide-react` (v0.468)

All icons are imported from Lucide. No custom SVG icon files.

---

## 8. Form Handling

### Libraries

| Package | Version | Role |
|---------|---------|------|
| `react-hook-form` | 7.60.0 | Form state management |
| `zod` | 3.25.63 | Schema validation |
| `@hookform/resolvers` | 5.1.1 | Zod-to-RHF bridge |

### Form Pattern

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  price: z.number().min(0),
});

type FormData = z.infer<typeof formSchema>;

function CreateProductForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", price: 0 },
  });

  const onSubmit = async (data: FormData) => {
    await createProduct(data);
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### Shared Validation

Centralized schemas live in `app/dashboard/create/shared/validation.ts`, shared across creation wizards.

### Simple Forms

Many forms use plain `useState` with manual validation rather than react-hook-form, especially older components like `create-course-form.tsx` and `post-composer.tsx`. These use:
- State per field
- Inline validation checks
- `useFieldValidation()` hook for field-level validation
- `FormErrorBanner` for error display
- Toast notifications for submission feedback

---

## 9. Error Handling & Error Boundaries

### Next.js Error Boundaries

Error boundary files exist throughout the app:

```
app/create-course/error.tsx
app/marketplace/error.tsx
app/admin/email-analytics/error.tsx
app/admin/settings/*/error.tsx
app/dashboard/[various]/error.tsx
```

### Error Boundary Pattern

```typescript
"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <AlertTriangle /> Something went wrong
      </CardHeader>
      <CardContent>
        {process.env.NODE_ENV === "development" && <p>{error.message}</p>}
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild><a href="/">Go Home</a></Button>
      </CardContent>
    </Card>
  );
}
```

### Error Tracking

**Sentry** is integrated at three levels:
- `sentry.client.config.ts` — Browser errors
- `sentry.server.config.ts` — Server-side errors
- `sentry.edge.config.ts` — Middleware/edge errors

API routes capture exceptions with contextual tags:

```typescript
Sentry.captureException(err, {
  tags: { component: "stripe-webhook", stage: "signature-verification" },
});
```

### Server Logger

`lib/server-logger.ts` provides structured logging:

| Method | Usage |
|--------|-------|
| `serverLogger.debug()` | Dev-only debug output |
| `serverLogger.info()` | Informational messages |
| `serverLogger.warn()` | Warnings (prod + dev) |
| `serverLogger.error()` | Always logged |
| `serverLogger.payment()` | Payment events (sanitized in prod) |
| `serverLogger.webhook()` | Webhook events (dev only unless DEBUG) |

Log level defaults to `debug` in development, `warn` in production.

---

## 10. Loading States & Suspense

### Loading Files

```
app/marketplace/loading.tsx
app/admin/products/loading.tsx
app/dashboard/settings/loading.tsx
app/admin/emails/loading.tsx
```

### Loading Pattern

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="w-full h-48" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Suspense Boundaries

The dashboard layout wraps content in `<Suspense>` with a full-screen skeleton fallback:

```typescript
<Suspense fallback={<Skeleton className="h-screen w-full" />}>
  {children}
</Suspense>
```

### In-Component Loading

Most client components handle their own loading via Convex query states:

```typescript
const data = useQuery(api.someQuery, args);
if (data === undefined) return <LoadingSkeleton />;
if (data === null) return <EmptyState />;
return <DataView data={data} />;
```

---

## 11. Mobile Responsiveness

### Approach

Mobile-first with Tailwind responsive prefixes. No separate mobile components or media query files.

### Common Responsive Patterns

```typescript
// Grid that collapses on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

// Padding that grows on larger screens
<div className="p-4 md:p-6 lg:p-8">

// Hidden on mobile, visible on desktop
<Button className="hidden md:flex">Search</Button>

// Sidebar trigger only on mobile
<SidebarTrigger className="-ml-1 md:hidden" />

// Content areas with responsive columns
<div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
  <div className="lg:col-span-3">Main</div>
  <div>Sidebar</div>
</div>
```

### Mobile Navigation

- Desktop: Fixed sidebar via `SidebarProvider`
- Mobile: Sidebar collapses into a `Sheet` (slide-out drawer) triggered by hamburger icon
- `useMobile()` hook detects breakpoint for conditional rendering

### Breakpoints

Standard Tailwind defaults: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)

---

## 12. Dark Mode & Theming

### Implementation

| Layer | Technology |
|-------|------------|
| Provider | `next-themes` (`ThemeProvider`) |
| Strategy | CSS class (`class` attribute on `<html>`) |
| Default | `light` |
| System | Enabled (`enableSystem`) |
| Toggle | `components/mode-toggle.tsx` |
| Transitions | Disabled (`disableTransitionOnChange`) to prevent flash |

### How It Works

1. `ThemeProvider` adds `class="dark"` or `class="light"` to `<html>`
2. CSS custom properties in `.dark` selector override `:root` values
3. Tailwind `dark:` prefix applies dark-specific styles
4. All colors reference CSS custom properties, so they update automatically

### Example

```typescript
// Automatic via CSS variables
<Card className="bg-card text-card-foreground">

// Explicit dark overrides
<div className="bg-white dark:bg-black border border-border">

// Toast styling
<div className="bg-white dark:bg-black text-foreground">
```

### Sonner Toaster Integration

The `ThemedSonnerToaster` in `BuildProviders` passes the current theme to Sonner:

```typescript
<Sonner theme={theme as "light" | "dark" | "system"} />
```

---

*NEEDS EXPANSION IN PASS 3: Server component data fetching patterns in detail, image optimization pipeline, Remotion video rendering integration, accessibility audit results.*
