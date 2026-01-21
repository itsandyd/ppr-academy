"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, Check, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { useGenerateUploadUrl, useGetFileUrl } from "@/lib/convex-typed-hooks";
import { detectMetadata, isAudioFile, AudioMetadata, DetectionProgress } from "@/lib/audio-analyzer";

export interface UploadedFileData {
  name: string;
  storageId: string;
  size: number;
  type: string;
  audioMetadata?: AudioMetadata;
}

interface FileUploaderProps {
  onFilesUploaded: (files: UploadedFileData[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  buttonText?: string;
  className?: string;
  analyzeAudio?: boolean; // Enable BPM/key detection for audio files
  onAudioMetadata?: (metadata: AudioMetadata) => void;
}

export function FileUploader({
  onFilesUploaded,
  accept = "*",
  multiple = true,
  maxSize = 100,
  buttonText = "Select Files",
  className = "",
  analyzeAudio = false,
  onAudioMetadata
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [audioAnalysisProgress, setAudioAnalysisProgress] = useState<DetectionProgress | null>(null);

  const generateUploadUrl = useGenerateUploadUrl();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed ${maxSize}MB limit: ${oversizedFiles.map(f => f.name).join(", ")}`);
      return;
    }

    setUploading(true);
    const uploadedFiles: UploadedFileData[] = [];

    try {
      for (const file of selectedFiles) {
        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Step 1: Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Step 2: Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const { storageId } = await result.json();

        // Update progress to complete
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        const uploadedFile: UploadedFileData = {
          name: file.name,
          storageId,
          size: file.size,
          type: file.type,
        };

        // Analyze audio if enabled and file is audio
        if (analyzeAudio && isAudioFile(file)) {
          try {
            setAnalyzingAudio(true);
            const metadata = await detectMetadata(file, (progress) => {
              setAudioAnalysisProgress(progress);
            });
            uploadedFile.audioMetadata = metadata;
            onAudioMetadata?.(metadata);
            toast.success(`Detected: ${metadata.bpm ? `${metadata.bpm} BPM` : "Unknown BPM"} | ${metadata.key || "Unknown key"}`);
          } catch (error) {
            console.error("Audio analysis failed:", error);
            // Continue without metadata - not a fatal error
          } finally {
            setAnalyzingAudio(false);
            setAudioAnalysisProgress(null);
          }
        }

        uploadedFiles.push(uploadedFile);
      }

      // Call callback with uploaded files
      onFilesUploaded(uploadedFiles);

      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{fileName}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          ))}
        </div>
      )}

      {/* Audio Analysis Progress */}
      {analyzingAudio && audioAnalysisProgress && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Music className="w-4 h-4 animate-pulse text-primary" />
            <span>{audioAnalysisProgress.message}</span>
          </div>
          <Progress value={audioAnalysisProgress.progress * 100} className="h-1" />
        </div>
      )}
    </div>
  );
}

export interface UploadedFile {
  id: string;
  name: string;
  storageId: string;
  size: number;
  type: string;
  url?: string;
  audioMetadata?: AudioMetadata;
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (fileId: string) => void;
}

export function FileList({ files, onRemove }: FileListProps) {
  const getFileUrl = useGetFileUrl();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (file: UploadedFile) => {
    try {
      const url = await getFileUrl({ storageId: file.storageId });
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      toast.error("Failed to get file URL");
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <Card key={file.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {file.type || "Unknown type"}
                  {file.audioMetadata && (
                    <span className="ml-2 text-primary">
                      {file.audioMetadata.bpm && `${file.audioMetadata.bpm} BPM`}
                      {file.audioMetadata.bpm && file.audioMetadata.key && " • "}
                      {file.audioMetadata.key}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(file)}
              >
                <File className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(file.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
