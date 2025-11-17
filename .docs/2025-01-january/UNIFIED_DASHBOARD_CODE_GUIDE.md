# Unified Dashboard - Code Implementation Guide

**Companion to**: `UNIFIED_DASHBOARD_ARCHITECTURE.md`  
**Purpose**: Concrete code examples and step-by-step implementation

---

## Quick Start: What You're Building

**Before**: Two separate dashboards
- `/library` - Learner dashboard (700+ lines)
- `/home` - Creator dashboard (different nav, different data)

**After**: One unified dashboard
- `/dashboard?mode=learn` - Learn mode
- `/dashboard?mode=create` - Create mode
- Seamless toggle between modes
- Shared layout, mode-aware content

---

## Step 1: Create the Hook for Dashboard Preference

```typescript
// hooks/useDashboardPreference.ts
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export type DashboardMode = 'learn' | 'create';

export function useDashboardPreference() {
  const { user } = useUser();
  const [localPreference, setLocalPreference] = useState<DashboardMode>('learn');

  // Get user's saved preference from Convex
  const userPreference = useQuery(
    api.users.getUserDashboardPreference,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const savePreference = useMutation(api.users.setDashboardPreference);

  // Initialize from user preference or localStorage
  useEffect(() => {
    if (userPreference) {
      setLocalPreference(userPreference as DashboardMode);
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem('dashboard-mode') as DashboardMode;
      if (stored) setLocalPreference(stored);
    }
  }, [userPreference]);

  const setPreference = async (mode: DashboardMode) => {
    setLocalPreference(mode);
    localStorage.setItem('dashboard-mode', mode);
    
    // Save to Convex if user is logged in
    if (user?.id) {
      await savePreference({ clerkId: user.id, preference: mode });
    }
  };

  return { preference: localPreference, setPreference };
}
```

---

## Step 2: Add Convex Functions for Preference

```typescript
// convex/users.ts (add these functions)

import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const getUserDashboardPreference = query({
  args: { clerkId: v.string() },
  returns: v.union(v.literal('learn'), v.literal('create'), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    return user?.dashboardPreference || null;
  },
});

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
      throw new Error('User not found');
    }

    await ctx.db.patch(user._id, {
      dashboardPreference: args.preference,
    });

    return null;
  },
});
```

**Don't forget to add to schema**:

```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    // ... existing fields ...
    dashboardPreference: v.optional(v.union(v.literal('learn'), v.literal('create'))),
  }).index('by_clerk_id', ['clerkId']),
  // ... other tables ...
});
```

---

## Step 3: Create Mode Toggle Component

```typescript
// app/dashboard/components/ModeToggle.tsx
'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardMode } from '@/hooks/useDashboardPreference';

interface ModeToggleProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
  className?: string;
}

export function ModeToggle({ mode, onChange, className }: ModeToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-border p-1 bg-muted/50 backdrop-blur-sm',
        className
      )}
    >
      <button
        onClick={() => onChange('learn')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium',
          mode === 'learn'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        )}
      >
        <BookOpen className="w-4 h-4" />
        <span>Learn</span>
      </button>
      
      <button
        onClick={() => onChange('create')}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium',
          mode === 'create'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span>Create</span>
      </button>
    </div>
  );
}
```

---

## Step 4: Create Dashboard Shell (Layout)

```typescript
// app/dashboard/components/DashboardShell.tsx
'use client';

import { ReactNode } from 'react';
import { ModeToggle } from './ModeToggle';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardMode } from '@/hooks/useDashboardPreference';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, Search, Settings } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface DashboardShellProps {
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  children: ReactNode;
}

export function DashboardShell({ mode, onModeChange, children }: DashboardShellProps) {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar mode={mode} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {mode === 'learn' ? 'My Learning' : 'Creator Studio'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onChange={onModeChange} />

            {/* Search */}
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>

            {/* User Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## Step 5: Create Mode-Aware Sidebar

```typescript
// app/dashboard/components/DashboardSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DashboardMode } from '@/hooks/useDashboardPreference';
import {
  Home,
  BookOpen,
  Download,
  Award,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Settings,
  Music,
} from 'lucide-react';

interface DashboardSidebarProps {
  mode: DashboardMode;
}

const learnLinks = [
  { href: '/dashboard?mode=learn', label: 'Dashboard', icon: Home },
  { href: '/dashboard/courses?mode=learn', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/downloads?mode=learn', label: 'Downloads', icon: Download },
  { href: '/dashboard/certificates?mode=learn', label: 'Certificates', icon: Award },
  { href: '/dashboard/analytics?mode=learn', label: 'Progress', icon: TrendingUp },
];

const createLinks = [
  { href: '/dashboard?mode=create', label: 'Dashboard', icon: Home },
  { href: '/dashboard/products?mode=create', label: 'My Products', icon: Package },
  { href: '/dashboard/courses?mode=create', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/samples?mode=create', label: 'Samples', icon: Music },
  { href: '/dashboard/customers?mode=create', label: 'Customers', icon: Users },
  { href: '/dashboard/analytics?mode=create', label: 'Analytics', icon: BarChart3 },
];

export function DashboardSidebar({ mode }: DashboardSidebarProps) {
  const pathname = usePathname();
  const links = mode === 'learn' ? learnLinks : createLinks;

  return (
    <aside className="w-64 border-r border-border bg-card p-4">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg" />
          <span className="font-bold text-lg">PPR</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href.split('?')[0] || 
                          (link.href === `/dashboard?mode=${mode}` && pathname === '/dashboard');
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings (bottom) */}
      <div className="absolute bottom-4 left-4 right-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
```

---

## Step 6: Create Learn Mode Content

```typescript
// app/dashboard/components/LearnModeContent.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Award, Clock, TrendingUp, Download, Music, Package } from 'lucide-react';
import { CourseCardEnhanced } from '@/components/ui/course-card-enhanced';
import { Skeleton } from '@/components/ui/skeleton';

export function LearnModeContent() {
  const { user } = useUser();
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Fetch enrolled courses
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch library stats
  const stats = useQuery(
    api.userLibrary.getUserLibraryStats,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch purchased products
  const purchases = useQuery(
    api.library.getUserPurchases,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  const isLoading = !user || convexUser === undefined || stats === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-chart-1 to-chart-4 rounded-2xl p-8 text-primary-foreground">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'Student'}! 👋
        </h1>
        <p className="text-primary-foreground/80">
          Ready to continue your music production journey?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Enrolled</p>
                <p className="text-2xl font-bold">{stats?.coursesEnrolled || 0}</p>
              </div>
              <BookOpen className="w-8 h-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats?.coursesCompleted || 0}</p>
              </div>
              <Award className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Learned</p>
                <p className="text-2xl font-bold">{stats?.totalHoursLearned || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-chart-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Continue Learning</h2>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Browse Courses
          </Button>
        </div>

        {enrolledCourses && enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course: any) => (
              <CourseCardEnhanced
                key={course._id}
                id={course._id}
                title={course.title}
                description={course.description || ''}
                imageUrl={course.imageUrl || ''}
                price={course.price || 0}
                category={course.category || 'Course'}
                skillLevel={course.skillLevel || 'Beginner'}
                slug={course.slug || ''}
                progress={course.progress || 0}
                isEnrolled={true}
                variant="default"
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your learning journey by enrolling in a course.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Browse Courses
            </Button>
          </Card>
        )}
      </div>

      {/* Downloads */}
      {purchases && purchases.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Downloads</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.slice(0, 4).map((purchase: any) => (
              <Card key={purchase._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                      {purchase.product?.productCategory === 'sample-pack' ? (
                        <Music className="w-8 h-8 text-purple-600" />
                      ) : (
                        <Package className="w-8 h-8 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{purchase.product?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
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

## Step 7: Create Create Mode Content

```typescript
// app/dashboard/components/CreateModeContent.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Music,
  Package,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  Play,
  Headphones,
  BarChart3,
} from 'lucide-react';
import { useValidStoreId } from '@/hooks/useStoreId';
import Link from 'next/link';

export function CreateModeContent() {
  const { user } = useUser();
  const storeId = useValidStoreId();
  
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Fetch created courses
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch digital products
  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : 'skip'
  );

  const allProducts = [...(userCourses || []), ...(digitalProducts || [])];
  const publishedCount = allProducts.filter((p: any) => p.isPublished).length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Creator Studio
          </h1>
          <p className="text-muted-foreground">
            Manage your products and grow your music business
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Link href={`/store/${storeId}/products`}>
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Total Products</p>
                <p className="text-2xl font-bold">{allProducts.length}</p>
                <p className="text-xs text-white/70">Published: {publishedCount}</p>
              </div>
              <Package className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Revenue</p>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-xs text-white/70">+0% from last month</p>
              </div>
              <DollarSign className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Downloads</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-white/70">All time</p>
              </div>
              <Download className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Growth</p>
                <p className="text-2xl font-bold">+0%</p>
                <p className="text-xs text-white/70">This month</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Create</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Sample Pack',
              icon: Music,
              color: 'from-purple-500 to-pink-500',
              href: `/store/${storeId}/products/pack/create?type=sample-pack`,
            },
            {
              label: 'Preset Pack',
              icon: Package,
              color: 'from-blue-500 to-cyan-500',
              href: `/store/${storeId}/products/pack/create?type=preset-pack`,
            },
            {
              label: 'Course',
              icon: BookOpen,
              color: 'from-green-500 to-emerald-500',
              href: `/store/${storeId}/course/create`,
            },
            {
              label: 'Coaching',
              icon: Headphones,
              color: 'from-orange-500 to-red-500',
              href: `/store/${storeId}/products/coaching-call/create`,
            },
          ].map((action) => (
            <Card key={action.label} className="cursor-pointer hover:shadow-lg transition-all">
              <Link href={action.href}>
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-medium">{action.label}</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Products */}
      {allProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Recent Products</h2>
            <Button variant="outline" asChild>
              <Link href="/dashboard/products?mode=create">View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {allProducts.slice(0, 5).map((product: any) => (
              <Card key={product._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      {product.type === 'course' ? (
                        <Play className="w-6 h-6 text-white" />
                      ) : (
                        <Music className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={product.isPublished ? 'default' : 'secondary'}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">${product.price || 0}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allProducts.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Products Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first product to start earning from your music
          </p>
          <Button asChild>
            <Link href={`/store/${storeId}/products`}>
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
```

---

## Step 8: Main Dashboard Page (Orchestrates Everything)

```typescript
// app/dashboard/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDashboardPreference, DashboardMode } from '@/hooks/useDashboardPreference';
import { DashboardShell } from './components/DashboardShell';
import { LearnModeContent } from './components/LearnModeContent';
import { CreateModeContent } from './components/CreateModeContent';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

export default function UnifiedDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { preference, setPreference } = useDashboardPreference();
  
  // Get mode from URL or user preference
  const urlMode = searchParams.get('mode') as DashboardMode | null;
  const [mode, setMode] = useState<DashboardMode>(
    urlMode || preference || 'learn'
  );

  // Sync URL with mode
  useEffect(() => {
    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    }
  }, [urlMode]);

  // Handle mode change
  const handleModeChange = (newMode: DashboardMode) => {
    setMode(newMode);
    setPreference(newMode);
    router.replace(`/dashboard?mode=${newMode}`, { scroll: false });
    
    toast({
      title: `Switched to ${newMode === 'learn' ? 'Learn' : 'Create'} Mode`,
      description: newMode === 'learn' 
        ? 'View your courses and learning progress'
        : 'Manage your products and sales',
      className: 'bg-white dark:bg-black',
    });
  };

  return (
    <DashboardShell mode={mode} onModeChange={handleModeChange}>
      {mode === 'learn' ? <LearnModeContent /> : <CreateModeContent />}
    </DashboardShell>
  );
}
```

---

## Step 9: Add Redirects in Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Redirect /library to /dashboard?mode=learn
  if (url.pathname === '/library') {
    return NextResponse.redirect(new URL('/dashboard?mode=learn', request.url));
  }
  
  // Redirect /library/* to /dashboard/*?mode=learn
  if (url.pathname.startsWith('/library/')) {
    const subPath = url.pathname.replace('/library', '/dashboard');
    return NextResponse.redirect(new URL(`${subPath}?mode=learn`, request.url));
  }
  
  // Redirect /home to /dashboard?mode=create
  if (url.pathname === '/home' || url.pathname === '/(dashboard)/home') {
    return NextResponse.redirect(new URL('/dashboard?mode=create', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/library/:path*', '/home/:path*', '/(dashboard)/home/:path*'],
};
```

---

## Step 10: Update Dashboard Layout (if needed)

```typescript
// app/dashboard/layout.tsx
import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // No sidebar wrapper needed - handled in DashboardShell
  return <>{children}</>;
}
```

---

## Testing Checklist

### Functionality Tests
- [ ] `/library` redirects to `/dashboard?mode=learn`
- [ ] `/home` redirects to `/dashboard?mode=create`
- [ ] Mode toggle switches between learn and create
- [ ] URL updates when mode changes
- [ ] User preference is saved
- [ ] Preference persists on page reload
- [ ] Learn mode shows enrolled courses
- [ ] Create mode shows published products
- [ ] Sidebar links are mode-aware
- [ ] Quick create buttons work in create mode

### Visual Tests
- [ ] Mode toggle looks good on mobile
- [ ] Sidebar is responsive
- [ ] Cards render correctly in both modes
- [ ] Loading states work
- [ ] Empty states show when no data
- [ ] Stats cards display correctly

### Edge Cases
- [ ] What if user has no courses?
- [ ] What if user has no products?
- [ ] What if user is not logged in?
- [ ] What if storeId is missing?
- [ ] What if Convex query fails?

---

## Deployment Strategy

### Phase 1: Dark Launch (Week 1)
- Deploy to production behind feature flag
- Only accessible via direct URL (`/dashboard`)
- Monitor errors, performance

### Phase 2: Gradual Rollout (Week 2)
- Enable for 10% of users
- Add redirects from `/library` and `/home`
- Monitor analytics (mode switches, time in each mode)

### Phase 3: Full Rollout (Week 3)
- Enable for 100% of users
- Remove old `/library` and `/home` pages
- Update all internal links
- Announce to users

---

## Next Steps

After unified dashboard is live:
1. Migrate sub-pages (courses, products, analytics)
2. Unify product creation flows
3. Add cross-mode features
4. Improve onboarding for new users
5. Add intelligent recommendations

---

## Summary

You now have:
✅ One unified dashboard (`/dashboard`)  
✅ Two clear modes (Learn & Create)  
✅ Mode toggle in header  
✅ Mode-aware sidebar navigation  
✅ User preference saved  
✅ Redirects from old URLs  
✅ Specialized product creation flows (unchanged)

**Ship small, iterate fast, learn from users.**

