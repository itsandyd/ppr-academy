# Unified Dashboard - Shippable v1 (Lean Version)

**Date**: 2025-11-17  
**Goal**: Ship the smallest version that delivers the mental model  
**Timeline**: 2-3 days

---

## What We're Actually Building

**Scope**:
- ✅ `/dashboard` with mode toggle
- ✅ Learn mode (wraps existing Library content)
- ✅ Create mode (wraps existing Creator content)
- ✅ Redirects from `/library` and `/home`
- ✅ Mode preference saved to Convex

**NOT in v1**:
- ❌ Mode-aware subpages
- ❌ Detailed analytics
- ❌ Progressive rollout flags
- ❌ Onboarding modals
- ❌ Cross-mode features

---

## File Structure

```
app/
  dashboard/
    page.tsx                    ← Main page (server component)
    components/
      DashboardShell.tsx        ← Layout wrapper
      ModeToggle.tsx            ← Client component for toggle
      LearnModeContent.tsx      ← Wraps existing Library
      CreateModeContent.tsx     ← Wraps existing Creator dashboard
```

---

## Implementation

### 1. Main Dashboard Page (Server Component)

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { DashboardShell } from './components/DashboardShell';
import { LearnModeContent } from './components/LearnModeContent';
import { CreateModeContent } from './components/CreateModeContent';

export const dynamic = 'force-dynamic';

type DashboardMode = 'learn' | 'create';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get mode from URL
  let mode = searchParams.mode as DashboardMode | undefined;

  // If no mode in URL, determine default and redirect
  if (!mode || (mode !== 'learn' && mode !== 'create')) {
    // Check if user has published products (they're a creator)
    const convexUser = await fetchQuery(api.users.getUserFromClerk, {
      clerkId: user.id,
    });

    // Check for user preference first
    const preference = convexUser?.dashboardPreference as DashboardMode | undefined;
    
    if (preference && (preference === 'learn' || preference === 'create')) {
      redirect(`/dashboard?mode=${preference}`);
    }

    // Default: new users go to learn, creators go to create
    const stores = await fetchQuery(api.stores.getStoresByUser, {
      userId: user.id,
    });

    const defaultMode = stores && stores.length > 0 ? 'create' : 'learn';
    redirect(`/dashboard?mode=${defaultMode}`);
  }

  return (
    <DashboardShell mode={mode}>
      {mode === 'learn' ? <LearnModeContent /> : <CreateModeContent />}
    </DashboardShell>
  );
}
```

---

### 2. Dashboard Shell (Client Component)

```typescript
// app/dashboard/components/DashboardShell.tsx
'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './ModeToggle';
import { AppSidebarEnhanced } from '@/app/(dashboard)/components/app-sidebar-enhanced';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type DashboardMode = 'learn' | 'create';

interface DashboardShellProps {
  mode: DashboardMode;
  children: ReactNode;
}

export function DashboardShell({ mode, children }: DashboardShellProps) {
  const router = useRouter();
  const { user } = useUser();
  const savePreference = useMutation(api.users.setDashboardPreference);

  const handleModeChange = async (newMode: DashboardMode) => {
    // Update URL immediately (optimistic)
    router.replace(`/dashboard?mode=${newMode}`, { scroll: false });

    // Save preference in background (don't block UI)
    if (user?.id) {
      try {
        await savePreference({
          clerkId: user.id,
          preference: newMode,
        });
      } catch (error) {
        console.error('Failed to save preference:', error);
      }
    }
  };

  return (
    <SidebarProvider>
      <AppSidebarEnhanced />
      <main className="flex-1 flex flex-col w-full">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b border-border bg-card">
          <SidebarTrigger className="-ml-1 md:hidden" />
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-card-foreground">
              {mode === 'learn' ? 'My Learning' : 'Creator Studio'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onChange={handleModeChange} />

            {/* Quick actions */}
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full bg-background">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
```

---

### 3. Mode Toggle (Client Component)

```typescript
// app/dashboard/components/ModeToggle.tsx
'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardMode = 'learn' | 'create';

interface ModeToggleProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-xl border border-border p-1 bg-muted/50">
      <button
        onClick={() => onChange('learn')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
          mode === 'learn'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Learn</span>
      </button>
      
      <button
        onClick={() => onChange('create')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
          mode === 'create'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Create</span>
      </button>
    </div>
  );
}
```

---

### 4. Learn Mode Content (Wrapper)

```typescript
// app/dashboard/components/LearnModeContent.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Skeleton } from '@/components/ui/skeleton';

// Import your existing Library page content
// For v1, we literally just reuse it
import LibraryPageContent from '@/app/library/page';

export function LearnModeContent() {
  // Same queries as your library page
  const { user } = useUser();
  
  if (!user) {
    return <LoadingSkeleton />;
  }

  // Just render your existing Library page
  return <LibraryPageContent />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
```

---

### 5. Create Mode Content (Wrapper)

```typescript
// app/dashboard/components/CreateModeContent.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/skeleton';

// Import your existing Creator dashboard content
import { CreatorDashboardContent } from '@/components/dashboard/creator-dashboard-content';

export function CreateModeContent() {
  const { user } = useUser();
  
  if (!user) {
    return <LoadingSkeleton />;
  }

  // Just render your existing Creator dashboard
  return <CreatorDashboardContent />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
```

---

### 6. Middleware (Redirects)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware((auth, request: NextRequest) => {
  const url = request.nextUrl;
  
  // Redirect /library → /dashboard?mode=learn
  if (url.pathname === '/library') {
    return NextResponse.redirect(new URL('/dashboard?mode=learn', request.url));
  }
  
  // Redirect /library/* → /dashboard?mode=learn (preserve subpath if needed later)
  if (url.pathname.startsWith('/library/')) {
    return NextResponse.redirect(new URL('/dashboard?mode=learn', request.url));
  }
  
  // Redirect /home → /dashboard?mode=create
  if (url.pathname === '/home') {
    return NextResponse.redirect(new URL('/dashboard?mode=create', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/library/:path*',
    '/home/:path*',
    '/dashboard/:path*',
  ],
};
```

---

### 7. Update Convex Schema (if not already there)

```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Add this field
    dashboardPreference: v.optional(v.union(v.literal('learn'), v.literal('create'))),
  }).index('by_clerk_id', ['clerkId']),
  // ... rest of your schema
});
```

---

### 8. Add Convex Preference Functions (if not already there)

```typescript
// convex/users.ts
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const setDashboardPreference = mutation({
  args: {
    clerkId: v.string(),
    preference: v.union(v.literal('learn'), v.literal('create')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      // Create user if doesn't exist
      await ctx.db.insert('users', {
        clerkId: args.clerkId,
        dashboardPreference: args.preference,
      });
    } else {
      // Update preference
      await ctx.db.patch(user._id, {
        dashboardPreference: args.preference,
      });
    }

    return null;
  },
});
```

---

## What This Gives You

✅ **Unified home**: `/dashboard` is the one place  
✅ **Mode switching**: Toggle in top-right, instant  
✅ **Preference saved**: Convex remembers choice  
✅ **Redirects work**: Old URLs land in right mode  
✅ **No data migration**: Just wrapping existing views  
✅ **Ships in 2-3 days**: ~300 lines of new code

---

## Testing Checklist (v1)

- [ ] Navigate to `/dashboard` → redirects to `?mode=learn` or `?mode=create`
- [ ] Click mode toggle → URL updates, content switches
- [ ] Reload page → stays in same mode
- [ ] Navigate to `/library` → lands in `/dashboard?mode=learn`
- [ ] Navigate to `/home` → lands in `/dashboard?mode=create`
- [ ] Preference persists across sessions
- [ ] Mobile: mode toggle works, content is responsive

---

## What's NOT in v1

❌ Mode-aware subpages (`/dashboard/courses`, etc.)  
❌ Analytics events beyond console logs  
❌ Progressive rollout (just ship it)  
❌ Fancy animations  
❌ Empty states redesign  
❌ Cross-mode features

**Those are Phase 2.** Ship this first, see how it feels.

---

## Deploy Steps

1. Create feature branch: `git checkout -b feat/unified-dashboard-v1`
2. Add files above
3. Update schema in Convex dashboard
4. Test locally
5. Deploy to Vercel
6. Monitor for errors
7. Done ✅

---

## If Something Breaks

**Rollback**: Comment out middleware redirects, `/library` and `/home` work as before.

That's it. No complicated rollback, no feature flags, just comment out 10 lines.

---

## Analytics (Optional)

If you want ONE analytics event:

```typescript
// In DashboardShell handleModeChange
const handleModeChange = async (newMode: DashboardMode) => {
  // Track mode switch (optional)
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track('Dashboard Mode Changed', {
      from: mode,
      to: newMode,
    });
  }

  router.replace(`/dashboard?mode=${newMode}`, { scroll: false });
  
  // ... rest
};
```

**That's it.** Don't add more until you actually use it.

---

## Next Steps After v1 Ships

1. **Week 1**: Ship this, watch for errors
2. **Week 2**: Polish animations, add loading states
3. **Week 3**: Make `/dashboard/courses` mode-aware (if useful)
4. **Week 4**: Add cross-mode features ("Create from what you learned")

**But ship v1 FIRST.** Don't overthink it.

---

## Summary

**Shippable v1**:
- 6 new files
- ~300 lines of code
- 2-3 days to build
- Delivers core mental model
- Easy to rollback
- No analytics bloat

**Ship it, learn from it, iterate.**

