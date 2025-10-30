"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { ArrowRight, Store, Gift, ExternalLink, GraduationCap, Youtube, Music, Globe, Link as LinkIcon, Lock } from "lucide-react";
import { LeadMagnetPreview } from "./LeadMagnetPreview";
import { FollowGateModal } from "@/components/follow-gates/FollowGateModal";
import Link from "next/link";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";

// Custom DialogContent with solid overlay
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Overlay 
      className="fixed inset-0 z-[99998] bg-background" 
      style={{ 
        backgroundColor: 'hsl(var(--background)) !important',
        opacity: '1 !important',
        pointerEvents: 'auto'
      }} 
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[99999] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-white dark:bg-black p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <span className="text-xl font-bold text-muted-foreground hover:text-foreground">×</span>
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

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
  _creationTime: number;
  // Follow Gate fields
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;
}

interface DesktopStorefrontProps {
  store: {
    _id: string;
    userId: string;
    name: string;
    slug: string;
  };
  user: {
    name?: string;
    imageUrl?: string;
  } | null;
  products: Product[];
  displayName: string;
  initials: string;
  avatarUrl: string;
}

export function DesktopStorefront({ store, user, products, displayName, initials, avatarUrl }: DesktopStorefrontProps) {
  const { toast } = useToast();
  const [showFollowGate, setShowFollowGate] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  
  return (
    <div>
      {/* Store Landing Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="w-16 h-16 border-4 border-primary-foreground/20">
              <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
              <AvatarFallback className="text-xl font-bold bg-primary-foreground/20 text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-background">{store.name}</h1>
              <p className="text-background/80 text-lg mb-3">by {displayName} • @{store.slug}</p>
              {store.description && (
                <p className="text-background/90 text-base max-w-2xl leading-relaxed">
                  {store.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-8">
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold text-background">{products?.filter(p => p.isPublished).length || 0}</div>
              <div className="text-background/80 text-sm">Products & Courses</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold text-background">{products?.filter(p => p.price === 0 && p.isPublished).length || 0}</div>
              <div className="text-background/80 text-sm">Free Resources</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl font-bold text-background">🎓</div>
              <div className="text-background/80 text-sm">Learn & Grow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Store Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Products Section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">Available Products & Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Lead Magnet Cards (Free Digital Products Only - NOT URL/Media) */}
            {products?.filter(p => p.productType === "digitalProduct" && p.price === 0 && (p.style === "card" || p.style === "callout") && p.isPublished && !p.url).map((leadMagnet) => (
              <Dialog key={leadMagnet._id}>
                <DialogTrigger asChild>
                  <Card className="group p-6 border border-primary/20 bg-primary/5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                    {/* Image */}
                    <div className="w-full h-48 bg-primary/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {leadMagnet.imageUrl ? (
                        <Image 
                          src={leadMagnet.imageUrl} 
                          alt={leadMagnet.title}
                          width={640}
                          height={192}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="text-center">
                          <Gift className="w-16 h-16 text-primary mx-auto mb-2" />
                          <span className="text-sm text-primary font-medium">Free Resource</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary text-xs border-primary/20 font-semibold">
                          FREE
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg text-primary line-clamp-2">
                        {leadMagnet.title}
                      </h3>
                      <p className="text-primary/80 text-sm line-clamp-3 leading-relaxed">
                        {leadMagnet.description || "Get instant access to this valuable free resource"}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-primary font-medium">Click to get access</span>
                        <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </Card>
                </DialogTrigger>
                <CustomDialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-primary text-xl font-bold">{leadMagnet.title}</DialogTitle>
                    <DialogDescription className="text-primary/80 text-sm">
                      Enter your details below to get instant access to your free resource
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-background rounded-lg relative z-0">
                    <LeadMagnetPreview 
                      leadMagnet={{
                        title: leadMagnet.title,
                        subtitle: leadMagnet.description || "",
                        imageUrl: leadMagnet.imageUrl,
                        ctaText: leadMagnet.buttonLabel || "Get Free Resource",
                        downloadUrl: leadMagnet.downloadUrl,
                        productId: leadMagnet._id
                      }} 
                      storeData={{ store, user }}
                      isFullScreen={false} 
                    />
                  </div>
                </CustomDialogContent>
              </Dialog>
            ))}
            
            {/* Free Courses */}
            {products?.filter(p => p.productType === "course" && p.price === 0 && p.isPublished).map((course) => (
              <Card 
                key={course._id} 
                className="group p-6 border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={() => {
                  window.location.href = `/courses/${course.slug}`;
                }}
              >
                {/* Image */}
                <div className="w-full h-48 bg-primary/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {course.imageUrl ? (
                    <Image 
                      src={course.imageUrl} 
                      alt={course.title}
                      width={640}
                      height={192}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="text-center">
                      <GraduationCap className="w-16 h-16 text-primary mx-auto mb-2" />
                      <span className="text-sm text-primary font-medium">Free Course</span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary text-xs border-primary/20 font-semibold">
                      FREE COURSE
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {course.category || "Course"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg text-primary line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-primary/80 text-sm line-clamp-3 leading-relaxed">
                    {course.description || "Comprehensive course content"}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-primary font-medium">Click to enroll</span>
                    <GraduationCap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
              </Card>
            ))}
            
            {/* Paid Courses */}
            {products?.filter(p => p.productType === "course" && p.price > 0 && p.isPublished).map((course) => (
              <Card 
                key={course._id} 
                className="group p-6 border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={() => {
                  window.location.href = `/courses/${course.slug}`;
                }}
              >
                {/* Image */}
                <div className="w-full h-48 bg-primary/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {course.imageUrl ? (
                    <Image 
                      src={course.imageUrl} 
                      alt={course.title}
                      width={640}
                      height={192}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="text-center">
                      <GraduationCap className="w-16 h-16 text-primary mx-auto mb-2" />
                      <span className="text-sm text-primary font-medium">Course</span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold">
                      ${course.price}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {course.category || "Course"}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg text-primary line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-primary/80 text-sm line-clamp-3 leading-relaxed">
                    {course.description || "Comprehensive course content"}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-primary font-medium">Click to enroll</span>
                    <GraduationCap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                </div>
              </Card>
            ))}
            
            {/* URL/Media Products */}
            {products?.filter(p => p.productType === "urlMedia" && p.isPublished).map((urlMedia) => {
              const getMediaIcon = (mediaType?: string) => {
                switch (mediaType) {
                  case "youtube": return <Youtube className="w-16 h-16 text-secondary" />;
                  case "spotify": return <Music className="w-16 h-16 text-primary" />;
                  default: return <LinkIcon className="w-16 h-16 text-accent" />;
                }
              };

              const getMediaBadge = (mediaType?: string) => {
                switch (mediaType) {
                  case "youtube": return <Badge className="bg-secondary/10 text-secondary">YouTube</Badge>;
                  case "spotify": return <Badge className="bg-primary/10 text-primary">Spotify</Badge>;
                  default: return <Badge className="bg-accent/10 text-accent">Link</Badge>;
                }
              };

              return (
                <Card 
                  key={urlMedia._id} 
                  className="group p-6 border border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    // Open URL in new tab
                    window.open(urlMedia.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  {/* Media Display */}
                  <div className="w-full h-48 bg-accent/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <div className="text-center">
                      {getMediaIcon(urlMedia.mediaType)}
                      <span className="text-sm text-accent font-medium mt-2 block">
                        {urlMedia.mediaType === "youtube" ? "Video Content" : 
                         urlMedia.mediaType === "spotify" ? "Music Content" : "External Link"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getMediaBadge(urlMedia.mediaType)}
                      <Badge variant="secondary" className="text-xs">FREE</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-accent line-clamp-2">
                      {urlMedia.title}
                    </h3>
                    <p className="text-accent/80 text-sm line-clamp-3 leading-relaxed">
                      {urlMedia.description || "Click to visit this link"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-accent font-medium">Click to open</span>
                      <ExternalLink className="w-5 h-5 text-accent group-hover:scale-110 transition-transform duration-200" />
                    </div>
                  </div>
                </Card>
              );
            })}
            
            {/* Paid Digital Products */}
            {products?.filter(p => p.productType === "digitalProduct" && p.price > 0 && p.isPublished).map((product) => (
              <Card 
                key={product._id} 
                className="group p-6 border-premium bg-card hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={() => {
                  toast({
                    title: "Coming Soon! 🚀",
                    description: `Digital product checkout for "${product.title}" is currently in development and will be available soon.`,
                    className: "bg-white dark:bg-black",
                  });
                }}
              >
                {/* Image */}
                <div className="w-full h-48 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.title}
                      width={640}
                      height={192}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="text-center">
                      <Store className="w-16 h-16 text-accent mx-auto mb-2" />
                      <span className="text-sm text-accent font-medium">Digital Product</span>
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
            ))}

            {/* Free Digital Products (Non-Card Style) */}
            {products?.filter(p => p.productType === "digitalProduct" && p.price === 0 && p.style !== "card" && p.style !== "callout" && p.isPublished).map((product) => {
              const isLeadMagnet = product.price === 0;
              
              if (isLeadMagnet) {
                // Check if follow gate is enabled
                if (product.followGateEnabled) {
                  return (
                    <Card 
                      key={product._id} 
                      className="group p-6 border-primary/20 bg-primary/5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowFollowGate(true);
                      }}
                    >
                      {/* Image */}
                      <div className="w-full h-48 bg-primary/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                        {product.imageUrl ? (
                          <>
                            <Image 
                              src={product.imageUrl} 
                              alt={product.title}
                              width={640}
                              height={192}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            {/* Follow Gate Overlay Badge */}
                            <div className="absolute top-2 right-2 bg-chart-1 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                              <Lock className="w-3 h-3" />
                              Follow to Unlock
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <Gift className="w-16 h-16 text-primary mx-auto mb-2" />
                            <span className="text-sm text-primary font-medium">Free Resource</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-semibold">
                            FREE
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Lock className="w-4 h-4 text-chart-1" />
                            <span className="text-xs text-chart-1 font-semibold">Follow Gate</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-xl text-primary line-clamp-2">
                          {product.title}
                        </h3>
                        <p className="text-primary/80 text-sm line-clamp-3 leading-relaxed">
                          {product.description || "Get this amazing free resource"}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-primary font-medium">Follow to get free access</span>
                          <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    </Card>
                  );
                }
                
                // Standard lead magnet (no follow gate)
                return (
                  <Dialog key={product._id}>
                    <DialogTrigger asChild>
                      <Card className="group p-6 border-primary/20 bg-primary/5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                        {/* Image */}
                        <div className="w-full h-48 bg-primary/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <Image 
                              src={product.imageUrl} 
                              alt={product.title}
                              width={640}
                              height={192}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="text-center">
                              <Gift className="w-16 h-16 text-primary mx-auto mb-2" />
                              <span className="text-sm text-primary font-medium">Free Resource</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-semibold">
                              FREE
                            </Badge>
                            <Gift className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-bold text-xl text-primary line-clamp-2">
                            {product.title}
                          </h3>
                          <p className="text-primary/80 text-sm line-clamp-3 leading-relaxed">
                            {product.description || "Get this amazing free resource"}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-primary font-medium">Click to get free resource</span>
                            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                        </div>
                      </Card>
                    </DialogTrigger>
                    <CustomDialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold text-primary">
                          Get Your Free Resource
                        </DialogTitle>
                        <DialogDescription className="text-center text-primary/80">
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
                    </CustomDialogContent>
                  </Dialog>
                );
              }
              
              // Paid products show checkout functionality
              return (
                <Card 
                  key={product._id} 
                  className="group p-6 border-premium bg-card hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    toast({
                      title: "Coming Soon! 🚀",
                      description: `Digital product checkout for "${product.title}" is currently in development and will be available soon.`,
                      className: "bg-white dark:bg-black",
                    });
                  }}
                >
                {/* Image */}
                <div className="w-full h-48 bg-gradient-to-br from-accent/5 to-accent/10 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.title}
                      width={640}
                      height={192}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="text-center">
                      <Store className="w-16 h-16 text-accent mx-auto mb-2" />
                      <span className="text-sm text-accent font-medium">Digital Product</span>
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

      {/* Follow Gate Modal */}
      {selectedProduct && (
        <FollowGateModal
          open={showFollowGate}
          onOpenChange={setShowFollowGate}
          product={selectedProduct as any}
          onSuccess={(submissionId) => {
            console.log(`Follow gate completed for ${selectedProduct.title}`, submissionId);
            toast({
              title: "🎉 Success!",
              description: "Check your email for the download link!",
              className: "bg-white dark:bg-black",
            });
          }}
        />
      )}
    </div>
  );
}
