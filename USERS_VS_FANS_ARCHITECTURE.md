# Users vs Fans: Complete Architecture

## 🎯 Core Concept

### **Users** (Registered Accounts)
- **What:** People who have created an account via Clerk authentication
- **Where:** `/admin/users` (admin only)
- **Table:** `users` table in Convex
- **Source:** Clerk webhooks, sign-ups
- **Can:** Log in, access dashboard, purchase products, enroll in courses
- **Examples:** 
  - andrew@pauseplayrepeat.com (owner)
  - student@example.com (signed up, taking courses)

### **Fans/Contacts** (Email List)
- **What:** People on your email list (may or may not have an account)
- **Where:** `/store/{storeId}/contacts` (creator dashboard)
- **Table:** `customers` table in Convex
- **Source:** 
  - CSV imports (ActiveCampaign, etc.)
  - Stripe purchases (auto-created)
  - Course enrollments (auto-created)
- **Can:** Receive emails, have tags/scores, have profile data
- **Examples:**
  - producer@gmail.com (imported from ActiveCampaign, no account yet)
  - customer@example.com (bought something via Stripe, might have account)

## 📊 Current System Architecture

### **Admin View** (`/admin/users`)
**Purpose:** Platform-wide user management (admin only)

```
┌─────────────────────────────────────┐
│       Admin Users Page              │
│   /admin/users                      │
├─────────────────────────────────────┤
│ Data Source: users table            │
│ Shows: Registered accounts only     │
│ Count: 312 users                    │
│                                     │
│ Features:                           │
│ • View all platform users           │
│ • Manage roles (Owner/Admin/User)   │
│ • Check Stripe connection status    │
│ • Bulk user actions                 │
│ • Platform-wide user stats          │
└─────────────────────────────────────┘
```

### **Creator View** (`/store/{storeId}/contacts`)
**Purpose:** Creator's fan/contact management (per store)

```
┌─────────────────────────────────────┐
│      Fan Management Page            │
│   /store/{storeId}/contacts         │
├─────────────────────────────────────┤
│ Data Source: customers table        │
│ Shows: Email list + customers       │
│ Count: 47,344+ fans                 │
│                                     │
│ Features:                           │
│ • Import CSV (ActiveCampaign data)  │
│ • View tags, scores, DAW, genres    │
│ • Track purchases & enrollments     │
│ • Engagement metrics (opens/clicks) │
│ • Mass email campaigns              │
│ • Get Exact Count button            │
└─────────────────────────────────────┘
```

## 🔄 Data Flow

### **Journey: Email Contact → User**

```
Step 1: Import from ActiveCampaign
┌──────────────────────────┐
│ producer@example.com     │
│ • Type: "lead"           │
│ • Tags: [beginner, edm]  │
│ • Score: 42              │
│ • DAW: Ableton          │
└──────────────────────────┘
           ↓
    (CSV Import to customers table)
           ↓
┌──────────────────────────┐
│ Fan in /contacts page    │
│ Status: "lead"           │
│ Can receive emails ✓     │
│ Cannot log in ✗          │
└──────────────────────────┘
           ↓
    (Creator sends campaign)
           ↓
    (Fan clicks & signs up)
           ↓
┌──────────────────────────┐
│ User in /admin/users     │
│ Clerk account created    │
│ Can log in ✓             │
│ Can access library ✓     │
└──────────────────────────┘
           ↓
    (Still shows in /contacts as "paying" customer)
```

### **Journey: User → Customer (Reverse)**

```
Step 1: User signs up via Clerk
┌──────────────────────────┐
│ newuser@example.com      │
│ • Clerk account          │
│ • Can log in             │
│ • No purchases yet       │
└──────────────────────────┘
           ↓
    (User browses marketplace)
           ↓
    (User makes purchase via Stripe)
           ↓
┌──────────────────────────┐
│ Customer record created  │
│ • Type: "paying"         │
│ • Total spent: $99       │
│ • Enrolled courses       │
└──────────────────────────┘
           ↓
    (Now shows in creator's /contacts)
```

## 🏗️ Database Schema

### **`users` Table**
```typescript
{
  _id: Id<"users">,
  clerkId: string,           // From Clerk authentication
  email: string,
  name: string,
  imageUrl?: string,
  role: "AGENCY_OWNER" | "AGENCY_ADMIN" | "SUBACCOUNT_USER" | "SUBACCOUNT_GUEST",
  admin: boolean,            // Platform admin flag
  stripeConnectAccountId?: string,
  // ... other Clerk/user fields
}
```

**Purpose:** Authentication, authorization, platform access  
**Managed by:** Clerk webhooks, admin  
**Visible in:** `/admin/users` (admin only)

### **`customers` Table (Fans)**
```typescript
{
  _id: Id<"customers">,
  email: string,
  name: string,
  storeId: string,           // Which creator's store
  adminUserId: string,       // Creator who owns this contact
  type: "lead" | "paying" | "subscription",
  source: string,            // "activecampaign_import", "stripe_purchase", etc.
  totalSpent: number,
  
  // ActiveCampaign fields (for email list management)
  tags: string[],            // ["beginner", "edm", "vip"]
  score: number,             // Engagement score
  daw: string,              // "Ableton", "FL Studio"
  typeOfMusic: string,       // "EDM", "Hip-Hop"
  studentLevel: string,      // "Beginner", "Intermediate"
  opensEmail: boolean,
  clicksLinks: boolean,
  lastOpenDate: number,
  
  // ... other fan/customer fields
}
```

**Purpose:** Email list, marketing, customer tracking  
**Managed by:** CSV imports, Stripe webhooks, creator  
**Visible in:** `/store/{storeId}/contacts` (per creator)

## 🔑 Key Differences

| Feature | Users (`/admin/users`) | Fans (`/contacts`) |
|---------|------------------------|-------------------|
| **Purpose** | Platform access & authentication | Email list & marketing |
| **Who sees** | Admin only | Each creator sees their own |
| **Source** | Clerk sign-ups | CSV imports, purchases |
| **Can log in** | ✅ Yes (Clerk account) | ❌ No (just email) |
| **Has password** | ✅ Yes (Clerk) | ❌ No |
| **Email campaigns** | ❌ Not the primary use | ✅ Yes, main purpose |
| **Tags & scores** | ❌ No | ✅ Yes (ActiveCampaign) |
| **Purchase tracking** | ❌ Not in users table | ✅ Yes |
| **Deduplication** | By Clerk ID | By email + storeId |
| **Count** | ~312 users | ~47,344+ fans |

## 🎯 Use Cases

### **For Platform Admin:**
1. **View all registered users** → `/admin/users`
2. **Manage platform roles** → Make someone admin
3. **Check Stripe connections** → See who can sell
4. **Platform-wide stats** → Total users, creators, students

### **For Creator:**
1. **Import email list** → `/store/{storeId}/contacts` → "Import CSV"
2. **Send campaigns** → `/store/{storeId}/email-campaigns` → Mass email fans
3. **Track engagement** → See who opens/clicks
4. **Manage tags** → Segment by genre, skill level, DAW
5. **Convert fans** → Send campaign → Fan signs up → Becomes user
6. **Track revenue** → See total spent per fan

## 🚀 Email Campaign Flow

### **Creator sends campaign to fans:**

```
Step 1: Creator composes email
┌────────────────────────────────┐
│ /store/{storeId}/email-campaigns │
│ • Select template              │
│ • Write copy (AI assist)       │
│ • Choose recipients            │
└────────────────────────────────┘
           ↓
Step 2: System sends to all fans
┌────────────────────────────────┐
│ Query: customers table         │
│ Filter: storeId = creator's    │
│ Count: 47,344 fans             │
│ Status: All with email         │
└────────────────────────────────┘
           ↓
Step 3: Track engagement
┌────────────────────────────────┐
│ Update customer record:        │
│ • opensEmail = true            │
│ • clicksLinks = true           │
│ • lastOpenDate = now           │
│ • score += 10                  │
└────────────────────────────────┘
           ↓
Step 4: Conversion tracking
┌────────────────────────────────┐
│ Fan clicks CTA → Signs up      │
│ • Clerk account created        │
│ • Shows in /admin/users        │
│ • Still in /contacts (paying)  │
└────────────────────────────────┘
```

## 📈 Future Enhancements

### **Fan → User Conversion Tracking**
- Link `customers.email` to `users.email`
- Show "Has Account" badge in `/contacts`
- Track conversion rate: fans → users
- Segment: "Fans without account" for campaigns

### **User → Fan Auto-Sync**
- When user makes first purchase
- Auto-create `customer` record
- Import user profile data to fan profile
- Link for bidirectional updates

### **Unified Fan View** (Already Implemented ✓)
- Show users + customers in `/contacts`
- Deduplicate by email
- Badge: "Registered User" vs "Lead"
- Current: Up to 5,000 from each table

## 🎨 Current Implementation Status

### ✅ **Completed:**
1. **Admin Users Page** - Shows all registered users (Clerk)
2. **Fan Management Page** - Shows customers/contacts per store
3. **CSV Import** - Import ActiveCampaign contacts
4. **Batch Processing** - Handle 47k+ imports
5. **Background Counting** - Exact fan totals via cron
6. **Unified View** - Fans page shows users + customers
7. **Type Badges** - Lead/Paying/Subscriber/Registered User
8. **Profile Data** - DAW, genre, tags, scores

### 🚧 **To Do:**
1. **Email Campaigns** - Mass email to all fans
2. **Conversion Tracking** - Link fan email → user account
3. **Segmentation** - Filter by tags, engagement, has account
4. **Lead Scoring** - Auto-score based on activity
5. **Automation** - Welcome series, nurture sequences

## 📁 Related Files

### **Admin Users:**
- `/app/admin/users/page.tsx` - Admin users UI
- `/convex/users.ts` - User queries/mutations
- `/convex/clerkSync.ts` - Clerk webhook handlers

### **Fan Management:**
- `/app/(dashboard)/store/[storeId]/contacts/page.tsx` - Fan UI
- `/convex/customers.ts` - Customer queries (includes `getFansForStore`)
- `/convex/importFans.ts` - CSV import handler
- `/convex/fanCountAggregation.ts` - Background counting

### **Email Campaigns:**
- `/app/(dashboard)/store/[storeId]/email-campaigns/*` - Campaign UI
- `/convex/emailCopyGenerator.ts` - AI email generation
- `/convex/emailTemplates.ts` - Email templates

## 💡 Key Insight

**The distinction is:**
- **Users** = Platform accounts (can log in)
- **Fans** = Email list contacts (receive campaigns)

**They can overlap:**
- A fan can become a user (signs up)
- A user can become a fan (makes purchase)
- But they serve different purposes!

**Replace ActiveCampaign:**
- CSV import ✓
- Tags & scores ✓
- Email campaigns ✓
- Engagement tracking ✓
- Lead scoring ✓
- Automation (coming soon)

This architecture allows you to **stop paying for ActiveCampaign** while giving **each creator their own email list management** within the platform! 🚀

