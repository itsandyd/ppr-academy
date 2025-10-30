# Follow Gates - Quick Integration Guide

## 🚀 How to Use Follow Gates in Your Storefront

### Step 1: Import the Modal Component

```typescript
import { FollowGateModal } from "@/components/follow-gates/FollowGateModal";
import { useState } from "react";
```

### Step 2: Add State for Modal

```typescript
const [showFollowGate, setShowFollowGate] = useState(false);
const [selectedProduct, setSelectedProduct] = useState<any>(null);
```

### Step 3: Replace Download Button Logic

**Before (Direct Download):**
```typescript
<Button onClick={() => window.open(product.downloadUrl, '_blank')}>
  Download Now
</Button>
```

**After (With Follow Gate):**
```typescript
<Button 
  onClick={() => {
    if (product.followGateEnabled) {
      setSelectedProduct(product);
      setShowFollowGate(true);
    } else {
      window.open(product.downloadUrl, '_blank');
    }
  }}
>
  {product.followGateEnabled ? 'Get Free Download' : 'Download Now'}
</Button>

{/* Add modal at the end of your component */}
{selectedProduct && (
  <FollowGateModal
    open={showFollowGate}
    onOpenChange={setShowFollowGate}
    product={selectedProduct}
    onSuccess={(submissionId) => {
      console.log('Follow gate completed!', submissionId);
      // Optionally auto-download after success
      if (selectedProduct.downloadUrl) {
        window.open(selectedProduct.downloadUrl, '_blank');
      }
    }}
  />
)}
```

### Step 4: Example Integration in Storefront Page

**File:** `app/[slug]/page.tsx` or `app/[slug]/components/DesktopStorefront.tsx`

```typescript
"use client";

import { useState } from "react";
import { FollowGateModal } from "@/components/follow-gates/FollowGateModal";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: any }) {
  const [showFollowGate, setShowFollowGate] = useState(false);

  const handleDownload = () => {
    if (product.followGateEnabled) {
      setShowFollowGate(true);
    } else {
      // Direct download
      if (product.downloadUrl) {
        window.open(product.downloadUrl, '_blank');
      }
    }
  };

  return (
    <>
      <div className="product-card">
        <h3>{product.title}</h3>
        <p>{product.description}</p>
        
        <Button onClick={handleDownload} className="w-full">
          {product.followGateEnabled ? (
            <>
              🎁 Get Free Download
            </>
          ) : (
            <>
              Download Now
            </>
          )}
        </Button>
      </div>

      <FollowGateModal
        open={showFollowGate}
        onOpenChange={setShowFollowGate}
        product={product}
        onSuccess={(submissionId) => {
          console.log('User completed follow gate!', submissionId);
          // Email will be sent automatically if configured
          // Download link is provided in the success modal
        }}
      />
    </>
  );
}
```

---

## 🎯 Complete Example: Product Grid with Follow Gates

```typescript
"use client";

import { useState } from "react";
import { FollowGateModal } from "@/components/follow-gates/FollowGateModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Lock } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface Product {
  _id: Id<"digitalProducts">;
  title: string;
  description?: string;
  imageUrl?: string;
  downloadUrl?: string;
  price: number;
  followGateEnabled?: boolean;
  followGateRequirements?: any;
  followGateSocialLinks?: any;
  followGateMessage?: string;
}

export function ProductGrid({ products }: { products: Product[] }) {
  const [showFollowGate, setShowFollowGate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    // If product has follow gate, show modal
    if (product.followGateEnabled) {
      setSelectedProduct(product);
      setShowFollowGate(true);
    } 
    // If it's paid, go to checkout
    else if (product.price > 0) {
      window.location.href = `/products/${product._id}/checkout`;
    } 
    // If it's free with no gate, direct download
    else if (product.downloadUrl) {
      window.open(product.downloadUrl, '_blank');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
            </CardHeader>
            
            <CardContent>
              <CardTitle className="flex items-center gap-2">
                {product.title}
                {product.followGateEnabled && (
                  <Lock className="w-4 h-4 text-chart-1" />
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {product.description}
              </p>
            </CardContent>

            <CardFooter>
              <Button 
                onClick={() => handleProductClick(product)}
                className="w-full"
                variant={product.followGateEnabled ? "default" : "outline"}
              >
                {product.followGateEnabled && (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                {product.followGateEnabled 
                  ? "Get Free Download" 
                  : product.price > 0 
                  ? `Buy for $${product.price}` 
                  : "Download Free"
                }
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Follow Gate Modal */}
      {selectedProduct && (
        <FollowGateModal
          open={showFollowGate}
          onOpenChange={setShowFollowGate}
          product={selectedProduct}
          onSuccess={(submissionId) => {
            console.log(`Follow gate completed for ${selectedProduct.title}`, submissionId);
            // Optionally trigger analytics event
            // Track conversion in your analytics platform
          }}
        />
      )}
    </>
  );
}
```

---

## 📊 View Analytics in Your Dashboard

```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export function FollowGateAnalyticsDashboard() {
  const { user } = useUser();
  
  const analytics = useQuery(
    api.followGateSubmissions.getFollowGateAnalytics,
    user?.id ? { creatorId: user.id } : "skip"
  );

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Follow Gate Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-lg border">
          <p className="text-sm text-muted-foreground">Total Submissions</p>
          <p className="text-3xl font-bold">{analytics.totalSubmissions}</p>
        </div>
        
        <div className="p-6 bg-white rounded-lg border">
          <p className="text-sm text-muted-foreground">Downloads</p>
          <p className="text-3xl font-bold">{analytics.totalDownloads}</p>
        </div>
        
        <div className="p-6 bg-white rounded-lg border">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-3xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Platform Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Instagram</span>
            <span className="font-bold">{analytics.platformBreakdown.instagram}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>TikTok</span>
            <span className="font-bold">{analytics.platformBreakdown.tiktok}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>YouTube</span>
            <span className="font-bold">{analytics.platformBreakdown.youtube}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Spotify</span>
            <span className="font-bold">{analytics.platformBreakdown.spotify}</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
        <div className="space-y-2">
          {analytics.recentSubmissions.map((submission, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>{submission.email}</span>
              <span className="text-muted-foreground">
                {submission.platformCount} platforms • {new Date(submission.submittedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Testing Your Integration

1. **Create a Test Product:**
   - Go to your dashboard
   - Create a new digital download
   - In the "Options" step, enable Follow Gate
   - Set Instagram + TikTok required (1 out of 2)
   - Add your social links
   - Save/Publish

2. **Test the User Flow:**
   - Visit your storefront as a logged-out user
   - Click the product download button
   - Verify follow gate modal appears
   - Enter email
   - Click "Follow" buttons
   - Check confirmation boxes
   - Submit
   - Verify success screen shows
   - Check download button works

3. **Verify Backend:**
   - Check Convex dashboard
   - View `followGateSubmissions` table
   - Confirm submission was recorded
   - Check platform flags are correct

---

## 🎉 You're All Set!

Your follow gate system is now ready to:
- ✅ Capture emails from visitors
- ✅ Grow your social media following
- ✅ Track conversions and analytics
- ✅ Gate downloads behind follows
- ✅ Build relationships with fans

**Happy creating!** 🚀

