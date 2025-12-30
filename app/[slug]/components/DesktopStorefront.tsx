"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Store,
  Gift,
  ExternalLink,
  GraduationCap,
  Youtube,
  Music,
  Globe,
  Link as LinkIcon,
  Lock,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
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
        backgroundColor: "hsl(var(--background)) !important",
        opacity: "1 !important",
        pointerEvents: "auto",
      }}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[99999] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-white p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] dark:bg-black sm:rounded-lg",
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
  productType?: string;
  mediaType?: string;
  url?: string;
  slug?: string;
  category?: string;
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
    description?: string;
  };
  user: {
    name?: string;
    imageUrl?: string;
  } | null;
  products: Product[];
  displayName: string;
  initials: string;
  avatarUrl: string;
  socialAccounts?: Array<{
    _id: string;
    platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
    platformUsername?: string;
    platformDisplayName?: string;
    accountLabel?: string;
    isActive: boolean;
    isConnected: boolean;
  }>;
}

export function DesktopStorefront({
  store,
  user,
  products,
  displayName,
  initials,
  avatarUrl,
  socialAccounts = [],
}: DesktopStorefrontProps) {
  const { toast } = useToast();
  const [showFollowGate, setShowFollowGate] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  return (
    <div>
      {/* Store Landing Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 flex items-center gap-6">
            <Avatar className="h-16 w-16 border-4 border-primary-foreground/20">
              <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
              <AvatarFallback className="bg-primary-foreground/20 text-xl font-bold text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold text-background">{store.name}</h1>
              <p className="mb-3 text-lg text-background/80">
                by {displayName} • @{store.slug}
              </p>
              {store.description && (
                <p className="max-w-2xl text-base leading-relaxed text-background/90">
                  {store.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 text-center md:grid-cols-3">
            <div className="rounded-lg bg-primary-foreground/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-background">
                {products?.filter((p) => p.isPublished).length || 0}
              </div>
              <div className="text-sm text-background/80">Products & Courses</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-background">
                {products?.filter((p) => p.price === 0 && p.isPublished).length || 0}
              </div>
              <div className="text-sm text-background/80">Free Resources</div>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-4 backdrop-blur">
              <div className="text-2xl font-bold text-background">🎓</div>
              <div className="text-sm text-background/80">Learn & Grow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Store Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Products Section */}
        <div className="space-y-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            Available Products & Resources
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Lead Magnet Cards (Free Digital Products Only - NOT URL/Media) */}
            {products
              ?.filter(
                (p) =>
                  p.productType === "digitalProduct" &&
                  p.price === 0 &&
                  (p.style === "card" || p.style === "callout") &&
                  p.isPublished &&
                  !p.url
              )
              .map((leadMagnet) => (
                <Dialog key={leadMagnet._id}>
                  <DialogTrigger asChild>
                    <Card className="group cursor-pointer border border-primary/20 bg-primary/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      {/* Image */}
                      <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                        {leadMagnet.imageUrl ? (
                          <Image
                            src={leadMagnet.imageUrl}
                            alt={leadMagnet.title}
                            width={640}
                            height={192}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="text-center">
                            <Gift className="mx-auto mb-2 h-16 w-16 text-primary" />
                            <span className="text-sm font-medium text-primary">Free Resource</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge className="border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
                            FREE
                          </Badge>
                        </div>
                        <h3 className="line-clamp-2 text-lg font-bold text-primary">
                          {leadMagnet.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-primary/80">
                          {leadMagnet.description ||
                            "Get instant access to this valuable free resource"}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-medium text-primary">
                            Click to get access
                          </span>
                          <ArrowRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Card>
                  </DialogTrigger>
                  <CustomDialogContent className="mx-auto max-h-[90vh] w-[95vw] max-w-md overflow-y-auto">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-bold text-primary">
                        {leadMagnet.title}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-primary/80">
                        Enter your details below to get instant access to your free resource
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative z-0 rounded-lg bg-background">
                      <LeadMagnetPreview
                        leadMagnet={{
                          title: leadMagnet.title,
                          subtitle: leadMagnet.description || "",
                          imageUrl: leadMagnet.imageUrl,
                          ctaText: leadMagnet.buttonLabel || "Get Free Resource",
                          downloadUrl: leadMagnet.downloadUrl,
                          productId: leadMagnet._id,
                        }}
                        storeData={{ store, user }}
                        isFullScreen={false}
                      />
                    </div>
                  </CustomDialogContent>
                </Dialog>
              ))}

            {/* Free Courses */}
            {products
              ?.filter((p) => p.productType === "course" && p.price === 0 && p.isPublished)
              .map((course) => (
                <Card
                  key={course._id}
                  className="group cursor-pointer border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  onClick={() => {
                    window.location.href = `/courses/${course.slug}`;
                  }}
                >
                  {/* Image */}
                  <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                    {course.imageUrl ? (
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        width={640}
                        height={192}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="text-center">
                        <GraduationCap className="mx-auto mb-2 h-16 w-16 text-primary" />
                        <span className="text-sm font-medium text-primary">Free Course</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
                        FREE COURSE
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {course.category || "Course"}
                      </Badge>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-primary">{course.title}</h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-primary/80">
                      {course.description || "Comprehensive course content"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-primary">Click to enroll</span>
                      <GraduationCap className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                    </div>
                  </div>
                </Card>
              ))}

            {/* Paid Courses */}
            {products
              ?.filter((p) => p.productType === "course" && p.price > 0 && p.isPublished)
              .map((course) => (
                <Card
                  key={course._id}
                  className="group cursor-pointer border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  onClick={() => {
                    window.location.href = `/courses/${course.slug}`;
                  }}
                >
                  {/* Image */}
                  <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                    {course.imageUrl ? (
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        width={640}
                        height={192}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="text-center">
                        <GraduationCap className="mx-auto mb-2 h-16 w-16 text-primary" />
                        <span className="text-sm font-medium text-primary">Course</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="border-primary/20 bg-primary/10 font-semibold text-primary">
                        ${course.price}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {course.category || "Course"}
                      </Badge>
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-primary">{course.title}</h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-primary/80">
                      {course.description || "Comprehensive course content"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-primary">Click to enroll</span>
                      <GraduationCap className="h-5 w-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                    </div>
                  </div>
                </Card>
              ))}

            {/* URL/Media Products */}
            {products
              ?.filter((p) => p.productType === "urlMedia" && p.isPublished)
              .map((urlMedia) => {
                const getMediaIcon = (mediaType?: string) => {
                  switch (mediaType) {
                    case "youtube":
                      return <Youtube className="h-16 w-16 text-secondary" />;
                    case "spotify":
                      return <Music className="h-16 w-16 text-primary" />;
                    default:
                      return <LinkIcon className="h-16 w-16 text-accent" />;
                  }
                };

                const getMediaBadge = (mediaType?: string) => {
                  switch (mediaType) {
                    case "youtube":
                      return <Badge className="bg-secondary/10 text-secondary">YouTube</Badge>;
                    case "spotify":
                      return <Badge className="bg-primary/10 text-primary">Spotify</Badge>;
                    default:
                      return <Badge className="bg-accent/10 text-accent">Link</Badge>;
                  }
                };

                return (
                  <Card
                    key={urlMedia._id}
                    className="group cursor-pointer border border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    onClick={() => {
                      // Open URL in new tab
                      window.open(urlMedia.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {/* Media Display */}
                    <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-accent/10">
                      <div className="text-center">
                        {getMediaIcon(urlMedia.mediaType)}
                        <span className="mt-2 block text-sm font-medium text-accent">
                          {urlMedia.mediaType === "youtube"
                            ? "Video Content"
                            : urlMedia.mediaType === "spotify"
                              ? "Music Content"
                              : "External Link"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getMediaBadge(urlMedia.mediaType)}
                        <Badge variant="secondary" className="text-xs">
                          FREE
                        </Badge>
                      </div>
                      <h3 className="line-clamp-2 text-lg font-bold text-accent">
                        {urlMedia.title}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-relaxed text-accent/80">
                        {urlMedia.description || "Click to visit this link"}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-medium text-accent">Click to open</span>
                        <ExternalLink className="h-5 w-5 text-accent transition-transform duration-200 group-hover:scale-110" />
                      </div>
                    </div>
                  </Card>
                );
              })}

            {/* Paid Digital Products */}
            {products
              ?.filter((p) => p.productType === "digitalProduct" && p.price > 0 && p.isPublished)
              .map((product) => (
                <Card
                  key={product._id}
                  className="border-premium group cursor-pointer bg-card p-6 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => {
                    toast({
                      title: "Coming Soon! 🚀",
                      description: `Digital product checkout for "${product.title}" is currently in development and will be available soon.`,
                      className: "bg-white dark:bg-black",
                    });
                  }}
                >
                  {/* Image */}
                  <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent/5 to-accent/10">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={640}
                        height={192}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="text-center">
                        <Store className="mx-auto mb-2 h-16 w-16 text-accent" />
                        <span className="text-sm font-medium text-accent">Digital Product</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="border-primary/20 bg-primary/10 font-semibold text-primary"
                      >
                        ${product.price}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                    </div>
                    <h3 className="line-clamp-2 text-lg font-bold text-card-foreground">
                      {product.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {product.description || "High-quality digital product"}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Click to purchase
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </Card>
              ))}

            {/* Free Digital Products (Non-Card Style) */}
            {products
              ?.filter(
                (p) =>
                  p.productType === "digitalProduct" &&
                  p.price === 0 &&
                  p.style !== "card" &&
                  p.style !== "callout" &&
                  p.isPublished
              )
              .map((product) => {
                const isLeadMagnet = product.price === 0;

                if (isLeadMagnet) {
                  // Check if follow gate is enabled
                  if (product.followGateEnabled) {
                    return (
                      <Card
                        key={product._id}
                        className="group cursor-pointer border-primary/20 bg-primary/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowFollowGate(true);
                        }}
                      >
                        {/* Image */}
                        <div className="relative mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                          {product.imageUrl ? (
                            <>
                              <Image
                                src={product.imageUrl}
                                alt={product.title}
                                width={640}
                                height={192}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              {/* Follow Gate Overlay Badge */}
                              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-chart-1 px-3 py-1 text-xs font-bold text-white shadow-lg">
                                <Lock className="h-3 w-3" />
                                Follow to Unlock
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <Gift className="mx-auto mb-2 h-16 w-16 text-primary" />
                              <span className="text-sm font-medium text-primary">
                                Free Resource
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="border-0 bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                              FREE
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Lock className="h-4 w-4 text-chart-1" />
                              <span className="text-xs font-semibold text-chart-1">
                                Follow Gate
                              </span>
                            </div>
                          </div>
                          <h3 className="line-clamp-2 text-xl font-bold text-primary">
                            {product.title}
                          </h3>
                          <p className="line-clamp-3 text-sm leading-relaxed text-primary/80">
                            {product.description || "Get this amazing free resource"}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-medium text-primary">
                              Follow to get free access
                            </span>
                            <ArrowRight className="h-4 w-4 text-primary transition-all duration-200 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Card>
                    );
                  }

                  // Standard lead magnet (no follow gate)
                  return (
                    <Dialog key={product._id}>
                      <DialogTrigger asChild>
                        <Card className="group cursor-pointer border-primary/20 bg-primary/5 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                          {/* Image */}
                          <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.title}
                                width={640}
                                height={192}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="text-center">
                                <Gift className="mx-auto mb-2 h-16 w-16 text-primary" />
                                <span className="text-sm font-medium text-primary">
                                  Free Resource
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge className="border-0 bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                                FREE
                              </Badge>
                              <Gift className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="line-clamp-2 text-xl font-bold text-primary">
                              {product.title}
                            </h3>
                            <p className="line-clamp-3 text-sm leading-relaxed text-primary/80">
                              {product.description || "Get this amazing free resource"}
                            </p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs font-medium text-primary">
                                Click to get free resource
                              </span>
                              <ArrowRight className="h-4 w-4 text-primary transition-all duration-200 group-hover:translate-x-1" />
                            </div>
                          </div>
                        </Card>
                      </DialogTrigger>
                      <CustomDialogContent className="mx-auto max-h-[90vh] w-[95vw] max-w-md overflow-y-auto">
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
                            downloadUrl: product.downloadUrl,
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
                    className="border-premium group cursor-pointer bg-card p-6 transition-all duration-300 hover:scale-[1.02]"
                    onClick={() => {
                      toast({
                        title: "Coming Soon! 🚀",
                        description: `Digital product checkout for "${product.title}" is currently in development and will be available soon.`,
                        className: "bg-white dark:bg-black",
                      });
                    }}
                  >
                    {/* Image */}
                    <div className="mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent/5 to-accent/10">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          width={640}
                          height={192}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="text-center">
                          <Store className="mx-auto mb-2 h-16 w-16 text-accent" />
                          <span className="text-sm font-medium text-accent">Digital Product</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="border-primary/20 bg-primary/10 font-semibold text-primary"
                        >
                          ${product.price}
                        </Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                      </div>
                      <h3 className="line-clamp-2 text-lg font-bold text-card-foreground">
                        {product.title}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {product.description || "High-quality digital product"}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Click to purchase
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                  </Card>
                );
              })}

            {/* Empty State */}
            {(!products || products.filter((p) => p.isPublished).length === 0) && (
              <div className="col-span-full py-16 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                  <Store className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  No products available yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Check back soon for amazing resources and products!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Accounts Section */}
        {socialAccounts && socialAccounts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Connect With Me</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {socialAccounts
                .filter((account) => account.isActive && account.isConnected)
                .map((account) => {
                  const getPlatformIcon = () => {
                    switch (account.platform) {
                      case "instagram":
                        return <Instagram className="h-6 w-6" />;
                      case "twitter":
                        return <Twitter className="h-6 w-6" />;
                      case "facebook":
                        return <Facebook className="h-6 w-6" />;
                      case "tiktok":
                        return <Music className="h-6 w-6" />;
                      case "linkedin":
                        return <LinkIcon className="h-6 w-6" />;
                      default:
                        return <Globe className="h-6 w-6" />;
                    }
                  };

                  const getPlatformColor = () => {
                    switch (account.platform) {
                      case "instagram":
                        return "from-purple-500 to-pink-500";
                      case "twitter":
                        return "from-blue-400 to-blue-600";
                      case "facebook":
                        return "from-blue-600 to-blue-800";
                      case "tiktok":
                        return "from-black to-gray-800 dark:from-white dark:to-gray-200";
                      case "linkedin":
                        return "from-blue-700 to-blue-900";
                      default:
                        return "from-gray-500 to-gray-700";
                    }
                  };

                  const getPlatformUsername = () => {
                    if (account.platformUsername) {
                      return `@${account.platformUsername.replace("@", "")}`;
                    }
                    return account.platformDisplayName || account.platform;
                  };

                  const getPlatformUrl = () => {
                    const username = account.platformUsername?.replace("@", "") || "";
                    switch (account.platform) {
                      case "instagram":
                        return `https://instagram.com/${username}`;
                      case "twitter":
                        return `https://twitter.com/${username}`;
                      case "facebook":
                        return `https://facebook.com/${username}`;
                      case "tiktok":
                        return `https://tiktok.com/@${username}`;
                      case "linkedin":
                        return `https://linkedin.com/in/${username}`;
                      default:
                        return "#";
                    }
                  };

                  return (
                    <a
                      key={account._id}
                      href={getPlatformUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <Card className="cursor-pointer bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${getPlatformColor()} flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110`}
                          >
                            {getPlatformIcon()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold capitalize text-foreground">
                              {account.platform}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {getPlatformUsername()}
                            </p>
                            {account.accountLabel && (
                              <Badge variant="outline" className="mt-1 h-4 px-1 py-0 text-[10px]">
                                {account.accountLabel}
                              </Badge>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </Card>
                    </a>
                  );
                })}
            </div>
          </div>
        )}

        {/* Store Footer */}
        <div className="mt-16 border-t border-border pt-12">
          <div className="rounded-2xl bg-muted/30 p-8">
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
                <AvatarFallback className="bg-muted font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-foreground">About {displayName}</h3>
                <p className="text-muted-foreground">Creator of {store.name}</p>
              </div>
            </div>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Welcome to my digital store! I create high-quality resources and tools to help you
              succeed in your journey. Every product is carefully crafted with your success in mind.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground"></div>
                </div>
                <span className="text-sm font-medium text-foreground">Instant Access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground"></div>
                </div>
                <span className="text-sm font-medium text-foreground">Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <div className="h-3 w-3 rounded-full bg-primary-foreground"></div>
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
