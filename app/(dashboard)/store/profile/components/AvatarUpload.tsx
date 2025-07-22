"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PenLine, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing-hooks";
import { useToast } from "@/hooks/use-toast";

export function AvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  
  // Get user data from Convex
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Mutation to update user image
  const updateUser = useMutation(api.users.updateUserByClerkId);

  // UploadThing hook
  const { startUpload } = useUploadThing("avatarUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url && clerkUser?.id) {
        // Save the uploaded image URL to user profile
        updateUser({
          clerkId: clerkUser.id,
          imageUrl: res[0].url,
        }).then(() => {
          toast({
            title: "Success",
            description: "Profile picture updated successfully!",
          });
        }).catch((error) => {
          console.error("Error updating profile:", error);
          toast({
            title: "Error", 
            description: "Failed to update profile picture",
            variant: "destructive",
          });
        });
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  // Get display name and generate initials
  const displayName = convexUser?.name || 
    (clerkUser?.firstName && clerkUser?.lastName 
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser?.firstName || clerkUser?.lastName || "User");
  
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await startUpload([file]);
      } catch (error) {
        console.error("Upload failed:", error);
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="flex justify-center">
      <div className="relative">
        <Avatar className="w-32 h-32 cursor-pointer">
          <AvatarImage src={convexUser?.imageUrl || clerkUser?.imageUrl || ""} alt={`${displayName}'s profile`} />
          <AvatarFallback className="text-2xl font-semibold bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Edit Badge */}
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#6356FF] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#5248E6] transition-colors">
          {isUploading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <PenLine className="w-4 h-4 text-white" />
          )}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
} 