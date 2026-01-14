"use client";

import { useState, useCallback } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface MuxUploaderProps {
  onUploadComplete: (data: { uploadId: string; assetId: string }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

type UploadStatus = "idle" | "preparing" | "uploading" | "processing" | "complete" | "error";

export function MuxUploader({
  onUploadComplete,
  onUploadError,
  className,
  accept = "video/*",
  maxSizeMB = 5000, // 5GB default max
}: MuxUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        const errorMsg = `File too large. Maximum size is ${maxSizeMB}MB`;
        setError(errorMsg);
        setStatus("error");
        onUploadError?.(errorMsg);
        return;
      }

      setFileName(file.name);
      setError(null);
      setStatus("preparing");
      setProgress(0);

      try {
        // Step 1: Get upload URL from our API
        const uploadResponse = await fetch("/api/mux/upload", {
          method: "POST",
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadId, uploadUrl } = await uploadResponse.json();

        // Step 2: Upload directly to Mux
        setStatus("uploading");

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setStatus("processing");
            setProgress(100);

            // Step 3: Poll for asset ID
            let assetId: string | null = null;
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds max

            while (!assetId && attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              attempts++;

              const statusResponse = await fetch(
                `/api/mux/upload?uploadId=${uploadId}`
              );
              const statusData = await statusResponse.json();

              if (statusData.assetId) {
                assetId = statusData.assetId;
              } else if (statusData.status === "errored") {
                throw new Error("Video processing failed");
              }
            }

            if (!assetId) {
              throw new Error("Timeout waiting for asset");
            }

            setStatus("complete");
            onUploadComplete({ uploadId, assetId });
          } else {
            throw new Error("Upload failed");
          }
        });

        xhr.addEventListener("error", () => {
          throw new Error("Upload failed");
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setError(errorMsg);
        setStatus("error");
        onUploadError?.(errorMsg);
      }
    },
    [maxSizeMB, onUploadComplete, onUploadError]
  );

  const reset = () => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setFileName(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {status === "idle" && (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground">
              MP4, MOV, WebM (max {maxSizeMB / 1000}GB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileSelect}
          />
        </label>
      )}

      {(status === "preparing" ||
        status === "uploading" ||
        status === "processing") && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-border rounded-lg bg-muted/30">
          <Loader2 className="w-10 h-10 mb-3 text-emerald-500 animate-spin" />
          <p className="mb-2 text-sm font-medium">
            {status === "preparing" && "Preparing upload..."}
            {status === "uploading" && `Uploading ${fileName}...`}
            {status === "processing" && "Processing video..."}
          </p>
          {status === "uploading" && (
            <div className="w-2/3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center mt-1">
                {progress}%
              </p>
            </div>
          )}
          {status === "processing" && (
            <p className="text-xs text-muted-foreground">
              This may take a few minutes...
            </p>
          )}
        </div>
      )}

      {status === "complete" && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-emerald-500 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
          <CheckCircle className="w-10 h-10 mb-3 text-emerald-500" />
          <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Upload complete!
          </p>
          <p className="text-xs text-muted-foreground mb-3">{fileName}</p>
          <Button variant="outline" size="sm" onClick={reset}>
            Upload another
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
          <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
            Upload failed
          </p>
          <p className="text-xs text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

// Simple video upload button variant
interface MuxUploadButtonProps {
  onUploadComplete: (data: { uploadId: string; assetId: string }) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MuxUploadButton({
  onUploadComplete,
  onUploadError,
  className,
  disabled,
}: MuxUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);

      try {
        const uploadResponse = await fetch("/api/mux/upload", {
          method: "POST",
        });
        const { uploadId, uploadUrl } = await uploadResponse.json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Poll for asset ID
        let assetId: string | null = null;
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const status = await fetch(`/api/mux/upload?uploadId=${uploadId}`);
          const data = await status.json();
          if (data.assetId) {
            assetId = data.assetId;
            break;
          }
        }

        if (assetId) {
          onUploadComplete({ uploadId, assetId });
        } else {
          throw new Error("Timeout");
        }
      } catch (err) {
        onUploadError?.(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isUploading}
      className={className}
    >
      {isUploading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Video className="w-4 h-4 mr-2" />
          Upload Video
        </>
      )}
    </Button>
  );
}
