"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Store, Gift, ExternalLink, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { LeadMagnetPreview } from "./LeadMagnetPreview";
import { useToast } from "@/hooks/use-toast";

interface Product {
  _id: string;
  title: string;
  description?: string;
  price: number;
  style?: string;
  isPublished?: boolean;
  imageUrl?: string;
  buttonLabel?: string;
  downloadUrl?: string;
}

interface LinkInBioLayoutProps {
  products: Product[];
  leadMagnetData?: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    downloadUrl?: string;
  } | null;
  storeData?: {
    store: {
      _id: string;
      userId: string;
      name: string;
      slug: string;
    };
    user: {
      name?: string;
      email?: string;
    } | null;
  };
}

export function LinkInBioLayout({ products, leadMagnetData, storeData }: LinkInBioLayoutProps) {
  const { toast } = useToast();
  const publishedProducts = products?.filter(p => p.isPublished) || [];
  
  // Separate lead magnets from other products (exclude URL/Media from lead magnets)
  const leadMagnets = publishedProducts.filter(p => p.price === 0 && (p.style === "card" || p.style === "callout") && !p.url);
  const otherProducts = publishedProducts.filter(p => !(p.price === 0 && (p.style === "card" || p.style === "callout") && !p.url));

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
        
        // Prevent body scroll when modal is open
        React.useEffect(() => {
          if (isOpen) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = 'unset';
          }
          
          // Cleanup on unmount
          return () => {
            document.body.style.overflow = 'unset';
          };
        }, [isOpen]);
        
        return (
          <div key={leadMagnet._id}>
            <Card 
              className="p-4 border border-primary/20 bg-primary/5 hover:shadow-md transition-all cursor-pointer touch-manipulation"
              onClick={() => {
                console.log('Mobile card clicked:', leadMagnet.title);
                setIsOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-primary truncate">
                    {leadMagnet.title}
                  </h3>
                  <p className="text-xs text-primary/80 truncate">
                    Free Resource • Click to get access
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge className="bg-primary/10 text-primary text-xs border-primary/20">
                    FREE
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </div>
            </Card>
            
            {/* Lead Magnet Modal */}
            {isOpen && (
              <div 
                className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4"
                style={{ 
                  backgroundColor: 'hsl(var(--background))',
                  opacity: 1,
                  pointerEvents: 'auto'
                }}
              >
                <div className="bg-white dark:bg-black border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-primary text-xl font-bold">{leadMagnet.title}</h3>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="text-muted-foreground hover:text-foreground text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-primary/80 text-sm mb-4">
                    Enter your details below to get instant access to your free resource
                  </p>
                  <div className="bg-card rounded-lg relative z-0">
                    <LeadMagnetPreview 
                      leadMagnet={{
                        title: leadMagnet.title,
                        subtitle: leadMagnet.description || "",
                        imageUrl: leadMagnet.imageUrl,
                        ctaText: leadMagnet.buttonLabel || "Get Free Resource",
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
        const isLeadMagnet = product.price === 0 && (product.style === "card" || product.style === "callout") && !product.url;
        const isCourse = product.slug !== undefined && product.style === undefined;
        const isUrlMedia = product.url !== undefined;
        
        // Prevent body scroll when modal is open
        React.useEffect(() => {
          if (isOpen) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = 'unset';
          }
          
          // Cleanup on unmount
          return () => {
            document.body.style.overflow = 'unset';
          };
        }, [isOpen]);
        
        return (
          <div key={product._id}>
            <Card 
              className={`p-4 border hover:shadow-md transition-all cursor-pointer touch-manipulation ${
                isCourse 
                  ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50" 
                  : "border-gray-200"
              }`}
              onClick={() => {
                console.log('Product clicked:', product.title, 'Type:', isCourse ? 'Course' : isUrlMedia ? 'URL/Media' : 'Digital Product', 'Price:', product.price);
                if (isLeadMagnet) {
                  setIsOpen(true);
                } else if (isCourse) {
                  // Navigate to public course landing page
                  window.location.href = `/courses/${product.slug}`;
                } else if (isUrlMedia) {
                  // Open URL in new tab
                  window.open(product.url, '_blank', 'noopener,noreferrer');
                } else {
                  // Handle digital product purchase
                  toast({
                    title: "Coming Soon! 🚀",
                    description: `Digital product checkout for "${product.title}" is currently in development and will be available soon.`,
                    className: "bg-white dark:bg-black",
                  });
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  isCourse 
                    ? "bg-emerald-100" 
                    : "bg-blue-100"
                }`}>
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : isCourse ? (
                    <GraduationCap className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Store className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm truncate ${
                    isCourse ? "text-emerald-800" : "text-foreground"
                  }`}>
                    {product.title}
                  </h3>
                  <p className={`text-xs truncate ${
                    isCourse ? "text-emerald-600" : "text-muted-foreground"
                  }`}>
                    {isCourse 
                      ? `Course • ${product.description || "Learn essential skills"}` 
                      : (product.description || "Digital Product")
                    }
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant={isCourse ? "default" : "secondary"} 
                    className={`text-xs ${
                      isCourse ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""
                    }`}
                  >
                    ${product.price}
                  </Badge>
                  {isLeadMagnet ? (
                    <ArrowRight className="w-4 h-4 text-primary" />
                  ) : isCourse ? (
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Card>
            
            {/* Modal for free products (lead magnets) */}
            {isLeadMagnet && isOpen && (
              <div 
                className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4"
                style={{ 
                  backgroundColor: 'hsl(var(--background))',
                  opacity: 1,
                  pointerEvents: 'auto'
                }}
              >
                <div className="bg-white dark:bg-black border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-primary text-xl font-bold">{product.title}</h3>
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
                  <p className="text-primary/80 text-sm mb-4">
                    Enter your details below to get instant access to your free resource
                  </p>
                  <div className="bg-card rounded-lg relative z-0">
                    <LeadMagnetPreview 
                      leadMagnet={{
                        title: product.title,
                        subtitle: product.description || "",
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
