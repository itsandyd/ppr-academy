"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserResource } from "@clerk/types";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { CheckCircle, Download, Mail, ArrowRight } from "lucide-react";

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
  };
  // Digital product specific props
  digitalProduct?: {
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
  };
}

// Lead Magnet Preview Component with Form and Post-Opt-In States
function LeadMagnetPreview({ leadMagnet }: { leadMagnet?: PhonePreviewProps['leadMagnet'] }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = () => {
    if (formData.name && formData.email) {
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <Card className="flex-1 p-4 space-y-4 bg-gradient-to-br from-green-50 to-emerald-50">
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
              <p className="text-xs text-gray-500">
                {leadMagnet?.downloadUrl ? 'Ready for Download' : 'PDF • 2.3 MB'}
              </p>
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
      </Card>
    );
  }

  return (
    <Card className="flex-1 p-4 space-y-4">
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
    </Card>
  );
}

export function PhonePreview({ 
  user, 
  products, 
  store, 
  mode = "store",
  leadMagnet,
  digitalProduct 
}: PhonePreviewProps) {
  // Get updated user data from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Show loading state while fetching user data
  if (convexUser === undefined) {
    return (
      <div className="lg:sticky lg:top-24">
        <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 bg-white flex flex-col p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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

  const publishedProducts = products?.filter(p => p.isPublished) || [];

  // Render different content based on mode
  const renderContent = () => {
    switch (mode) {
      case "leadMagnet":
        console.log("📱 PhonePreview leadMagnet mode:", leadMagnet);
        return <LeadMagnetPreview leadMagnet={leadMagnet} />;

      case "digitalProduct":
        return (
          <div className="flex-1 space-y-4">
            {/* Product Image */}
            <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center overflow-hidden">
              {digitalProduct?.imageUrl ? (
                <img 
                  src={digitalProduct.imageUrl} 
                  alt="Product preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/50 rounded-lg mx-auto mb-2" />
                  <span className="text-xs text-gray-500">Product Image</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg leading-tight">
                  {digitalProduct?.title || "Digital Product Title"}
                </h3>
                <Badge className="bg-green-100 text-green-800">
                  ${digitalProduct?.price?.toFixed(2) || "9.99"}
                </Badge>
              </div>
              
              {digitalProduct?.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {digitalProduct.description}
                </p>
              )}
            </div>

            {/* Purchase Button */}
            <Button className="w-full bg-[#6356FF] hover:bg-[#5248E6] text-white">
              Buy Now
            </Button>
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
          <div className="flex-1 overflow-y-auto">
            {publishedProducts.length > 0 ? (
              <div className="space-y-4">
                {publishedProducts.map((product) => (
                  <Card key={product._id} className="p-4 border border-gray-200">
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
                        ${product.price}
                      </Badge>
                      <button className="text-xs bg-[#6356FF] text-white px-3 py-1 rounded-full">
                        Buy Now
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4" />
                  <p className="text-sm">No products yet</p>
                  <p className="text-xs">Add products to see them here</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 bg-white flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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
        
        {/* Dynamic Content */}
        {renderContent()}
      </Card>
    </div>
  );
} 