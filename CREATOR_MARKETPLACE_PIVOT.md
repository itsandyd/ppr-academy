# PPR Academy - Creator Marketplace Pivot

## 🎯 Business Model Overview

PPR Academy is pivoting from a traditional course platform to a **creator-focused subscription marketplace** where music producers can set up their own stores to sell courses, coaching, and subscriptions with flexible pricing models.

### Key Value Propositions
- **For Creators**: Own branded storefront, flexible pricing, direct fan relationship
- **For Students**: Access to diverse creators, flexible payment options, personalized learning
- **For Platform**: Sustainable 10% revenue share, scalable creator ecosystem

---

## 🔄 Current State vs Target State

### Current State
- ✅ Course creation and management
- ✅ Coaching system with booking
- ✅ User authentication & roles
- ✅ Basic dashboard structure
- ✅ Payment processing (basic)

### Target State
- 🎯 **Individual Creator Storefronts** - Each producer gets branded space
- 🎯 **Flexible Pricing Models** - Courses, coaching, subscriptions per creator
- 🎯 **Revenue Sharing** - 10% platform cut, 90% to creators
- 🎯 **Creator Analytics** - Earnings, subscriber growth, engagement metrics
- 🎯 **Subscription Management** - Per-creator billing and access control

---

## 💰 Revenue Model

### Creator Monetization Options
1. **One-time Course Sales** - Traditional course purchases
2. **Creator Subscriptions** - Monthly/yearly access to creator's content library
3. **Coaching Sessions** - Hourly or package-based coaching
4. **Tiered Memberships** - Basic, Pro, VIP access levels

### Platform Revenue
- **10% transaction fee** on all creator earnings
- **Payment processing** handled by platform
- **Automatic fee splitting** on payouts

---

## 🏗️ Technical Implementation Plan

### Phase 1: Creator Storefronts
- [ ] Creator profile pages with branding
- [ ] Individual creator URLs (`/creators/[username]`)
- [ ] Creator course/content organization
- [ ] Basic subscription setup UI

### Phase 2: Subscription System
- [ ] Per-creator subscription plans
- [ ] Subscription billing integration
- [ ] Access control per creator content
- [ ] Subscription management dashboard

### Phase 3: Revenue & Analytics
- [ ] Revenue splitting system
- [ ] Creator earnings dashboard
- [ ] Subscription analytics
- [ ] Payout management

### Phase 4: Enhanced Features
- [ ] Tiered membership levels
- [ ] Bundle pricing options
- [ ] Creator collaboration tools
- [ ] Advanced analytics

---

## 📊 Database Schema Changes

### New Tables Needed

#### `creator_stores`
```sql
- id: string (primary key)
- user_id: string (foreign key to users)
- store_name: string
- store_slug: string (unique)
- description: text
- banner_image: string
- avatar_image: string
- theme_colors: json
- social_links: json
- created_at: timestamp
- updated_at: timestamp
```

#### `creator_subscriptions`
```sql
- id: string (primary key)
- creator_id: string (foreign key to users)
- name: string
- description: text
- price: decimal
- billing_cycle: enum ('monthly', 'yearly')
- features: json
- is_active: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### `user_subscriptions`
```sql
- id: string (primary key)
- user_id: string (foreign key to users)
- creator_id: string (foreign key to users)
- subscription_id: string (foreign key to creator_subscriptions)
- stripe_subscription_id: string
- status: enum ('active', 'cancelled', 'past_due')
- current_period_start: timestamp
- current_period_end: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### `creator_earnings`
```sql
- id: string (primary key)
- creator_id: string (foreign key to users)
- transaction_type: enum ('course_sale', 'subscription', 'coaching')
- gross_amount: decimal
- platform_fee: decimal
- net_amount: decimal
- payout_status: enum ('pending', 'paid', 'failed')
- stripe_payment_intent_id: string
- created_at: timestamp
- updated_at: timestamp
```

### Modified Tables

#### `courses` (existing)
```sql
+ subscription_tier: enum ('free', 'basic', 'pro', 'premium') -- Which tier can access
+ is_subscription_only: boolean -- Course requires subscription
```

#### `coaching_sessions` (existing)
```sql
+ is_subscription_discount: boolean -- Discounted for subscribers
+ subscription_price: decimal -- Price for subscribers
```

---

## 🎨 UI/UX Changes

### New Pages
- `/creators/[username]` - Creator storefront
- `/creators/[username]/subscribe` - Subscription checkout
- `/dashboard/store` - Creator store management
- `/dashboard/subscriptions` - Creator subscription management
- `/dashboard/earnings` - Creator earnings & analytics
- `/my-subscriptions` - User subscription management

### Enhanced Pages
- `/dashboard` - Add creator store metrics
- `/courses/[slug]` - Show if course requires subscription
- `/coaching` - Display creator subscription benefits

### New Components
- `CreatorStorefront` - Main creator page layout
- `SubscriptionPlanCard` - Subscription tier display
- `CreatorEarningsDashboard` - Revenue analytics
- `SubscriptionManager` - User subscription management
- `CreatorStoreSetup` - Store configuration form

---

## 🔧 Technical Stack Additions

### Required Integrations
- **Stripe Subscriptions** - Recurring billing management
- **Stripe Connect** - Creator payout system
- **Webhook Handlers** - Subscription status updates
- **Analytics Service** - Creator performance tracking

### New Server Actions
- `createCreatorStore` - Set up creator storefront
- `createSubscriptionPlan` - Creator subscription management
- `subscribeToCreator` - User subscription flow
- `processCreatorPayout` - Revenue distribution
- `getCreatorAnalytics` - Performance metrics

---

## 📈 Success Metrics

### Creator Success
- Monthly recurring revenue per creator
- Subscription retention rate
- Creator onboarding completion rate
- Average revenue per user (ARPU)

### Platform Success
- Total platform revenue (10% cuts)
- Creator acquisition rate
- Student-to-creator conversion rate
- Platform transaction volume

---

## 🚀 Implementation Priority

### Immediate (Week 1-2)
1. Creator store database schema
2. Basic creator storefront pages
3. Creator store setup flow

### Short-term (Week 3-4)
1. Subscription plan creation
2. Stripe subscription integration
3. Access control implementation

### Medium-term (Month 2)
1. Revenue sharing system
2. Creator earnings dashboard
3. Subscription analytics

### Long-term (Month 3+)
1. Advanced creator tools
2. Tiered membership features
3. Creator collaboration features

---

## 💡 Future Considerations

### Scalability
- Multi-tenant architecture for creator stores
- CDN for creator content delivery
- Database sharding for large creator base

### Features
- Creator collaboration tools
- Student progress tracking per creator
- Creator-specific community features
- Advanced analytics and insights

### Monetization
- Premium creator tools subscription
- Featured creator placement fees
- Advanced analytics tier for creators

---

## 📝 Notes

- This model solves the revenue attribution problem by giving creators control over their pricing and subscriptions
- Platform focuses on providing tools and taking a small cut rather than competing with creators
- Creator success directly correlates with platform success
- Flexible enough to accommodate different creator business models

---

*Last updated: [Current Date]*
*Status: Planning Phase* 