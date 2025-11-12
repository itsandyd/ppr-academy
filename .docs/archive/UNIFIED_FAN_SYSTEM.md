# Unified Fan System: Customers + Users

## Overview
The Fan Management system now shows **all potential fans** by combining data from two tables:
1. **Customers** (from `customers` table) - People who have purchased, enrolled, or been imported
2. **Registered Users** (from `users` table) - All registered accounts who haven't purchased yet

## Architecture

### New Query: `getFansForStore`
**Location:** `convex/customers.ts`

This query creates a unified view by:
1. Fetching up to 100 most recent customers for the store
2. Fetching up to 100 most recent users from the platform
3. Deduplicating by email (customers take priority)
4. Converting users to "fan" format with type: `"user"`
5. Combining and sorting by creation time

### Fan Types
- **`lead`** - Customer who hasn't purchased (Green badge)
- **`paying`** - Customer who made a one-time purchase (Blue badge)
- **`subscription`** - Customer with active subscription (Purple badge)
- **`user`** - Registered account, not yet a customer (Gray badge)

## Implementation Details

### Backend (`convex/customers.ts`)
```typescript
export const getFansForStore = query({
  args: { storeId: v.string() },
  returns: v.array(v.object({
    _id: v.union(v.id("customers"), v.id("users")),
    type: v.union(
      v.literal("lead"), 
      v.literal("paying"), 
      v.literal("subscription"), 
      v.literal("user")  // ← NEW TYPE
    ),
    // ... other fields
    imageUrl: v.optional(v.string()),  // ← From users table
  })),
  handler: async (ctx, args) => {
    // 1. Get customers
    // 2. Get users
    // 3. Deduplicate
    // 4. Combine
    // 5. Sort
  }
});
```

### Frontend (`app/(dashboard)/store/[storeId]/contacts/page.tsx`)
- Updated to use `api.customers.getFansForStore`
- Badge rendering now handles 4 types (lead, paying, subscription, user)
- Shows user avatars when available (`imageUrl` from users table)
- Displays "Registered User" badge for accounts without purchases

## Benefits

### For Creators
1. **Complete Audience View** - See everyone in one place
2. **Convert Users to Customers** - Identify registered users to target with campaigns
3. **Unified Management** - No need to check multiple places

### For the Platform
1. **Better Marketing** - Creators can target registered users who haven't purchased
2. **Improved Engagement** - All users visible for email campaigns
3. **Data Consistency** - Single source of truth for "fans"

## Data Flow

```
┌─────────────────────┐
│   Customers Table   │  ← Purchases, imports, enrollments
│  (Lead/Paying/Sub)  │
└──────────┬──────────┘
           │
           │  Unified in
           │  getFansForStore
           │
┌──────────▼──────────┐
│   Fans Page Shows   │
│   All Contacts      │
└──────────▲──────────┘
           │
           │
┌──────────┴──────────┐
│    Users Table      │  ← Registered accounts
│  (Registered User)  │
└─────────────────────┘
```

## User Experience

### Fans Page Now Shows
1. **Imported CSV contacts** - From ActiveCampaign, with full profile data
2. **Customers who purchased** - From Stripe, with revenue/enrollment data
3. **Registered users** - From Clerk authentication
4. **All with dedupe** - No duplicates (email-based)

### Visual Indicators
- **Avatar** - Shows user profile picture if available (from users table)
- **Badge** - Shows fan type (Lead/Customer/Subscriber/Registered User)
- **Source** - Shows origin (e.g., "registered_user", "activecampaign_import", "stripe_purchase")
- **Profile** - Shows DAW, genre, level (from customer fields)
- **Tags** - Shows ActiveCampaign tags if imported
- **Engagement** - Shows courses enrolled, products purchased

## Performance

### Optimizations
- Limited to 100 most recent from each table (200 max combined)
- No expensive joins or enrichment in list view
- Deduplication done in memory (fast for 200 items)
- Background cron job for exact total count

### Scaling
- For stores with 1000+ fans, use cached counts from `fanCounts` table
- Pagination handled by showing "most recent 100"
- Exact counts computed periodically by background job

## Future Enhancements

### Potential Additions
1. **Filter by type** - Show only customers, only users, etc.
2. **User engagement tracking** - Track course views, sample downloads
3. **Conversion tracking** - See which users became customers
4. **Segmentation** - Create campaigns for "registered but not purchased"
5. **Lead scoring** - Score users based on activity + customer spend

## Related Files
- `/convex/customers.ts` - Backend query for unified fans
- `/app/(dashboard)/store/[storeId]/contacts/page.tsx` - Frontend UI
- `/convex/schema.ts` - Database schema (customers, users, fanCounts tables)
- `/convex/fanCountAggregation.ts` - Background job for exact counts

