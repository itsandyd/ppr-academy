# Social Follow Gates - Implementation Plan

## 🎯 Feature Overview

Allow creators to gate their free/paid content behind social media follows and email collection. This helps creators:
- Grow their Instagram, TikTok, YouTube, and Spotify following
- Build email lists for marketing
- Track which platforms drive the most conversions
- Reward fans with free content in exchange for follows

---

## 📊 Database Schema Design

### Digital Products Table (Update Existing)

Add follow gate configuration to `digitalProducts` table:

```typescript
digitalProducts: defineTable({
  // ... existing fields ...
  
  // Follow Gate Configuration
  followGateEnabled: v.optional(v.boolean()),
  followGateRequirements: v.optional(v.object({
    email: v.optional(v.boolean()), // Require email
    instagram: v.optional(v.boolean()), // Require Instagram follow
    tiktok: v.optional(v.boolean()), // Require TikTok follow
    youtube: v.optional(v.boolean()), // Require YouTube follow/subscribe
    spotify: v.optional(v.boolean()), // Require Spotify follow
    minFollowsRequired: v.optional(v.number()), // e.g., "Follow 2 out of 4 platforms"
  })),
  
  // Social Links (for follow gate CTAs)
  socialLinks: v.optional(v.object({
    instagram: v.optional(v.string()), // @username or full URL
    tiktok: v.optional(v.string()),
    youtube: v.optional(v.string()),
    spotify: v.optional(v.string()),
  })),
})
```

### Follow Gate Submissions Table (New)

Track who completed follow gates:

```typescript
followGateSubmissions: defineTable({
  productId: v.id("digitalProducts"),
  storeId: v.string(),
  creatorId: v.string(), // Creator who owns the product
  
  // User Information
  email: v.string(),
  name: v.optional(v.string()),
  
  // Follow Confirmations (self-reported)
  followedPlatforms: v.object({
    instagram: v.optional(v.boolean()),
    tiktok: v.optional(v.boolean()),
    youtube: v.optional(v.boolean()),
    spotify: v.optional(v.boolean()),
  }),
  
  // Metadata
  submittedAt: v.number(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  
  // Download Tracking
  hasDownloaded: v.optional(v.boolean()),
  downloadCount: v.optional(v.number()),
  lastDownloadAt: v.optional(v.number()),
})
  .index("by_product", ["productId"])
  .index("by_email", ["email"])
  .index("by_creator", ["creatorId"])
  .index("by_email_product", ["email", "productId"]),
```

---

## 🎨 UI/UX Flow

### 1. Creator Configuration (Dashboard)

**Location:** Product creation/edit form

```typescript
// Components needed:
// - FollowGateSettings.tsx (configuration panel)

Features:
- Toggle "Enable Follow Gate"
- Checkboxes for each platform requirement
- Input fields for social profile URLs
- "Require X out of Y platforms" selector
- Preview of what users will see
```

### 2. User Experience (Storefront)

**Flow:**
1. User clicks "Download" or "Get Free Access" on product
2. Modal/overlay appears with follow gate
3. Shows email input (if required)
4. Shows social platform buttons with instructions
5. User confirms they followed by checking boxes
6. Submit button enables when requirements met
7. Thank you message + download button appears

---

## 🔧 Implementation Steps

### Phase 1: Schema & Backend ✅

**Files to modify:**
- `convex/schema.ts` - Add follow gate fields
- `convex/digitalProducts.ts` - Add queries/mutations for follow gates
- `convex/followGateSubmissions.ts` - New file for tracking

**Queries/Mutations needed:**
```typescript
// Get product with follow gate settings
export const getProductWithFollowGate = query({ ... })

// Submit follow gate (capture email + follows)
export const submitFollowGate = mutation({ ... })

// Check if user already submitted for this product
export const checkFollowGateSubmission = query({ ... })

// Get follow gate analytics for creator
export const getFollowGateAnalytics = query({ ... })
```

### Phase 2: Creator UI (Dashboard)

**New Components:**
```
components/follow-gates/
├── FollowGateSettings.tsx       # Configuration panel
├── FollowGatePreview.tsx        # Preview of user experience
└── FollowGateAnalytics.tsx      # Conversion stats
```

**Features:**
- ✅ Enable/disable follow gate
- ✅ Select required platforms
- ✅ Input social profile URLs
- ✅ Set minimum follows required
- ✅ Live preview
- ✅ Analytics dashboard

### Phase 3: User-Facing UI (Storefront)

**New Components:**
```
app/[slug]/components/
├── FollowGateModal.tsx          # Main follow gate overlay
├── SocialFollowButton.tsx       # Individual platform button
└── FollowGateSuccess.tsx        # Thank you + download
```

**Features:**
- ✅ Beautiful modal design
- ✅ Email capture form
- ✅ Social platform buttons (open in new tab)
- ✅ Checkbox confirmations
- ✅ Progress indicator
- ✅ Download button after completion

### Phase 4: Analytics & Tracking

**Metrics to track:**
```typescript
- Total follow gate views
- Completion rate (started vs completed)
- Email capture rate
- Per-platform follow rates
- Drop-off analysis
- Time to complete
- Repeat downloaders
```

---

## 🎯 User Journey Example

### Scenario: Free Sample Pack with Follow Gate

1. **User sees product:** "Free Trap Drum Kit"
2. **Clicks CTA:** "Get Free Download"
3. **Follow Gate Modal appears:**
   ```
   🎁 Get Your Free Trap Drum Kit!
   
   Support me by following on 2 of these platforms:
   
   📧 Enter your email (required)
   [Email input field]
   
   Follow me on:
   ☐ Instagram (@beatmaker)    [Follow →]
   ☐ TikTok (@beatmaker)        [Follow →]
   ☐ YouTube (BeatMaker)        [Subscribe →]
   ☐ Spotify (BeatMaker)        [Follow →]
   
   [Download Now] (disabled until 2 selected + email)
   ```
4. **User completes requirements**
5. **Success message:** "Thank you! 🎉"
6. **Download button enabled**

---

## 🔒 Anti-Abuse Measures

1. **Email validation** - Require real email addresses
2. **Rate limiting** - Prevent spam submissions
3. **IP tracking** - Detect multiple submissions from same IP
4. **Download limits** - Allow X downloads per email/IP
5. **Verification delays** - Small delay between follow and unlock (optional)

---

## 📈 Analytics Dashboard

Show creators:
```
Follow Gate Performance
├── Total Views: 1,247
├── Started: 892 (71.5%)
├── Completed: 634 (71.1% of started)
├── Emails Collected: 634
└── Platform Breakdown:
    ├── Instagram: 512 follows (80.8%)
    ├── TikTok: 423 follows (66.7%)
    ├── YouTube: 389 follows (61.4%)
    └── Spotify: 298 follows (47.0%)

Conversion Funnel:
1. Product Views: 1,247
2. Follow Gate Opened: 892 (71.5%)
3. Email Entered: 758 (85.0%)
4. Follows Confirmed: 634 (71.1%)
5. Downloads: 612 (96.5%)
```

---

## 🎨 Design Inspiration

**Modal Style:**
- Clean, modern overlay
- Brand colors from creator's store
- Large, clickable social buttons with platform logos
- Progress indicator (1/3, 2/3, 3/3)
- Animated checkmarks when completed
- Confetti animation on success

**Social Buttons:**
```
[Instagram Icon] Follow @username on Instagram ☐
                 Opens in new tab →
```

---

## 🚀 Quick Start Implementation

### Step 1: Schema Update
```bash
# Update convex/schema.ts with follow gate fields
# Deploy: npx convex deploy
```

### Step 2: Create Backend Functions
```bash
# Create convex/followGateSubmissions.ts
# Add mutations and queries
```

### Step 3: Build Creator UI
```bash
# Create components/follow-gates/ folder
# Add to product creation form
```

### Step 4: Build User UI
```bash
# Create follow gate modal
# Integrate with product cards
```

---

## 🔄 Integration Points

**Existing features to integrate:**
1. **Email system** - Add follow gate emails to email lists
2. **Analytics** - Track follow gate conversions
3. **Customer management** - Link submissions to customer records
4. **Lead magnets** - Combine with existing lead magnet system

---

## 💡 Advanced Features (Future)

1. **Verified follows** - OAuth integration to verify actual follows
2. **Progressive gates** - "Follow 1 platform for preview, 3 for full access"
3. **Time-limited gates** - "Follow within 24 hours for bonus content"
4. **Referral tracking** - Track which platform drives most traffic
5. **A/B testing** - Test different gate requirements
6. **Smart gates** - Adjust requirements based on conversion data

---

## ✅ Success Metrics

Track these KPIs:
- Email list growth rate
- Social follower growth rate
- Follow gate completion rate (target: 60-80%)
- Download-to-customer conversion rate
- Platform preference by audience

---

**Ready to implement? Let's start with Phase 1 (Schema & Backend)!** 🚀

