# Unified Dashboard - Implementation Checklist

**Use this as your tactical guide during implementation**

---

## ✅ Pre-Implementation

- [ ] Read `UNIFIED_DASHBOARD_EXECUTIVE_SUMMARY.md`
- [ ] Read `UNIFIED_DASHBOARD_ARCHITECTURE.md`
- [ ] Read `UNIFIED_DASHBOARD_CODE_GUIDE.md`
- [ ] Review `UNIFIED_DASHBOARD_VISUAL_GUIDE.md`
- [ ] Create feature branch: `feat/unified-dashboard`

---

## 📦 Week 1: Foundation

### Day 1: Setup & Hook

- [ ] Create directory: `app/dashboard/`
- [ ] Create directory: `app/dashboard/components/`
- [ ] Create file: `hooks/useDashboardPreference.ts`
- [ ] Implement `useDashboardPreference` hook
- [ ] Test hook with console logs

### Day 2: Convex Backend

- [ ] Update `convex/schema.ts` - Add `dashboardPreference` field to users table
- [ ] Add function: `convex/users.ts` → `getUserDashboardPreference`
- [ ] Add function: `convex/users.ts` → `setDashboardPreference`
- [ ] Test Convex functions in dashboard
- [ ] Push schema change to Convex

### Day 3: Core Components

- [ ] Create `app/dashboard/components/ModeToggle.tsx`
- [ ] Create `app/dashboard/components/DashboardShell.tsx`
- [ ] Create `app/dashboard/components/DashboardSidebar.tsx`
- [ ] Add basic styling (Tailwind)
- [ ] Test components in isolation

### Day 4: Main Dashboard Page

- [ ] Create `app/dashboard/page.tsx`
- [ ] Implement URL param handling
- [ ] Connect mode toggle to URL
- [ ] Test mode switching locally
- [ ] Fix TypeScript errors

### Day 5: Testing & Refinement

- [ ] Test on mobile (responsive)
- [ ] Test with keyboard navigation
- [ ] Test with screen reader
- [ ] Fix any visual bugs
- [ ] Commit and push to feature branch

**Week 1 Deliverable**: Working `/dashboard` route with mode toggle (not yet linked from nav)

---

## 📦 Week 2: Content Migration

### Day 1: Learn Mode Content

- [ ] Create `app/dashboard/components/LearnModeContent.tsx`
- [ ] Copy content from `app/library/page.tsx`
- [ ] Update all Convex queries (check userId vs clerkId)
- [ ] Remove hard-coded data, use real queries
- [ ] Test Learn mode with real user data

### Day 2: Create Mode Content

- [ ] Create `app/dashboard/components/CreateModeContent.tsx`
- [ ] Copy content from `app/(dashboard)/home/page.tsx`
- [ ] Update all Convex queries
- [ ] Add quick create action buttons
- [ ] Test Create mode with real user data

### Day 3: Stats & Empty States

- [ ] Build loading skeletons for both modes
- [ ] Build empty states (no courses, no products)
- [ ] Test empty states
- [ ] Add transitions/animations
- [ ] Polish visual details

### Day 4: Navigation Updates

- [ ] Update sidebar links to be mode-aware
- [ ] Ensure mode persists across navigation
- [ ] Test all internal links
- [ ] Fix broken links
- [ ] Update "return to dashboard" links in product editors

### Day 5: Integration Testing

- [ ] Test full user flow: Login → Learn → Create → Product creation
- [ ] Test switching modes during a session
- [ ] Test preference persistence
- [ ] Test with different user types (new, learner, creator, hybrid)
- [ ] Fix bugs found during testing

**Week 2 Deliverable**: Fully functional unified dashboard (ready for dark launch)

---

## 📦 Week 3: Dark Launch

### Day 1: Deploy to Production

- [ ] Merge feature branch to main (or staging)
- [ ] Deploy to production
- [ ] Verify `/dashboard` is accessible
- [ ] Test mode toggle in production
- [ ] No redirects enabled yet (just direct access)

### Day 2: Internal Testing

- [ ] Share `/dashboard` link with team
- [ ] Collect feedback from team
- [ ] Monitor Sentry for errors
- [ ] Check Convex logs for query issues
- [ ] Fix critical bugs

### Day 3: Analytics Setup

- [ ] Add analytics event: `Dashboard Mode Changed`
- [ ] Add analytics event: `Mode Session Duration`
- [ ] Add analytics event: `Learn to Create Conversion`
- [ ] Test analytics events fire correctly
- [ ] Set up dashboard in Mixpanel/Analytics tool

### Day 4: Performance Testing

- [ ] Run Lighthouse audit (desktop & mobile)
- [ ] Check page load time (target: < 2s)
- [ ] Check mode switch latency (target: < 200ms)
- [ ] Optimize if needed (lazy loading, code splitting)
- [ ] Re-test performance

### Day 5: Bug Fixes & Polish

- [ ] Fix all bugs found during week
- [ ] Polish animations/transitions
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test on different devices (iPhone, Android, tablet)
- [ ] Prepare for rollout

**Week 3 Deliverable**: Stable dashboard ready for user rollout

---

## 📦 Week 4: Gradual Rollout

### Day 1 (Monday): 10% Rollout

- [ ] Add middleware redirects (with feature flag)
- [ ] Enable redirects for 10% of users (env var or Convex setting)
- [ ] Deploy redirects to production
- [ ] Monitor analytics (mode switches, errors)
- [ ] Monitor support tickets

### Day 2 (Tuesday): Monitor & Fix

- [ ] Review analytics from Day 1
- [ ] Check error logs (Sentry)
- [ ] Fix any critical issues
- [ ] Deploy hotfixes if needed
- [ ] Prepare for 50% rollout

### Day 3 (Wednesday): 50% Rollout

- [ ] Bump feature flag to 50% of users
- [ ] Deploy to production
- [ ] Monitor analytics
- [ ] Check performance metrics
- [ ] Address any issues

### Day 4 (Thursday): Monitor & Fix

- [ ] Review analytics from 50% rollout
- [ ] Check error logs
- [ ] Fix any issues
- [ ] Test with different user segments
- [ ] Prepare for 100% rollout

### Day 5 (Friday): 100% Rollout

- [ ] Enable redirects for 100% of users
- [ ] Deploy to production
- [ ] Send email announcement to users
- [ ] Post in-app notification
- [ ] Update help docs / FAQs
- [ ] Monitor support channels
- [ ] Celebrate! 🎉

**Week 4 Deliverable**: Unified dashboard is live for all users

---

## 🔧 Middleware Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Feature flag (set in env or Convex)
  const ENABLE_UNIFIED_DASHBOARD = process.env.ENABLE_UNIFIED_DASHBOARD === 'true';
  
  if (!ENABLE_UNIFIED_DASHBOARD) {
    return NextResponse.next();
  }
  
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
  if (url.pathname === '/home') {
    return NextResponse.redirect(new URL('/dashboard?mode=create', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/library/:path*', '/home/:path*'],
};
```

---

## 🧪 Testing Checklist

### Functionality

- [ ] Mode toggle switches between learn and create
- [ ] URL updates when mode changes
- [ ] User preference is saved to Convex
- [ ] Preference persists on page reload
- [ ] Learn mode shows enrolled courses
- [ ] Create mode shows published products
- [ ] Sidebar links are mode-aware
- [ ] Redirects work from old URLs
- [ ] Quick create buttons work
- [ ] Stats cards show correct data

### Visual

- [ ] Mode toggle looks good on desktop
- [ ] Mode toggle looks good on mobile
- [ ] Sidebar is responsive
- [ ] Cards render correctly
- [ ] Loading skeletons display
- [ ] Empty states show when appropriate
- [ ] Animations are smooth
- [ ] Dark mode works

### Accessibility

- [ ] Mode toggle has focus states
- [ ] Screen reader announces mode changes
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Icons have text alternatives
- [ ] Skip links work

### Performance

- [ ] Page loads in < 2s
- [ ] Mode switch feels instant (< 200ms)
- [ ] No layout shift (CLS < 0.1)
- [ ] Images are optimized
- [ ] Code is properly split

### Edge Cases

- [ ] Works with no courses enrolled
- [ ] Works with no products created
- [ ] Works for new users
- [ ] Works without storeId
- [ ] Handles Convex query failures gracefully

---

## 📊 Analytics to Monitor

### Week 1 (10% rollout)

- [ ] Total users on new dashboard
- [ ] Mode switch rate
- [ ] Error rate
- [ ] Support tickets
- [ ] Page load time

### Week 2 (50% rollout)

- [ ] % users using both modes
- [ ] Average mode switches per session
- [ ] Time to first mode switch
- [ ] Learn → Create conversion rate
- [ ] Drop-off points

### Week 3 (100% rollout)

- [ ] Overall adoption rate
- [ ] NPS score change
- [ ] Support ticket volume change
- [ ] User retention change
- [ ] Creator activation rate

---

## 🚨 Rollback Procedure

If critical issues arise:

### Step 1: Disable Redirects (< 5 min)

```bash
# Set env var
ENABLE_UNIFIED_DASHBOARD=false

# Or update Convex setting
# Then redeploy
```

### Step 2: Communicate

- [ ] Post in #incidents Slack channel
- [ ] Email affected users (if needed)
- [ ] Add banner: "Dashboard improvements are temporarily paused"

### Step 3: Investigate

- [ ] Check Sentry for errors
- [ ] Check analytics for drop-offs
- [ ] Check support tickets
- [ ] Identify root cause

### Step 4: Fix or Postpone

- [ ] If quick fix (< 1 hour) → Fix and redeploy
- [ ] If complex → Roll back, fix in staging, re-test

---

## 📝 Communication Templates

### Email Announcement (Day of 100% rollout)

**Subject**: Introducing Your New Unified Dashboard

**Body**:
```
Hey [Name],

We've improved your dashboard experience! 

You now have a single home base with two modes:

📚 Learn Mode - View your courses, downloads, and progress
✨ Create Mode - Manage your products, sales, and analytics

Just toggle between modes at the top of your dashboard.

Your old bookmarks still work, so nothing is broken.

Check it out: [Link to dashboard]

Questions? Reply to this email.

- The PPR Team
```

### In-App Notification

```
🎉 New Unified Dashboard!

Toggle between Learn and Create modes from one place.

[Take a tour] [Dismiss]
```

---

## 🎯 Success Criteria Review

### After Week 1 (10% rollout)

- [ ] ✅ 0 critical errors
- [ ] ✅ < 1% mode switch failure rate
- [ ] ✅ No increase in support tickets

### After Week 2 (50% rollout)

- [ ] ✅ 10%+ of users switch modes
- [ ] ✅ Page load < 2s
- [ ] ✅ No performance degradation

### After Week 4 (100% rollout)

- [ ] ✅ 100% of users migrated
- [ ] ✅ 20%+ use both modes
- [ ] ✅ 0 broken links

### After Month 1

- [ ] ✅ 30% hybrid users
- [ ] ✅ 15% Learn → Create conversion
- [ ] ✅ -50% navigation support tickets
- [ ] ✅ +10 NPS improvement

---

## 🐛 Common Issues & Solutions

### Issue: Mode doesn't persist after page reload

**Solution**: Check localStorage AND Convex query
```typescript
// In useDashboardPreference hook
useEffect(() => {
  if (userPreference) {
    setLocalPreference(userPreference);
  } else {
    const stored = localStorage.getItem('dashboard-mode');
    if (stored) setLocalPreference(stored as DashboardMode);
  }
}, [userPreference]);
```

### Issue: Sidebar links don't have mode param

**Solution**: Always include mode in href
```typescript
href: `/dashboard/courses?mode=${mode}`
```

### Issue: Product creation returns to wrong mode

**Solution**: Add return URL in product creation flow
```typescript
router.push('/dashboard?mode=create');
```

### Issue: Mobile mode toggle is hard to tap

**Solution**: Increase touch target size
```typescript
className="px-4 py-3" // At least 44px height
```

---

## 📚 Files to Create/Modify

### New Files (Create)

- [ ] `hooks/useDashboardPreference.ts`
- [ ] `app/dashboard/page.tsx`
- [ ] `app/dashboard/layout.tsx`
- [ ] `app/dashboard/components/ModeToggle.tsx`
- [ ] `app/dashboard/components/DashboardShell.tsx`
- [ ] `app/dashboard/components/DashboardSidebar.tsx`
- [ ] `app/dashboard/components/LearnModeContent.tsx`
- [ ] `app/dashboard/components/CreateModeContent.tsx`

### Modified Files

- [ ] `convex/schema.ts` (add dashboardPreference)
- [ ] `convex/users.ts` (add preference functions)
- [ ] `middleware.ts` (add redirects)
- [ ] Product creation flows (update return URLs)

### Optional Files

- [ ] `app/dashboard/components/DashboardHeader.tsx` (if you want to extract header)
- [ ] `app/dashboard/components/StatsCard.tsx` (reusable stat card)

---

## 🎉 Launch Day Checklist

- [ ] Deploy to production
- [ ] Enable redirects (100%)
- [ ] Send email announcement
- [ ] Post in-app notification
- [ ] Update help docs
- [ ] Monitor Sentry dashboard
- [ ] Monitor analytics dashboard
- [ ] Monitor support inbox
- [ ] Post in team Slack
- [ ] Tweet about it (optional)
- [ ] Celebrate with team! 🎊

---

**Good luck! You've got this. Ship small, iterate fast, learn from users.**

