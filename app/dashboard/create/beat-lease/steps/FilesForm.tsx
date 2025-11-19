"use client";

import { useBeatLeaseCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Music, CheckCircle, X, Play } from "lucide-react";
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex-api";
import { toast } from "sonner";

export function FilesForm() {
  const { state, updateData, saveBeat } = useBeatLeaseCreation();
  const router = useRouter();
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  
  // File input refs
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const wavInputRef = useRef<HTMLInputElement>(null);
  const stemsInputRef = useRef<HTMLInputElement>(null);
  const trackoutsInputRef = useRef<HTMLInputElement>(null);

  // @ts-ignore
  const generateUploadUrl: any = useMutation(api.files.generateUploadUrl as any);

  const handleNext = async () => {
    await saveBeat();
    router.push(`/dashboard/create/beat-lease?step=licensing${state.beatId ? `&beatId=${state.beatId}` : ''}`);
  };

  const handleBack = () => {
    router.push(`/dashboard/create/beat-lease?step=metadata${state.beatId ? `&beatId=${state.beatId}` : ''}`);
  };

  const uploadFile = async (file: File, fileType: 'mp3' | 'wav' | 'stems' | 'trackouts') => {
    if (!file) return;

    setUploadingFile(fileType);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Failed to upload ${fileType}`);
      }

      const { storageId } = await result.json();

      // Update state with new file
      updateData("files", {
        files: {
          ...state.data.files,
          [`${fileType}Url`]: storageId,
        }
      });

      toast.success(`${fileType.toUpperCase()} uploaded successfully!`);
    } catch (error) {
      console.error(`Upload error for ${fileType}:`, error);
      toast.error(`Failed to upload ${fileType}. Please try again.`);
    } finally {
      setUploadingFile(null);
    }
  };

  const handleFileSelect = (fileType: 'mp3' | 'wav' | 'stems' | 'trackouts') => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file, fileType);
      }
    };
  };

  const removeFile = (fileType: 'mp3' | 'wav' | 'stems' | 'trackouts') => {
    updateData("files", {
      files: {
        ...state.data.files,
        [`${fileType}Url`]: undefined,
      }
    });
  };

  const canProceed = !!(state.data.files?.mp3Url || state.data.files?.wavUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Audio Files</h2>
        <p className="text-muted-foreground mt-1">
          Upload different file types for different lease options
        </p>
      </div>

      {/* File Upload Cards */}
      <div className="space-y-4">
        {/* MP3 Upload */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-blue-600" />
                  MP3 File (Required)
                </CardTitle>
                <CardDescription>Tagged preview for free/basic licenses</CardDescription>
              </div>
              <Badge variant="secondary">Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={mp3InputRef}
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={handleFileSelect('mp3')}
              className="hidden"
            />
            {state.data.files?.mp3Url ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">MP3 uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('mp3')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => mp3InputRef.current?.click()}
                disabled={uploadingFile === 'mp3'}
                className="w-full h-20"
              >
                {uploadingFile === 'mp3' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Uploading MP3...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload MP3 (with producer tag)
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* WAV Upload */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  WAV File (Recommended)
                </CardTitle>
                <CardDescription>High quality untagged version</CardDescription>
              </div>
              <Badge variant="outline">Recommended</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={wavInputRef}
              type="file"
              accept=".wav,audio/wav"
              onChange={handleFileSelect('wav')}
              className="hidden"
            />
            {state.data.files?.wavUrl ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">WAV uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('wav')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => wavInputRef.current?.click()}
                disabled={uploadingFile === 'wav'}
                className="w-full h-20"
              >
                {uploadingFile === 'wav' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Uploading WAV...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload WAV (24-bit, untagged)
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stems Upload */}
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-orange-600" />
                  Stems (Optional)
                </CardTitle>
                <CardDescription>Individual instrument tracks (ZIP file)</CardDescription>
              </div>
              <Badge variant="outline">Premium+</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={stemsInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={handleFileSelect('stems')}
              className="hidden"
            />
            {state.data.files?.stemsUrl ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Stems uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('stems')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => stemsInputRef.current?.click()}
                disabled={uploadingFile === 'stems'}
                className="w-full h-20"
              >
                {uploadingFile === 'stems' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Uploading Stems...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Stems ZIP
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Trackouts Upload */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-red-600" />
                  Trackouts (Optional)
                </CardTitle>
                <CardDescription>Full project files (DAW project + samples)</CardDescription>
              </div>
              <Badge variant="outline">Exclusive Only</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <input
              ref={trackoutsInputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={handleFileSelect('trackouts')}
              className="hidden"
            />
            {state.data.files?.trackoutsUrl ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Trackouts uploaded</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('trackouts')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => trackoutsInputRef.current?.click()}
                disabled={uploadingFile === 'trackouts'}
                className="w-full h-20"
              >
                {uploadingFile === 'trackouts' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Uploading Trackouts...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Trackouts ZIP
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Requirements Info */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">File Guidelines</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>MP3:</strong> 320kbps, include producer tag for preview</li>
            <li>• <strong>WAV:</strong> 24-bit/44.1kHz, no producer tag (clean version)</li>
            <li>• <strong>Stems:</strong> Individual instrument tracks in ZIP file</li>
            <li>• <strong>Trackouts:</strong> Full project file + samples in ZIP</li>
          </ul>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed}>
          Continue to Licensing →
        </Button>
      </div>
    </div>
  );
}
