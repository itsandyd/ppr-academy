"use client";

import { FC, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Package, Users, Download, Star, ExternalLink, ShoppingCart, Plug } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  price: number;
  thumbnail?: string;
  imageUrl?: string;
  contentType: "course" | "product" | "sample-pack" | "plugin";
  creatorName?: string;
  creatorAvatar?: string;
  enrollmentCount?: number;
  downloadCount?: number;
  sampleCount?: number;
  rating?: number;
  slug?: string;
  downloadUrl?: string;
  url?: string;
  buttonLabel?: string;
}

interface MarketplaceGridProps {
  content: ContentItem[];
  emptyMessage?: string;
}

export const MarketplaceGrid: FC<MarketplaceGridProps> = ({
  content,
  emptyMessage = "No content found. Try adjusting your search or filters.",
}) => {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<ContentItem | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);

  const handleProductClick = (item: ContentItem) => {
    if (item.contentType === "plugin") {
      // Navigate to plugin detail page
      const slug = item.slug || item.title.toLowerCase().replace(/\s+/g, "-");
      router.push(`/marketplace/plugins/${slug}`);
    } else if (item.contentType === "product" || item.contentType === "sample-pack") {
      // Reset form state
      setEmail("");
      setName("");
      setHasSubmittedEmail(false);
      // Debug: Log product to check URL fields
      console.log("🔍 Product clicked:", item.title);
      console.log("📦 Full product data:", item);
      console.log("📥 downloadUrl:", item.downloadUrl);
      console.log("🔗 url:", item.url);
      console.log("✅ Has downloadUrl:", !!item.downloadUrl);
      console.log("✅ Has url:", !!item.url);
      console.log("🔑 All item keys:", Object.keys(item));
      // Open modal for products and sample packs
      setSelectedProduct(item);
      setProductModalOpen(true);
    } else {
      // Navigate for courses
      const slug = item.slug || item.title.toLowerCase().replace(/\s+/g, "-");
      router.push(`/courses/${slug}`);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedProduct) return;

    setIsSubmitting(true);
    try {
      // TODO: Submit to Convex to store lead/contact
      // await mutation to save email and name
      console.log("Capturing lead:", { email, name, productId: selectedProduct._id });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasSubmittedEmail(true);
    } catch (error) {
      console.error("Failed to capture email:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (item: ContentItem) => {
    if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank');
    } else if (item.url) {
      window.open(item.url, '_blank');
    }
    // Don't close modal immediately so user sees success message
    setTimeout(() => {
      setProductModalOpen(false);
    }, 1000);
  };

  if (content.length === 0) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">No content found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{emptyMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {content.map((item, index) => (
          <ContentCard 
            key={item._id} 
            item={item} 
            index={index} 
            onClick={() => handleProductClick(item)}
          />
      ))}
    </div>

      {/* Product Details Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription>
                  {selectedProduct.contentType === "sample-pack" ? "Sample Pack" : "Digital Product"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Product Image */}
                {(selectedProduct.imageUrl || selectedProduct.thumbnail) && (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={selectedProduct.imageUrl || selectedProduct.thumbnail || ""}
                      alt={selectedProduct.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Price Badge */}
                <div className="flex items-center gap-4">
                  <Badge className="text-lg px-4 py-2">
                    {selectedProduct.price === 0 ? "FREE" : `$${selectedProduct.price}`}
                  </Badge>
                  <Badge variant="outline">
                    {selectedProduct.contentType === "sample-pack" ? "Sample Pack" : "Digital Product"}
                  </Badge>
                </div>

                {/* Stats */}
                {(selectedProduct.sampleCount || selectedProduct.downloadCount) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {selectedProduct.sampleCount && (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>{selectedProduct.sampleCount} samples</span>
                      </div>
                    )}
                    {selectedProduct.downloadCount && (
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span>{selectedProduct.downloadCount} downloads</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About this {selectedProduct.contentType === "sample-pack" ? "pack" : "product"}</h3>
                  <p className="text-muted-foreground">
                    {selectedProduct.description || "No description available."}
                  </p>
                </div>

                {/* Creator Info */}
                {selectedProduct.creatorName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedProduct.creatorAvatar || ""} />
                      <AvatarFallback>
                        {selectedProduct.creatorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Created by</p>
                      <p className="text-sm text-muted-foreground">{selectedProduct.creatorName}</p>
                    </div>
                  </div>
                )}

                {/* Opt-in Form or Action Buttons */}
                {selectedProduct.price === 0 && !hasSubmittedEmail ? (
                  /* Show opt-in form for free products */
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2">🎁 Get Free Access</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter your email to download this free resource instantly
                      </p>
                      <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <div>
                          <label htmlFor="name" className="text-sm font-medium block mb-1">
                            Name (optional)
                          </label>
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="text-sm font-medium block mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <Button 
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={isSubmitting || !email}
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Get Free Access
                            </>
                          )}
                        </Button>
                      </form>
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        🔒 We respect your privacy. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Show action buttons after email submission or for paid products */
                  <div className="space-y-4">
                    {hasSubmittedEmail && (
                      <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4">
                        <p className="text-chart-1 text-sm font-medium">
                          ✓ Email confirmed! Click below to access your download.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {(selectedProduct.downloadUrl || selectedProduct.url) ? (
                        <>
                          <Button 
                            size="lg"
                            className="flex-1"
                            onClick={() => {
                              console.log("Download button clicked for:", selectedProduct.title);
                              console.log("downloadUrl:", selectedProduct.downloadUrl);
                              console.log("url:", selectedProduct.url);
                              handleDownload(selectedProduct);
                            }}
                          >
                            {selectedProduct.downloadUrl ? (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                {selectedProduct.buttonLabel || "Download Now"}
                              </>
                            ) : selectedProduct.url ? (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {selectedProduct.buttonLabel || "Visit Link"}
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Access Product
                              </>
                            )}
                          </Button>
                          {selectedProduct.price > 0 && (
                            <Button 
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                alert(`To purchase "${selectedProduct.title}", please contact ${selectedProduct.creatorName || "the creator"} directly.`);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">
                            ⚠️ Debug: No URL found for this product
                          </p>
                          <Button 
                            size="lg"
                            className="flex-1"
                            onClick={() => {
                              const message = selectedProduct.price === 0 
                                ? `I'm interested in the free resource "${selectedProduct.title}".`
                                : `I'm interested in purchasing "${selectedProduct.title}" for $${selectedProduct.price}.`;
                              alert(`${message}\n\nPlease contact ${selectedProduct.creatorName || "the creator"} for more information.`);
                              setProductModalOpen(false);
                            }}
                          >
                            Contact Creator
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const ContentCard: FC<{ item: ContentItem; index: number; onClick: () => void }> = ({ item, index, onClick }) => {
  // Determine icon and color based on content type
  const IconComponent = item.contentType === "course" 
    ? BookOpen 
    : item.contentType === "sample-pack"
    ? Package
    : item.contentType === "plugin"
    ? Plug
    : Package;
    
  const badgeColor = item.contentType === "course" 
    ? "bg-chart-1/10 text-chart-1 dark:bg-chart-1/20 dark:text-chart-1" 
    : item.contentType === "sample-pack"
    ? "bg-chart-5/10 text-chart-5 dark:bg-chart-5/20 dark:text-chart-5"
    : item.contentType === "plugin"
    ? "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400"
    : "bg-chart-3/10 text-chart-3 dark:bg-chart-3/20 dark:text-chart-3";

  const badgeLabel = item.contentType === "course"
    ? "Course"
    : item.contentType === "sample-pack"
    ? "Sample Pack"
    : item.contentType === "plugin"
    ? "Plugin"
    : "Product";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Card
        className="group overflow-hidden border-border bg-card hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="relative h-52 bg-gradient-to-br from-muted to-muted/80 overflow-hidden">
          {(item.thumbnail || item.imageUrl) ? (
            <Image
              src={item.thumbnail || item.imageUrl || ""}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconComponent className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Type Badge */}
          <Badge className={`absolute top-3 left-3 ${badgeColor} font-medium shadow-lg`}>
            <IconComponent className="w-3 h-3 mr-1" />
            {badgeLabel}
          </Badge>

          {/* Price Badge */}
          <Badge className="absolute top-3 right-3 bg-card dark:bg-card text-foreground font-bold shadow-lg border border-border">
            {item.price === 0 ? "FREE" : `$${item.price.toFixed(2)}`}
          </Badge>

          {/* Rating (if available) */}
          {item.rating && (
            <Badge className="absolute bottom-3 right-3 bg-chart-5/90 text-primary-foreground font-semibold">
              <Star className="w-3 h-3 mr-1 fill-primary-foreground" />
              {item.rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-5 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 text-foreground group-hover:text-chart-1 transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {stripHtml(item.description)}
            </p>
          )}

          {/* Footer: Creator + Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* Creator */}
            <div className="flex items-center gap-2">
              <Avatar className="w-7 h-7 border border-border">
                <AvatarImage src={item.creatorAvatar} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-chart-1 to-chart-2 text-primary-foreground">
                  {item.creatorName?.charAt(0) || "C"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                {item.creatorName || "Creator"}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {item.contentType === "course" && item.enrollmentCount !== undefined && (
                <>
                  <Users className="w-4 h-4" />
                  <span>{item.enrollmentCount}</span>
                </>
              )}
              {item.contentType === "product" && item.downloadCount !== undefined && (
                <>
                  <Download className="w-4 h-4" />
                  <span>{item.downloadCount}</span>
                </>
              )}
              {item.contentType === "sample-pack" && (
                <>
                  {item.sampleCount !== undefined && (
                    <>
                      <Package className="w-4 h-4" />
                      <span>{item.sampleCount} samples</span>
                    </>
                  )}
                  {item.downloadCount !== undefined && item.sampleCount === undefined && (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{item.downloadCount}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

