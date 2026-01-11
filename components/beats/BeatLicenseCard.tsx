"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Music,
  Play,
  Pause,
  Loader2,
  FileAudio,
  Layers,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface BeatLicenseCardProps {
  license: {
    _id: Id<"beatLicenses">;
    purchaseId: Id<"purchases">;
    beatTitle: string;
    producerName: string;
    tierType: "basic" | "premium" | "exclusive" | "unlimited";
    tierName: string;
    price: number;
    deliveredFiles: string[];
    createdAt: number;
    beat?: {
      _id: Id<"digitalProducts">;
      title: string;
      imageUrl?: string;
      audioUrl?: string;
      bpm?: number;
      key?: string;
      genre?: string;
    } | null;
    store?: {
      _id: Id<"stores">;
      name: string;
      slug: string;
    } | null;
  };
}

const TIER_ICONS = {
  basic: FileAudio,
  premium: Layers,
  exclusive: Crown,
  unlimited: Crown,
};

const TIER_COLORS = {
  basic: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  premium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  exclusive: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  unlimited: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function BeatLicenseCard({ license }: BeatLicenseCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const TierIcon = TIER_ICONS[license.tierType];

  const handlePlayPreview = () => {
    if (!license.beat?.audioUrl) {
      toast.error("No audio preview available");
      return;
    }

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const newAudio = new Audio(license.beat.audioUrl);
    newAudio.onended = () => setIsPlaying(false);
    newAudio.play();
    setAudio(newAudio);
    setIsPlaying(true);
  };

  const handleDownloadContract = async () => {
    setIsGeneratingContract(true);
    try {
      const response = await fetch(
        `/api/beats/contract?licenseId=${license.purchaseId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate contract");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${license.beatTitle.replace(/[^a-zA-Z0-9]/g, "_")}_License_Agreement.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Contract downloaded!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download contract");
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handleDownloadFiles = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/beats/download?licenseId=${license.purchaseId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get download links");
      }

      const data = await response.json();

      // Show available files in a toast or modal
      if (data.files) {
        const availableFiles = data.files.filter((f: any) => f.available && f.url);
        if (availableFiles.length === 0) {
          toast.error("No files available for download");
          return;
        }

        // Download each available file
        for (const file of availableFiles) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = `${license.beatTitle}_${file.type.toUpperCase()}`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        toast.success(`Downloaded ${availableFiles.length} file(s)`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download files");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Beat Artwork */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
            {license.beat?.imageUrl ? (
              <img
                src={license.beat.imageUrl}
                alt={license.beatTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Music className="h-8 w-8 text-orange-500/50" />
              </div>
            )}
            {license.beat?.audioUrl && (
              <button
                onClick={handlePlayPreview}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white" />
                )}
              </button>
            )}
          </div>

          {/* License Details */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold line-clamp-1">{license.beatTitle}</h4>
                <p className="text-sm text-muted-foreground">
                  by {license.producerName}
                </p>
              </div>
              <Badge className={TIER_COLORS[license.tierType]}>
                <TierIcon className="mr-1 h-3 w-3" />
                {license.tierName}
              </Badge>
            </div>

            {/* Beat Info */}
            <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {license.beat?.bpm && (
                <span className="rounded bg-muted px-2 py-0.5">{license.beat.bpm} BPM</span>
              )}
              {license.beat?.key && (
                <span className="rounded bg-muted px-2 py-0.5">{license.beat.key}</span>
              )}
              {license.beat?.genre && (
                <span className="rounded bg-muted px-2 py-0.5">{license.beat.genre}</span>
              )}
            </div>

            {/* Included Files */}
            <div className="mb-3 flex flex-wrap gap-1">
              {license.deliveredFiles.map((file) => (
                <Badge key={file} variant="secondary" className="text-xs">
                  {file.toUpperCase()}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleDownloadFiles}
                disabled={isDownloading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Files
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadContract}
                disabled={isGeneratingContract}
              >
                {isGeneratingContract ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Contract
              </Button>
            </div>

            {/* Purchase Date */}
            <p className="mt-2 text-xs text-muted-foreground">
              Purchased {new Date(license.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
