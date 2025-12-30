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
  mode?: "store" | "leadMagnet" | "digitalProduct" | "profile" | "course";
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
  // Course preview specific props
  coursePreview?: {
    title?: string;
    description?: string;
    category?: string;
    skillLevel?: string;
    thumbnail?: string;
    price?: number;
    modules?: number;
  };
  // Style and button props for digital product creation
  style?: "button" | "callout" | "preview" | "card" | "minimal";
  buttonLabel?: string;
}

// Link-in-Bio Style Component for Phone Preview
function LinkInBioLayout({
  products,
  leadMagnetData,
  storeData,
  onLeadMagnetClick,
}: {
  products: any[];
  leadMagnetData?: any;
  storeData?: any;
  onLeadMagnetClick?: (leadMagnet: any) => void;
}) {
  const allProducts = products || [];
  const publishedProducts = allProducts.filter((p) => p.isPublished);
  const draftProducts = allProducts.filter((p) => !p.isPublished);

  // Separate lead magnets from other products for both published and draft
  const leadMagnets = publishedProducts.filter(
    (p) => p.price === 0 && (p.style === "card" || p.style === "callout")
  );
  const draftLeadMagnets = draftProducts.filter(
    (p) => p.price === 0 && (p.style === "card" || p.style === "callout")
  );
  const otherProducts = publishedProducts.filter(
    (p) => !(p.price === 0 && (p.style === "card" || p.style === "callout"))
  );
  const draftOtherProducts = draftProducts.filter(
    (p) => !(p.price === 0 && (p.style === "card" || p.style === "callout"))
  );

  if (allProducts.length === 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Store className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No products available yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Check back soon!</p>
      </div>
    );
  }

  if (publishedProducts.length === 0 && draftProducts.length > 0) {
    return (
      <div className="w-full p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-amber-100">
          <Store className="h-8 w-8 text-amber-600" />
        </div>
        <p className="text-sm text-muted-foreground">You have draft content</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Publish your products to make them visible to visitors
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Lead Magnet Cards */}
      {leadMagnets.map((leadMagnet) => (
        <Card
          key={leadMagnet._id}
          className="cursor-pointer border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 transition-all hover:shadow-md"
          onClick={() => onLeadMagnetClick?.(leadMagnet)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-green-800">{leadMagnet.title}</h3>
              <p className="truncate text-xs text-green-600">Free Resource • Click to get access</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Badge className="border-green-200 bg-green-100 text-xs text-green-800">FREE</Badge>
              <ArrowRight className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </Card>
      ))}

      {/* Other Products */}
      {otherProducts.map((product) => (
        <Card
          key={product._id}
          className="cursor-pointer border-border p-4 transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">{product.title}</h3>
              <p className="truncate text-xs text-muted-foreground">
                {product.description || "Digital Product"}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                ${product.price}
              </Badge>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>
      ))}

      {/* Draft Products Section */}
      {(draftLeadMagnets.length > 0 || draftOtherProducts.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <div className="h-px flex-1 bg-border" />
            <Badge variant="secondary" className="text-xs">
              Draft Content
            </Badge>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Draft Lead Magnet Cards */}
          {draftLeadMagnets.map((leadMagnet) => (
            <Card
              key={leadMagnet._id}
              className="cursor-pointer border border-dashed border-amber-200 bg-amber-50/50 p-4 opacity-75 transition-all hover:shadow-md"
              onClick={() => onLeadMagnetClick?.(leadMagnet)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Gift className="h-6 w-6 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-amber-800">
                    {leadMagnet.title}
                  </h3>
                  <p className="truncate text-xs text-amber-600">Free Resource • Draft</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <Badge className="border-amber-200 bg-amber-100 text-xs text-amber-800">
                    DRAFT
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                </div>
              </div>
            </Card>
          ))}

          {/* Draft Other Products */}
          {draftOtherProducts.map((product) => (
            <Card
              key={product._id}
              className="cursor-pointer border border-dashed border-gray-200 bg-gray-50/50 p-4 opacity-75 transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{product.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.description || "Digital Product"} • Draft
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <Badge variant="outline" className="border-dashed text-xs">
                    ${product.price}
                  </Badge>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
function LeadMagnetPreview({
  leadMagnet,
  storeData,
  isInPhoneDialog = false,
}: {
  leadMagnet?: PhonePreviewProps["leadMagnet"];
  storeData?: any;
  isInPhoneDialog?: boolean;
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    submissionId: string;
    downloadUrl?: string;
  } | null>(null);

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
      const link = document.createElement("a");
      link.href = submissionResult.downloadUrl;
      link.download = leadMagnet?.title || "lead-magnet";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (showSuccess) {
    const SuccessContent = (
      <div className="space-y-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        {/* Success Header */}
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-800">🎉 Success!</h3>
          <p className="text-sm text-green-700">
            Thanks {formData.name || "John"}! Check your email for your free resource.
          </p>
        </div>

        {/* Download Preview */}
        <div className="rounded-lg border border-green-200 bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {leadMagnet?.title || "Ultimate Marketing Guide"}
              </p>
              <p className="text-xs text-muted-foreground">
                {leadMagnet?.downloadUrl ? "Ready for Download" : "PDF • 2.3 MB"}
              </p>
            </div>
          </div>
          <Button
            className="mt-3 w-full bg-primary text-sm text-primary-foreground hover:bg-primary/90"
            onClick={handleDownload}
            disabled={!submissionResult?.downloadUrl}
          >
            <Download className="mr-2 h-4 w-4" />
            {submissionResult?.downloadUrl ? "Download Now" : "File Not Available"}
          </Button>
        </div>

        {/* Email Confirmation */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-blue-700">
              Confirmation email sent to {formData.email || "john@example.com"}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-2 pt-2">
          <p className="text-center text-xs text-muted-foreground">
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
    <div className="space-y-4 rounded-lg bg-card p-4">
      {/* Image Preview */}
      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-100">
        {leadMagnet?.imageUrl ? (
          <img
            src={leadMagnet.imageUrl}
            alt="Lead magnet preview"
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-green-200">
              <Gift className="h-8 w-8 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600">Lead Magnet</span>
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-card-foreground">
          {leadMagnet?.title || "Lead Magnet Title"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {leadMagnet?.subtitle ||
            "Get instant access to our comprehensive guide and boost your marketing results today!"}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <Input
          placeholder="Your Name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="h-12 border-border bg-card text-foreground placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
        />
        <Input
          placeholder="Your Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          className="h-12 border-border bg-card text-foreground placeholder-muted-foreground focus:border-green-500 focus:ring-green-500"
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : leadMagnet?.ctaText || "Get Free Resource"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-muted-foreground">No spam</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-muted-foreground">Instant access</span>
        </div>
      </div>

      {/* Auto-cycle indicator */}
      <div className="flex justify-center pt-1">
        <div className="flex gap-1">
          <div className={`h-2 w-2 rounded-full ${!showSuccess ? "bg-green-500" : "bg-muted"}`} />
          <div className={`h-2 w-2 rounded-full ${showSuccess ? "bg-green-500" : "bg-muted"}`} />
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
  coursePreview,
  style = "button",
  buttonLabel = "Get Now",
}: PhonePreviewProps) {
  // State for lead magnet dialog within phone
  const [selectedLeadMagnet, setSelectedLeadMagnet] = useState<any>(null);
  const [showLeadMagnetDialog, setShowLeadMagnetDialog] = useState(false);

  // Get updated user data from Convex
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // Show loading state while fetching user data
  if (convexUser === undefined) {
    return (
      <div className="lg:sticky lg:top-24">
        <Card className="flex h-[610px] w-[320px] flex-col rounded-3xl border-4 border-foreground/90 bg-card p-6">
          <div className="animate-pulse">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
                <div className="h-3 w-1/2 rounded bg-muted"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Prioritize saved name over Clerk's firstName + lastName
  const displayName =
    convexUser?.name ||
    (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || "User");

  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToStore}
              className="mb-2 gap-2 text-sm"
            >
              ← Back to Store
            </Button>

            {/* Lead Magnet Preview */}
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-green-800">{selectedLeadMagnet.title}</h2>
              <p className="text-sm text-green-600">
                Enter your details below to get instant access
              </p>
            </div>

            <LeadMagnetPreview
              leadMagnet={{
                title: selectedLeadMagnet.title,
                subtitle: selectedLeadMagnet.description,
                imageUrl: selectedLeadMagnet.imageUrl,
                ctaText: selectedLeadMagnet.buttonLabel,
                downloadUrl: selectedLeadMagnet.downloadUrl,
                productId: selectedLeadMagnet._id,
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
          <div className="flex-1 overflow-y-auto bg-background p-4">
            <div className="w-full space-y-3">
              {(displayStyle === "button" || style === "minimal") && (
                /* Button Style - Simple compact card */
                <Card className="cursor-pointer touch-manipulation border border-gray-200 p-4 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-100">
                      {digitalProduct?.imageUrl ? (
                        <img
                          src={digitalProduct.imageUrl}
                          alt={digitalProduct.title || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">
                        {digitalProduct?.title || "Digital Product Title"}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {digitalProduct?.description || "Digital Product"}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        ${digitalProduct?.price?.toFixed(2) || "9.99"}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              )}

              {(displayStyle === "callout" || style === "card") && (
                /* Callout Style - Larger card with more details */
                <Card className="cursor-pointer border border-primary/20 bg-primary/5 p-6 transition-all hover:shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                        {digitalProduct?.imageUrl ? (
                          <img
                            src={digitalProduct.imageUrl}
                            alt={digitalProduct.title || "Product"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-primary">
                          {digitalProduct?.title || "Digital Product Title"}
                        </h3>
                        {digitalProduct?.description && (
                          <p className="mt-1 text-sm text-primary/80">
                            {digitalProduct.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className="border-primary/20 bg-primary/10 text-primary">
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
                    <div className="flex h-48 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                      {digitalProduct?.imageUrl ? (
                        <img
                          src={digitalProduct.imageUrl}
                          alt={digitalProduct.title || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto mb-2 h-20 w-20 rounded-lg bg-muted/50" />
                          <span className="text-sm text-muted-foreground">Product Image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">
                          {digitalProduct?.title || "Digital Product Title"}
                        </h3>
                        <Badge className="bg-green-100 text-sm text-green-800">
                          ${digitalProduct?.price?.toFixed(2) || "9.99"}
                        </Badge>
                      </div>

                      {digitalProduct?.description && (
                        <p className="text-sm text-muted-foreground">
                          {digitalProduct.description}
                        </p>
                      )}

                      <Button className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90">
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
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-lg bg-muted" />
              <p className="text-sm">Your profile preview</p>
              <p className="text-xs">Changes update in real-time</p>
            </div>
          </div>
        );

      case "course":
        return (
          <div className="flex-1 overflow-hidden bg-background">
            <div className="h-full overflow-y-auto p-2">
              <div className="max-w-none space-y-2">
                {/* Course Preview Card */}
                <Card className="max-w-none overflow-hidden rounded-lg border border-gray-200 p-3 shadow-sm">
                  {/* Course Thumbnail */}
                  {coursePreview?.thumbnail ? (
                    <div className="mb-2 h-20 w-full overflow-hidden rounded-md bg-gray-100">
                      <img
                        src={coursePreview.thumbnail}
                        alt={coursePreview.title || "Course thumbnail"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-20 w-full items-center justify-center rounded-md bg-gradient-to-br from-blue-100 to-purple-100">
                      <div className="text-center">
                        <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                          <span className="text-xs font-bold text-white">📚</span>
                        </div>
                        <p className="text-xs text-gray-600">Course thumbnail</p>
                      </div>
                    </div>
                  )}

                  {/* Course Info */}
                  <div className="max-w-none space-y-2 overflow-hidden">
                    <div className="flex max-w-none items-start gap-2 overflow-hidden">
                      <h3 className="min-w-0 flex-1 truncate text-xs font-bold leading-tight text-gray-900">
                        {coursePreview?.title || "Course Title"}
                      </h3>
                      {coursePreview?.price && (
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 bg-green-100 px-1 py-0 text-xs font-semibold text-green-800"
                        >
                          ${coursePreview.price}
                        </Badge>
                      )}
                    </div>

                    <p className="line-clamp-2 max-w-none overflow-hidden text-xs leading-relaxed text-gray-600">
                      {coursePreview?.description || "Course description will appear here..."}
                    </p>

                    {/* Course Meta */}
                    <div className="flex max-w-none flex-wrap items-center gap-1 overflow-hidden pt-1">
                      {coursePreview?.category && (
                        <Badge
                          variant="outline"
                          className="max-w-[80px] truncate px-1 py-0 text-xs"
                        >
                          {coursePreview.category}
                        </Badge>
                      )}
                      {coursePreview?.skillLevel && (
                        <Badge
                          variant="outline"
                          className="max-w-[70px] truncate px-1 py-0 text-xs"
                        >
                          {coursePreview.skillLevel}
                        </Badge>
                      )}
                      {coursePreview?.modules !== undefined && coursePreview.modules > 0 && (
                        <Badge variant="outline" className="px-1 py-0 text-xs">
                          {coursePreview.modules}m
                        </Badge>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button className="mt-2 h-7 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-xs text-white hover:from-blue-700 hover:to-purple-700">
                      Enroll Now
                    </Button>
                  </div>
                </Card>

                {/* Preview Status */}
                <div className="py-1 text-center">
                  <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    <div className="h-1 w-1 animate-pulse rounded-full bg-blue-500"></div>
                    Live preview
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Updates as you create</p>
                </div>
              </div>
            </div>
          </div>
        );

      default: // "store" mode
        return (
          <div className="flex-1 overflow-y-auto p-4">
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
      <Card className="flex h-[610px] w-[320px] flex-col overflow-hidden rounded-3xl border-4 border-foreground/90 bg-card">
        {/* Header */}
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
              <AvatarFallback className="bg-muted text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{displayName}</span>
              {convexUser?.bio ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {convexUser.bio}
                </span>
              ) : store?.slug ? (
                <span className="block truncate text-xs text-muted-foreground">@{store.slug}</span>
              ) : store?.name ? (
                <span className="block truncate text-xs text-muted-foreground">
                  @{store.name.toLowerCase().replace(/\s+/g, "")}
                </span>
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
