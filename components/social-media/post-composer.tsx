"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  ImageIcon,
  VideoIcon,
  X,
  Clock,
  Upload,
  AlertCircle,
  Crop,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ImageCropEditor } from "./image-crop-editor";

interface PostComposerProps {
  storeId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editPost?: {
    _id: Id<"scheduledPosts">;
    socialAccountId: Id<"socialAccounts">;
    content: string;
    postType: "post" | "reel" | "story" | "tweet" | "thread";
    scheduledFor: number;
    timezone: string;
    mediaStorageIds?: Id<"_storage">[];
  };
}

interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
  storageId?: Id<"_storage">;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string;
}

export function PostComposer({
  storeId,
  userId,
  open,
  onOpenChange,
  onSuccess,
  editPost,
}: PostComposerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get connected social accounts
  const accounts = useQuery(api.socialMedia.getSocialAccounts, { storeId });
  
  // Get media URLs for editing
  const existingMediaUrls = useQuery(
    api.socialMedia.getMediaUrls,
    editPost?.mediaStorageIds && editPost.mediaStorageIds.length > 0
      ? { storageIds: editPost.mediaStorageIds }
      : "skip"
  );

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState<Id<"socialAccounts"> | null>(editPost?.socialAccountId || null);
  const [postType, setPostType] = useState<"post" | "reel" | "story">(editPost?.postType as any || "post");
  const [content, setContent] = useState(editPost?.content || "");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [postTiming, setPostTiming] = useState<"now" | "later">("later");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    editPost?.scheduledFor ? new Date(editPost.scheduledFor) : undefined
  );
  const [scheduledTime, setScheduledTime] = useState(() => {
    if (editPost?.scheduledFor) {
      const date = new Date(editPost.scheduledFor);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return "12:00";
  });
  const [timezone, setTimezone] = useState(editPost?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [showCropEditor, setShowCropEditor] = useState(false);

  // Mutations
  const createPost = useMutation(api.socialMedia.createScheduledPost);
  const updatePost = useMutation(api.socialMedia.updateScheduledPost);
  const generateUploadUrl = useMutation(api.socialMedia.generateMediaUploadUrl);

  // Load existing media when editing
  useEffect(() => {
    if (existingMediaUrls && existingMediaUrls.length > 0) {
      console.log('📂 Loading existing media for edit:', existingMediaUrls);
      
      const existingFiles: MediaFile[] = existingMediaUrls
        .filter(item => item.url !== null)
        .map(item => ({
          file: new File([], `existing-${item.storageId}`), // Placeholder file
          preview: item.url!, // Storage URL for preview
          type: "image", // Default to image (we could enhance this)
          storageId: item.storageId,
          uploading: false,
          uploadProgress: 100,
        }));
      
      if (existingFiles.length > 0) {
        console.log('📂 Loaded', existingFiles.length, 'existing media files');
        setMediaFiles(existingFiles);
      }
    }
  }, [existingMediaUrls]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open && !editPost) {
      // Only reset if not editing
      setSelectedAccountId(null);
      setPostType("post");
      setContent("");
      setMediaFiles([]);
      setScheduledDate(undefined);
      setScheduledTime("12:00");
    }
  }, [open, editPost]);

  // Debug
  useEffect(() => {
    console.log('🎬 PostComposer mounted, dialog open:', open);
  }, []);

  useEffect(() => {
    console.log('📅 scheduledDate changed:', scheduledDate);
  }, [scheduledDate]);

  // Get selected account details
  const selectedAccount = accounts?.find(a => a._id === selectedAccountId);
  const platform = selectedAccount?.platform;

  // Platform-specific limits
  const CHARACTER_LIMITS: Record<string, number> = {
    instagram: 2200,
    facebook: 63206,
    twitter: 280,
    linkedin: 3000,
  };

  const characterLimit = platform ? CHARACTER_LIMITS[platform] : 2200;
  const remainingChars = characterLimit - content.length;

  // Handle media file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid file type",
          description: "Please upload images (JPEG, PNG) or videos (MP4, MOV)",
          variant: "destructive",
        });
        continue;
      }

      // Validate file size
      const maxSize = isImage ? 8 * 1024 * 1024 : 100 * 1024 * 1024; // 8MB for images, 100MB for videos
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${isImage ? "Images" : "Videos"} must be under ${isImage ? "8MB" : "100MB"}`,
          variant: "destructive",
        });
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);

      // Check dimensions for Instagram
      if (isImage && platform === "instagram") {
        const img = new Image();
        img.src = preview;
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        
        const aspectRatio = img.width / img.height;
        const recommendedRatios: Record<string, { min: number; max: number; ideal: string }> = {
          story: { min: 0.5, max: 0.6, ideal: "9:16 (1080x1920)" },
          reel: { min: 0.5, max: 0.6, ideal: "9:16 (1080x1920)" },
          post: { min: 0.8, max: 1.91, ideal: "1:1 (square) or 4:5" },
        };
        
        const rec = recommendedRatios[postType];
        if (rec && (aspectRatio < rec.min || aspectRatio > rec.max)) {
          toast({
            title: "Dimension warning",
            description: `For ${postType}s, we recommend ${rec.ideal}. Your image is ${img.width}x${img.height}. It may be cropped.`,
            variant: "default",
          });
        }
      }

      const mediaFile: MediaFile = {
        file,
        preview,
        type: isImage ? "image" : "video",
        uploading: false,
      };

      setMediaFiles(prev => [...prev, mediaFile]);
    }

    // Reset input
    if (e.target) {
      e.target.value = "";
    }
  };

  // Remove media file
  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Handle crop complete
  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    if (cropImageIndex === null) return;

    setMediaFiles(prev => {
      const newFiles = [...prev];
      const oldPreview = newFiles[cropImageIndex].preview;
      
      // Revoke old preview URL
      URL.revokeObjectURL(oldPreview);
      
      // Update with cropped version
      newFiles[cropImageIndex] = {
        ...newFiles[cropImageIndex],
        file: new File([croppedBlob], newFiles[cropImageIndex].file.name, {
          type: "image/jpeg",
        }),
        preview: croppedUrl,
      };
      
      return newFiles;
    });

    setCropImageIndex(null);
  };

  // Upload media files to Convex storage
  const uploadMediaFiles = async (): Promise<Id<"_storage">[]> => {
    const storageIds: Id<"_storage">[] = [];
    console.log('🔼 Starting media upload for', mediaFiles.length, 'files');

    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];
      
      // Skip if already uploaded (existing media)
      if (mediaFile.storageId) {
        console.log(`🔼 File ${i + 1}/${mediaFiles.length} already uploaded, using existing storageId:`, mediaFile.storageId);
        storageIds.push(mediaFile.storageId);
        continue;
      }
      
      console.log(`🔼 Uploading file ${i + 1}/${mediaFiles.length}:`, mediaFile.file.name);

      try {
        // Update uploading state
        setMediaFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], uploading: true, uploadProgress: 0 };
          return newFiles;
        });

        // Get upload URL
        console.log('  - Requesting upload URL...');
        const uploadUrl = await generateUploadUrl();
        console.log('  - Upload URL received:', uploadUrl);

        // Upload file
        console.log('  - Uploading to Convex storage...');
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mediaFile.file.type },
          body: mediaFile.file,
        });

        console.log('  - Upload response status:', result.status);

        if (!result.ok) {
          const errorText = await result.text();
          console.error('  - Upload failed:', errorText);
          throw new Error(`Failed to upload file: ${errorText}`);
        }

        const responseData = await result.json();
        console.log('  - Upload response:', responseData);
        
        const { storageId } = responseData;
        if (!storageId) {
          throw new Error("No storageId in response");
        }
        
        console.log('  - ✅ File uploaded, storageId:', storageId);
        storageIds.push(storageId);

        // Update success state
        setMediaFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = {
            ...newFiles[i],
            uploading: false,
            uploadProgress: 100,
            storageId,
          };
          return newFiles;
        });
      } catch (error: any) {
        console.error(`  - ❌ Upload failed for file ${i + 1}:`, error);
        // Update error state
        setMediaFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = {
            ...newFiles[i],
            uploading: false,
            error: error.message,
          };
          return newFiles;
        });
        throw error;
      }
    }

    console.log('🔼 All uploads complete. Storage IDs:', storageIds);
    return storageIds;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!selectedAccountId) {
      toast({
        title: "No account selected",
        description: "Please select a social media account",
        variant: "destructive",
      });
      return;
    }

    // Validation: Stories don't require captions, but posts/reels need content or media
    if (postType !== "story") {
      if (!content.trim() && mediaFiles.length === 0) {
        toast({
          title: "Empty post",
          description: "Please add some content or media",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Stories require media (at minimum)
      if (mediaFiles.length === 0) {
        toast({
          title: "Story requires media",
          description: "Please add an image or video for your story",
          variant: "destructive",
        });
        return;
      }
    }

    // Determine scheduled time based on post timing option
    let scheduledDateTime: Date;

    if (postTiming === "now") {
      // Post immediately (10 seconds from now so cron picks it up)
      scheduledDateTime = new Date(Date.now() + 10 * 1000);
    } else {
      // Schedule for later
      if (!scheduledDate || !scheduledTime) {
        toast({
          title: "No schedule time",
          description: "Please select when to publish this post",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Validate schedule time (must be at least 5 minutes in future)
      const minScheduleTime = Date.now() + 5 * 60 * 1000;
      if (scheduledDateTime.getTime() < minScheduleTime) {
        toast({
          title: "Invalid schedule time",
          description: "Posts must be scheduled at least 5 minutes in advance",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload media files first
      const mediaStorageIds = mediaFiles.length > 0
        ? await uploadMediaFiles()
        : editPost?.mediaStorageIds;

      if (editPost) {
        // Update existing post
        await updatePost({
          postId: editPost._id,
          userId,
          content: content.trim(),
          mediaStorageIds,
          scheduledFor: scheduledDateTime.getTime(),
          timezone,
          postType,
        });

        toast({
          title: "Post updated!",
          description: postTiming === "now"
            ? "Your post will be published within the next minute"
            : `Your post will be published on ${format(scheduledDateTime, "PPP 'at' p")}`,
        });
      } else {
        // Create new scheduled post
        await createPost({
          storeId,
          userId,
          socialAccountId: selectedAccountId,
          content: content.trim(),
          mediaStorageIds,
          scheduledFor: scheduledDateTime.getTime(),
          timezone,
          postType,
        });

        toast({
          title: postTiming === "now" ? "Publishing post..." : "Post scheduled!",
          description: postTiming === "now"
            ? "Your post will be published within the next minute"
            : `Your post will be published on ${format(scheduledDateTime, "PPP 'at' p")}`,
        });
      }

      // Reset form
      setContent("");
      setMediaFiles([]);
      setScheduledDate(undefined);
      setScheduledTime("12:00");
      setPostType("post");
      
      // Close dialog
      onOpenChange(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create post:", error);
      toast({
        title: "Failed to schedule post",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost ? "Edit Scheduled Post" : "Schedule New Post"}</DialogTitle>
            <DialogDescription>
              {editPost ? "Update your scheduled post" : "Create and schedule a post for your social media accounts"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Account Selection */}
            <div className="space-y-2">
              <Label>Select Account</Label>
              <Select
                value={selectedAccountId || undefined}
                onValueChange={(value) => setSelectedAccountId(value as Id<"socialAccounts">)}
                disabled={!!editPost} // Can't change account when editing
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter(a => a.isConnected).map(account => (
                    <SelectItem key={account._id} value={account._id}>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{account.platform}</span>
                        <span className="text-muted-foreground">
                          @{account.platformUsername}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editPost && (
                <p className="text-xs text-muted-foreground">
                  Account cannot be changed when editing
                </p>
              )}
            </div>

            {/* Post Type (Instagram only) */}
            {platform === "instagram" && (
              <div className="space-y-2">
                <Label>Post Type</Label>
                <div className="flex gap-2">
                  {(["post", "reel", "story"] as const).map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={postType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPostType(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Content - Hide for Instagram stories */}
            {postType !== "story" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Caption</Label>
                  <span className={cn(
                    "text-sm",
                    remainingChars < 0
                      ? "text-red-500"
                      : remainingChars < 100
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  )}>
                    {content.length} / {characterLimit}
                  </span>
                </div>
                <Textarea
                  placeholder="Write your caption here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            )}

            {/* Media Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Media</Label>
                {platform === "instagram" && (
                  <span className="text-xs text-muted-foreground">
                    {postType === "story" && "9:16 (1080x1920)"}
                    {postType === "reel" && "9:16 (1080x1920)"}
                    {postType === "post" && "1:1 or 4:5"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative w-32 max-h-48 rounded-lg overflow-hidden border">
                    {media.type === "image" ? (
                      <img
                        src={media.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <video
                        src={media.preview}
                        className="w-full h-auto object-contain"
                      />
                    )}
                    
                    {media.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-xs">Uploading...</div>
                      </div>
                    )}
                    
                    {media.error && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute top-1 right-1 flex gap-1">
                      {media.type === "image" && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6 bg-blue-500 hover:bg-blue-600"
                          onClick={() => {
                            setCropImageIndex(index);
                            setShowCropEditor(true);
                          }}
                          title="Crop image"
                        >
                          <Crop className="h-3 w-3 text-white" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveMedia(index)}
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="absolute bottom-1 left-1">
                      {media.type === "image" ? (
                        <ImageIcon className="h-4 w-4 text-white drop-shadow" />
                      ) : (
                        <VideoIcon className="h-4 w-4 text-white drop-shadow" />
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add media button */}
                {mediaFiles.length < 10 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add Media</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Images: JPEG, PNG (max 8MB) • Videos: MP4, MOV (max 100MB)</p>
                {platform === "instagram" && (
                  <p className="text-blue-600 dark:text-blue-400">
                    {postType === "story" && "📐 Stories: 9:16 ratio recommended (e.g., 1080x1920)"}
                    {postType === "reel" && "📐 Reels: 9:16 ratio recommended (e.g., 1080x1920), 3-90 sec"}
                    {postType === "post" && "📐 Posts: 1:1 (square) or 4:5 (portrait) recommended"}
                  </p>
                )}
                {platform === "facebook" && (
                  <p className="text-blue-600 dark:text-blue-400">
                    📐 Recommended: 1200x630 for optimal display
                  </p>
                )}
              </div>
            </div>

            {/* Post Timing Options */}
            <div>
              <Label>When to Post</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={postTiming === "now" ? "default" : "outline"}
                  onClick={() => setPostTiming("now")}
                  className="flex-1"
                >
                  Post Now
                </Button>
                <Button
                  type="button"
                  variant={postTiming === "later" ? "default" : "outline"}
                  onClick={() => setPostTiming("later")}
                  className="flex-1"
                >
                  Schedule for Later
                </Button>
              </div>
            </div>

            {/* Show date/time picker only when scheduling for later */}
            {postTiming === "later" && (
              <>
                <div>
                  <Label>Select Date</Label>
                  <div className="mt-2 flex justify-center border rounded-lg p-4 bg-white dark:bg-black">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={(date) => {
                        console.log('✅ Date selected:', date);
                        setScheduledDate(date);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="!bg-transparent"
                    />
                  </div>
                  {scheduledDate && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Selected: {format(scheduledDate, "PPPP")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Phoenix">Arizona (AZ)</SelectItem>
                        <SelectItem value="America/Anchorage">Alaska (AK)</SelectItem>
                        <SelectItem value="Pacific/Honolulu">Hawaii (HI)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedAccountId || remainingChars < 0}
            >
              {isSubmitting 
                ? (postTiming === "now" ? "Publishing..." : (editPost ? "Updating..." : "Scheduling..."))
                : (postTiming === "now" ? "Post Now" : (editPost ? "Update Post" : "Schedule Post"))
              }
            </Button>
          </DialogFooter>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,video/mp4,video/quicktime"
            multiple
            onChange={handleFileSelect}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            style={{ pointerEvents: 'none', display: 'none' }}
          />
        </DialogContent>
      </Dialog>

      {/* Image Crop Editor */}
      {cropImageIndex !== null && cropImageIndex >= 0 && cropImageIndex < mediaFiles.length && (
        <ImageCropEditor
          image={mediaFiles[cropImageIndex]?.preview || ""}
          open={showCropEditor}
          onOpenChange={(open) => {
            setShowCropEditor(open);
            if (!open) setCropImageIndex(null);
          }}
          onCropComplete={handleCropComplete}
          postType={postType}
          suggestedAspectRatio={
            postType === "story" || postType === "reel" ? 9 / 16 : postType === "post" ? 1 : undefined
          }
        />
      )}
    </>
  );
}
