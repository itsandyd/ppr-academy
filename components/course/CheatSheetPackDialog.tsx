"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Download,
  FileDown,
  FileStack,
  Check,
  X,
  Clock,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

type DialogView =
  | "ready"
  | "generating"
  | "complete"
  | "publish";

interface SheetResult {
  moduleTitle: string;
  pdfUrl: string;
  cheatSheetId: string;
}

interface GenerationProgress {
  totalModules: number;
  completedModules: string[];
  failedModules: string[];
  currentModule?: string;
}

interface CheatSheetPackDialogProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CheatSheetPackDialog({
  courseId,
  courseTitle,
  isOpen,
  onClose,
}: CheatSheetPackDialogProps) {
  const [view, setView] = useState<DialogView>("ready");
  const [modelId, setModelId] = useState("claude-3.5-haiku");
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [sheets, setSheets] = useState<SheetResult[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [packId, setPackId] = useState<string | null>(null);

  // Publish form state
  const [publishTitle, setPublishTitle] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishPricing, setPublishPricing] = useState<"free" | "paid" | "lead-magnet">("lead-magnet");
  const [publishPrice, setPublishPrice] = useState("");
  const [publishFollowGate, setPublishFollowGate] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // Check for existing pack
  const existingPack = useQuery(
    api.cheatSheetPacks.getPackByCourse,
    { courseId: courseId as Id<"courses"> }
  );

  // If pack exists and dialog opens, go to complete view
  useEffect(() => {
    if (isOpen && existingPack && (existingPack.status === "complete" || existingPack.status === "partial")) {
      setPackId(existingPack._id);
      setView("complete");
    } else if (isOpen && !existingPack) {
      setView("ready");
    }
  }, [isOpen, existingPack]);

  // Get pack with populated sheets for complete view
  const packWithSheets = useQuery(
    api.cheatSheetPacks.getPackWithSheets,
    packId ? { packId: packId as Id<"cheatSheetPacks"> } : "skip"
  );

  const handleGenerate = useCallback(async () => {
    setView("generating");
    setErrorMessage(null);
    setWarnings([]);
    setSheets([]);
    setProgress({ totalModules: 0, completedModules: [], failedModules: [] });

    try {
      const response = await fetch("/api/courses/generate-cheat-sheet-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, modelId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate cheat sheet pack");
      }

      setPackId(data.packId);
      setSheets(data.sheets || []);
      setWarnings(data.warnings || []);
      setProgress({
        totalModules: data.totalModules,
        completedModules: (data.sheets || []).map((s: SheetResult) => s.moduleTitle),
        failedModules: data.warnings
          ?.filter((w: string) => w.includes("failed"))
          .map((w: string) => {
            const match = w.match(/Module "(.+)" failed/);
            return match ? match[1] : w;
          }) || [],
      });
      setView("complete");
      toast.success(
        `Generated ${data.completedModules} of ${data.totalModules} cheat sheets`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage(msg);
      setView("ready");
      toast.error("Pack generation failed");
    }
  }, [courseId, modelId]);

  const handlePublish = async () => {
    if (!packId) return;

    setIsPublishing(true);
    try {
      const response = await fetch("/api/courses/publish-cheat-sheet-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          pricing: publishPricing,
          price: publishPricing === "paid" ? Math.round(parseFloat(publishPrice) * 100) : 0,
          followGateEnabled: publishPricing === "lead-magnet" ? true : publishFollowGate,
          title: publishTitle || undefined,
          description: publishDescription || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      toast.success("Cheat sheet pack published to your store");
      setView("complete");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (view === "generating") {
      toast.warning("Generation in progress — please wait");
      return;
    }
    setView("ready");
    setErrorMessage(null);
    setWarnings([]);
    onClose();
  };

  const handleDownloadAll = () => {
    const sheetsToDownload = packWithSheets?.sheets || sheets;
    for (const sheet of sheetsToDownload) {
      if (sheet.pdfUrl) {
        window.open(sheet.pdfUrl, "_blank");
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="w-5 h-5 text-indigo-600" />
            Cheat Sheet Pack
          </DialogTitle>
          <DialogDescription className="text-sm">
            {view === "publish"
              ? "Publish as a digital product in your store"
              : `Generate focused cheat sheets for each module in "${courseTitle}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* ─── READY STATE ─── */}
          {view === "ready" && (
            <>
              {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">AI Model</Label>
                  <Select value={modelId} onValueChange={setModelId}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3.5-haiku">
                        Claude 3.5 Haiku (Fast)
                      </SelectItem>
                      <SelectItem value="claude-4-sonnet">
                        Claude 4 Sonnet
                      </SelectItem>
                      <SelectItem value="claude-4.5-sonnet">
                        Claude 4.5 Sonnet (Best)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Each module will get its own focused 1-2 page cheat sheet.
                  Processing takes ~5 seconds per module.
                </p>
              </div>

              <Button onClick={handleGenerate} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Cheat Sheet Pack
              </Button>
            </>
          )}

          {/* ─── GENERATING STATE ─── */}
          {view === "generating" && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm text-center text-muted-foreground">
                  Generating cheat sheets for each module...
                  <br />
                  <span className="text-xs">
                    This may take 30-120 seconds depending on course size.
                  </span>
                </p>
              </div>

              {progress && progress.totalModules > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {progress.completedModules.length + progress.failedModules.length} of{" "}
                      {progress.totalModules}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${((progress.completedModules.length + progress.failedModules.length) / progress.totalModules) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── COMPLETE STATE ─── */}
          {view === "complete" && (
            <div className="space-y-4">
              {/* Existing pack data or just-generated sheets */}
              {(() => {
                const displaySheets = packWithSheets?.sheets || sheets.map(s => ({
                  ...s,
                  _id: s.cheatSheetId,
                  moduleTitle: s.moduleTitle,
                }));

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {displaySheets.length} sheet{displaySheets.length !== 1 ? "s" : ""} ready
                      </Badge>
                      {displaySheets.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadAll}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download All
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {displaySheets.map((sheet: any) => (
                        <div
                          key={sheet._id || sheet.cheatSheetId}
                          className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                              <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium truncate">
                              {sheet.moduleTitle}
                            </span>
                          </div>
                          {sheet.pdfUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={sheet.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                              >
                                <FileDown className="w-3 h-3 mr-1" />
                                PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {warnings.length > 0 && (
                      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                          Warnings:
                        </p>
                        {warnings.map((w, i) => (
                          <p
                            key={i}
                            className="text-xs text-yellow-700 dark:text-yellow-400"
                          >
                            {w}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleGenerate}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate All
                      </Button>
                      {!existingPack?.digitalProductId && (
                        <Button
                          onClick={() => {
                            setPublishTitle(
                              `${courseTitle} — Cheat Sheet Pack`
                            );
                            setPublishDescription(
                              `${displaySheets.length} module cheat sheets covering ${courseTitle}`
                            );
                            setView("publish");
                          }}
                          className="flex-1"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Publish as Product
                        </Button>
                      )}
                      {existingPack?.digitalProductId && (
                        <Badge
                          variant="secondary"
                          className="self-center text-xs"
                        >
                          Already published
                        </Badge>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ─── PUBLISH STATE ─── */}
          {view === "publish" && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("complete")}
                className="text-xs -ml-2"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Title</Label>
                  <Input
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder="Product title"
                  />
                </div>

                <div>
                  <Label className="text-sm">Description</Label>
                  <Input
                    value={publishDescription}
                    onChange={(e) => setPublishDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <Label className="text-sm">Pricing</Label>
                  <Select
                    value={publishPricing}
                    onValueChange={(v) =>
                      setPublishPricing(v as "free" | "paid" | "lead-magnet")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead-magnet">
                        Lead Magnet (Follow Gate)
                      </SelectItem>
                      <SelectItem value="free">Free (No Gate)</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {publishPricing === "paid" && (
                  <div>
                    <Label className="text-sm">Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={publishPrice}
                      onChange={(e) => setPublishPrice(e.target.value)}
                      placeholder="9.99"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Publish to Store
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
