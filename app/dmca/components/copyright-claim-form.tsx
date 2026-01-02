"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface FormData {
  claimantName: string;
  claimantEmail: string;
  claimantAddress: string;
  claimantPhone: string;
  contentUrl: string;
  contentTitle: string;
  originalWorkDescription: string;
  originalWorkUrl: string;
  infringementDescription: string;
  goodFaithStatement: boolean;
  accuracyStatement: boolean;
  digitalSignature: string;
}

export function CopyrightClaimForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const searchParams = useSearchParams();

  const prefillContentId = searchParams.get("content") || "";
  const prefillTitle = searchParams.get("title") || "";

  const [formData, setFormData] = useState<FormData>({
    claimantName: "",
    claimantEmail: "",
    claimantAddress: "",
    claimantPhone: "",
    contentUrl: prefillContentId,
    contentTitle: prefillTitle,
    originalWorkDescription: "",
    originalWorkUrl: "",
    infringementDescription: "",
    goodFaithStatement: false,
    accuracyStatement: false,
    digitalSignature: "",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitClaim = useMutation((api as any).copyright.submitCopyrightClaim);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (formData.claimantName.length < 2) {
      newErrors.claimantName = "Full legal name is required";
    }
    if (!formData.claimantEmail.includes("@")) {
      newErrors.claimantEmail = "Valid email is required";
    }
    if (formData.contentUrl.length < 1) {
      newErrors.contentUrl = "Please provide the URL or ID of the infringing content";
    }
    if (formData.contentTitle.length < 1) {
      newErrors.contentTitle = "Content title is required";
    }
    if (formData.originalWorkDescription.length < 20) {
      newErrors.originalWorkDescription =
        "Please describe your original work in detail (min 20 chars)";
    }
    if (formData.infringementDescription.length < 20) {
      newErrors.infringementDescription =
        "Please explain how your work is being infringed (min 20 chars)";
    }
    if (!formData.goodFaithStatement) {
      newErrors.goodFaithStatement = "You must confirm this statement";
    }
    if (!formData.accuracyStatement) {
      newErrors.accuracyStatement = "You must confirm this statement";
    }
    if (formData.digitalSignature.length < 2) {
      newErrors.digitalSignature = "Please type your full legal name as a digital signature";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await submitClaim({
        contentId: formData.contentUrl,
        contentType: "sample",
        contentTitle: formData.contentTitle,
        claimantName: formData.claimantName,
        claimantEmail: formData.claimantEmail,
        claimantAddress: formData.claimantAddress || undefined,
        claimantPhone: formData.claimantPhone || undefined,
        originalWorkDescription: formData.originalWorkDescription,
        originalWorkUrl: formData.originalWorkUrl || undefined,
        infringementDescription: formData.infringementDescription,
        goodFaithStatement: formData.goodFaithStatement,
        accuracyStatement: formData.accuracyStatement,
        digitalSignature: formData.digitalSignature,
      });

      setIsSubmitted(true);
      toast.success("Copyright claim submitted successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit claim";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 py-8 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h3 className="text-xl font-semibold">Claim Submitted</h3>
        <p className="mx-auto max-w-md text-muted-foreground">
          We have received your copyright claim and will review it within 48 hours. You will receive
          an email notification with updates.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Your Information (Copyright Owner)</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="claimantName">
              Full Legal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="claimantName"
              value={formData.claimantName}
              onChange={(e) => updateField("claimantName", e.target.value)}
            />
            {errors.claimantName && <p className="text-sm text-red-500">{errors.claimantName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimantEmail">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="claimantEmail"
              type="email"
              value={formData.claimantEmail}
              onChange={(e) => updateField("claimantEmail", e.target.value)}
            />
            {errors.claimantEmail && <p className="text-sm text-red-500">{errors.claimantEmail}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="claimantAddress">Mailing Address</Label>
            <Input
              id="claimantAddress"
              value={formData.claimantAddress}
              onChange={(e) => updateField("claimantAddress", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claimantPhone">Phone Number</Label>
            <Input
              id="claimantPhone"
              value={formData.claimantPhone}
              onChange={(e) => updateField("claimantPhone", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Infringing Content</h3>

        <div className="space-y-2">
          <Label htmlFor="contentUrl">
            URL or ID of Infringing Content <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contentUrl"
            placeholder="https://ppr-academy.com/... or content ID"
            value={formData.contentUrl}
            onChange={(e) => updateField("contentUrl", e.target.value)}
          />
          {errors.contentUrl && <p className="text-sm text-red-500">{errors.contentUrl}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contentTitle">
            Content Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contentTitle"
            value={formData.contentTitle}
            onChange={(e) => updateField("contentTitle", e.target.value)}
          />
          {errors.contentTitle && <p className="text-sm text-red-500">{errors.contentTitle}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Your Original Work</h3>

        <div className="space-y-2">
          <Label htmlFor="originalWorkDescription">
            Description of Your Original Work <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="originalWorkDescription"
            placeholder="Describe your original copyrighted work..."
            rows={3}
            value={formData.originalWorkDescription}
            onChange={(e) => updateField("originalWorkDescription", e.target.value)}
          />
          {errors.originalWorkDescription && (
            <p className="text-sm text-red-500">{errors.originalWorkDescription}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="originalWorkUrl">URL to Your Original Work (if available)</Label>
          <Input
            id="originalWorkUrl"
            placeholder="https://..."
            value={formData.originalWorkUrl}
            onChange={(e) => updateField("originalWorkUrl", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="infringementDescription">
            How is Your Work Being Infringed? <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="infringementDescription"
            placeholder="Explain how the content infringes on your copyright..."
            rows={3}
            value={formData.infringementDescription}
            onChange={(e) => updateField("infringementDescription", e.target.value)}
          />
          {errors.infringementDescription && (
            <p className="text-sm text-red-500">{errors.infringementDescription}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Required Legal Statements</h3>

        <Alert
          variant="destructive"
          className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Making false claims is a violation of law and may result in legal action against you.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="goodFaithStatement"
              checked={formData.goodFaithStatement}
              onCheckedChange={(checked) => updateField("goodFaithStatement", checked === true)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="goodFaithStatement"
                className="cursor-pointer text-sm leading-relaxed"
              >
                I have a good faith belief that use of the material in the manner complained of is
                not authorized by the copyright owner, its agent, or the law.{" "}
                <span className="text-red-500">*</span>
              </Label>
              {errors.goodFaithStatement && (
                <p className="text-sm text-red-500">{errors.goodFaithStatement}</p>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="accuracyStatement"
              checked={formData.accuracyStatement}
              onCheckedChange={(checked) => updateField("accuracyStatement", checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="accuracyStatement" className="cursor-pointer text-sm leading-relaxed">
                I swear, under penalty of perjury, that the information in this notification is
                accurate and that I am the copyright owner or am authorized to act on behalf of the
                owner of an exclusive right that is allegedly infringed.{" "}
                <span className="text-red-500">*</span>
              </Label>
              {errors.accuracyStatement && (
                <p className="text-sm text-red-500">{errors.accuracyStatement}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="digitalSignature">
          Digital Signature (Type Your Full Legal Name) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="digitalSignature"
          placeholder="Type your full legal name"
          className="font-serif italic"
          value={formData.digitalSignature}
          onChange={(e) => updateField("digitalSignature", e.target.value)}
        />
        {errors.digitalSignature && (
          <p className="text-sm text-red-500">{errors.digitalSignature}</p>
        )}
        <p className="text-xs text-muted-foreground">
          By typing your name above, you are providing a legally binding digital signature.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Claim...
          </>
        ) : (
          "Submit Copyright Claim"
        )}
      </Button>
    </form>
  );
}
