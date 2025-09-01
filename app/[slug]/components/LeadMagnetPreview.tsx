"use client";

import { useState } from "react";
import { CheckCircle, Download, Mail, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface LeadMagnetPreviewProps {
  leadMagnet?: {
    title: string;
    subtitle: string;
    imageUrl?: string;
    ctaText?: string;
    downloadUrl?: string;
    productId: string;
  };
  isFullScreen?: boolean;
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

export function LeadMagnetPreview({ leadMagnet, isFullScreen = false, storeData }: LeadMagnetPreviewProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ submissionId: string; downloadUrl?: string } | null>(null);
  
  // Check if leadSubmissions API is available (after npx convex dev)
  const hasLeadSubmissionsAPI = (api as any).leadSubmissions?.submitLead;
  const submitLead = hasLeadSubmissionsAPI ? useMutation((api as any).leadSubmissions.submitLead) : null;
  const trackDownload = hasLeadSubmissionsAPI ? useMutation((api as any).leadSubmissions.trackDownload) : null;

  const handleSubmit = async () => {
    console.log("🎯 handleSubmit called!", { formData, isSubmitting });
    
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
    console.log("📥 handleDownload called!", { submissionResult });
    
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
      <div className="w-full p-4 space-y-4 bg-primary/5 rounded-lg">
        {/* Success Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg text-primary">
            🎉 Success!
          </h3>
          <p className="text-sm text-primary/80">
            Thanks {formData.name || "John"}! Check your email for your free resource.
          </p>
        </div>

        {/* Download Preview */}
        <div className="bg-card rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
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
            type="button"
            className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm relative z-10 pointer-events-auto touch-manipulation min-h-[44px]"
            onClick={(e) => {
              e.preventDefault();
              console.log("💾 Download button clicked!");
              handleDownload();
            }}
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
    <div className="w-full p-4 space-y-4 bg-card relative z-0">
      {/* Image Preview */}
      <div className="w-full h-32 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/20">
        {leadMagnet?.imageUrl ? (
          <img 
            src={leadMagnet.imageUrl} 
            alt="Lead magnet preview" 
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <span className="text-xs text-primary font-medium">Lead Magnet</span>
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
      <div className="space-y-3 relative z-10">
        <Input 
          placeholder="Your Name" 
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="h-12 bg-card border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative z-10 pointer-events-auto min-h-[44px] touch-manipulation" 
        />
        <Input 
          placeholder="Your Email" 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="h-12 bg-card border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary relative z-10 pointer-events-auto min-h-[44px] touch-manipulation" 
        />
        <Button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            console.log("🔥 Button clicked!");
            handleSubmit();
          }}
          disabled={isSubmitting}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 font-semibold disabled:opacity-50 relative z-10 pointer-events-auto touch-manipulation min-h-[44px]"
        >
          {isSubmitting ? "Submitting..." : (leadMagnet?.ctaText || "Get Free Resource")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center gap-4 pt-2 relative z-10">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">No spam</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Instant access</span>
        </div>
      </div>

      {/* Auto-cycle indicator */}
      <div className="flex justify-center pt-1">
        <div className="flex gap-1">
          <div className={`w-2 h-2 rounded-full ${!showSuccess ? "bg-primary" : "bg-muted"}`} />
          <div className={`w-2 h-2 rounded-full ${showSuccess ? "bg-primary" : "bg-muted"}`} />
        </div>
      </div>
    </div>
  );
}
