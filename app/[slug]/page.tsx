"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, use } from "react";
import { CheckCircle, Download, Mail, ArrowRight, Store } from "lucide-react";
import { notFound } from "next/navigation";

interface StorefrontPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Lead Magnet Preview Component (same as PhonePreview)
function LeadMagnetPreview({ leadMagnet, isFullScreen = false }: { leadMagnet?: any; isFullScreen?: boolean }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = () => {
    if (formData.name && formData.email) {
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="w-full p-4 space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-bold text-lg text-green-800">
            🎉 Success!
          </h3>
          <p className="text-sm text-green-700">
            Thanks {formData.name || "John"}! Check your email for your free resource.
          </p>
        </div>

        {/* Download Preview */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {leadMagnet?.title || "Ultimate Marketing Guide"}
              </p>
              <p className="text-xs text-gray-500">PDF • 2.3 MB</p>
            </div>
          </div>
          <Button 
            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm"
            onClick={() => {
              if (leadMagnet?.downloadUrl) {
                // Create a temporary link and trigger download
                const link = document.createElement('a');
                link.href = leadMagnet.downloadUrl;
                link.download = leadMagnet.title || 'lead-magnet';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
            disabled={!leadMagnet?.downloadUrl}
          >
            <Download className="w-4 h-4 mr-2" />
            {leadMagnet?.downloadUrl ? 'Download Now' : 'File Not Available'}
          </Button>
        </div>

        {/* Email Confirmation */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-700">
              Confirmation email sent to {formData.email || "john@example.com"}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-2 space-y-2">
          <p className="text-xs text-gray-600 text-center">
            Want more marketing tips? Follow us on social media!
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSuccess(false)}
            className="w-full text-xs"
          >
            ← Back to Opt-in Form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-4">
      {/* Image Preview */}
      <div className="w-full h-32 bg-[#E9FFD9] rounded-lg flex items-center justify-center">
        {leadMagnet?.imageUrl ? (
          <img 
            src={leadMagnet.imageUrl} 
            alt="Lead magnet preview" 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-200 rounded-lg mx-auto mb-2" />
            <span className="text-xs text-muted-foreground">400×400</span>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">
          {leadMagnet?.title || "Lead Magnet Title"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {leadMagnet?.subtitle || "Get instant access to our comprehensive guide and boost your marketing results today!"}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <Input 
          placeholder="Your Name" 
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="h-10" 
        />
        <Input 
          placeholder="Your Email" 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="h-10" 
        />
        <Button 
          onClick={handleSubmit}
          className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
        >
          {leadMagnet?.ctaText || "Get Free Resource"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-xs text-gray-600">No spam</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-xs text-gray-600">Instant access</span>
        </div>
      </div>

      {/* Auto-cycle indicator */}
      <div className="flex justify-center pt-1">
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full ${!showSuccess ? "bg-green-500" : "bg-gray-300"}`} />
          <div className={`w-2 h-2 rounded-full ${showSuccess ? "bg-green-500" : "bg-gray-300"}`} />
        </div>
      </div>
    </div>
  );
}

// Store Products Display
function StoreProducts({ products, isFullScreen = false }: { products: any[]; isFullScreen?: boolean }) {
  const publishedProducts = products?.filter(p => p.isPublished) || [];

  if (publishedProducts.length === 0) {
    return (
      <div className="w-full text-center p-8">
        <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No products available yet</p>
        <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
      </div>
    );
  }

  // Categorize products
  const freeResources = publishedProducts.filter(p => p.price === 0);
  const paidProducts = publishedProducts.filter(p => p.price > 0);
  const premiumProducts = paidProducts.filter(p => p.price >= 50);
  const standardProducts = paidProducts.filter(p => p.price < 50);

  const ProductCard = ({ product }: { product: any }) => (
    <Card key={product._id} className="p-4 border border-gray-200 hover:shadow-md transition-shadow">
      {product.imageUrl && (
        <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
        {product.title}
      </h3>
      {product.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {product.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {product.price === 0 ? "FREE" : `$${product.price}`}
        </Badge>
        <button className="text-xs bg-[#6356FF] text-white px-3 py-1 rounded-full hover:bg-[#5248E6] transition-colors">
          {product.price === 0 ? "Get Free" : "Buy Now"}
        </button>
      </div>
    </Card>
  );

  return (
    <div className="w-full space-y-6">
      {/* Free Resources Section */}
      {freeResources.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="font-semibold text-lg text-[#0F0F0F]">Free Resources</h3>
            <Badge className="bg-green-100 text-green-800 text-xs">
              {freeResources.length} available
            </Badge>
          </div>
          <div className="space-y-3">
            {freeResources.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Premium Products Section */}
      {premiumProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="font-semibold text-lg text-[#0F0F0F]">Premium Collection</h3>
            <Badge className="bg-purple-100 text-purple-800 text-xs">
              {premiumProducts.length} available
            </Badge>
          </div>
          <div className="space-y-3">
            {premiumProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Standard Products Section */}
      {standardProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="font-semibold text-lg text-[#0F0F0F]">Digital Products</h3>
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              {standardProducts.length} available
            </Badge>
          </div>
          <div className="space-y-3">
            {standardProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StorefrontPage({ params }: StorefrontPageProps) {
  // Unwrap the params Promise
  const { slug } = use(params);
  
  // Fetch store by slug
  const store = useQuery(
    api.stores.getStoreBySlug,
    { slug: slug }
  );

  // Fetch user data if store exists
  const user = useQuery(
    api.users.getUserByClerkId,
    store ? { clerkId: store.userId } : "skip"
  );

  // Fetch products for this store
  const products = useQuery(
    api.digitalProducts.getProductsByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Loading state
  if (store === undefined || user === undefined || products === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-sm mx-auto h-[600px] rounded-3xl border-4 border-black/90 bg-white flex flex-col p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Store not found
  if (store === null) {
    notFound();
  }

  // Get display name and avatar
  const displayName = user?.name || "Store Owner";
  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = user?.imageUrl || "";

  // Check if there are lead magnets (price: 0)
  const leadMagnets = products?.filter(p => p.price === 0 && p.style === "card") || [];
  const hasLeadMagnets = leadMagnets.length > 0;
  const latestLeadMagnet = hasLeadMagnets ? leadMagnets.sort((a, b) => b._creationTime - a._creationTime)[0] : null;

  const leadMagnetData = latestLeadMagnet ? {
    title: latestLeadMagnet.title,
    subtitle: latestLeadMagnet.description,
    imageUrl: latestLeadMagnet.imageUrl,
    ctaText: latestLeadMagnet.buttonLabel,
    downloadUrl: latestLeadMagnet.downloadUrl
  } : null;

    return (
    <div className="min-h-screen bg-white">
      {/* Desktop Layout - Store Landing Page */}
      <div className="hidden lg:block">
        {/* Store Landing Page Header */}
        <div className="bg-gradient-to-r from-[#6356FF] to-[#5248E6] text-white">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="w-16 h-16 border-4 border-white/20">
                <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
                <AvatarFallback className="text-xl font-bold bg-white/20">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold mb-2">{store.name}</h1>
                <p className="text-white/80 text-lg">by {displayName} • @{store.slug}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{products?.filter(p => p.isPublished).length || 0}</div>
                <div className="text-white/80 text-sm">Products Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{products?.filter(p => p.price === 0 && p.isPublished).length || 0}</div>
                <div className="text-white/80 text-sm">Free Resources</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">⚡</div>
                <div className="text-white/80 text-sm">Instant Download</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Store Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* {hasLeadMagnets && (
            <div className="mb-16">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-bold text-green-800 text-lg">🎁 FREE STARTER RESOURCE</span>
                </div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  {latestLeadMagnet?.title}
                </h2>
                <p className="text-green-700 mb-6">
                  Get instant access to this valuable resource - completely free! Join thousands who have already downloaded it.
                </p>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md">
                  <LeadMagnetPreview leadMagnet={leadMagnetData} isFullScreen={true} />
                </div>
              </div>
            </div>
          )} */}

          {/* Products Section */}
          <div className="space-y-12">
            <StoreProducts products={products || []} isFullScreen={true} />
          </div>

          {/* Store Footer */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
                  <AvatarFallback className="font-semibold bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-xl text-[#0F0F0F]">About {displayName}</h3>
                  <p className="text-[#51536A]">Creator of {store.name}</p>
                </div>
              </div>
              <p className="text-[#51536A] leading-relaxed mb-6">
                Welcome to my digital store! I create high-quality resources and tools to help you succeed in your journey. 
                Every product is carefully crafted with your success in mind.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6356FF] flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Instant Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6356FF] flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6356FF] flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Matches PhonePreview.tsx */}
      <div className="lg:hidden min-h-screen bg-white flex flex-col">
        {/* Mobile App Header (matches PhonePreview) */}
        <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm truncate block">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate block">@{store.slug}</span>
            </div>
          </div>
        </div>
        
        {/* Mobile App Content (matches PhonePreview) */}
        <div className="flex-1 p-6">
          {hasLeadMagnets && leadMagnetData ? (
            <LeadMagnetPreview leadMagnet={leadMagnetData} isFullScreen={true} />
          ) : (
            <StoreProducts products={products || []} isFullScreen={true} />
          )}
        </div>
      </div>
    </div>
  );
} 