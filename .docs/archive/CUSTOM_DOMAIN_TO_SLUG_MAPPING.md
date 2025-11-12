# 🌐 Custom Domain → Slug Mapping Architecture

## Vision

Allow creators to point their own domain (e.g., `beatsbymike.com`) to their PPR Academy storefront slug, so visitors see their branded domain but get the full PPR Academy storefront.

---

## 🎯 How It Works

### **User Journey:**

1. Creator has slug: `ppr-academy.com/beatsbymike`
2. Creator owns domain: `beatsbymike.com`
3. Creator connects domain in settings
4. Visitor goes to `beatsbymike.com`
5. **DNS routes to PPR Academy**
6. **Middleware detects custom domain**
7. **Looks up which slug it maps to**
8. **Serves the `/beatsbymike` storefront**
9. **URL stays `beatsbymike.com`** (no redirect!)

### **Result:**
- URL bar shows: `beatsbymike.com`
- Content displayed: Their storefront
- Slug still works: `ppr-academy.com/beatsbymike`
- Both URLs work, custom domain is primary

---

## 🔧 Technical Implementation

### **1. Database Schema**

```typescript
// Add to stores table in convex/schema.ts
stores: defineTable({
  // ... existing fields
  slug: v.string(), // beatsbymike
  customDomain: v.optional(v.string()), // beatsbymike.com
  domainStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("verifying"),
    v.literal("active"),
    v.literal("failed")
  )),
  domainVerifiedAt: v.optional(v.number()),
})
.index("by_customDomain", ["customDomain"]) // Important!
```

### **2. Middleware (Next.js)**

**File:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  
  // Skip for localhost, main domain, and API routes
  if (
    hostname.includes('localhost') ||
    hostname === 'ppr-academy.com' ||
    hostname === 'www.ppr-academy.com' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }
  
  // Check if this is a custom domain
  const customDomain = hostname.replace('www.', '');
  
  // Look up which store owns this domain
  const store = await getStoreByCustomDomain(customDomain);
  
  if (store) {
    // Rewrite to the slug page, but keep custom domain in URL
    const slugPath = `/${store.slug}${url.pathname}`;
    
    url.pathname = slugPath;
    
    // Rewrite (not redirect!) so URL stays beatsbymike.com
    return NextResponse.rewrite(url);
  }
  
  // Not a custom domain, continue normal routing
  return NextResponse.next();
}

// Helper function (calls Convex)
async function getStoreByCustomDomain(domain: string) {
  // Call Convex query to lookup store by customDomain
  const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'stores:getStoreByCustomDomain',
      args: { domain },
    }),
  });
  
  const data = await response.json();
  return data.value;
}
```

### **3. Convex Query**

```typescript
// convex/stores.ts

export const getStoreByCustomDomain = query({
  args: { domain: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("stores"),
      slug: v.string(),
      name: v.string(),
      userId: v.string(),
      customDomain: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_customDomain", (q) => q.eq("customDomain", args.domain))
      .first();
    
    if (!store) return null;
    
    return {
      _id: store._id,
      slug: store.slug,
      name: store.name,
      userId: store.userId,
      customDomain: store.customDomain,
    };
  },
});
```

### **4. Vercel Configuration**

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/:path*"
    }
  ],
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "X-Custom-Domain",
          "value": "true"
        }
      ]
    }
  ]
}
```

**Add Domain via Vercel Dashboard:**
- Go to Project Settings → Domains
- Add `beatsbymike.com`
- Vercel provides DNS instructions
- Auto-provisions SSL

---

## 📋 DNS Setup (Creator Side)

### **What Creator Does:**

1. Buy domain (beatsbymike.com) from any registrar
2. In PPR Academy settings, enter domain
3. Get DNS instructions:

```
Add these DNS records at your domain registrar:

A Record:
Name: @
Value: 76.76.21.21 (Vercel IP)

CNAME Record:
Name: www
Value: cname.vercel-dns.com
```

4. Wait for verification (usually 5-60 minutes)
5. Done! Domain active

---

## 🎨 Creator Settings UI

### **Domain Settings Page:**

**Route:** `/store/[storeId]/settings/domain`

```typescript
"use client";

export default function DomainSettingsPage() {
  const [domain, setDomain] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  const store = useQuery(api.stores.getUserStore, { userId: user.id });
  const connectDomain = useMutation(api.stores.connectCustomDomain);
  const verifyDomain = useMutation(api.stores.verifyCustomDomain);
  
  const handleConnect = async () => {
    await connectDomain({ 
      storeId: store._id, 
      domain: domain.toLowerCase().replace('www.', '') 
    });
    
    // Show DNS instructions
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domain</CardTitle>
        <CardDescription>
          Use your own domain to display your storefront
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!store.customDomain ? (
          // Connect domain flow
          <div className="space-y-4">
            <div>
              <Label>Your Domain</Label>
              <Input 
                placeholder="beatsbymike.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current storefront: ppr-academy.com/{store.slug}
              </p>
            </div>
            
            <Button onClick={handleConnect} disabled={!domain}>
              Connect Domain
            </Button>
          </div>
        ) : (
          // Domain connected - show status
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{store.customDomain}</span>
                <Badge className={
                  store.domainStatus === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }>
                  {store.domainStatus}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Points to: ppr-academy.com/{store.slug}
              </p>
            </div>
            
            {store.domainStatus === 'pending' && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>DNS Setup Required</AlertTitle>
                  <AlertDescription>
                    Add these records at your domain registrar:
                  </AlertDescription>
                </Alert>
                
                <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                  <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                    <div className="font-bold">Type</div>
                    <div className="font-bold">Name</div>
                    <div className="font-bold">Value</div>
                    
                    <div>A</div>
                    <div>@</div>
                    <div>76.76.21.21</div>
                    
                    <div>CNAME</div>
                    <div>www</div>
                    <div>cname.vercel-dns.com</div>
                  </div>
                </div>
                
                <Button onClick={() => verifyDomain({ storeId: store._id })}>
                  Check Verification
                </Button>
              </div>
            )}
            
            {store.domainStatus === 'active' && (
              <div className="space-y-2">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Domain Active!</AlertTitle>
                  <AlertDescription>
                    Your storefront is now live at {store.customDomain}
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`https://${store.customDomain}`, '_blank')}
                  >
                    Visit Your Site
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {/* Remove domain */}}
                    className="text-destructive"
                  >
                    Remove Domain
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔄 Complete Flow Diagram

```
1. Creator Setup:
   beatsbymike.com (DNS) → Vercel IP
   PPR Academy DB: beatsbymike.com → slug: "beatsbymike"

2. Visitor Types: beatsbymike.com
   ↓
3. DNS resolves to Vercel
   ↓
4. Middleware checks: Is "beatsbymike.com" a custom domain?
   ↓
5. Query Convex: getStoreByCustomDomain("beatsbymike.com")
   ↓
6. Found! slug = "beatsbymike"
   ↓
7. Rewrite URL to: /beatsbymike
   ↓
8. Your existing [slug]/page.tsx renders
   ↓
9. URL bar still shows: beatsbymike.com ✅
```

---

## ✅ Advantages of This Approach

### **For Creators:**
✅ **Own Their Domain** - beatsbymike.com
✅ **Full Branding** - no PPR Academy visible
✅ **SEO Benefits** - domain authority
✅ **Professional** - real domain
✅ **Portable** - can move domain later
✅ **Control** - manage their DNS

### **For Platform:**
✅ **Simple Implementation** - just middleware + lookup
✅ **Use Existing Pages** - [slug]/page.tsx already works!
✅ **No Duplicate Code** - same storefront component
✅ **Easy Maintenance** - one codebase
✅ **Scalable** - unlimited domains
✅ **Vercel Handles SSL** - automatic

### **For Both:**
✅ **Slug Still Works** - ppr-academy.com/beatsbymike backup
✅ **Marketplace Discovery** - still indexed
✅ **Network Effects** - dual presence
✅ **Analytics** - track both URLs

---

## 💰 Pricing Model

### **Tier Structure:**

**Free:**
- ppr-academy.com/yourname (slug only)
- Platform branding
- Basic features

**Pro ($29/mo):**
- Custom domain (beatsbymike.com)
- No platform branding
- Priority support
- Advanced analytics

**How to Gate:**
```typescript
// In middleware
if (store.customDomain && !store.isPro) {
  // Redirect to upgrade page
  return NextResponse.redirect('/upgrade');
}

// Only pro users can use custom domains
```

---

## 🔧 Implementation Checklist

### **Backend (Convex):**
- [ ] Add `customDomain` field to stores schema
- [ ] Add `by_customDomain` index
- [ ] Create `getStoreByCustomDomain` query
- [ ] Create `connectCustomDomain` mutation
- [ ] Create `verifyCustomDomain` mutation
- [ ] Create `removeCustomDomain` mutation

### **Middleware:**
- [ ] Create `middleware.ts` with domain detection
- [ ] Add custom domain lookup logic
- [ ] Implement rewrite (not redirect)
- [ ] Handle www prefix
- [ ] Cache domain lookups (performance)

### **UI:**
- [ ] Create `/settings/domain` page
- [ ] DNS instruction component
- [ ] Verification status display
- [ ] Domain input & validation
- [ ] Remove domain option

### **Vercel:**
- [ ] Configure wildcard domain support
- [ ] Add domains via Vercel API
- [ ] Auto-provision SSL
- [ ] Monitor SSL renewal

### **Background Jobs:**
- [ ] Cron job to verify DNS (every 15 min)
- [ ] Update domain status automatically
- [ ] Email notification on activation
- [ ] Alert on SSL issues

---

## 🎨 Key Features

### **1. Automatic SSL**
- Vercel provisions SSL automatically
- Let's Encrypt integration
- Auto-renewal
- Zero config for creator

### **2. DNS Verification**
- Background cron checks DNS
- Updates status automatically
- Email notification when active
- Retry logic for temporary failures

### **3. Fallback Support**
- If custom domain fails, slug still works
- Graceful degradation
- No downtime

### **4. Multi-Domain Support**
- One creator could have multiple domains
- Different domains → same slug
- A/B test different domains

---

## 🚀 Migration Path

### **Phase 1: Schema & Queries (Week 1)**
```typescript
// Just database prep
✅ Add customDomain field
✅ Add index
✅ Create lookup query
✅ Test with fake data
```

### **Phase 2: Middleware (Week 2)**
```typescript
// Routing logic
✅ Create middleware.ts
✅ Domain detection
✅ Rewrite logic
✅ Test locally with hosts file
```

### **Phase 3: UI (Week 3)**
```typescript
// Settings page
✅ Domain input form
✅ DNS instructions
✅ Verification status
✅ Connect/remove buttons
```

### **Phase 4: Vercel Integration (Week 4)**
```typescript
// Production setup
✅ Vercel API integration
✅ Auto-add domains
✅ SSL provisioning
✅ Production testing
```

### **Phase 5: Automation (Week 5)**
```typescript
// Background jobs
✅ Verification cron
✅ Email notifications
✅ Status updates
✅ Error handling
```

---

## 💡 Example Use Cases

### **Music Producer:**
```
Domain: beatsbymike.com
Slug: beatsbymike
Instagram bio: "Beats → beatsbymike.com"
Result: Fully branded experience
```

### **Sample Pack Creator:**
```
Domain: lofisamples.io
Slug: lofi-samples
Marketing: Clean, professional URL
Result: Looks like independent business
```

### **Course Creator:**
```
Domain: mixingacademy.com
Slug: mixing-academy
SEO: Ranks for "mixing academy"
Result: Education brand authority
```

---

## 🎯 Why This Is Better Than Traditional Multi-Tenant

### **Traditional Approach:**
- Separate app instance per creator
- Different databases
- Complex deployment
- High maintenance

### **Your Approach (Smart!):**
- Single app, single database
- Domain → slug mapping
- Use existing pages
- Zero duplication

**It's just routing!** The [slug]/page.tsx you already have works perfectly. You just need to route custom domains to it.

---

## 📊 Technical Details

### **URL Behavior:**

**Visitor on custom domain:**
```
URL: beatsbymike.com/
Displays: /beatsbymike page content
Headers: host: beatsbymike.com
Actual Route: /[slug] with slug="beatsbymike"
```

**Visitor on platform:**
```
URL: ppr-academy.com/beatsbymike
Displays: Same /beatsbymike content
Headers: host: ppr-academy.com
Actual Route: /[slug] with slug="beatsbymike"
```

**Same code, different URL!**

### **SEO Impact:**

Both URLs index separately:
- `beatsbymike.com` - creator's domain authority
- `ppr-academy.com/beatsbymike` - platform authority

Use canonical tags to choose primary:
```html
<!-- On custom domain -->
<link rel="canonical" href="https://beatsbymike.com" />

<!-- On platform URL -->
<link rel="canonical" href="https://beatsbymike.com" />
```

---

## 💰 Business Model

### **Revenue Opportunities:**

**Direct:**
- $29/mo for custom domain feature
- 1,000 creators × 10% adoption = 100 × $29 = $2,900/mo

**Indirect:**
- Higher creator retention (invested in domain)
- More professional = more sales = more fees
- Upsell opportunities (domain + email + analytics)

**Competitive Pricing:**
- Gumroad: $10/mo for domain
- Kajabi: Included in $149/mo plan
- Teachable: Included in $99/mo plan
- **PPR Academy: $29/mo (competitive!)**

---

## ⚠️ Gotchas to Handle

### **1. www Prefix**
```typescript
// Handle both
beatsbymike.com → works
www.beatsbymike.com → works
```

### **2. Slug Conflicts**
```typescript
// What if someone tries to use existing slug?
// Solution: Domain must match slug, or reserve new slug
if (domain !== slug && slugTaken) {
  error("Slug not available for this domain");
}
```

### **3. Domain Verification**
```typescript
// Cron job checks DNS every 15 min
// Updates status when verified
// Emails creator on success/failure
```

### **4. SSL Edge Cases**
```typescript
// Vercel usually handles, but monitor for:
// - Expired certificates (auto-renewal issues)
// - CAA records blocking
// - DNS propagation delays
```

### **5. Domain Disputes**
```typescript
// Two creators claim same domain?
// Solution: First to verify wins
// Verification proves ownership
```

---

## 🎉 Summary

### **The Brilliant Part:**

You already built the hard part! The [slug]/page.tsx storefront exists and works.

All you need is:
1. **Middleware** to detect custom domains
2. **Database lookup** (domain → slug)
3. **Rewrite** to existing slug page
4. **DNS settings UI** for creators

**That's it!** 

No new pages. No new components. Just smart routing.

### **Complexity:** Low-Medium
**Timeline:** 4-5 weeks
**Impact:** High (premium feature)
**Maintenance:** Low (Vercel handles SSL)

**This is absolutely the right architecture!** 🚀

Your slug-based system is perfect because:
- Slug is required anyway (fallback)
- Custom domain is optional enhancement
- Same code serves both URLs
- Scalable and maintainable

**Ready to implement when you have 50+ creators wanting custom domains!**

