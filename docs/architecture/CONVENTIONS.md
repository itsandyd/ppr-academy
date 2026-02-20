# Coding Conventions

> **Last Updated:** 2026-02-19
> **Pass:** 2 — Frontend & UI

---

## Table of Contents

- [1. File Naming](#1-file-naming)
- [2. Component Structure](#2-component-structure)
- [3. Convex Function Patterns](#3-convex-function-patterns)
- [4. API Route Patterns](#4-api-route-patterns)
- [5. Server Action Patterns](#5-server-action-patterns)
- [6. Error Handling](#6-error-handling)
- [7. TypeScript Patterns](#7-typescript-patterns)
- [8. Import Patterns & Aliases](#8-import-patterns--aliases)
- [9. Environment Variables](#9-environment-variables)
- [10. Testing](#10-testing)
- [11. Utility Functions](#11-utility-functions)

---

## 1. File Naming

| Location | Convention | Examples |
|----------|-----------|----------|
| **Components (files)** | kebab-case | `course-card.tsx`, `mode-toggle.tsx` |
| **Components (exports)** | PascalCase functions | `export default function CourseCard()` |
| **Component subdirs** | kebab-case or PascalCase | `follow-gates/`, some files like `AgentPicker.tsx` use PascalCase |
| **Convex functions** | camelCase | `courses.ts`, `aiEmailGenerator.ts`, `cheatSheetMutations.ts` |
| **API routes** | kebab-case dirs + `route.ts` | `api/products/create-checkout-session/route.ts` |
| **Server actions** | kebab-case with `-actions` suffix | `course-actions.ts`, `user-actions.ts` |
| **Hooks** | `use-` prefix, kebab-case | `use-toast.ts`, `use-mobile.tsx` |
| **Lib utilities** | kebab-case | `server-logger.ts`, `convex-provider.tsx` |
| **Pages** | `page.tsx` (App Router convention) | — |
| **Layouts** | `layout.tsx` (App Router convention) | — |
| **Error boundaries** | `error.tsx` (App Router convention) | — |
| **Loading states** | `loading.tsx` (App Router convention) | — |

**Note:** There's some inconsistency in hook naming — older hooks use camelCase (`useAuth.ts`, `useAnalytics.ts`) while newer ones use kebab-case (`use-toast.ts`, `use-mobile.tsx`). Prefer kebab-case for new hooks.

---

## 2. Component Structure

### Standard Pattern

```typescript
"use client";

// 1. External imports
import { useState } from "react";
import { useQuery } from "convex/react";

// 2. Internal imports (@ alias)
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

// 3. Types/interfaces
interface CourseCardProps {
  course: CourseWithDetails;
}

// 4. Component function (default export)
export default function CourseCard({ course }: CourseCardProps) {
  // Hooks first
  const { toast } = useToast();

  // Derived values
  const courseSlug = course.slug || generateSlug(course.title);

  // Render
  return (
    <Card className={cn("group", "hover:shadow-lg")}>
      {/* JSX */}
    </Card>
  );
}
```

### Key Patterns

- **`"use client"` directive** at top of file for client components
- **Props interface** defined before component, not inlined
- **`export default function`** for page and most feature components
- **Named exports** for shadcn/ui components (`export { Button, buttonVariants }`)
- **`forwardRef`** for shadcn/ui components that need ref forwarding
- **`displayName`** set after `forwardRef` components

### What Goes Where

- Business logic: in the component or a custom hook
- Validation schemas: in a shared `validation.ts` or inline
- Types: in `lib/types.ts` or co-located with the component
- Utilities: in `lib/utils.ts` or feature-specific lib files

---

## 3. Convex Function Patterns

### Query

```typescript
export const getCourseBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.object({ /* fields */ }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});
```

### Mutation

```typescript
export const createCourse = mutation({
  args: {
    title: v.string(),
    userId: v.string(),
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    // Auth check
    const { identity } = await requireStoreOwner(ctx, args.storeId);

    return await ctx.db.insert("courses", {
      title: args.title,
      userId: args.userId,
      storeId: args.storeId,
      status: "draft",
    });
  },
});
```

### Action (Node runtime)

```typescript
"use node";

import { action } from "./_generated/server";

export const generateEmail = action({
  args: {
    storeId: v.string(),
    emailType: v.union(v.literal("welcome"), v.literal("nurture")),
  },
  returns: v.object({
    subject: v.string(),
    body: v.string(),
  }),
  handler: async (ctx, args) => {
    // Call internal queries/mutations
    const data = await ctx.runQuery(api.courses.getCourseWithInstructor, {
      courseId: args.courseId,
    });

    // Call external APIs (OpenAI, etc.)
    const result = await openai.chat.completions.create({ ... });

    return { subject: result.subject, body: result.body };
  },
});
```

### Internal Functions

```typescript
export const processQueue = internalMutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Called by crons or other internal functions
    // Not exposed to client
  },
});
```

### Authorization Helpers

**File:** `convex/lib/auth.ts`

| Function | Purpose |
|----------|---------|
| `requireAuth(ctx)` | Returns identity or throws "Not authenticated" |
| `requireStoreOwner(ctx, storeId)` | Verifies user owns the store, returns `{ identity, store }` |
| `requireAdmin(ctx)` | Checks `user.admin` flag, returns `{ identity, user }` |

Usage pattern:

```typescript
export const updateProduct = mutation({
  args: { storeId: v.id("stores"), /* ... */ },
  handler: async (ctx, args) => {
    const { identity, store } = await requireStoreOwner(ctx, args.storeId);
    // Authorized — proceed with mutation
  },
});
```

### Validators

Convex uses its own validator library (`v.*`):

```typescript
// Primitive types
v.string(), v.number(), v.boolean(), v.null()

// Complex types
v.id("tableName")            // Document ID
v.array(v.string())          // Array
v.object({ key: v.string() }) // Object
v.union(v.literal("a"), v.literal("b"))  // Union
v.optional(v.string())       // Optional field

// Nested validators (reusable)
const outlineValidator = v.object({
  title: v.string(),
  sections: v.array(v.object({
    heading: v.string(),
    type: v.union(v.literal("key_takeaways"), v.literal("quick_reference")),
    items: v.array(v.object({ text: v.string() })),
  })),
});
```

### Cron Jobs

**File:** `convex/crons.ts`

```typescript
import { cronJobs } from "convex/server";

const crons = cronJobs();

crons.interval(
  "process email send queue",  // Human-readable name
  { seconds: 30 },             // Interval
  internal.emailSendQueueActions.processEmailSendQueue,  // Internal function
  {},                           // Args
);

export default crons;
```

### Modular Schema

The schema is split across multiple files and composed in `convex/schema.ts`:

```typescript
import { emailTables } from "./emailSchema";
import { monetizationTables } from "./monetizationSchema";
import { analyticsTables } from "./analyticsSchema";

export default defineSchema({
  users: defineTable({ ... }).index("by_clerkId", ["clerkId"]),
  courses: defineTable({ ... }).index("by_slug", ["slug"]),
  ...emailTables,
  ...monetizationTables,
  ...analyticsTables,
});
```

---

## 4. API Route Patterns

### Standard Structure

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { serverLogger } from "@/lib/server-logger";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { userId } = await requireAuth();

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(userId, "strict");
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // 3. Parse body
    const body = await request.json();

    // 4. Business logic
    const result = await doSomething(body);

    // 5. Return success
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    serverLogger.error("API", "Operation failed", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Webhook Pattern

```typescript
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature")!;

  // 1. Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Idempotency check
  const existing = await fetchQuery(api.webhookEvents.getWebhookEvent, {
    stripeEventId: event.id,
  });
  if (existing?.status === "processed") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 3. Handle event
  switch (event.type) {
    case "checkout.session.completed":
      // Process payment...
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 5. Server Action Patterns

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { revalidatePath } from "next/cache";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function createCourse(courseData: CourseData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const courseId = await convex.mutation(api.courses.createCourse, {
    ...courseData,
    userId,
  });

  revalidatePath("/dashboard/courses");
  return courseId;
}
```

Server actions:
- Use `"use server"` directive
- Authenticate via `auth()` from Clerk
- Call Convex via `ConvexHttpClient` (not hooks)
- Call `revalidatePath()` to bust Next.js cache
- Return serializable results

---

## 6. Error Handling

### Layers

| Layer | Tool | Pattern |
|-------|------|---------|
| **Next.js error boundaries** | `error.tsx` files | Catch rendering errors per route segment |
| **API route try/catch** | `serverLogger` + Sentry | Log + track + return HTTP error |
| **Convex functions** | `throw new Error()` | Propagated to client as mutation/action error |
| **Client components** | `try/catch` in handlers, toast feedback | Show user-friendly messages |
| **Browser errors** | Sentry client SDK | Automatic capture |
| **Server errors** | Sentry server SDK | Automatic capture |
| **Edge errors** | Sentry edge SDK | Middleware errors |

### Server Logger

**File:** `lib/server-logger.ts`

| Method | When Logged |
|--------|-------------|
| `serverLogger.debug()` | Dev only (or `LOG_LEVEL=debug`) |
| `serverLogger.info()` | Dev + info level |
| `serverLogger.warn()` | Dev + prod (default prod level) |
| `serverLogger.error()` | Always |
| `serverLogger.payment()` | Dev always; prod only if `LOG_PAYMENTS=true` (sanitized) |
| `serverLogger.webhook()` | Dev only (or `NEXT_PUBLIC_DEBUG=true`) |

### Client Error Pattern

```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);
    await createProduct(data);
    toast({ title: "Product created!" });
  } catch (error) {
    console.error(error);
    toast({ title: "Failed to create product", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

---

## 7. TypeScript Patterns

### Convex-Generated Types

```typescript
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

// Document type
type User = Doc<"users">;

// Document ID
type UserId = Id<"users">;
```

### Extended Types

**File:** `lib/types.ts`

```typescript
export type CourseWithDetails = Doc<"courses"> & {
  instructor?: Doc<"users"> | null;
  _count?: { enrollments: number };
};

export type EnrollmentWithCourse = Doc<"enrollments"> & {
  course: Doc<"courses"> & {
    instructor?: Doc<"users"> | null;
  };
};
```

### Component Props

```typescript
// Interface defined above component
interface CourseCardProps {
  course: CourseWithDetails;
}

// Extending HTML attributes (shadcn pattern)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

### Convex Validators as Types

Convex validators define both runtime validation and TypeScript types. The `returns` validator in queries/mutations provides type-safe return types.

---

## 8. Import Patterns & Aliases

### Path Alias

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Import Order Convention

```typescript
// 1. React / Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";

// 3. Internal — UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 4. Internal — feature components
import { CourseCard } from "@/components/course-card";

// 5. Internal — lib/utils
import { cn, generateSlug } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

// 6. Internal — types
import type { CourseWithDetails } from "@/lib/types";

// 7. Icons
import { BookOpen, Sparkles, Plus } from "lucide-react";
```

### No Barrel Exports (mostly)

Components are imported directly by file path. A few feature directories have `index.ts` barrels (`dashboard/analytics/`, `storefront/`, `video/`, `quiz/`, `settings/`), but most do not.

---

## 9. Environment Variables

### Organization

**File:** `.env.example` — categorized with comments:

```bash
# ─── Core (REQUIRED) ───
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# ─── Auth - Clerk (REQUIRED) ───
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ─── Payments - Stripe (REQUIRED) ───
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Feature Flags (OPTIONAL) ───
CREATOR_PAYOUTS=false
ENABLE_CACHING=false
```

### Conventions

- `NEXT_PUBLIC_` prefix: Exposed to browser (client-safe values only)
- No prefix: Server-only (secrets, API keys)
- Feature flags: Boolean strings (`"true"` / `"false"`)
- `LOG_LEVEL`: Controls server-logger verbosity
- `NEXT_PUBLIC_DEBUG`: Enables verbose client logging

### Access Pattern

```typescript
// Client-safe
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Server-only (API routes, server actions)
const stripeKey = process.env.STRIPE_SECRET_KEY!;

// With fallback
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "warn");
```

---

## 10. Testing

### Framework

| Tool | Version | Config |
|------|---------|--------|
| Vitest | latest | `vitest.config.ts` |
| Environment | Node | `test.environment: "node"` |
| Timeout | 15s | `test.testTimeout: 15000` |

### Test Location

```
__tests__/
├── stripe-webhook.test.ts
└── helpers/
    └── factories.ts
```

### Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildCheckoutSession, createMockRequest } from "./helpers/factories";

describe("Stripe Webhook Handler", () => {
  // Mock external dependencies
  vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
  vi.mock("@/lib/server-logger", () => ({
    serverLogger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
  }));

  const mockFetchMutation = vi.fn(async () => "mock_id");
  vi.mock("convex/nextjs", () => ({
    fetchMutation: (...args: any[]) => mockFetchMutation(...args),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes checkout.session.completed", async () => {
    const session = buildCheckoutSession({ productType: "course" });
    // ... test logic
    expect(mockFetchMutation).toHaveBeenCalledWith(/* ... */);
  });
});
```

### Factory Pattern

Test helpers in `__tests__/helpers/factories.ts` provide builders for Stripe events, mock requests, and API proxies.

### Coverage

Testing is minimal — primarily webhook handler tests. No component tests, no E2E tests. The codebase relies on TypeScript type checking and Convex's built-in validator enforcement for safety.

---

## 11. Utility Functions

### Core Utilities (`lib/utils.ts`)

| Function | Purpose |
|----------|---------|
| `cn(...inputs)` | Merge Tailwind classes with conflict resolution (`clsx` + `tailwind-merge`) |
| `generateSlug(title)` | Convert title to URL-safe slug |
| `generateUniqueSlug(base, existing)` | Slug with numeric suffix for uniqueness |
| `formatCurrency(amount, currency)` | Format number as currency string |
| `markdownToHtml(markdown)` | Convert markdown to HTML |

### Auth Helpers (`lib/auth-helpers.ts`)

| Function | Purpose |
|----------|---------|
| `requireAuth()` | Get authenticated user or throw 401 |
| `getAuthUser()` | Get user or return null |
| `requireAdmin()` | Enforce admin role |
| `requireRole(role)` | Role-based access control |
| `withAuth()` | Middleware wrapper for API routes |

### Server Logger (`lib/server-logger.ts`)

Structured logging with level control. See [Error Handling](#6-error-handling) section.

### Rate Limiting

Uses `@convex-dev/rate-limiter` for API endpoint protection. Strict tier: 5 requests/min for checkout sessions.

---

*NEEDS EXPANSION IN PASS 3: ESLint rules and configuration, Prettier/formatting setup, git hooks, CI/CD pipeline, deployment conventions.*
