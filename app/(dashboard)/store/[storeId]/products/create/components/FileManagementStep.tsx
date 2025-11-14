"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Upload, X, File, Download, Plus } from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface FileManagementStepProps {
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  onContinue: () => void;
  onBack: () => void;
  productCategory: string;
}

export function FileManagementStep({
  files,
  onFilesChange,
  onContinue,
  onBack,
  productCategory,
}: FileManagementStepProps) {
  const [isUploading, setIsUploading] = useState(false);

  const getFileTypeLabel = () => {
    switch (productCategory) {
      case "sample-pack":
        return "Audio Samples (WAV, MP3, AIFF)";
      case "midi-pack":
        return "MIDI Files (.mid)";
      case "preset-pack":
        return "Preset Files (Serum, Vital, etc.)";
      case "ableton-rack":
        return "Ableton Rack Files (.adg, .alp)";
      case "project-files":
        return "Project Files (any DAW)";
      case "mixing-template":
        return "Mixing Templates & Chains";
      default:
        return "Files";
    }
  };

  const handleAddFile = () => {
    // Placeholder for file upload
    const newFile: FileItem = {
      id: Date.now().toString(),
      name: "New File.wav",
      url: "https://example.com/file.wav",
      size: 1024000,
      type: "audio/wav"
    };
    onFilesChange([...files, newFile]);
    toast.success("File added (upload integration coming soon)");
  };

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">File Management</h2>
        <p className="text-muted-foreground mt-1">
          Upload and manage {getFileTypeLabel().toLowerCase()}
        </p>
      </div>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File List */}
          {files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                No files uploaded yet
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {getFileTypeLabel()}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleAddFile}
            variant="outline"
            className="w-full"
            disabled={isUploading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Files
          </Button>

          <p className="text-xs text-muted-foreground">
            💡 Tip: You can add files now or later from the product editor
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onContinue}>
            Skip & Continue →
          </Button>
          <Button onClick={onContinue}>
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

