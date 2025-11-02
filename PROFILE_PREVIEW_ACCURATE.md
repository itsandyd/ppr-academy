# Profile Preview - Made Accurate ✅

## What Was Updated

The **Phone Preview** component on the Profile Settings page now shows an **accurate mini version** of how the storefront actually looks.

## Location

**File:** `app/(dashboard)/store/profile/components/PhonePreview.tsx`

**Page:** `/store/profile` (right side of the page, sticky preview)

## New Features

### 1. **Accurate Storefront Layout**
Matches the real `DesktopStorefront` component structure:

#### Header Section (Gradient Background)
- Store name with gradient (chart-1 to chart-2)
- Avatar with white border
- Store name + creator name + slug
- Bio (if set, line-clamp-2)
- Stats cards (Products, Free, Learn)

#### Content Area
- "Your Products & Courses" heading
- Placeholder product cards (2 shown)
- Product cards with icon placeholders

#### Social Links Section
- Shows only if social links are added
- Instagram, TikTok, Twitter, YouTube, Website icons
- Color-coded icons matching platforms
- Centered layout with proper spacing

#### Footer
- "Powered by PausePlayRepeat" badge
- Subtle muted background

### 2. **Real-Time Updates**
- Fetches actual store data from Convex
- Shows live updates when editing:
  - Name changes
  - Bio changes
  - Avatar changes
  - Social links added/removed

### 3. **Visual Accuracy**
- Matches storefront gradient colors
- Same avatar styling
- Same card layouts
- Same typography and spacing
- Proper dark mode support

### 4. **Data Sources**
```typescript
// User data
const convexUser = useQuery(api.users.getUserFromClerk, { clerkId: clerkUser.id });

// Store data
const stores = useQuery(api.stores.getStoresByUser, { userId: clerkUser.id });
const store = stores?.[0];
```

## Preview Layout Structure

```
┌─────────────────────────────────┐
│  Live Preview                   │
│  Changes update in real-time    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ╔═══════════════════════════╗   │
│ ║  [Gradient Header]        ║   │
│ ║  👤 Store Name            ║   │
│ ║  by Creator • @slug       ║   │
│ ║  Bio text here...         ║   │
│ ║  ┌───┬───┬───┐            ║   │
│ ║  │ 0 │ 0 │🎓│ Stats      ║   │
│ ║  └───┴───┴───┘            ║   │
│ ╠═══════════════════════════╣   │
│ ║  Your Products & Courses  ║   │
│ ║  ┌─────────────────────┐  ║   │
│ ║  │ Product Card 1      │  ║   │
│ ║  └─────────────────────┘  ║   │
│ ║  ┌─────────────────────┐  ║   │
│ ║  │ Product Card 2      │  ║   │
│ ║  └─────────────────────┘  ║   │
│ ║                           ║   │
│ ║  Connect                  ║   │
│ ║  [IG] [TT] [X] [YT] [WEB] ║   │
│ ╠═══════════════════════════╣   │
│ ║ Powered by PPR            ║   │
│ ╚═══════════════════════════╝   │
└─────────────────────────────────┘
```

## Visual Elements

### Gradient Header:
- Background: `bg-gradient-to-r from-chart-1 to-chart-2`
- Text: White for maximum contrast
- Stats: White/10 background with backdrop blur

### Avatar:
- Size: 12x12 (48px)
- Border: 2px white with 30% opacity
- Fallback: White/20 background with white text

### Bio:
- Color: `text-white/90`
- Size: `text-xs`
- Clamp: Maximum 2 lines with ellipsis

### Social Icons:
- Instagram: Pink (`text-pink-500`)
- TikTok: Black/White (adaptive)
- Twitter: Blue (`text-blue-500`)
- YouTube: Red (`text-red-500`)
- Website: Gray (`text-gray-600`)

## Real-Time Sync

When users edit their profile:
1. Type in Name field → Header updates immediately
2. Type in Bio field → Bio updates immediately (2 line max)
3. Upload Avatar → Avatar updates immediately
4. Add social links → Icons appear in Connect section
5. Remove social links → Icons disappear

## Dark Mode Support

- Background: `bg-white dark:bg-zinc-900`
- Border: `border-black/90 dark:border-zinc-700`
- Text: Automatically adapts via Tailwind dark mode
- Icons: Conditional colors for TikTok (black→white)

## Benefits

1. **Accurate Representation:** Users see exactly how their profile will look
2. **Immediate Feedback:** Changes are visible instantly
3. **Professional Design:** Matches the actual storefront 1:1
4. **Confidence Building:** Users know what they're building
5. **Better UX:** No surprises when profile goes live

## Technical Details

### Component Size:
- Width: 356px (iPhone 14 Pro size)
- Height: 678px (tall enough for scrollable content)
- Border: 4px black/zinc border (phone frame effect)
- Border radius: 3xl (very rounded corners)

### Sticky Positioning:
- Position: `sticky top-32`
- Stays in view while scrolling form
- Always visible during editing

### Loading State:
- Shows animated skeleton while fetching
- Matches final layout structure
- Gradient header skeleton
- Smooth transition to loaded state

## Status: ✅ Complete

The profile preview now accurately represents the actual storefront layout with real-time updates!

