"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  FileText,
  Link2,
  Unlink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TikTok icon (not in lucide)
const TikTokIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5 text-pink-500" />,
  twitter: <Twitter className="h-5 w-5 text-sky-500" />,
  facebook: <Facebook className="h-5 w-5 text-blue-600" />,
  tiktok: <TikTokIcon />,
  youtube: <Youtube className="h-5 w-5 text-red-500" />,
  linkedin: <Linkedin className="h-5 w-5 text-blue-700" />,
};

interface AccountProfileCardProps {
  profile: {
    _id: Id<"socialAccountProfiles">;
    name: string;
    description: string;
    platform: string;
    topics: string[];
    targetAudience?: string;
    socialAccountId?: Id<"socialAccounts">;
    totalScheduledScripts?: number;
    totalPublishedScripts?: number;
    linkedAccount?: {
      platformUsername?: string;
      profileImageUrl?: string;
    } | null;
  };
  onEdit: (profile: any) => void;
  onViewCalendar: (profileId: Id<"socialAccountProfiles">) => void;
  onViewScripts: (profileId: Id<"socialAccountProfiles">) => void;
}

export function AccountProfileCard({
  profile,
  onEdit,
  onViewCalendar,
  onViewScripts,
}: AccountProfileCardProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteProfile = useMutation(api.socialAccountProfiles.deleteAccountProfile);
  const unlinkAccount = useMutation(api.socialAccountProfiles.unlinkSocialAccount);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProfile({ profileId: profile._id });
      toast({
        title: "Profile deleted",
        description: "The account profile has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUnlink = async () => {
    try {
      await unlinkAccount({ profileId: profile._id });
      toast({
        title: "Account unlinked",
        description: "The social account has been unlinked from this profile.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink account",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {platformIcons[profile.platform]}
              <div>
                <h3 className="font-semibold">{profile.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {profile.platform}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(profile)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewCalendar(profile._id)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  View Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewScripts(profile._id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Scripts
                </DropdownMenuItem>
                {profile.socialAccountId && (
                  <DropdownMenuItem onClick={handleUnlink}>
                    <Unlink className="mr-2 h-4 w-4" />
                    Unlink Account
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {profile.description}
          </p>

          {profile.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.topics.slice(0, 5).map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {profile.topics.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.topics.length - 5}
                </Badge>
              )}
            </div>
          )}

          {profile.targetAudience && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Audience:</span> {profile.targetAudience}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {profile.totalScheduledScripts || 0}
                </span>{" "}
                scheduled
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {profile.totalPublishedScripts || 0}
                </span>{" "}
                published
              </span>
            </div>
            {profile.linkedAccount && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Link2 className="h-3 w-3" />
                Linked
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{profile.name}&quot;? This action cannot be undone.
              Any scheduled scripts will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
