"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductFormData } from "../types";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, Edit } from "lucide-react";

interface ReviewAndPublishProps {
  formData: ProductFormData;
  onBack: () => void;
  onEdit: (step: number) => void;
}

export function ReviewAndPublish({ formData, onBack, onEdit }: ReviewAndPublishProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  const createProduct = useMutation(api.universalProducts.createUniversalProduct);
  const updateProduct = useMutation(api.digitalProducts.updateProduct);

  const handlePublish = async (publishNow: boolean) => {
    if (publishNow) {
      setIsPublishing(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      const productId = await createProduct({
        title: formData.title,
        description: formData.description || undefined,
        storeId: formData.storeId,
        userId: formData.userId,
        productType: formData.productType,
        productCategory: formData.productCategory,
        pricingModel: formData.pricingModel,
        price: formData.price,
        imageUrl: formData.imageUrl || undefined,
        downloadUrl: formData.downloadUrl || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        
        // Follow gate config (if free)
        followGateConfig: formData.pricingModel === "free_with_gate" && formData.followGateConfig
          ? {
              requireEmail: formData.followGateConfig.requireEmail,
              requireInstagram: formData.followGateConfig.requireInstagram,
              requireTiktok: formData.followGateConfig.requireTiktok,
              requireYoutube: formData.followGateConfig.requireYoutube,
              requireSpotify: formData.followGateConfig.requireSpotify,
              minFollowsRequired: formData.followGateConfig.minFollowsRequired,
              socialLinks: formData.followGateConfig.socialLinks,
              customMessage: formData.followGateConfig.customMessage,
            }
          : undefined,
        
        // Playlist config (if applicable)
        playlistConfig: formData.playlistConfig
          ? {
              linkedPlaylistId: formData.playlistConfig.linkedPlaylistId,
              reviewTurnaroundDays: formData.playlistConfig.reviewTurnaroundDays,
              genresAccepted: formData.playlistConfig.genresAccepted,
              submissionGuidelines: formData.playlistConfig.submissionGuidelines,
              maxSubmissionsPerMonth: formData.playlistConfig.maxSubmissionsPerMonth,
            }
          : undefined,
        
        // Ableton config (if applicable)
        abletonVersion: formData.abletonRackConfig?.abletonVersion,
        rackType: formData.abletonRackConfig?.rackType,
      });

      // Update to publish if needed
      if (publishNow) {
        await updateProduct({
          id: productId,
          isPublished: true,
        });
      }

      toast.success(publishNow ? "Product published!" : "Draft saved!");
      router.push(`/store/${formData.storeId}/products`);
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product. Please try again.");
    } finally {
      setIsPublishing(false);
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Publish</h2>
        <p className="text-muted-foreground mt-1">
          Review your product before publishing
        </p>
      </div>

      {/* Product Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Product Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Image */}
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-sm">No image</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-lg">{formData.title || "Untitled Product"}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {formData.description || "No description"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {formData.productCategory.replace("-", " ")}
                </Badge>
                {formData.pricingModel === "free_with_gate" ? (
                  <Badge className="bg-purple-500">FREE - Follow to Unlock</Badge>
                ) : (
                  <Badge className="bg-green-500">${formData.price}</Badge>
                )}
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SummaryItem
            label="Product Type"
            value={formData.productCategory.replace("-", " ")}
            onEdit={() => onEdit(1)}
          />
          <SummaryItem
            label="Pricing Model"
            value={formData.pricingModel === "free_with_gate" ? "Free with Download Gate" : `Paid - $${formData.price}`}
            onEdit={() => onEdit(2)}
          />
          <SummaryItem
            label="Product Details"
            value={`${formData.title}${formData.description ? " - " + formData.description.substring(0, 50) + "..." : ""}`}
            onEdit={() => onEdit(3)}
          />
          
          {formData.pricingModel === "free_with_gate" && formData.followGateConfig && (
            <SummaryItem
              label="Follow Gate Requirements"
              value={getFollowGateDescription(formData.followGateConfig)}
              onEdit={() => onEdit(4)}
            />
          )}

          {formData.productCategory === "playlist-curation" && formData.playlistConfig && (
            <SummaryItem
              label="Playlist Configuration"
              value={`${formData.playlistConfig.genresAccepted.join(", ")} - ${formData.playlistConfig.reviewTurnaroundDays} day review`}
              onEdit={() => onEdit(5)}
            />
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handlePublish(false)}
            disabled={isPublishing || isSavingDraft}
          >
            {isSavingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button
            onClick={() => handlePublish(true)}
            disabled={isPublishing || isSavingDraft}
            size="lg"
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPublishing ? "Publishing..." : "Publish Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function SummaryItem({ label, value, onEdit }: SummaryItemProps) {
  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1">
        <Edit className="h-3 w-3" />
        Edit
      </Button>
    </div>
  );
}

function getFollowGateDescription(config: any): string {
  const requirements: string[] = [];
  
  if (config.requireEmail) requirements.push("Email");
  if (config.requireInstagram) requirements.push("Instagram");
  if (config.requireTiktok) requirements.push("TikTok");
  if (config.requireYoutube) requirements.push("YouTube");
  if (config.requireSpotify) requirements.push("Spotify");
  
  if (requirements.length === 0) return "No requirements";
  
  const platforms = requirements.slice(1);
  if (platforms.length === 0) return requirements[0];
  
  if (config.minFollowsRequired === 0) {
    return requirements.join(" + ");
  } else {
    return `${config.minFollowsRequired} of ${platforms.length} platforms + Email`;
  }
}

