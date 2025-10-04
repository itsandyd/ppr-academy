"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Unplug,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface SocialAccount {
  _id: Id<"socialAccounts">;
  platform: string;
  platformUsername?: string;
  platformDisplayName?: string;
  profileImageUrl?: string;
  isConnected: boolean;
  isActive: boolean;
  lastVerified?: number;
  grantedScopes: string[];
  accountLabel?: string;
  connectionError?: string;
}

interface AccountManagementDialogProps {
  account: SocialAccount | null;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReconnect: (platform: string) => void;
}

export function AccountManagementDialog({
  account,
  userId,
  open,
  onOpenChange,
  onReconnect,
}: AccountManagementDialogProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [label, setLabel] = useState(account?.accountLabel || "");
  const [isUpdatingLabel, setIsUpdatingLabel] = useState(false);

  const disconnectAccount = useMutation(api.socialMedia.disconnectSocialAccount);
  const deleteAccount = useMutation(api.socialMedia.deleteSocialAccount);
  const updateLabel = useMutation(api.socialMedia.updateAccountLabel);

  if (!account) return null;

  const handleDisconnect = async () => {
    try {
      await disconnectAccount({
        accountId: account._id,
        userId,
      });
      toast({
        title: "Account disconnected",
        description: `Your ${account.platform} account has been disconnected.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect account",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount({
        accountId: account._id,
        userId,
      });
      toast({
        title: "Account deleted",
        description: `Your ${account.platform} account has been permanently deleted.`,
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const handleUpdateLabel = async () => {
    if (!label.trim()) {
      toast({
        title: "Invalid label",
        description: "Please enter a label for your account",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingLabel(true);
      await updateLabel({
        accountId: account._id,
        userId,
        label: label.trim(),
      });
      toast({
        title: "Label updated",
        description: "Account label has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update label",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingLabel(false);
    }
  };

  const handleReconnect = () => {
    onOpenChange(false);
    onReconnect(account.platform);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="capitalize">{account.platform}</span>
              {account.isConnected ? (
                <Badge className="bg-green-500">Connected</Badge>
              ) : (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Manage your {account.platform} account settings and connection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Account Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Account Details</h4>
              <div className="space-y-2 rounded-lg border p-4">
                {account.profileImageUrl && (
                  <img
                    src={account.profileImageUrl}
                    alt={account.platformUsername}
                    className="h-12 w-12 rounded-full"
                  />
                )}
                {account.platformUsername && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Username:</span>
                    <span className="font-medium">@{account.platformUsername}</span>
                  </div>
                )}
                {account.platformDisplayName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Display Name:</span>
                    <span className="font-medium">{account.platformDisplayName}</span>
                  </div>
                )}
                {account.lastVerified && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Verified:</span>
                    <span className="text-sm">{formatDate(account.lastVerified)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Connection Status</h4>
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  {account.isConnected ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Active and connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm">Disconnected</span>
                    </>
                  )}
                </div>
                {account.connectionError && (
                  <p className="text-sm text-red-500">{account.connectionError}</p>
                )}
              </div>
            </div>

            {/* Account Label */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Account Label
              </h4>
              <div className="space-y-2">
                <Label htmlFor="label" className="text-xs text-muted-foreground">
                  Add a custom label to identify this account (e.g., "Personal", "Business")
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="label"
                    placeholder="Enter label..."
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleUpdateLabel}
                    disabled={isUpdatingLabel || label === account.accountLabel}
                    size="sm"
                  >
                    {isUpdatingLabel ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Permissions */}
            {account.grantedScopes && account.grantedScopes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Granted Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {account.grantedScopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-col gap-2">
            {/* Reconnect Button */}
            {!account.isConnected && (
              <Button onClick={handleReconnect} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect Account
              </Button>
            )}

            {/* Disconnect Button */}
            {account.isConnected && (
              <Button onClick={handleDisconnect} variant="outline" className="w-full">
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect Account
              </Button>
            )}

            {/* Delete Button */}
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your{" "}
              {account.platform} account connection and cancel all scheduled posts for
              this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Yes, delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
