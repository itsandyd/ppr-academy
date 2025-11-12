# 🌐 Custom Domain Architecture Plan

## Vision: Multi-Tenant Creator Platform

Allow each creator to have their own branded domain (e.g., `producername.com`) while running on PPR Academy infrastructure.

---

## 🏗️ Architecture Overview

### **Current System:**
```
ppr-academy.com/
├── /marketplace (global)
├── /[slug] (creator storefront)
├── /library (student dashboard)
└── /home (creator dashboard)
```

### **Multi-Domain System:**
```
producername.com → Creator's storefront
  ├── / (homepage)
  ├── /courses
  ├── /packs
  ├── /coaching
  └── /about

dashboard.producername.com → Creator's admin
  ├── /analytics
  ├── /campaigns
  ├── /customers
  └── /products

ppr-academy.com → Main platform
  ├── /marketplace (global discovery)
  ├── /sign-up (creator onboarding)
  └── /library (student universal library)
```

---

## 🔧 Technical Implementation

### **1. Domain Management**

**DNS Setup:**
```typescript
// convex/domains.ts
domains: defineTable({
  storeId: v.id("stores"),
  domain: v.string(), // "producername.com"
  subdomain: v.optional(v.string()), // "dashboard", "shop"
  status: v.union(
    v.literal("pending-verification"),
    v.literal("verified"),
    v.literal("active"),
    v.literal("suspended")
  ),
  verificationToken: v.string(),
  sslStatus: v.string(),
  dnsRecords: v.array(v.object({
    type: v.string(),
    name: v.string(),
    value: v.string(),
    verified: v.boolean(),
  })),
})
```

**Required DNS Records:**
- A record: `@ → Vercel IP`
- CNAME: `www → cname.vercel-dns.com`
- TXT: `_vercel → verification-token`

**Verification Flow:**
1. Creator enters domain in settings
2. System generates verification token
3. Show DNS instructions
4. Background cron checks verification (every 15 min)
5. Once verified, activate domain
6. SSL automatically provisioned via Vercel

### **2. Domain Routing (Middleware)**

**File:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Main domain - normal routing
  if (hostname === 'ppr-academy.com' || hostname.includes('localhost')) {
    return NextResponse.next();
  }
  
  // Custom domain - rewrite to creator storefront
  if (isCustomDomain(hostname)) {
    const store = await getStoreByDomain(hostname);
    
    if (!store) {
      return NextResponse.redirect(new URL('/404', request.url));
    }
    
    // Rewrite to storefront with store context
    return NextResponse.rewrite(
      new URL(`/storefront/${store.slug}${request.nextUrl.pathname}`, request.url)
    );
  }
  
  return NextResponse.next();
}
```

### **3. Vercel Configuration**

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "(?<customDomain>.*)"
        }
      ],
      "destination": "/storefront/:customDomain/:path*"
    }
  ],
  "domains": [
    "ppr-academy.com",
    "*.ppr-academy.com"
  ],
  "wildcardDomain": true
}
```

**Vercel API Integration:**
```typescript
// Add domain via Vercel API
const response = await fetch('https://api.vercel.com/v9/projects/{projectId}/domains', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
  },
  body: JSON.stringify({
    name: 'producername.com',
  }),
});
```

---

## 🎨 Creator Customization Options

### **Domain Settings Page:**
```
/store/[storeId]/settings/domain

┌─────────────────────────────────────┐
│ Custom Domain Setup                 │
├─────────────────────────────────────┤
│                                     │
│ Your Domain                         │
│ ┌─────────────────────────────────┐ │
│ │ producername.com              ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ DNS Configuration                   │
│ ┌─────────────────────────────────┐ │
│ │ Type  │ Name │ Value           │ │
│ │ A     │ @    │ 76.76.21.21    │ │
│ │ CNAME │ www  │ cname.vercel   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⏳ Verifying DNS...                 │
│                                     │
│ [ Connect Domain ]                  │
└─────────────────────────────────────┘
```

### **Homepage Customization:**
```
/store/[storeId]/settings/homepage

Options:
• Hero image/video
• Headline & tagline
• Featured products
• About section
• Social links
• Custom colors/branding
• Navigation menu items
```

---

## 📊 Database Schema Changes

### **Stores Table:**
```typescript
stores: defineTable({
  // ... existing fields
  
  // Custom Domain
  customDomain: v.optional(v.string()),
  domainStatus: v.optional(v.string()),
  
  // Branding
  brandColors: v.optional(v.object({
    primary: v.string(),
    secondary: v.string(),
    accent: v.string(),
  })),
  
  // Homepage Settings
  homepageConfig: v.optional(v.object({
    heroImage: v.optional(v.string()),
    heroVideo: v.optional(v.string()),
    headline: v.string(),
    tagline: v.string(),
    featuredProducts: v.array(v.string()),
    sections: v.array(v.any()),
  })),
  
  // SEO
  metaTitle: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  ogImage: v.optional(v.string()),
})
```

---

## 🌐 Domain Hierarchy

### **Option A: Custom Slug as URL (SIMPLEST)** ⭐ RECOMMENDED
```
ppr-academy.com/lofibeats
ppr-academy.com/producerjohn
ppr-academy.com/beatsbyalex
```

**How It Works:**
- Slug IS the custom URL
- Creator picks their slug on signup
- Becomes their branded path
- No DNS, no verification, instant

**Pros:**
- ✅ Zero complexity
- ✅ Instant activation
- ✅ No DNS setup
- ✅ SEO still works
- ✅ Free for all creators
- ✅ Shareable branded link
- ✅ Already implemented!

**Cons:**
- PPR Academy in URL (but short)
- Not "fully" custom domain
- Platform brand visible

**This is what you already have!** Just market it as "your custom creator page"

### **Option B: Subdomains (Medium)**
```
lofibeats.ppr-academy.com
producerjohn.ppr-academy.com
beatsbyalex.ppr-academy.com
```

**Pros:**
- More "domain-like"
- Single wildcard SSL
- No per-domain costs
- Instant provisioning

**Cons:**
- Requires middleware
- Longer URLs
- Still platform branded

### **Option C: Custom Domains (Advanced)**
```
producername.com
djname.io
beatsbyartist.net
```

**Pros:**
- Fully branded
- Professional
- Creator owns domain
- SEO benefits

**Cons:**
- DNS verification required
- SSL per domain
- Creator manages DNS
- 24-48h verification time

### **Option D: Hybrid (Best Long-Term)**
```
Free tier: ppr-academy.com/yourname (slug)
Pro tier: yourname.ppr-academy.com (subdomain)
Enterprise tier: yourname.com (custom domain)
```

**Progressive enhancement as creators grow.**

---

## 🎨 Creator Storefront Components

### **1. Dynamic Homepage Builder**

```typescript
// /storefront/[domain]/page.tsx

export default function CreatorHomepage({ domain }: Props) {
  const store = useQuery(api.stores.getStoreByDomain, { domain });
  const config = store?.homepageConfig;
  
  return (
    <div style={{ '--primary': config?.brandColors?.primary }}>
      <HeroSection config={config.hero} />
      <FeaturedProducts products={config.featuredProducts} />
      <AboutSection content={config.about} />
      <ContactSection />
    </div>
  );
}
```

### **2. Reusable Sections:**

**Available Blocks:**
- Hero (image/video)
- Featured Products Grid
- About/Bio
- Testimonials
- Sample Pack Preview
- Course Curriculum
- Coaching Calendar
- Newsletter Signup
- Social Links
- Video Embed
- Custom HTML

### **3. Page Templates:**

**Pre-built layouts:**
- Minimalist (clean, simple)
- Portfolio (showcase work)
- Store (e-commerce focus)
- Course Platform (education focus)
- Music Producer (beats/samples focus)

---

## 💰 Monetization Model

### **Pricing Tiers:**

**Free Tier:**
- yourname.ppr-academy.com subdomain
- Basic customization
- 3 products max
- PPR Academy branding

**Pro Tier ($29/month):**
- Custom domain (producername.com)
- Full customization
- Unlimited products
- Remove PPR branding
- Priority support

**Enterprise ($99/month):**
- Multiple custom domains
- Advanced analytics
- API access
- White-label options
- Dedicated support

---

## 🔐 Technical Challenges & Solutions

### **Challenge 1: Domain Verification**

**Solution:**
- Automated verification via Vercel API
- Background cron job checking DNS
- Email notifications on status change
- Clear DNS setup instructions
- Visual verification progress

### **Challenge 2: SSL Certificates**

**Solution:**
- Vercel auto-provisions SSL
- Let's Encrypt integration
- Automatic renewal
- No manual intervention needed

### **Challenge 3: Multi-Tenant Routing**

**Solution:**
- Middleware checks hostname
- Rewrites to appropriate storefront
- Caches domain → store mapping
- Fast lookups (< 10ms)

### **Challenge 4: SEO & Indexing**

**Solution:**
- Dynamic meta tags per store
- Separate sitemaps per domain
- robots.txt per domain
- Schema.org markup
- Open Graph tags

### **Challenge 5: Email Sending**

**Already Solved!**
- Store-specific email config
- Custom from addresses
- Reply-to per store
- Resend integration ready

---

## 📱 Mobile App Considerations

### **Future: Native Apps**

**Creator App:**
- Manage store on the go
- View analytics
- Respond to customers
- Upload products
- Send campaigns

**Student App:**
- Access all purchased content
- Download samples
- Watch courses
- Book coaching
- Browse marketplace

**Unified Login:**
- Clerk handles auth
- Works across all domains
- Single sign-on

---

## 🚀 Implementation Phases

### **Phase 1: Subdomain System (2 weeks)**
- Implement `creator.ppr-academy.com` subdomains
- Dynamic routing via middleware
- Homepage customization UI
- Test with 5 beta creators

### **Phase 2: Custom Domain Support (4 weeks)**
- Vercel domain API integration
- DNS verification system
- SSL automation
- Migration tool (subdomain → custom)
- Creator dashboard for DNS setup

### **Phase 3: Advanced Customization (6 weeks)**
- Visual homepage builder (drag & drop)
- Section library (20+ blocks)
- Theme marketplace
- Custom CSS/branding
- Template variations

### **Phase 4: White-Label (8 weeks)**
- Remove all PPR Academy branding
- Custom login pages
- Branded emails
- Custom checkout flow
- Partner API

---

## 💡 Key Features

### **For Creators:**
✅ Own branded domain
✅ Custom homepage
✅ Full control over look/feel
✅ Professional appearance
✅ SEO benefits
✅ Brand building

### **For Platform:**
✅ Higher retention (investment in domain)
✅ Premium tier revenue
✅ Network effects (still discoverable)
✅ Scalable architecture
✅ Automated management

---

## 🎯 Competitive Advantage

**vs Gumroad:**
- ✅ Custom domains (they charge $10/mo extra)
- ✅ More customization
- ✅ Built-in email marketing
- ✅ Sample pack infrastructure

**vs Kajabi:**
- ✅ Lower price point
- ✅ Music production focus
- ✅ Credit economy
- ✅ Marketplace discovery

**vs Teachable:**
- ✅ Not just courses
- ✅ Sample packs + coaching
- ✅ Email automation included
- ✅ Custom domains on lower tier

---

## 🗺️ User Journey

### **Creator Onboarding:**
```
1. Sign up on ppr-academy.com
2. Create store (yourname.ppr-academy.com)
3. Add products
4. Upgrade to Pro
5. Connect custom domain (producername.com)
6. Customize homepage
7. Drive traffic to own domain
8. Students discover via marketplace too
```

### **Discovery Flow:**
```
Students find creators via:
1. Main marketplace (ppr-academy.com/marketplace)
2. Google search (producername.com ranks)
3. Social media (creator shares own domain)
4. Cross-promotion (featured on platform)
```

---

## 📦 What's Already Built (Ready for Multi-Domain)

✅ **Store System** - Each creator has storeId
✅ **Storefronts** - `/[slug]` already works
✅ **Email Config** - Per-store email settings
✅ **Product Management** - Scoped to store
✅ **Customer Lists** - Per-store customers
✅ **Analytics** - Per-store tracking
✅ **Payments** - Already store-scoped

**What's Missing:**
- Domain verification system
- Middleware routing logic
- DNS management UI
- Vercel API integration
- Custom homepage builder

---

## 💰 Revenue Model

### **Pricing Strategy:**

**Free:**
- yourname.ppr-academy.com
- Limited features
- Platform branding

**Pro ($29/mo):**
- Custom domain
- Full customization
- No platform branding
- Priority support

**Enterprise ($99/mo):**
- Multiple domains
- Advanced analytics
- API access
- Custom checkout

**Revenue Projection:**
- 100 creators × $29 = $2,900/mo
- 10% upgrade rate on 1,000 creators = $2,900/mo
- Plus 10% transaction fees

---

## 🎨 Homepage Builder Concept

### **Drag & Drop Sections:**

**Available Blocks:**
1. Hero (with CTA)
2. Product Grid
3. Featured Course
4. Sample Pack Preview (with player)
5. Testimonials
6. About/Bio
7. Social Proof Stats
8. Newsletter Signup
9. Instagram Feed
10. YouTube Videos
11. Upcoming Coaching
12. Recent Blog Posts
13. Free Download (lead magnet)
14. Custom HTML

**How It Works:**
```typescript
homepageConfig: {
  sections: [
    {
      type: "hero",
      config: {
        headline: "Pro Sample Packs",
        image: "hero.jpg",
        cta: { text: "Browse Packs", link: "/packs" }
      }
    },
    {
      type: "featured-products",
      config: {
        title: "Latest Releases",
        productIds: ["id1", "id2", "id3"],
        layout: "grid"
      }
    }
  ]
}
```

---

## 🔍 SEO Strategy

### **Per-Domain SEO:**

**Creator Domain (producername.com):**
```html
<title>{{creatorName}} - {{tagline}}</title>
<meta name="description" content="{{bio}}">
<meta property="og:image" content="{{brandImage}}">
<link rel="canonical" href="https://producername.com">
```

**Platform Marketplace:**
```html
<title>{{creatorName}} on PPR Academy</title>
<meta name="description" content="Discover {{creatorName}}'s courses...">
<link rel="canonical" href="https://ppr-academy.com/{{slug}}">
```

**Both discoverable, no competition.**

---

## 🎯 Examples

### **Sample Creator Setup:**

**Lo-Fi Beats Producer:**
- Domain: `lofibeatsbyalex.com`
- Homepage: Minimalist design, featured packs
- Branding: Chill purple/pink palette
- Focus: Sample packs + production tips

**Course Creator:**
- Domain: `mixingacademy.com`
- Homepage: Course platform layout
- Branding: Professional blue/white
- Focus: Courses + coaching

**Multi-Genre Producer:**
- Domain: `beatsbysarah.com`
- Homepage: Portfolio style
- Branding: Bold red/black
- Focus: Everything (packs + courses + coaching)

---

## ⚡ Quick Wins (Minimal Implementation)

### **MVP Approach:**

**Phase 0.5: Subdomain Beta (1 week)**
```
1. Add subdomain field to stores
2. Create route: /s/[subdomain] → rewrite to /[slug]
3. Let creators choose: yourname.ppr-academy.com
4. Test with 10 creators
5. Gather feedback
```

**No custom domains yet, but:**
- Creators get branded URL
- Test multi-tenant routing
- Validate demand
- Low complexity

---

## 🎁 Bundled Value

### **What Creators Get:**

**With Custom Domain:**
- Professional presence
- SEO ownership
- Brand building
- Email @yourdomain.com
- Independence (portable)
- Trust signals

**Still on Platform:**
- Marketplace discovery
- Payment processing
- Email infrastructure
- Analytics
- Support
- Updates

**Best of both worlds.**

---

## 🚧 Considerations

### **Pros:**
✅ Creator retention (invested in domain)
✅ Premium tier revenue
✅ Professional offering
✅ Competitive advantage
✅ Network effects maintained

### **Cons:**
❌ Complexity increase
❌ Support burden (DNS issues)
❌ Verification delays
❌ SSL edge cases
❌ Potential domain abuse

### **Risk Mitigation:**
- Clear documentation
- Automated verification
- Status dashboard
- Support chatbot for DNS
- Approval process

---

## 🎯 Recommendation

### **BEST APPROACH: Use What You Have!**

**You already have custom URLs via slugs:**
- `ppr-academy.com/lofibeats`
- `ppr-academy.com/producerjohn`
- `ppr-academy.com/beatsbyalex`

**Just enhance the slug system:**

1. **Better Slug Selection UI**
   - During onboarding
   - Show preview: "Your link: ppr-academy.com/{{slug}}"
   - Availability checker
   - Suggestions if taken

2. **Market It As Custom URL**
   - "Get your creator page: ppr-academy.com/yourname"
   - Short, memorable
   - Professional enough
   - SEO friendly

3. **Add Later (If Needed):**
   - Pro tier: `yourname.ppr-academy.com` subdomain
   - Enterprise: `yourname.com` custom domain

### **Why This Is Smart:**

✅ **Already implemented** - no new build
✅ **Zero complexity** - no DNS, no SSL issues
✅ **Instant** - works immediately
✅ **SEO works** - `/producerjohn` ranks fine
✅ **Shareable** - clean URL for social media
✅ **Free** - no domain costs
✅ **Discoverable** - still in marketplace

**Example:**
- Share on Instagram: "Check out my packs at ppr-academy.com/lofibeats"
- Works like Linktree but better (actual storefront)
- SEO: "lo-fi beats sample packs" → ppr-academy.com/lofibeats ranks

### **Future Enhancement:**
If creators really want custom domains, add as $29/mo premium feature. But start by marketing the slug as their "custom creator page" - it's 90% of the value with 0% of the complexity!

---

## 📈 Success Metrics

### **Measure:**
- % of creators who set up subdomain
- Upgrade rate (subdomain → custom domain)
- Creator retention (custom domain vs standard)
- Support ticket volume
- Time to verification
- Domain setup completion rate

### **Goals:**
- 30% of creators use subdomain
- 10% upgrade to custom domain
- 90% retention for domain users
- < 5% support tickets on DNS
- < 24h average verification time

---

## ✨ Summary

**The Architecture is Sound:**

Your current system is already 80% ready for multi-tenant domains because:
- Store-scoped everything
- Clean separation of concerns
- Dynamic routing possible
- Email infrastructure ready

**What You'd Need:**
- Middleware for domain routing
- Vercel domain API integration
- DNS verification system
- Homepage customization UI
- Domain management dashboard

**Complexity:** Medium
**Timeline:** 2-4 weeks for subdomain MVP
**Value:** High (retention + premium revenue)
**Risk:** Low (can start with subdomains)

**Worth considering as a pro-tier feature once you have 100+ active creators!** 🚀

