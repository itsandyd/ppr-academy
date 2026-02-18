"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ExportReferencePdfDialogProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExportState = "idle" | "generating" | "success" | "error";

export function ExportReferencePdfDialog({
  courseId,
  courseTitle,
  isOpen,
  onClose,
}: ExportReferencePdfDialogProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleGenerate = async () => {
    setState("generating");
    setErrorMessage(null);
    setWarnings([]);
    setPdfUrl(null);

    try {
      const response = await fetch("/api/courses/generate-reference-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate PDF");
      }

      setPdfUrl(data.pdfUrl);
      if (data.warnings?.length) {
        setWarnings(data.warnings);
      }
      setState("success");
      toast.success("Reference PDF generated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage(msg);
      setState("error");
      toast.error("PDF generation failed");
    }
  };

  const handleClose = () => {
    // Reset state on close so it's fresh next time
    setState("idle");
    setPdfUrl(null);
    setErrorMessage(null);
    setWarnings([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle>Export Reference PDF</DialogTitle>
          <DialogDescription>
            Generate a branded reference guide from &ldquo;{courseTitle}&rdquo;.
            AI will transform your course content into a scannable PDF with key
            takeaways, quick references, and pro tips.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Idle state — generate button */}
          {state === "idle" && (
            <Button onClick={handleGenerate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Generate Reference PDF
            </Button>
          )}

          {/* Generating state — spinner */}
          {state === "generating" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Transforming course content into a reference guide...
                <br />
                <span className="text-xs">This may take 30-60 seconds.</span>
              </p>
            </div>
          )}

          {/* Success state — download link */}
          {state === "success" && pdfUrl && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-center">
                  Reference PDF generated
                </p>
              </div>

              <Button asChild className="w-full">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </a>
              </Button>

              {warnings.length > 0 && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    Generated with warnings:
                  </p>
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
                      {w}
                    </p>
                  ))}
                </div>
              )}

              <Button variant="outline" onClick={handleGenerate} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-center text-red-600 dark:text-red-400">
                  {errorMessage || "Something went wrong"}
                </p>
              </div>

              <Button onClick={handleGenerate} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
