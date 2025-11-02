# Added "Plan & Billing" to Creator Dashboard Sidebar

## Date: November 2, 2025

## Summary
Added a dedicated "Plan & Billing" link directly to the creator dashboard sidebar for easier access to profile visibility settings and subscription management.

---

## Changes Made

### 1. **Added CreditCard Icon Import**
**File:** `app/(dashboard)/components/app-sidebar-enhanced.tsx`

Added `CreditCard` to the lucide-react imports to use as the icon for Plan & Billing.

```typescript
import { 
  // ... existing icons
  CreditCard
} from "lucide-react";
```

---

### 2. **Added "Plan & Billing" Navigation Item**
**File:** `app/(dashboard)/components/app-sidebar-enhanced.tsx`

Added new navigation item in the "Manage & Monetize" section:

```typescript
{
  label: "Manage & Monetize",
  items: [
    { 
      icon: Store, 
      href: `/store/${storeId || 'setup'}/products`, 
      label: "My Products",
      gradient: "from-rose-500 to-pink-500"
    },
    { 
      icon: DollarSign, 
      href: `/store/${storeId || 'setup'}/settings/payouts`, 
      label: "Earnings",
      gradient: "from-green-500 to-emerald-500"
    },
    { 
      icon: CreditCard,                            // ← NEW
      href: `/store/${storeId || 'setup'}/plan`,   // ← NEW
      label: "Plan & Billing",                     // ← NEW
      gradient: "from-violet-500 to-purple-500"    // ← NEW
    },
    { 
      icon: Settings, 
      href: `/store/${storeId || 'setup'}/options`, 
      label: "Settings",
      gradient: "from-gray-500 to-slate-500"
    },
  ]
}
```

---

### 3. **Updated Page Title Recognition**
**File:** `app/(dashboard)/components/sidebar-wrapper.tsx`

Added route recognition for the Plan & Billing page:

```typescript
const getPageTitle = () => {
  if (pathname === "/home") return "Dashboard";
  if (pathname === "/home/analytics") return "Analytics";
  if (pathname.startsWith("/store/")) {
    if (pathname.includes("/products")) return "Products";
    if (pathname.includes("/customers")) return "Customers";
    if (pathname.includes("/email-campaigns")) return "Emails";
    if (pathname.includes("/inbox")) return "Customer Inbox";
    if (pathname.includes("/social")) return "Socials";
    if (pathname.includes("/automations")) return "Automations";
    if (pathname.includes("/plan")) return "Plan & Billing"; // ← NEW
    if (pathname.includes("/options")) return "Settings";
    if (pathname.includes("/settings")) return "Store Settings";
  }
  return "Creator Studio";
};
```

---

## New Sidebar Structure

### **Manage & Monetize Section**
1. 📦 My Products
2. 💰 Earnings
3. 💳 **Plan & Billing** ← NEW
4. ⚙️ Settings

---

## What This Enables

### For All Users:
✅ **Easier Access** - One click from sidebar instead of buried in settings
✅ **Better Discoverability** - New creators can find plan options quickly
✅ **Visual Hierarchy** - CreditCard icon makes it clear this is about billing

### For Free Plan Users:
✅ See what features are locked
✅ Easy upgrade path to Creator or Creator Pro
✅ Understand why they can't make profile public

### For Paid Plan Users:
✅ Quick access to profile visibility toggle
✅ Manage subscription settings
✅ View usage statistics

---

## User Flow

**Old Flow (3 clicks):**
1. Click "Settings" in sidebar
2. Navigate to "Plan" tab/section
3. Find "Profile Visibility" toggle

**New Flow (1 click):**
1. Click "Plan & Billing" in sidebar → directly opens plan page with visibility toggle

---

## Plan Page Features (Reminder)

The `/store/[storeId]/plan` page includes:

1. **Current Plan Card**
   - Shows active plan (Free, Creator, Creator Pro)
   - Trial status (if applicable)
   - Usage statistics

2. **Profile Visibility Card**
   - Toggle for "Make Profile Public"
   - Explains what public/private means
   - Shows upgrade prompt for free users

3. **Plan Features Comparison**
   - Lists what's included in each tier
   - Upgrade buttons

4. **Usage Statistics**
   - Link-in-bio links used
   - Courses created
   - Products listed
   - Email campaigns sent

---

## Design Details

**Icon:** `CreditCard` (purple gradient: from-violet-500 to-purple-500)
- Matches billing/payment theme
- Distinct from Settings (gray gear icon)
- Consistent with monetization section

**Label:** "Plan & Billing"
- Clear and descriptive
- Standard SaaS terminology
- Covers both subscription and visibility settings

**Position:** Between "Earnings" and "Settings"
- Logical grouping with monetization features
- Keeps Settings as the "catch-all" at the end

---

## Testing Checklist

- [x] Added CreditCard icon import
- [x] Added navigation item to sidebar
- [x] Updated page title recognition
- [x] No linter errors
- [ ] Test: Click "Plan & Billing" navigates to correct page
- [ ] Test: Active state highlights when on plan page
- [ ] Test: Free users see upgrade prompt
- [ ] Test: Paid users can toggle profile visibility

---

## Related Files

**Modified:**
- `app/(dashboard)/components/app-sidebar-enhanced.tsx` - Added nav item
- `app/(dashboard)/components/sidebar-wrapper.tsx` - Added page title

**Existing (Not Modified):**
- `app/(dashboard)/store/[storeId]/plan/page.tsx` - Plan page UI
- `components/creator/plan-settings.tsx` - Plan settings component
- `convex/creatorPlans.ts` - Backend logic

---

## Next Steps (Future Enhancements)

1. **Badge for Free Users** - Add "Upgrade" badge next to Plan & Billing
2. **Trial Indicator** - Show "X days left" if on trial
3. **Quick Actions** - Add dropdown menu with:
   - View plan details
   - Upgrade plan
   - Toggle visibility (for paid users)
4. **Notification Dot** - Alert when trial is ending

---

**Updated By:** AI Assistant (Claude Sonnet 4.5)  
**Date:** November 2, 2025  
**Status:** ✅ Complete

