"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { AccountProfileCard } from "./AccountProfileCard";
import { CreateAccountProfileDialog } from "./CreateAccountProfileDialog";

interface AccountProfilesListProps {
  storeId: string;
  userId: string;
}

export function AccountProfilesList({ storeId, userId }: AccountProfilesListProps) {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editProfile, setEditProfile] = useState<any | null>(null);

  const profiles = useQuery(api.socialAccountProfiles.getAccountProfilesWithAccounts, {
    storeId,
  });

  const handleEdit = (profile: any) => {
    setEditProfile(profile);
    setShowCreateDialog(true);
  };

  const handleViewCalendar = (profileId: Id<"socialAccountProfiles">) => {
    router.push(`/dashboard/social/calendar/${profileId}`);
  };

  const handleViewScripts = (profileId: Id<"socialAccountProfiles">) => {
    router.push(`/dashboard/social/library?account=${profileId}`);
  };

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setEditProfile(null);
    }
  };

  if (profiles === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Account Profiles</h2>
            <p className="text-sm text-muted-foreground">
              Loading profiles...
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-lg border bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Account Profiles</h2>
          <p className="text-sm text-muted-foreground">
            Create profiles for your different social media pages to organize content by niche.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No account profiles yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Create profiles to organize your content for different social media pages.
            Each profile can have its own topics, target audience, and calendar.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Profile
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile: any) => (
            <AccountProfileCard
              key={profile._id}
              profile={profile}
              onEdit={handleEdit}
              onViewCalendar={handleViewCalendar}
              onViewScripts={handleViewScripts}
            />
          ))}
        </div>
      )}

      <CreateAccountProfileDialog
        open={showCreateDialog}
        onOpenChange={handleDialogClose}
        storeId={storeId}
        userId={userId}
        editProfile={editProfile}
      />
    </div>
  );
}
