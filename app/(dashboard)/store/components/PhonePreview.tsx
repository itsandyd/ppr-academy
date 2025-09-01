"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserResource } from "@clerk/types";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { CheckCircle, Download, Mail, ArrowRight, Gift, ExternalLink, Store } from "lucide-react";


interface PhonePreviewProps {
  user: UserResource;
  products?: Array<{
    _id: string;
    title: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isPublished?: boolean;
  }>;
  store?: {
    _id: string;
    name: string;
    slug?: string;
    userId: string;
  };
  mode?: "store" | "leadMagnet" | "digitalProduct" | "profile";
  // Lead magnet specific props
  leadMagnet?: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    downloadUrl?: string;
    productId?: string;
  };
  // Digital product specific props
  digitalProduct?: {
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  };
  // Style and button props for digital product creation
  style?: "button" | "callout" | "preview" | "card" | "minimal";
  buttonLabel?: string;
}

// Link-in-Bio Style Component for Phone Preview
function LinkInBioLayout({ products, leadMagnetData, storeData, onLeadMagnetClick }: { products: any[]; leadMagnetData?: any; storeData?: any; onLeadMagnetClick?: (leadMagnet: any) => void }) {
  const allProducts = products || [];
  const publishedProducts = allProducts.filter(p => p.isPublished);
  const draftProducts = allProducts.filter(p => !p.isPublished);
  
  // Separate lead magnets from other products for both published and draft
  const leadMagnets = publishedProducts.filter(p => p.price === 0 && (p.style === "card" || p.style === "callout"));
  const draftLeadMagnets = draftProducts.filter(p => p.price === 0 && (p.style === "card" || p.style === "callout"));
  const otherProducts = publishedProducts.filter(p => !(p.price === 0 && (p.style === "card" || p.style === "callout")));
  const draftOtherProducts = draftProducts.filter(p => !(p.price === 0 && (p.style === "card" || p.style === "callout")));

  if (allProducts.length === 0) {
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

  if (publishedProducts.length === 0 && draftProducts.length > 0) {
    return (
      <div className="w-full text-center p-8">
        <div className="w-16 h-16 bg-amber-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Store className="w-8 h-8 text-amber-600" />
        </div>
        <p className="text-sm text-muted-foreground">You have draft content</p>
        <p className="text-xs text-muted-foreground mt-1">Publish your products to make them visible to visitors</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Lead Magnet Cards */}
      {leadMagnets.map((leadMagnet) => (
        <Card 
          key={leadMagnet._id}
          className="p-4 border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onLeadMagnetClick?.(leadMagnet)}
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
      ))}

      {/* Other Products */}
      {otherProducts.map((product) => (
        <Card key={product._id} className="p-4 border-border hover:shadow-md transition-all cursor-pointer">
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
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </Card>
      ))}

      {/* Draft Products Section */}
      {(draftLeadMagnets.length > 0 || draftOtherProducts.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="h-px bg-border flex-1" />
            <Badge variant="secondary" className="text-xs">Draft Content</Badge>
            <div className="h-px bg-border flex-1" />
          </div>
          
          {/* Draft Lead Magnet Cards */}
          {draftLeadMagnets.map((leadMagnet) => (
            <Card 
              key={leadMagnet._id}
              className="p-4 border border-dashed border-amber-200 bg-amber-50/50 opacity-75 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onLeadMagnetClick?.(leadMagnet)}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-amber-800 truncate">
                    {leadMagnet.title}
                  </h3>
                  <p className="text-xs text-amber-600 truncate">
                    Free Resource • Draft
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge className="bg-amber-100 text-amber-800 text-xs border-amber-200">
                    DRAFT
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </div>
              </div>
            </Card>
          ))}

          {/* Draft Other Products */}
          {draftOtherProducts.map((product) => (
            <Card key={product._id} className="p-4 border border-dashed border-gray-200 bg-gray-50/50 opacity-75 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {product.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.description || "Digital Product"} • Draft
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-xs border-dashed">
                    ${product.price}
                  </Badge>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Lead Magnet Preview Component with Form and Post-Opt-In States
function LeadMagnetPreview({ leadMagnet, storeData, isInPhoneDialog = false }: { leadMagnet?: PhonePreviewProps['leadMagnet']; storeData?: any; isInPhoneDialog?: boolean }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ submissionId: string; downloadUrl?: string } | null>(null);

  // TODO: Replace with actual API calls once Convex API is regenerated
  // const submitLead = useMutation(api.leadSubmissions.submitLead);
  // const trackDownload = useMutation(api.leadSubmissions.trackDownload);

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      return; // Silent validation for preview
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual submitLead API call
      const result = {
        submissionId: `temp_${Date.now()}`,
        hasAccess: true,
        downloadUrl: leadMagnet?.downloadUrl,
      };

      console.log("Lead submitted (preview):", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        productId: leadMagnet?.productId,
      });

      setSubmissionResult(result);
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (submissionResult?.downloadUrl) {
      console.log("Download tracked (preview):", submissionResult.submissionId);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = submissionResult.downloadUrl;
      link.download = leadMagnet?.title || 'lead-magnet';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (showSuccess) {
    const SuccessContent = (
      <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
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
        <div className="bg-card rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {leadMagnet?.title || "Ultimate Marketing Guide"}
              </p>
              <p className="text-xs text-muted-foreground">
                {leadMagnet?.downloadUrl ? 'Ready for Download' : 'PDF • 2.3 MB'}
              </p>
            </div>
          </div>
          <Button 
            className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            onClick={handleDownload}
            disabled={!submissionResult?.downloadUrl}
          >
            <Download className="w-4 h-4 mr-2" />
            {submissionResult?.downloadUrl ? 'Download Now' : 'File Not Available'}
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
    
    return isInPhoneDialog ? SuccessContent : <Card className="flex-1">{SuccessContent}</Card>;
  }

  const MainContent = (
    <div className="space-y-4 bg-card p-4 rounded-lg">
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
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
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
  
  return isInPhoneDialog ? MainContent : <Card className="flex-1">{MainContent}</Card>;
}

export function PhonePreview({ 
  user, 
  products, 
  store, 
  mode = "store",
  leadMagnet,
  digitalProduct,
  style = "button",
  buttonLabel = "Get Now"
}: PhonePreviewProps) {
  // State for lead magnet dialog within phone
  const [selectedLeadMagnet, setSelectedLeadMagnet] = useState<any>(null);
  const [showLeadMagnetDialog, setShowLeadMagnetDialog] = useState(false);

  // Get updated user data from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Show loading state while fetching user data
  if (convexUser === undefined) {
    return (
      <div className="lg:sticky lg:top-24">
        <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-foreground/90 bg-card flex flex-col p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Prioritize saved name over Clerk's firstName + lastName
  const displayName = convexUser?.name || 
    (user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || "User");
    
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Use saved avatar or fallback to Clerk image
  const avatarUrl = convexUser?.imageUrl || user.imageUrl || "";

  const handleLeadMagnetClick = (leadMagnet: any) => {
    setSelectedLeadMagnet(leadMagnet);
    setShowLeadMagnetDialog(true);
  };

  const handleBackToStore = () => {
    setShowLeadMagnetDialog(false);
    setSelectedLeadMagnet(null);
  };

  // Render different content based on mode
  const renderContent = () => {
    // If showing lead magnet dialog within phone, show that regardless of mode
    if (showLeadMagnetDialog && selectedLeadMagnet) {
      return (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Back button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToStore}
              className="gap-2 text-sm mb-2"
            >
              ← Back to Store
            </Button>
            
            {/* Lead Magnet Preview */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-green-800">{selectedLeadMagnet.title}</h2>
              <p className="text-sm text-green-600">Enter your details below to get instant access</p>
            </div>
            
            <LeadMagnetPreview 
              leadMagnet={{
                title: selectedLeadMagnet.title,
                subtitle: selectedLeadMagnet.description,
                imageUrl: selectedLeadMagnet.imageUrl,
                ctaText: selectedLeadMagnet.buttonLabel,
                downloadUrl: selectedLeadMagnet.downloadUrl,
                productId: selectedLeadMagnet._id
              }} 
              storeData={{ store, user: convexUser }}
              isInPhoneDialog={true}
            />
          </div>
        </div>
      );
    }

    switch (mode) {
      case "leadMagnet":
        console.log("📱 PhonePreview leadMagnet mode:", leadMagnet);
        return <LeadMagnetPreview leadMagnet={leadMagnet} />;

      case "digitalProduct":
        // Map old style values to new ones for backward compatibility
        const displayStyle = style === "card" ? "callout" : style === "minimal" ? "button" : style;
        
        return (
          <div className="flex-1 p-4 overflow-y-auto bg-background">
            <div className="w-full space-y-3">
              {(displayStyle === "button" || style === "minimal") && (
                /* Button Style - Simple compact card */
                <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer touch-manipulation">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {digitalProduct?.imageUrl ? (
                        <img 
                          src={digitalProduct.imageUrl} 
                          alt={digitalProduct.title || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {digitalProduct?.title || "Digital Product Title"}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {digitalProduct?.description || "Digital Product"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        ${digitalProduct?.price?.toFixed(2) || "9.99"}
                      </Badge>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              )}

              {(displayStyle === "callout" || style === "card") && (
                /* Callout Style - Larger card with more details */
                <Card className="p-6 border border-primary/20 bg-primary/5 hover:shadow-lg transition-all cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {digitalProduct?.imageUrl ? (
                          <img 
                            src={digitalProduct.imageUrl} 
                            alt={digitalProduct.title || "Product"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-primary">
                          {digitalProduct?.title || "Digital Product Title"}
                        </h3>
                        {digitalProduct?.description && (
                          <p className="text-sm text-primary/80 mt-1">
                            {digitalProduct.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            ${digitalProduct?.price?.toFixed(2) || "9.99"}
                          </Badge>
                          <span className="text-xs text-primary/60">• Click to purchase</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {displayStyle === "preview" && (
                /* Preview Style - Full product showcase */
                <div className="space-y-4">
                  <Card className="overflow-hidden">
                    {/* Large Product Image */}
                    <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden">
                      {digitalProduct?.imageUrl ? (
                        <img 
                          src={digitalProduct.imageUrl} 
                          alt={digitalProduct.title || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="w-20 h-20 bg-muted/50 rounded-lg mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">Product Image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">
                          {digitalProduct?.title || "Digital Product Title"}
                        </h3>
                        <Badge className="bg-green-100 text-green-800 text-sm">
                          ${digitalProduct?.price?.toFixed(2) || "9.99"}
                        </Badge>
                      </div>
                      
                      {digitalProduct?.description && (
                        <p className="text-sm text-muted-foreground">
                          {digitalProduct.description}
                        </p>
                      )}
                      
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12">
                        {buttonLabel}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4" />
              <p className="text-sm">Your profile preview</p>
              <p className="text-xs">Changes update in real-time</p>
            </div>
          </div>
        );

      default: // "store" mode
        return (
          <div className="flex-1 p-4 overflow-y-auto">
            <LinkInBioLayout 
              products={products || []} 
              leadMagnetData={leadMagnet}
              storeData={{ store, user: convexUser }}
              onLeadMagnetClick={handleLeadMagnetClick}
            />
          </div>
        );
    }
  };

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-foreground/90 bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
            <AvatarFallback className="text-sm font-semibold bg-muted">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm truncate block">{displayName}</span>
            {convexUser?.bio ? (
              <span className="text-xs text-muted-foreground truncate block">{convexUser.bio}</span>
            ) : store?.slug ? (
              <span className="text-xs text-muted-foreground truncate block">@{store.slug}</span>
            ) : store?.name ? (
              <span className="text-xs text-muted-foreground truncate block">@{store.name.toLowerCase().replace(/\s+/g, '')}</span>
            ) : null}
          </div>
          </div>
        </div>
        
        {/* Dynamic Content */}
        {renderContent()}
      </Card>
    </div>
  );
} 