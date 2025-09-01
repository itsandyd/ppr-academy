"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Store, Gift, ExternalLink } from "lucide-react";
import { LeadMagnetPreview } from "./LeadMagnetPreview";

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
        const isLeadMagnet = product.price === 0;
        
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
                    <ArrowRight className="w-4 h-4 text-primary" />
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
