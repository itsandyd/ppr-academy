"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowRight, Save } from "lucide-react";
import { useMembershipCreation } from "../context";
import { AIContentAssistant } from "../../shared/AIContentAssistant";
import { ImageUploader } from "../../shared/ImageUploader";

export function MembershipBasicsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, updateData, saveTier, validateStep } = useMembershipCreation();
  const [newBenefit, setNewBenefit] = useState("");

  const tierId = searchParams.get("tierId");

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      const currentBenefits = state.data.benefits || [];
      updateData("basics", { benefits: [...currentBenefits, newBenefit.trim()] });
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    const currentBenefits = state.data.benefits || [];
    updateData("basics", { benefits: currentBenefits.filter((_, i) => i !== index) });
  };

  const handleNext = async () => {
    await saveTier();
    const newTierId = state.tierId || tierId;
    router.push(
      `/dashboard/create/membership?step=pricing${newTierId ? `&tierId=${newTierId}` : ""}`
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Membership Basics</CardTitle>
          <CardDescription>Define your membership tier details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tierName">Tier Name *</Label>
            <Input
              id="tierName"
              placeholder="e.g., Pro Member, VIP Access, All-Access Pass"
              value={state.data.tierName || ""}
              onChange={(e) => updateData("basics", { tierName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description *</Label>
              <AIContentAssistant
                productType="membership"
                title={state.data.tierName}
                description={state.data.description}
                onDescriptionGenerated={(desc) => updateData("basics", { description: desc })}
              />
            </div>
            <Textarea
              id="description"
              placeholder="Describe what members get with this tier..."
              rows={4}
              value={state.data.description || ""}
              onChange={(e) => updateData("basics", { description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Benefits</Label>
            <p className="text-sm text-muted-foreground">List the benefits members will receive</p>
            <div className="flex gap-2">
              <Input
                placeholder="Add a benefit..."
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddBenefit())}
              />
              <Button type="button" variant="outline" onClick={handleAddBenefit}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {state.data.benefits && state.data.benefits.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {state.data.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 py-1.5">
                    {benefit}
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Image */}
      <ImageUploader
        value={state.data.thumbnail}
        onChange={(url) => updateData("basics", { thumbnail: url })}
        title="Membership Thumbnail"
        description="Add an image to promote your membership tier"
        productType="membership"
        productTitle={state.data.tierName}
        productDescription={state.data.description}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard?mode=create")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveTier} disabled={state.isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {state.isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handleNext} disabled={!validateStep("basics")}>
            Next: Pricing
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
