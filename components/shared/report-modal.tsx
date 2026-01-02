"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: "sample" | "product" | "course";
  contentTitle: string;
  creatorName?: string;
  storeId?: string;
  isCopyrightReport?: boolean;
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "spam", label: "Spam or misleading" },
  { value: "quality", label: "Low quality or broken files" },
  { value: "stolen", label: "Stolen or repackaged content" },
  { value: "other", label: "Other" },
];

export function ReportModal({
  isOpen,
  onClose,
  contentId,
  contentType,
  contentTitle,
  creatorName,
  storeId,
  isCopyrightReport = false,
}: ReportModalProps) {
  const { user } = useUser();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createReport = useMutation((api as any).reports.createReport);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for your report");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedReason = REPORT_REASONS.find((r) => r.value === reason);
      await createReport({
        type: contentType,
        reportedBy: user?.id || "anonymous",
        reason: `${selectedReason?.label || reason}: ${details}`,
        contentId,
        contentTitle,
        contentPreview: details.substring(0, 200),
        reporterName: user?.fullName || user?.emailAddresses[0]?.emailAddress || "Anonymous",
        reportedUserName: creatorName,
        storeId,
        contentType,
      });

      toast.success("Report submitted. Thank you for helping keep our community safe.");
      onClose();
      setReason("");
      setDetails("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit report";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCopyrightReport) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white dark:bg-black sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copyright Infringement Report</DialogTitle>
            <DialogDescription>
              Copyright claims require a formal DMCA notice with legal attestations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              To report copyright infringement, you must submit a formal DMCA takedown request. This
              is a legal process that requires you to:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Identify your original copyrighted work</li>
              <li>Identify the infringing material</li>
              <li>Provide your contact information</li>
              <li>Sign a statement under penalty of perjury</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Link
              href={`/dmca?content=${encodeURIComponent(contentId)}&title=${encodeURIComponent(contentTitle)}`}
            >
              <Button>
                Go to DMCA Form
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-black sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Report &quot;{contentTitle}&quot; {creatorName && `by ${creatorName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Why are you reporting this content?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="cursor-pointer font-normal">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
