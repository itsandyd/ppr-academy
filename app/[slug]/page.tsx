"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, use } from "react";
import * as React from "react";
import { CheckCircle, Download, Mail, ArrowRight, Store, Gift, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { notFound } from "next/navigation";

interface StorefrontPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Lead Magnet Preview Component (same as PhonePreview)
function LeadMagnetPreview({ leadMagnet, isFullScreen = false, storeData }: { leadMagnet?: any; isFullScreen?: boolean; storeData?: any }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ submissionId: string; downloadUrl?: string } | null>(null);
  
  // Check if leadSubmissions API is available (after npx convex dev)
  const hasLeadSubmissionsAPI = (api as any).leadSubmissions?.submitLead;
  const submitLead = hasLeadSubmissionsAPI ? useMutation((api as any).leadSubmissions.submitLead) : null;
  const trackDownload = hasLeadSubmissionsAPI ? useMutation((api as any).leadSubmissions.trackDownload) : null;

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      alert("Please fill in both name and email");
      return;
    }

    if (!leadMagnet?.productId || !storeData?.store?._id || !storeData?.store?.userId) {
      alert("Missing product or store information");
      console.error("❌ Missing data:", {
        productId: leadMagnet?.productId,
        storeId: storeData?.store?._id,
        adminUserId: storeData?.store?.userId,
        leadMagnet,
        storeData
      });
      return;
    }

    console.log("🚀 Starting lead submission with data:", {
      name: formData.name.trim(),
      email: formData.email.trim(),
      productId: leadMagnet.productId,
      storeId: storeData.store._id,
      adminUserId: storeData.store.userId,
      hasSubmitFunction: !!submitLead,
      hasAPI: hasLeadSubmissionsAPI
    });

    setIsSubmitting(true);
    try {
      let result;

      if (submitLead && hasLeadSubmissionsAPI) {
        // Use real API if available
        console.log("📡 Calling submitLead mutation...");
        result = await submitLead({
          name: formData.name.trim(),
          email: formData.email.trim(),
          productId: leadMagnet.productId,
          storeId: storeData.store._id,
          adminUserId: storeData.store.userId,
          ipAddress: undefined,
          userAgent: navigator.userAgent,
          source: "storefront",
        });

        console.log("✅ Lead successfully submitted to database:", {
          submissionId: result.submissionId,
          customerCreated: true,
          downloadAvailable: result.hasAccess,
          result
        });
      } else {
        // Fallback simulation (until API is regenerated)
        result = {
          submissionId: `lead_${Date.now()}`,
          hasAccess: true,
          downloadUrl: leadMagnet?.downloadUrl,
        };

        console.log("⚠️ Using simulated submission (run 'npx convex dev' to enable real database):", {
          leadData: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            productId: leadMagnet.productId,
            storeId: storeData.store._id,
            adminUserId: storeData.store.userId,
            source: "storefront",
          },
          customerRecord: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            type: "lead",
            source: leadMagnet?.title || "Lead Magnet",
          }
        });
      }

      setSubmissionResult({
        submissionId: result.submissionId,
        downloadUrl: result.downloadUrl,
      });
      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting lead:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (submissionResult?.downloadUrl && submissionResult?.submissionId) {
      try {
        // Track download if API is available
        if (trackDownload && hasLeadSubmissionsAPI) {
          await trackDownload({
            submissionId: submissionResult.submissionId,
          });
          console.log("✅ Download tracked in database:", submissionResult.submissionId);
        } else {
          console.log("⚠️ Download tracking simulated:", submissionResult.submissionId);
        }

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = submissionResult.downloadUrl;
        link.download = leadMagnet?.title || 'lead-magnet';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error tracking download:", error);
        // Still allow download even if tracking fails
        const link = document.createElement('a');
        link.href = submissionResult.downloadUrl;
        link.download = leadMagnet?.title || 'lead-magnet';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  if (showSuccess) {
    return (
      <div className="w-full p-4 space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-bold text-lg text-green-800 dark:text-green-300">
            🎉 Success!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400">
            Thanks {formData.name || "John"}! Check your email for your free resource.
          </p>
        </div>

        {/* Download Preview */}
        <div className="bg-card rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">
                {leadMagnet?.title || "Ultimate Marketing Guide"}
              </p>
              <p className="text-xs text-muted-foreground">
                {leadMagnet?.downloadUrl ? 'Ready for Download' : 'PDF • 2.3 MB'}
              </p>
            </div>
          </div>
          <Button 
            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm"
            onClick={handleDownload}
            disabled={!submissionResult?.downloadUrl}
          >
            <Download className="w-4 h-4 mr-2" />
            {submissionResult?.downloadUrl ? 'Download Now' : 'File Not Available'}
          </Button>
        </div>

        {/* Email Confirmation */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Confirmation email sent to {formData.email || "john@example.com"}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-2 space-y-2">
          <p className="text-xs text-muted-foreground text-center">
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
    <div className="w-full p-4 space-y-4 bg-card">
      {/* Image Preview */}
      <div className="w-full h-32 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center border border-green-200">
        {leadMagnet?.imageUrl ? (
          <img 
            src={leadMagnet.imageUrl} 
            alt="Lead magnet preview" 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Gift className="w-8 h-8 text-green-600" />
            </div>
            <span className="text-xs text-green-600 font-medium">Lead Magnet</span>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-card-foreground">
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
          className="h-12 bg-card border-border text-foreground placeholder-muted-foreground focus:border-green-500 focus:ring-green-500" 
        />
        <Input 
          placeholder="Your Email" 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="h-12 bg-card border-border text-foreground placeholder-muted-foreground focus:border-green-500 focus:ring-green-500" 
        />
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : (leadMagnet?.ctaText || "Get Free Resource")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs text-muted-foreground font-medium">No spam</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs text-muted-foreground font-medium">Instant access</span>
        </div>
      </div>

      {/* Auto-cycle indicator */}
      <div className="flex justify-center pt-1">
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full ${!showSuccess ? "bg-green-500" : "bg-muted"}`} />
          <div className={`w-2 h-2 rounded-full ${showSuccess ? "bg-green-500" : "bg-muted"}`} />
        </div>
      </div>
    </div>
  );
}

// Link-in-Bio Style Component
function LinkInBioLayout({ products, leadMagnetData, storeData }: { products: any[]; leadMagnetData?: any; storeData?: any }) {
  const publishedProducts = products?.filter(p => p.isPublished) || [];
  
  // Separate lead magnets from other products
  const leadMagnets = publishedProducts.filter(p => p.price === 0 && p.style === "card");
  const otherProducts = publishedProducts.filter(p => !(p.price === 0 && p.style === "card"));

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

  return (
    <div className="w-full space-y-3">
      {/* Lead Magnet Cards */}
      {leadMagnets.map((leadMagnet) => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <div key={leadMagnet._id}>
            <Card 
              className="p-4 border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-all cursor-pointer touch-manipulation"
              onClick={() => {
                console.log('Mobile card clicked:', leadMagnet.title);
                setIsOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-green-800 truncate">
                    {leadMagnet.title}
                  </h3>
                  <p className="text-xs text-green-600 truncate">
                    Free Resource • Click to get access
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge className="bg-green-100 text-green-800 text-xs border-green-200">
                    FREE
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Card>
            
            {/* Lead Magnet Modal */}
            {isOpen && (
              <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-green-800 dark:text-green-400 text-xl font-bold">{leadMagnet.title}</h3>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="text-muted-foreground hover:text-foreground text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-green-600 dark:text-green-400 text-sm mb-4">
                    Enter your details below to get instant access to your free resource
                  </p>
                  <div className="bg-muted/30 rounded-lg">
                    <LeadMagnetPreview 
                      leadMagnet={{
                        title: leadMagnet.title,
                        subtitle: leadMagnet.description,
                        imageUrl: leadMagnet.imageUrl,
                        ctaText: leadMagnet.buttonLabel,
                        downloadUrl: leadMagnet.downloadUrl,
                        productId: leadMagnet._id
                      }} 
                      storeData={storeData}
                      isFullScreen={false} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Other Products */}
      {otherProducts.map((product) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const isLeadMagnet = product.price === 0;
        
        return (
          <div key={product._id}>
            <Card 
              className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer touch-manipulation"
              onClick={() => {
                console.log('Product clicked:', product.title, 'Price:', product.price);
                if (isLeadMagnet) {
                  setIsOpen(true);
                } else {
                  alert(`Purchase ${product.title} for $${product.price}\n\nCheckout functionality coming soon!`);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {product.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.description || "Digital Product"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    ${product.price}
                  </Badge>
                  {isLeadMagnet ? (
                    <ArrowRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Card>
            
            {/* Modal for free products (lead magnets) */}
            {isLeadMagnet && isOpen && (
              <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-green-800 dark:text-green-400 text-xl font-bold">{product.title}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                      }}
                      className="text-muted-foreground hover:text-foreground text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-green-600 dark:text-green-400 text-sm mb-4">
                    Enter your details below to get instant access to your free resource
                  </p>
                  <div className="bg-muted/30 rounded-lg">
                    <LeadMagnetPreview 
                      leadMagnet={{
                        title: product.title,
                        subtitle: product.description,
                        imageUrl: product.imageUrl,
                        ctaText: product.buttonLabel || "Get Free Resource",
                        downloadUrl: product.downloadUrl,
                        productId: product._id
                      }} 
                      storeData={storeData}
                      isFullScreen={false} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm mx-auto h-[600px] rounded-3xl border-4 border-foreground/90 bg-card flex flex-col p-6">
          <div className="animate-pulse">
                          <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
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
    <div className="min-h-screen bg-background">
      {/* Desktop Layout - Store Landing Page */}
      <div className="hidden lg:block">
        {/* Store Landing Page Header */}
                        <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
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
          <div className="space-y-8">
                          <h2 className="text-2xl font-bold text-center text-foreground mb-8">Available Products & Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Lead Magnet Cards */}
              {products?.filter(p => p.price === 0 && p.style === "card" && p.isPublished).map((leadMagnet) => (
                <Dialog key={leadMagnet._id}>
                  <DialogTrigger asChild>
                    <Card className="group p-6 border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                      {/* Image */}
                      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {leadMagnet.imageUrl ? (
                          <img 
                            src={leadMagnet.imageUrl} 
                            alt={leadMagnet.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center">
                            <Gift className="w-16 h-16 text-green-600 mx-auto mb-2" />
                            <span className="text-sm text-green-600 font-medium">Free Resource</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 text-xs border-green-200 font-semibold">
                            FREE
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg text-green-800 line-clamp-2">
                          {leadMagnet.title}
                        </h3>
                        <p className="text-green-600 text-sm line-clamp-3 leading-relaxed">
                          {leadMagnet.description || "Get instant access to this valuable free resource"}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-green-600 font-medium">Click to get access</span>
                          <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md mx-auto bg-card border-0 shadow-xl data-[state=open]:backdrop-brightness-90 p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-green-800 text-xl font-bold">{leadMagnet.title}</DialogTitle>
                      <DialogDescription className="text-green-600 text-sm">
                        Enter your details below to get instant access to your free resource
                      </DialogDescription>
                    </DialogHeader>
                    <div className="bg-card rounded-lg">
                      <LeadMagnetPreview 
                        leadMagnet={{
                          title: leadMagnet.title,
                          subtitle: leadMagnet.description,
                          imageUrl: leadMagnet.imageUrl,
                          ctaText: leadMagnet.buttonLabel,
                          downloadUrl: leadMagnet.downloadUrl,
                          productId: leadMagnet._id
                        }} 
                        storeData={{ store, user }}
                        isFullScreen={false} 
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
              
              {/* Other Products */}
              {products?.filter(p => !(p.price === 0 && p.style === "card") && p.isPublished).map((product) => {
                const isLeadMagnet = product.price === 0;
                
                if (isLeadMagnet) {
                  // Free products (lead magnets) should show opt-in form
                  return (
                    <Dialog key={product._id}>
                      <DialogTrigger asChild>
                        <Card className="group p-6 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                          {/* Image */}
                          <div className="w-full h-48 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="text-center">
                                <Gift className="w-16 h-16 text-green-600 mx-auto mb-2" />
                                <span className="text-sm text-green-600 font-medium">Free Resource</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 font-semibold">
                                FREE
                              </Badge>
                              <Gift className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-bold text-xl text-green-800 line-clamp-2">
                              {product.title}
                            </h3>
                            <p className="text-green-700 text-sm line-clamp-3 leading-relaxed">
                              {product.description || "Get this amazing free resource"}
                            </p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs text-green-600 font-medium">Click to get free resource</span>
                              <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                          </div>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-md mx-auto bg-card border-0 shadow-xl data-[state=open]:backdrop-brightness-90 p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-center text-xl font-bold text-green-800">
                            Get Your Free Resource
                          </DialogTitle>
                          <DialogDescription className="text-center text-green-600">
                            Enter your details below to access "{product.title}"
                          </DialogDescription>
                        </DialogHeader>
                        <LeadMagnetPreview 
                          leadMagnet={{
                            ...product,
                            productId: product._id,
                            title: product.title,
                            subtitle: product.description || "",
                            imageUrl: product.imageUrl,
                            ctaText: product.buttonLabel || "Get Free Resource",
                            downloadUrl: product.downloadUrl
                          }}
                          isFullScreen={true}
                          storeData={{ store, user }}
                        />
                      </DialogContent>
                    </Dialog>
                  );
                }
                
                // Paid products show checkout functionality
                return (
                  <Card 
                    key={product._id} 
                    className="group p-6 border-premium bg-card hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      alert(`Purchase ${product.title} for $${product.price}\n\nCheckout functionality coming soon!`);
                    }}
                  >
                  {/* Image */}
                  <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center">
                        <Store className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                        <span className="text-sm text-blue-600 font-medium">Digital Product</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-primary bg-primary/10 border-primary/20 font-semibold">
                        ${product.price}
                      </Badge>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                    </div>
                    <h3 className="font-bold text-lg text-card-foreground line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                      {product.description || "High-quality digital product"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground font-medium">Click to purchase</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all duration-200" />
                    </div>
                  </div>
                </Card>
                );
              })}
              
              {/* Empty State */}
              {(!products || products.filter(p => p.isPublished).length === 0) && (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 bg-muted rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Store className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No products available yet</h3>
                  <p className="text-muted-foreground text-sm">Check back soon for amazing resources and products!</p>
                </div>
              )}
            </div>
          </div>

          {/* Store Footer */}
          <div className="mt-16 pt-12 border-t border-border">
            <div className="bg-muted/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
                  <AvatarFallback className="font-semibold bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                                <h3 className="font-bold text-xl text-foreground">About {displayName}</h3>
              <p className="text-muted-foreground">Creator of {store.name}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Welcome to my digital store! I create high-quality resources and tools to help you succeed in your journey. 
                Every product is carefully crafted with your success in mind.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary-foreground rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-foreground">Instant Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary-foreground rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-foreground">Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-3 h-3 bg-primary-foreground rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium text-foreground">Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Matches PhonePreview.tsx */}
      <div className="lg:hidden min-h-screen bg-background flex flex-col">
        {/* Mobile App Header (matches PhonePreview) */}
        <div className="bg-card border-b border-border p-4 sticky top-0 z-40">
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
        <div className="flex-1 p-4 overflow-y-auto">
          <LinkInBioLayout products={products || []} leadMagnetData={leadMagnetData} storeData={{ store, user }} />
        </div>
      </div>
    </div>
  );
} 