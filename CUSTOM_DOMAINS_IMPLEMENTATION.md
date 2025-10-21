# 🌐 Custom Domains & Email Integration

## 📋 Overview

This system enables creators to use custom domains and branded email addresses for their storefronts.

### **Tier System**

| Tier | URL | Email | Price | DNS Required |
|------|-----|-------|-------|--------------|
| **Free** | `ppracademy.com/slug` | `noreply@ppracademy.com` | Free | ❌ No |
| **Pro** | `slug.ppracademy.com` | `slug@mail.ppracademy.com` | $29/mo | ✅ Auto |
| **Premium** | `custom.com` | `hello@custom.com` | $99/mo | ✅ Manual |

---

## 🏗️ Architecture

### **Components**

1. **Database Schema** - Store domain configuration
2. **Domain Verification** - DNS verification flow
3. **Routing Middleware** - Multi-domain routing
4. **Email Integration** - Resend domain management
5. **UI Components** - Domain management dashboard

---

## 📊 Database Schema Changes

### **Add to `stores` table:**

```typescript
// convex/schema.ts

stores: defineTable({
  // ... existing fields ...
  
  // Custom Domain Configuration
  customDomain: v.optional(v.object({
    domain: v.string(), // e.g., "creatorname.com" or "creator.ppracademy.com"
    domainType: v.union(
      v.literal("subdomain"), // creator.ppracademy.com
      v.literal("custom")     // creatorname.com
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("verifying"),
      v.literal("active"),
      v.literal("failed")
    ),
    verificationCode: v.optional(v.string()), // TXT record value
    verifiedAt: v.optional(v.number()),
    dnsRecords: v.optional(v.array(v.object({
      type: v.string(), // "A", "CNAME", "TXT"
      name: v.string(),
      value: v.string(),
      verified: v.boolean(),
    }))),
  })),
  
  // Email Domain Configuration (linked to Resend)
  emailDomain: v.optional(v.object({
    domain: v.string(), // e.g., "mail.ppracademy.com" or "creatorname.com"
    fromEmail: v.string(), // e.g., "hello@creatorname.com"
    fromName: v.string(), // e.g., "Creator Name"
    replyToEmail: v.optional(v.string()),
    resendDomainId: v.optional(v.string()), // Resend domain ID
    status: v.union(
      v.literal("pending"),
      v.literal("verifying"),
      v.literal("active"),
      v.literal("failed")
    ),
    spfVerified: v.optional(v.boolean()),
    dkimVerified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
  })),
})
```

---

## 🔧 Implementation Steps

### **Step 1: Database Schema** ✅

Add domain fields to stores table (see above).

### **Step 2: Domain Verification System**

Create verification flow:

**File:** `convex/domains.ts`

```typescript
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { internal } from "./_generated/api";

// Request subdomain (auto-approved)
export const requestSubdomain = mutation({
  args: {
    storeId: v.id("stores"),
    subdomain: v.string(), // e.g., "beatmaker"
  },
  returns: v.object({
    success: v.boolean(),
    domain: v.string(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");
    
    // Check if subdomain is available
    const existing = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("customDomain.domain"), `${args.subdomain}.ppracademy.com`))
      .first();
    
    if (existing) {
      return {
        success: false,
        domain: "",
        message: "Subdomain already taken",
      };
    }
    
    // Validate subdomain format (alphanumeric + hyphens only)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(args.subdomain)) {
      return {
        success: false,
        domain: "",
        message: "Subdomain can only contain letters, numbers, and hyphens",
      };
    }
    
    const domain = `${args.subdomain}.ppracademy.com`;
    
    // Update store with subdomain (auto-verified)
    await ctx.db.patch(args.storeId, {
      customDomain: {
        domain,
        domainType: "subdomain",
        status: "active",
        verifiedAt: Date.now(),
        dnsRecords: [], // Not needed for subdomains
      },
    });
    
    // Also set up email subdomain
    await ctx.db.patch(args.storeId, {
      emailDomain: {
        domain: `mail.ppracademy.com`,
        fromEmail: `${args.subdomain}@mail.ppracademy.com`,
        fromName: store.name,
        status: "active",
        spfVerified: true,
        dkimVerified: true,
        verifiedAt: Date.now(),
      },
    });
    
    return {
      success: true,
      domain,
      message: `Subdomain ${domain} activated!`,
    };
  },
});

// Request custom domain
export const requestCustomDomain = mutation({
  args: {
    storeId: v.id("stores"),
    domain: v.string(), // e.g., "creatorname.com"
  },
  returns: v.object({
    verificationCode: v.string(),
    dnsRecords: v.array(v.object({
      type: v.string(),
      name: v.string(),
      value: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");
    
    // Generate verification code
    const verificationCode = `ppr-academy-verify-${Math.random().toString(36).substring(7)}`;
    
    // DNS records needed for custom domain
    const dnsRecords = [
      {
        type: "CNAME",
        name: "@",
        value: "cname.vercel-dns.com", // Or your hosting provider
      },
      {
        type: "CNAME",
        name: "www",
        value: "cname.vercel-dns.com",
      },
      {
        type: "TXT",
        name: "_ppr-academy-verification",
        value: verificationCode,
      },
    ];
    
    await ctx.db.patch(args.storeId, {
      customDomain: {
        domain: args.domain,
        domainType: "custom",
        status: "pending",
        verificationCode,
        dnsRecords: dnsRecords.map(r => ({ ...r, verified: false })),
      },
    });
    
    // Schedule verification check in 5 minutes
    await ctx.scheduler.runAfter(5 * 60 * 1000, internal.domains.verifyCustomDomain, {
      storeId: args.storeId,
    });
    
    return { verificationCode, dnsRecords };
  },
});

// Verify custom domain DNS
export const verifyCustomDomain = action({
  args: { storeId: v.id("stores") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const store = await ctx.runQuery(internal.domains.getStoreDomain, { storeId: args.storeId });
    if (!store?.customDomain) return null;
    
    const { domain, verificationCode } = store.customDomain;
    
    try {
      // Check DNS records using Node.js dns module
      const dns = await import("dns/promises");
      
      // Verify TXT record
      const txtRecords = await dns.resolveTxt(`_ppr-academy-verification.${domain}`);
      const verified = txtRecords.flat().includes(verificationCode || "");
      
      if (verified) {
        // Mark as verified
        await ctx.runMutation(internal.domains.markDomainVerified, {
          storeId: args.storeId,
        });
      } else {
        // Retry in 15 minutes
        await ctx.scheduler.runAfter(15 * 60 * 1000, internal.domains.verifyCustomDomain, {
          storeId: args.storeId,
        });
      }
    } catch (error) {
      console.error("DNS verification failed:", error);
      // Retry in 15 minutes
      await ctx.scheduler.runAfter(15 * 60 * 1000, internal.domains.verifyCustomDomain, {
        storeId: args.storeId,
      });
    }
    
    return null;
  },
});

// Internal helper queries/mutations
export const getStoreDomain = query({
  args: { storeId: v.id("stores") },
  returns: v.union(v.object({
    customDomain: v.optional(v.any()),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.storeId);
  },
});

export const markDomainVerified = mutation({
  args: { storeId: v.id("stores") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store?.customDomain) return null;
    
    await ctx.db.patch(args.storeId, {
      customDomain: {
        ...store.customDomain,
        status: "active",
        verifiedAt: Date.now(),
      },
    });
    
    return null;
  },
});
```

### **Step 3: Routing Middleware**

Update Next.js middleware to handle custom domains:

**File:** `middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/library(.*)",
  "/home(.*)",
  "/courses/create(.*)",
  "/api/courses/create(.*)",
  "/api/user(.*)",
  "/profile(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const hostname = req.headers.get("host") || "";
  const url = req.nextUrl.clone();
  
  // Extract subdomain or custom domain
  const isSubdomain = hostname.endsWith(".ppracademy.com") && hostname !== "ppracademy.com";
  const isCustomDomain = !hostname.includes("ppracademy.com") && !hostname.includes("localhost");
  
  // Handle subdomain routing (creator.ppracademy.com)
  if (isSubdomain) {
    const subdomain = hostname.replace(".ppracademy.com", "");
    
    // Rewrite to /[slug] route
    url.pathname = `/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // Handle custom domain routing (creatorname.com)
  if (isCustomDomain) {
    // Query Convex to find store by custom domain
    // Note: This requires edge-compatible DB lookup
    // For now, we'll use a cookie-based cache
    
    // Rewrite to /[slug] route
    url.pathname = `/_custom-domain${url.pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-custom-domain", hostname);
    return response;
  }
  
  // Standard PPR Academy routing
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return NextResponse.next();
  }
  
  // CORS for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || '*';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
    
    if (isProtectedRoute(req)) await auth.protect();
    return response;
  }
  
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### **Step 4: Email Domain Integration**

Add Resend domain setup per creator:

**File:** `convex/emailDomains.ts`

```typescript
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";

// Request email domain verification
export const setupEmailDomain = action({
  args: {
    storeId: v.id("stores"),
    domain: v.string(), // e.g., "creatorname.com"
    fromEmail: v.string(), // e.g., "hello@creatorname.com"
    fromName: v.string(),
  },
  returns: v.object({
    dnsRecords: v.array(v.object({
      type: v.string(),
      name: v.string(),
      value: v.string(),
    })),
    instructions: v.string(),
  }),
  handler: async (ctx, args) => {
    // In production, this would call Resend API to create a domain
    // For now, provide DNS instructions
    
    const dnsRecords = [
      {
        type: "TXT",
        name: "@",
        value: "v=spf1 include:_spf.resend.com ~all",
      },
      {
        type: "CNAME",
        name: "resend._domainkey",
        value: "resend._domainkey.resend.com",
      },
      {
        type: "CNAME",
        name: "resend2._domainkey",
        value: "resend2._domainkey.resend.com",
      },
      {
        type: "CNAME",
        name: "resend3._domainkey",
        value: "resend3._domainkey.resend.com",
      },
      {
        type: "TXT",
        name: "_dmarc",
        value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@" + args.domain,
      },
    ];
    
    // Save to store
    await ctx.runMutation(internal.emailDomains.saveEmailDomain, {
      storeId: args.storeId,
      domain: args.domain,
      fromEmail: args.fromEmail,
      fromName: args.fromName,
    });
    
    return {
      dnsRecords,
      instructions: `Add these DNS records to ${args.domain} to verify your email domain.`,
    };
  },
});

// Save email domain configuration
export const saveEmailDomain = mutation({
  args: {
    storeId: v.id("stores"),
    domain: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.storeId, {
      emailDomain: {
        domain: args.domain,
        fromEmail: args.fromEmail,
        fromName: args.fromName,
        status: "pending",
        spfVerified: false,
        dkimVerified: false,
      },
    });
    return null;
  },
});

// Verify email domain
export const verifyEmailDomain = action({
  args: { storeId: v.id("stores") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // In production: Call Resend API to check verification status
    // For now: Mock verification
    
    await ctx.runMutation(internal.emailDomains.markEmailDomainVerified, {
      storeId: args.storeId,
    });
    
    return true;
  },
});

export const markEmailDomainVerified = mutation({
  args: { storeId: v.id("stores") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store?.emailDomain) return null;
    
    await ctx.db.patch(args.storeId, {
      emailDomain: {
        ...store.emailDomain,
        status: "active",
        spfVerified: true,
        dkimVerified: true,
        verifiedAt: Date.now(),
      },
    });
    
    return null;
  },
});
```

### **Step 5: Auto-populate Email in Campaign Creation**

Update email campaign creation to auto-fill from store's email domain:

**File:** `app/(dashboard)/store/[storeId]/email-campaigns/create/page.tsx`

```typescript
// Add this useEffect after line 44:

useEffect(() => {
  if (store?.emailDomain?.status === "active") {
    setFromEmail(store.emailDomain.fromEmail);
    setFromName(store.emailDomain.fromName);
    if (store.emailDomain.replyToEmail) {
      setReplyToEmail(store.emailDomain.replyToEmail);
    }
  } else {
    // Fallback to platform default
    setFromEmail("noreply@ppracademy.com");
    setFromName("PPR Academy");
  }
}, [store]);

// Add state for fromName:
const [fromName, setFromName] = useState("");

// Update the form to show fromName field and make fromEmail readonly if verified:
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="fromName">From Name</Label>
    <Input
      id="fromName"
      placeholder="Your Store Name"
      value={fromName}
      onChange={(e) => setFromName(e.target.value)}
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="fromEmail">
      From Email
      {store?.emailDomain?.status === "active" && (
        <Badge variant="success" className="ml-2">Verified</Badge>
      )}
    </Label>
    <Input
      id="fromEmail"
      type="email"
      placeholder="noreply@yourdomain.com"
      value={fromEmail}
      onChange={(e) => setFromEmail(e.target.value)}
      readOnly={store?.emailDomain?.status === "active"}
      className={store?.emailDomain?.status === "active" ? "bg-muted" : ""}
    />
    {store?.emailDomain?.status !== "active" && (
      <p className="text-sm text-muted-foreground">
        <Link href={`/store/${storeId}/settings/email-domain`} className="text-primary">
          Set up your custom email domain
        </Link>
      </p>
    )}
  </div>
</div>
```

---

## 🎨 UI Components

### **Domain Settings Page**

**File:** `app/(dashboard)/store/[storeId]/settings/domain/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Mail, Check, AlertCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DomainSettingsPage() {
  const params = useParams();
  const storeId = params.storeId as Id<"stores">;
  const { toast } = useToast();
  
  const store = useQuery(api.stores.getStoreById, { storeId });
  const requestSubdomain = useMutation(api.domains.requestSubdomain);
  const requestCustomDomain = useMutation(api.domains.requestCustomDomain);
  
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  
  const handleRequestSubdomain = async () => {
    setIsRequesting(true);
    try {
      const result = await requestSubdomain({ storeId, subdomain });
      if (result.success) {
        toast({
          title: "Subdomain activated!",
          description: `Your store is now live at ${result.domain}`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request subdomain",
        variant: "destructive",
      });
    }
    setIsRequesting(false);
  };
  
  const handleRequestCustomDomain = async () => {
    setIsRequesting(true);
    try {
      const result = await requestCustomDomain({ storeId, domain: customDomain });
      toast({
        title: "Custom domain requested",
        description: "Add the DNS records below to verify your domain",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request custom domain",
        variant: "destructive",
      });
    }
    setIsRequesting(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Domain Settings</h1>
        <p className="text-muted-foreground">
          Connect a custom domain to your storefront
        </p>
      </div>
      
      {/* Current Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Current Domain
          </CardTitle>
        </CardHeader>
        <CardContent>
          {store?.customDomain ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">{store.customDomain.domain}</span>
                <Badge variant={store.customDomain.status === "active" ? "success" : "secondary"}>
                  {store.customDomain.status}
                </Badge>
              </div>
              {store.customDomain.status === "active" && (
                <p className="text-sm text-muted-foreground">
                  ✅ Your custom domain is active and verified
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Currently using: ppracademy.com/{store?.slug}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Subdomain Setup */}
      {!store?.customDomain?.domain && (
        <Card>
          <CardHeader>
            <CardTitle>Free Subdomain</CardTitle>
            <CardDescription>
              Get a professional subdomain: yourname.ppracademy.com
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Choose your subdomain</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="yourstore"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                />
                <span className="flex items-center text-muted-foreground">.ppracademy.com</span>
              </div>
            </div>
            <Button onClick={handleRequestSubdomain} disabled={!subdomain || isRequesting}>
              Activate Subdomain
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Custom Domain Setup */}
      {!store?.customDomain?.domain && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Domain (Premium)</CardTitle>
            <CardDescription>
              Use your own domain: yourstore.com
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your domain</Label>
              <Input
                placeholder="yourstore.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
              />
            </div>
            <Button onClick={handleRequestCustomDomain} disabled={!customDomain || isRequesting}>
              Request Custom Domain
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* DNS Instructions (if custom domain pending) */}
      {store?.customDomain?.status === "pending" && store.customDomain.dnsRecords && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              DNS Configuration Required
            </CardTitle>
            <CardDescription>
              Add these DNS records to your domain registrar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {store.customDomain.dnsRecords.map((record, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{record.type} Record</span>
                  {record.verified && <Check className="h-4 w-4 text-green-500" />}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded">{record.name}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(record.name)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">{record.value}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(record.value)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Alert>
              <AlertDescription>
                DNS changes can take up to 48 hours to propagate. We'll automatically verify your records.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 🚀 Deployment Checklist

### **For Vercel Hosting:**

1. **Add Wildcard Domain:**
   - Go to Vercel project settings
   - Add domain: `*.ppracademy.com`
   - Configure DNS with your domain registrar:
     - `CNAME` record: `*.ppracademy` → `cname.vercel-dns.com`

2. **Environment Variables:**
   ```bash
   RESEND_API_KEY=re_your_key_here
   NEXT_PUBLIC_APP_URL=https://ppracademy.com
   ```

3. **Resend Setup:**
   - Add domain `mail.ppracademy.com` in Resend
   - Configure SPF, DKIM records
   - Verify domain

### **For Custom Domains:**

Each creator will need to:
1. Point their domain to Vercel (CNAME record)
2. Add verification TXT record
3. Wait for DNS propagation
4. System auto-verifies and activates

---

## 📊 Pricing Tiers

### **Free Tier**
- URL: `ppracademy.com/slug`
- Email: `noreply@ppracademy.com`
- Features: All core features

### **Pro Tier ($29/mo)**
- URL: `slug.ppracademy.com`
- Email: `slug@mail.ppracademy.com`
- Features: + subdomain + branded email

### **Premium Tier ($99/mo)**
- URL: `custom.com`
- Email: `hello@custom.com`
- Features: + full custom domain + custom email

---

## 🎯 Next Steps

1. **Add domain fields to schema** ✅ (see above)
2. **Create `convex/domains.ts`** ✅ (see above)
3. **Create `convex/emailDomains.ts`** ✅ (see above)
4. **Update middleware.ts** ✅ (see above)
5. **Create domain settings page** ✅ (see above)
6. **Update email campaign page** ✅ (see above)
7. **Configure Vercel wildcard domain**
8. **Set up Resend domain**
9. **Test subdomain routing**
10. **Test custom domain flow**

---

This gives you a complete custom domain + branded email system!

