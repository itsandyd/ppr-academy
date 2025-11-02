"use client";

import { PhoneShell } from "@/components/shared/PhoneShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CheckoutPhonePreviewProps {
  title?: string;
  body?: string;
  price?: number;
  cta?: string;
  image?: File | null;
  // User info for consistent header
  storeName?: string;
  displayName?: string;
  slug?: string;
  avatarUrl?: string;
  bio?: string;
}

export function CheckoutPhonePreview({ 
  title = "Digital Product Title", 
  body = "", 
  price = 9.99, 
  cta = "Buy Now",
  image,
  storeName = "Your Store",
  displayName = "Your Name",
  slug = "yourslug",
  avatarUrl,
  bio
}: CheckoutPhonePreviewProps) {
  return (
    <PhoneShell
      storeName={storeName}
      displayName={displayName}
      slug={slug}
      avatarUrl={avatarUrl}
      bio={bio}
    >
      <div className="p-4">
        <div className="space-y-4">
          {/* Hero Image */}
          <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center overflow-hidden">
            {image ? (
              <img 
                src={URL.createObjectURL(image)} 
                alt="Product preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-lg mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">Product Image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg leading-tight">
                {title || "Digital Product Title"}
              </h3>
              <Badge className="bg-green-100 text-green-800">
                ${price?.toFixed(2) || "9.99"}
              </Badge>
            </div>
            
            {/* Description */}
            {body && (
              <div 
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
            
            {/* Bullet Points */}
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <span>Instant download after purchase</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <span>Lifetime access included</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                <span>30-day money back guarantee</span>
              </div>
            </div>
          </div>

          {/* Purchase Form */}
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-lg"
            >
              {cta || "Buy Now"}
            </Button>
            
            {/* Customer Info Fields */}
            <div className="space-y-2 pt-2">
              <Input placeholder="Your Name" className="h-9 text-sm bg-background" />
              <Input placeholder="Your Email" className="h-9 text-sm bg-background" />
            </div>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
