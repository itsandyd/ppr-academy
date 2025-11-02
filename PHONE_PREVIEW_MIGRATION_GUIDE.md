# Phone Preview Migration Guide

## Status: Partial Migration ✅

The `GlobalPhonePreview` component has been created and is ready to use, but full migration of all preview components is **optional** since many have highly customized content.

---

## Recommendation: Hybrid Approach

### Use GlobalPhonePreview For:
✅ **Profile previews** - DONE  
✅ **Store overviews** - Simple layouts  
✅ **New features** - Going forward  

### Keep Custom Components For:
⏸️ **Checkout flows** - Custom forms and purchase UI  
⏸️ **Lead magnet previews** - Interactive opt-in flows  
⏸️ **Course creation** - Specialized course card layouts  
⏸️ **Coaching calls** - Booking-specific UI  
⏸️ **Bundle creation** - Complex product bundling  

---

## Already Migrated

### ✅ Profile Page
**File:** `app/(dashboard)/store/profile/components/PhonePreview.tsx`

**Before:** 226 lines of custom JSX  
**After:** 60 lines wrapping `GlobalPhonePreview`

**Result:** Consistent layout, real-time social updates

---

## Components That Stay Custom

These components have specialized, interactive content that goes beyond a simple storefront preview:

### 1. Store PhonePreview (`app/(dashboard)/store/components/PhonePreview.tsx`)
**Why Keep:** 
- Multiple modes (store, leadMagnet, digitalProduct, course)
- Interactive lead magnet forms with submission flow
- Draft vs published product states
- Complex product display logic

**Lines:** 816 (too complex to migrate)

### 2. Checkout Preview (`app/(dashboard)/store/[storeId]/products/digital-download/create/checkout/CheckoutPhonePreview.tsx`)
**Why Keep:**
- Purchase form with inputs
- Product details and pricing
- Custom CTA buttons
- File preview logic

**Lines:** 114 (specialized checkout UI)

### 3. Coaching Call Preview (`app/(dashboard)/store/[storeId]/products/coaching-call/create/CoachingCallPhonePreview.tsx`)
**Why Keep:**
- Multiple style variations
- Booking-specific UI elements
- Duration and pricing display
- Calendar integration hints

**Lines:** 180 (booking-focused)

### 4. Other Specialized Previews
- Bundle Preview - Complex multi-product display
- URL Media Preview - Embedded content previews
- Lead Magnet - Full opt-in flow with states

---

## When to Use GlobalPhonePreview

### ✅ Good Use Cases

**1. Simple Profile/Store Previews**
```typescript
<GlobalPhonePreview
  storeName="My Store"
  displayName="John Doe"
  slug="johndoe"
  avatarUrl="/avatar.jpg"
  bio="Music producer"
  socialAccounts={accounts}
/>
```

**2. Settings Pages**
```typescript
// User is changing their bio/social links
<GlobalPhonePreview
  storeName={store.name}
  displayName={user.name}
  bio={currentBio}  // Updates in real-time
  socialAccounts={accounts}
/>
```

**3. New Feature Development**
```typescript
// Building a new feature? Start with GlobalPhonePreview
<GlobalPhonePreview
  {...storeData}
  showPreviewLabel={true}
/>
```

### ❌ Not Suitable For

**1. Complex Forms**
```typescript
// Has custom inputs, submission logic
<CheckoutPhonePreview />  // Keep custom
```

**2. Multi-State Flows**
```typescript
// Lead magnet: form → success → download
<LeadMagnetPreview />  // Keep custom
```

**3. Product-Specific Layouts**
```typescript
// Custom layouts per product type
<BundlePhonePreview />  // Keep custom
```

---

## Alternative: PhoneShell Component

For custom content that needs a consistent shell, you can create a `PhoneShell` wrapper:

### PhoneShell.tsx (Optional)
```typescript
"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PhoneShellProps {
  children: React.ReactNode;
  storeName?: string;
  displayName?: string;
  slug?: string;
  avatarUrl?: string;
  showHeader?: boolean;
}

export function PhoneShell({
  children,
  storeName = "Your Store",
  displayName = "Your Name",
  slug = "yourslug",
  avatarUrl,
  showHeader = true,
}: PhoneShellProps) {
  const initials = displayName
    .split(" ")
    .map(n => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden shadow-2xl">
        {showHeader && (
          <div className="bg-gradient-to-r from-chart-1 to-chart-2 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-white/30">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-sm font-bold bg-white/20 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-base text-white truncate block">
                  {storeName}
                </span>
                <span className="text-xs text-white/80 truncate block">
                  by {displayName} • @{slug}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Custom content goes here */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        <div className="p-2 bg-muted/50 border-t border-border">
          <p className="text-[10px] text-center text-muted-foreground">
            Powered by <span className="font-semibold">PausePlayRepeat</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
```

### Usage
```typescript
<PhoneShell
  storeName={store.name}
  displayName={user.name}
  slug={store.slug}
  avatarUrl={user.avatar}
>
  {/* Your custom checkout form */}
  <div className="p-4">
    <Input placeholder="Email" />
    <Button>Purchase</Button>
  </div>
</PhoneShell>
```

---

## Benefits of Current Approach

### ✅ Flexibility
- Custom components can have specialized logic
- No forced migration of working code
- `GlobalPhonePreview` available when needed

### ✅ Consistency Where It Matters
- Profile previews now consistent ✓
- New features can use global component ✓
- Specialized flows keep their UX ✓

### ✅ Gradual Adoption
- Migrate components as needed
- No breaking changes
- Backwards compatible

---

## Decision Matrix

| Component | Lines | Complexity | Migrate? | Reason |
|-----------|-------|------------|----------|--------|
| Profile | 226 | Low | ✅ YES | Simple store preview |
| Store Multi-Mode | 816 | High | ❌ NO | Multiple modes, interactive |
| Checkout | 114 | Medium | ❌ NO | Custom forms |
| Coaching | 180 | Medium | ❌ NO | Booking UI |
| Bundle | ~150 | Medium | ❌ NO | Complex layout |
| URL Media | ~120 | Low | ⚠️ MAYBE | Could use PhoneShell |
| Lead Magnet | ~200 | High | ❌ NO | Multi-state flow |

---

## Recommendation

### Phase 1 (Done) ✅
- Created `GlobalPhonePreview`
- Migrated Profile page
- Documented usage

### Phase 2 (Optional)
- Create `PhoneShell` wrapper component
- Migrate URL Media preview
- Update any new features to use global component

### Phase 3 (If Needed)
- Gradually refactor complex components
- Extract reusable pieces
- Standardize where possible

---

## Conclusion

**Current Status:** ✅ Good enough!

- Profile previews are consistent
- Complex flows keep their specialized UX
- New features have a standard component to use
- No broken functionality
- Backwards compatible

**Next Steps:** Use `GlobalPhonePreview` for all **new** features going forward!

---

## Files

### Created
- `components/shared/GlobalPhonePreview.tsx` ✅

### Migrated
- `app/(dashboard)/store/profile/components/PhonePreview.tsx` ✅

### Kept As-Is (Intentionally)
- `app/(dashboard)/store/components/PhonePreview.tsx`
- `app/(dashboard)/store/[storeId]/products/digital-download/create/checkout/CheckoutPhonePreview.tsx`
- `app/(dashboard)/store/[storeId]/products/coaching-call/create/CoachingCallPhonePreview.tsx`
- All other specialized preview components

