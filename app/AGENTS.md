# APP ROUTER KNOWLEDGE

Next.js 15 App Router. Server components default. Multi-tenant storefronts.

## STRUCTURE

```
app/
├── (dashboard)/              # Creator dashboard (route group)
│   ├── store/[storeId]/      # Store management
│   ├── home/                 # Creator home
│   ├── music/                # Music showcase
│   └── settings/             # Creator settings
├── dashboard/                # Learner dashboard
│   ├── create/               # Product creation wizards
│   ├── notes/                # Note-taking
│   └── components/           # Dashboard UI
├── [slug]/                   # Public storefronts (multi-tenant)
├── library/                  # User's purchased content
├── marketplace/              # Browse all products
│   ├── plugins/              # Plugin marketplace
│   ├── samples/              # Sample marketplace
│   └── ableton-racks/        # Rack presets
├── courses/[slug]/           # Course player
├── admin/                    # Platform admin
├── api/                      # API routes + webhooks
├── actions/                  # Server actions (5 files)
├── _components/              # Shared page components
└── auth/                     # OAuth callbacks
```

## ROUTE GROUPS

| Group         | Path                 | Purpose                                |
| ------------- | -------------------- | -------------------------------------- |
| `(dashboard)` | `/store/[storeId]/*` | Creator tools, multi-tenant by storeId |
| None          | `/dashboard/*`       | Learner-facing, single user            |
| None          | `/[slug]/*`          | Public storefront pages                |

**Key distinction**:

- `(dashboard)/store/[storeId]` = Creator managing THEIR store
- `dashboard/` = Learner viewing THEIR library

## WHERE TO LOOK

| Task                | Location                                     | Pattern                 |
| ------------------- | -------------------------------------------- | ----------------------- |
| Add public page     | `app/{route}/page.tsx`                       | Server component        |
| Add creator feature | `app/(dashboard)/store/[storeId]/{feature}/` | With layout             |
| Add learner feature | `app/dashboard/{feature}/`                   | Use library for content |
| Add server action   | `app/actions/{domain}-actions.ts`            | `"use server"`          |
| Add API route       | `app/api/{route}/route.ts`                   | Webhooks only           |
| Add storefront page | `app/[slug]/{page}/page.tsx`                 | Public, no auth         |
| Add admin page      | `app/admin/{feature}/page.tsx`               | Requires admin check    |

## SERVER ACTIONS

Located in `app/actions/`:

| File                  | Domain   | Key Actions           |
| --------------------- | -------- | --------------------- |
| `course-actions.ts`   | Courses  | CRUD, enrollment      |
| `user-actions.ts`     | Users    | Profile, preferences  |
| `admin-actions.ts`    | Admin    | Platform operations   |
| `coach-actions.ts`    | Coaching | Session management    |
| `coaching-actions.ts` | Coaching | Booking, availability |

Pattern:

```typescript
"use server";
import { auth } from "@clerk/nextjs/server";

export async function myAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  // ...
}
```

## DYNAMIC ROUTES

| Route             | Param      | Source                |
| ----------------- | ---------- | --------------------- |
| `[slug]`          | Store slug | `stores.slug`         |
| `[storeId]`       | Convex ID  | `stores._id`          |
| `[productId]`     | Product ID | `digitalProducts._id` |
| `[certificateId]` | Cert ID    | `certificates._id`    |

## MIDDLEWARE ROUTING

See `middleware.ts` for:

- Protected route enforcement
- Custom domain → slug rewriting
- CORS headers for API routes
- Dashboard redirects (`/home` → `/dashboard?mode=create`)

## LAYOUTS

| Layout                          | Purpose                    |
| ------------------------------- | -------------------------- |
| `app/layout.tsx`                | Root: providers, analytics |
| `app/(dashboard)/layout.tsx`    | Creator sidebar            |
| `app/dashboard/layout.tsx`      | Learner sidebar            |
| `app/[slug]/layout.tsx`         | Public store wrapper       |
| `app/library/layout.tsx`        | Library navigation         |
| `app/courses/[slug]/layout.tsx` | Course player chrome       |

## CONVENTIONS

### Page Components

```tsx
// Server component (default)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Fetch data directly
}

// Client component (when needed)
("use client");
export default function Page() {
  // Interactive UI
}
```

### Loading States

```tsx
// loading.tsx in same directory
export default function Loading() {
  return <Skeleton />;
}
```

### Error Handling

```tsx
// error.tsx in same directory
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // Error UI
}
```

## ANTI-PATTERNS

| Pattern                     | Why Bad                    | Fix                  |
| --------------------------- | -------------------------- | -------------------- |
| API routes for data         | Bypasses Convex            | Use Convex functions |
| Client fetch in page        | Loses SSR benefits         | Use server component |
| `params.slug` without await | Next.js 15 breaking change | `await params` first |
| Layout with heavy data      | Rerenders on navigation    | Fetch in page        |

## API ROUTES

Only use for:

- Webhooks (`/api/webhooks/*`)
- External integrations
- UploadThing (`/api/uploadthing`)

All other data: Use Convex queries/mutations directly.

## MULTI-TENANT

Custom domain flow:

1. User visits `custom-domain.com`
2. Middleware queries store by domain
3. Rewrites to `/[slug]/*` internally
4. URL bar shows custom domain

Store slug routes:

- `/[slug]` - Store homepage
- `/[slug]/products` - Product listing
- `/[slug]/courses` - Course listing
