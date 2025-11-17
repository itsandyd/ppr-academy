# Unified Dashboard Architecture - PausePlayRepeat

**Status**: Proposal  
**Created**: 2025-11-17  
**Author**: Product Engineering Team

---

## Overview

This document outlines the architecture for unifying the "Library" (learner) and "Creator" dashboards into a single, mode-aware dashboard experience.

## Problem Statement

Currently, PausePlayRepeat treats learners and creators as two separate user types:
- `/library/*` - Learner dashboard
- `/home` - Creator dashboard

**Reality**: Most users are BOTH. They learn AND create, just at different times.

## Solution: Unified Dashboard with Learn/Create Modes

Move to a single home base with two clear modes:
- **Learn Mode**: Consume content (courses, samples, presets)
- **Create Mode**: Publish content and manage products

---

## 1. Information Architecture

### URL Structure

```
Primary Routes:
/dashboard                           → Main unified dashboard
/dashboard?mode=learn                → Learn mode (default for new users)
/dashboard?mode=create               → Create mode (default for creators)

Sub-pages (mode-aware):
/dashboard/courses                   → My courses (context switches based on mode)
/dashboard/products                  → My products (purchased vs published)
/dashboard/downloads                 → Downloads (learn only)
/dashboard/analytics                 → Analytics (consumption vs sales)
/dashboard/certificates              → Certificates (learn only)
/dashboard/customers                 → Customers (create only)
/dashboard/settings                  → Unified settings
```

### Product Creation Flows (Unchanged)

```
These remain specialized and unchanged:
/store/[storeId]/course/create
/store/[storeId]/products/coaching-call/create
/store/[storeId]/products/digital-download/create
/store/[storeId]/products/ableton-rack/create
/store/[storeId]/products/pack/create
```

**Why?** Product creation is complex and specialized. Unifying the creation flows is Phase 2. For now, we just need consistent entry points.

---

## 2. File Structure

```
app/
  dashboard/
    # Core dashboard
    layout.tsx                      ← Shell with mode-aware nav
    page.tsx                        ← Main dashboard (mode switcher)
    
    # Shared components
    components/
      DashboardShell.tsx            ← Outer shell
      ModeToggle.tsx                ← Learn ⟷ Create switcher
      UnifiedNav.tsx                ← Mode-aware navigation
      LearnModeContent.tsx          ← Learn mode dashboard
      CreateModeContent.tsx         ← Create mode dashboard
      
    # Sub-pages (mode-aware)
    courses/
      page.tsx                      ← Shows enrolled OR created courses
    products/
      page.tsx                      ← Shows purchased OR published products
    downloads/
      page.tsx                      ← Learn mode only
    certificates/
      page.tsx                      ← Learn mode only
    customers/
      page.tsx                      ← Create mode only
    analytics/
      page.tsx                      ← Mode-aware analytics
    settings/
      page.tsx                      ← Unified settings
```

---

## 3. Component Architecture

### DashboardShell Component

**Purpose**: Provide consistent layout for all dashboard views

```typescript
// app/dashboard/components/DashboardShell.tsx
interface DashboardShellProps {
  mode: 'learn' | 'create';
  onModeChange: (mode: 'learn' | 'create') => void;
  children: React.ReactNode;
}

export function DashboardShell({ mode, onModeChange, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav with Mode Toggle */}
      <DashboardHeader mode={mode} onModeChange={onModeChange} />
      
      {/* Sidebar (mode-aware links) */}
      <div className="flex flex-1">
        <DashboardSidebar mode={mode} />
        
        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### ModeToggle Component

**Purpose**: Clean switcher between Learn and Create modes

```typescript
// app/dashboard/components/ModeToggle.tsx
interface ModeToggleProps {
  mode: 'learn' | 'create';
  onChange: (mode: 'learn' | 'create') => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
      <button
        onClick={() => onChange('learn')}
        className={cn(
          "px-4 py-2 rounded-md transition-all text-sm font-medium",
          mode === 'learn' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BookOpen className="w-4 h-4 mr-2 inline" />
        Learn
      </button>
      <button
        onClick={() => onChange('create')}
        className={cn(
          "px-4 py-2 rounded-md transition-all text-sm font-medium",
          mode === 'create' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Sparkles className="w-4 h-4 mr-2 inline" />
        Create
      </button>
    </div>
  );
}
```

### Main Dashboard Page

```typescript
// app/dashboard/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardShell } from './components/DashboardShell';
import { LearnModeContent } from './components/LearnModeContent';
import { CreateModeContent } from './components/CreateModeContent';
import { useDashboardPreference } from '@/hooks/useDashboardPreference';

export default function UnifiedDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get user's saved preference or default to 'learn'
  const { preference, setPreference } = useDashboardPreference();
  
  // Mode from URL or user preference
  const urlMode = searchParams.get('mode') as 'learn' | 'create' | null;
  const [mode, setMode] = useState<'learn' | 'create'>(
    urlMode || preference || 'learn'
  );

  // Update URL when mode changes
  const handleModeChange = (newMode: 'learn' | 'create') => {
    setMode(newMode);
    setPreference(newMode); // Save preference
    router.replace(`/dashboard?mode=${newMode}`, { scroll: false });
  };

  // Sync URL with state
  useEffect(() => {
    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    }
  }, [urlMode]);

  return (
    <DashboardShell mode={mode} onModeChange={handleModeChange}>
      {mode === 'learn' ? <LearnModeContent /> : <CreateModeContent />}
    </DashboardShell>
  );
}
```

---

## 4. Mode-Aware Navigation

### Sidebar Links

```typescript
// app/dashboard/components/DashboardSidebar.tsx
const getNavLinks = (mode: 'learn' | 'create') => {
  if (mode === 'learn') {
    return [
      { href: '/dashboard?mode=learn', label: 'Dashboard', icon: Home },
      { href: '/dashboard/courses?mode=learn', label: 'My Courses', icon: BookOpen },
      { href: '/dashboard/downloads?mode=learn', label: 'Downloads', icon: Download },
      { href: '/dashboard/certificates?mode=learn', label: 'Certificates', icon: Award },
      { href: '/dashboard/analytics?mode=learn', label: 'Progress', icon: TrendingUp },
    ];
  }
  
  // Create mode
  return [
    { href: '/dashboard?mode=create', label: 'Dashboard', icon: Home },
    { href: '/dashboard/products?mode=create', label: 'My Products', icon: Package },
    { href: '/dashboard/courses?mode=create', label: 'My Courses', icon: BookOpen },
    { href: '/dashboard/customers?mode=create', label: 'Customers', icon: Users },
    { href: '/dashboard/analytics?mode=create', label: 'Analytics', icon: BarChart },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];
};
```

---

## 5. Migration Strategy

### Phase 1: Create Unified Routes (Week 1)

**Goals**:
- Set up `/dashboard` with mode toggle
- Redirect `/library` → `/dashboard?mode=learn`
- Redirect `/home` → `/dashboard?mode=create`
- Keep existing pages working

**Implementation**:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Redirect old library routes
  if (url.pathname === '/library') {
    return NextResponse.redirect(new URL('/dashboard?mode=learn', request.url));
  }
  
  if (url.pathname.startsWith('/library/')) {
    const subPath = url.pathname.replace('/library', '/dashboard');
    return NextResponse.redirect(new URL(`${subPath}?mode=learn`, request.url));
  }
  
  // Redirect old creator dashboard
  if (url.pathname === '/home' || url.pathname === '/(dashboard)/home') {
    return NextResponse.redirect(new URL('/dashboard?mode=create', request.url));
  }
  
  return NextResponse.next();
}
```

### Phase 2: Migrate Content (Week 2-3)

**Goals**:
- Move Library content into `LearnModeContent.tsx`
- Move Creator dashboard into `CreateModeContent.tsx`
- Test all flows with mode switching

**Migration Steps**:
1. Copy `/library/page.tsx` → `/dashboard/components/LearnModeContent.tsx`
2. Copy `/home/page.tsx` (creator dashboard) → `/dashboard/components/CreateModeContent.tsx`
3. Update all internal links to use mode-aware URLs
4. Test switching between modes
5. Update analytics to track mode switches

### Phase 3: Polish & Optimize (Week 4)

**Goals**:
- Smooth transitions between modes
- Save user preference
- Update onboarding flows
- Performance optimization

---

## 6. Product Editor Integration

**Key Principle**: Product editors stay specialized. We just need consistent entry points.

### Entry Points from Dashboard

**Learn Mode** → No product creation (just consumption)

**Create Mode** → Quick create buttons:

```typescript
// In CreateModeContent.tsx
const createActions = [
  {
    label: 'Course',
    icon: BookOpen,
    href: `/store/${storeId}/course/create`,
    description: 'Teach production skills'
  },
  {
    label: 'Sample Pack',
    icon: Music,
    href: `/store/${storeId}/products/pack/create?type=sample-pack`,
    description: 'Share beats and loops'
  },
  {
    label: 'Preset Pack',
    icon: Package,
    href: `/store/${storeId}/products/pack/create?type=preset-pack`,
    description: 'Upload synth presets'
  },
  {
    label: 'Coaching',
    icon: Users,
    href: `/store/${storeId}/products/coaching-call/create`,
    description: '1-on-1 mentoring'
  },
  // etc...
];
```

### Return Navigation

After creating a product, return to create mode dashboard:

```typescript
// In product creation flows
const handleComplete = () => {
  router.push('/dashboard?mode=create');
  toast.success('Product created! View in your dashboard.');
};
```

---

## 7. User Experience Flow

### New User Flow

1. Signs up → onboarding modal
2. Asked: "What brings you here?"
   - "I want to learn" → Sets preference to `learn`, lands on `/dashboard?mode=learn`
   - "I want to create" → Sets preference to `create`, lands on `/dashboard?mode=create`
3. Can always toggle modes from dashboard

### Existing User Migration

1. First visit to `/library` → Redirected to `/dashboard?mode=learn`
2. Toast: "We've unified the dashboard! Switch to Create mode to publish content."
3. Preference saved based on which URL they use most

### Power User Flow

1. Hybrid user (learns AND creates)
2. Starts in Learn mode, browsing courses
3. Gets inspired → Clicks mode toggle → Switches to Create
4. Creates course → Publishes
5. Switches back to Learn to check progress on other courses

---

## 8. Data Queries (Mode-Aware)

### Learn Mode Queries

```typescript
// Get enrolled courses
const enrolledCourses = useQuery(
  api.userLibrary.getUserEnrolledCourses,
  { userId: user.id }
);

// Get purchased products
const purchasedProducts = useQuery(
  api.library.getUserPurchases,
  { userId: user.id }
);

// Get learning progress
const learningStats = useQuery(
  api.userLibrary.getUserLibraryStats,
  { userId: user.id }
);
```

### Create Mode Queries

```typescript
// Get created courses
const createdCourses = useQuery(
  api.courses.getCoursesByUser,
  { userId: convexUser?._id }
);

// Get published products
const publishedProducts = useQuery(
  api.digitalProducts.getProductsByStore,
  { storeId }
);

// Get sales analytics
const salesStats = useQuery(
  api.analytics.getCreatorStats,
  { userId: convexUser?._id }
);
```

---

## 9. Analytics & Tracking

Track mode switches to understand user behavior:

```typescript
// In ModeToggle component
const handleModeChange = (newMode: 'learn' | 'create') => {
  // Track mode switch
  analytics.track('Dashboard Mode Changed', {
    from: mode,
    to: newMode,
    timestamp: Date.now(),
  });
  
  onChange(newMode);
};
```

**Metrics to Track**:
- Mode switch frequency
- Time spent in each mode
- % of users who use both modes
- Conversion: Learn → Create
- Entry points to product creation from Create mode

---

## 10. Future Enhancements (Phase 2+)

Once the unified dashboard is stable:

1. **Unified Product Creation**: Standardize all product creation flows
2. **Cross-Mode Features**: 
   - "Create a course about this" (from Learn mode)
   - "Preview as learner" (from Create mode)
3. **Intelligent Recommendations**:
   - In Learn mode: "Based on your learning, you could create..."
   - In Create mode: "Learn from these creators in your niche"
4. **Activity Feed**: Combined view of learning progress and creator milestones
5. **Collaborative Features**: Learn from other creators, create with other learners

---

## 11. Implementation Checklist

### Week 1: Foundation
- [ ] Create `/app/dashboard` directory structure
- [ ] Build `DashboardShell` component
- [ ] Build `ModeToggle` component  
- [ ] Set up URL param handling (`?mode=learn|create`)
- [ ] Create `useDashboardPreference` hook
- [ ] Add redirects in middleware

### Week 2: Content Migration
- [ ] Migrate Library content to `LearnModeContent.tsx`
- [ ] Migrate Creator dashboard to `CreateModeContent.tsx`
- [ ] Update all internal navigation links
- [ ] Test mode switching
- [ ] Update sidebar navigation (mode-aware)

### Week 3: Integration
- [ ] Update product creation entry points
- [ ] Update product creation "return" flows
- [ ] Add analytics tracking
- [ ] Test all user flows (new user, existing learner, existing creator, hybrid)
- [ ] Performance optimization

### Week 4: Polish & Launch
- [ ] Smooth transitions between modes
- [ ] Loading states
- [ ] Error states
- [ ] Mobile responsive design
- [ ] Accessibility audit
- [ ] Documentation for team
- [ ] Staged rollout (10% → 50% → 100%)

---

## Success Metrics

**Short-term (1 month)**:
- 0 broken links from old `/library` or `/home` routes
- < 3 second mode switch time
- > 80% user preference saved correctly

**Medium-term (3 months)**:
- 20%+ of users use BOTH modes
- 15%+ conversion from Learn → Create
- Net Promoter Score (NPS) improvement

**Long-term (6 months)**:
- Unified dashboard is the default for 100% of users
- 30%+ of users are hybrid (use both modes weekly)
- Reduced support tickets about "where do I find X?"

---

## Open Questions & Decisions Needed

1. **Default mode for existing users?**
   - Option A: Detect based on history (have they created products?)
   - Option B: Ask them on first unified dashboard visit
   - **Recommendation**: Option A with ability to override

2. **Should we show mode toggle in product editors?**
   - Option A: Yes, quick switch back to dashboard
   - Option B: No, keep editors focused
   - **Recommendation**: Option A, but in header not main nav

3. **URL structure for sub-pages?**
   - Option A: `/dashboard/courses?mode=learn`
   - Option B: `/dashboard/learn/courses` and `/dashboard/create/courses`
   - **Recommendation**: Option A (simpler, mode inheritance)

---

## Conclusion

This unified dashboard gives users **one home base** with **two clear modes**. It reduces cognitive load, makes switching contexts seamless, and sets the foundation for deeper integrations between learning and creating.

**Start small, ship incrementally, learn from users.**

