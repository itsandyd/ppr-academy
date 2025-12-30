"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UserResource } from "@clerk/types";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "@/hooks/use-toast";

interface ProfileCardProps {
  user: UserResource;
  store?: {
    _id: string;
    name: string;
    slug?: string;
    userId: string;
  };
}

export function ProfileCard({ user, store }: ProfileCardProps) {
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [storeName, setStoreName] = useState(store?.name || "");
  const [storeSlug, setStoreSlug] = useState(store?.slug || "");
  const [isLoading, setIsLoading] = useState(false);

  const updateStore = useMutation(api.stores.updateStore);
  const createStore = useMutation(api.stores.createStore);

  // Get updated user data from Convex
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // Prioritize saved name over Clerk's firstName + lastName
  const displayName =
    convexUser?.name ||
    (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || "User");

  const username = user.username || user.firstName?.toLowerCase() || "user";

  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Use saved avatar or fallback to Clerk image
  const avatarUrl = convexUser?.imageUrl || user.imageUrl || "";

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  const handleSaveStore = async () => {
    if (!storeName.trim()) {
      toast({
        title: "Error",
        description: "Store name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!storeSlug.trim()) {
      toast({
        title: "Error",
        description: "Store slug cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (store?._id) {
        // Update existing store
        console.log("Updating store:", {
          id: store._id,
          name: storeName.trim(),
          slug: storeSlug.trim() || undefined,
          userId: user.id,
        });
        await updateStore({
          id: store._id as Id<"stores">,
          name: storeName.trim(),
          slug: storeSlug.trim() || undefined, // Let backend generate from name if empty
          userId: user.id, // Add userId for authorization
        });
        toast({
          title: "Success",
          description: "Store updated successfully",
        });
      } else {
        // Create new store
        console.log("Creating store:", {
          name: storeName.trim(),
          slug: storeSlug.trim() || undefined,
          userId: user.id,
        });
        await createStore({
          name: storeName.trim(),
          slug: storeSlug.trim() || undefined, // Let backend generate from name if empty
          userId: user.id,
        });
        toast({
          title: "Success",
          description: "Store created successfully",
        });
      }
      setIsEditingStore(false);
    } catch (error) {
      console.error("Error saving store:", error);
      toast({
        title: "Error",
        description: `Failed to save store: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setStoreName(store?.name || "");
    setStoreSlug(store?.slug || "");
    setIsEditingStore(false);
  };

  const handleStartEdit = () => {
    setStoreName(store?.name || "My Store");
    // If no slug exists, generate from name, otherwise use existing slug
    setStoreSlug(store?.slug || generateSlug(store?.name || "my-store"));
    setIsEditingStore(true);
  };

  return (
    <Card className="flex items-center gap-6 rounded-xl bg-card p-6 shadow-sm">
      <Avatar className="h-16 w-16">
        <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
        <AvatarFallback className="bg-muted text-lg font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          <Button variant="ghost" size="sm" className="h-auto w-auto p-1" asChild>
            <Link href="/store/profile">
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
        {convexUser?.bio ? (
          <p className="text-sm font-normal text-muted-foreground">{convexUser.bio}</p>
        ) : (
          <p className="text-sm font-normal text-muted-foreground">
            @{store?.slug?.toLowerCase().replace(/\s+/g, "") || username}
          </p>
        )}

        {/* Store Section */}
        <div className="mt-1 flex flex-col gap-1">
          {isEditingStore ? (
            <div className="space-y-2">
              {/* Store Name */}
              <div className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground">Name:</span>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="h-6 min-w-0 flex-1 text-xs"
                  placeholder="Enter store name"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveStore();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                />
              </div>

              {/* Store Slug */}
              <div className="flex items-center gap-2">
                <span className="w-12 text-xs text-muted-foreground">Slug:</span>
                <Input
                  value={storeSlug}
                  onChange={(e) =>
                    setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="h-6 min-w-0 flex-1 font-mono text-xs"
                  placeholder="store-slug"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveStore();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 p-1 px-2"
                  onClick={handleSaveStore}
                  disabled={isLoading}
                >
                  <Check className="mr-1 h-3 w-3 text-primary" />
                  <span className="text-xs">Save</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 p-1 px-2"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  <X className="mr-1 h-3 w-3 text-destructive" />
                  <span className="text-xs">Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Store:</span>
                  <span className="text-xs text-foreground">
                    {store?.name || "No store created"}
                  </span>
                </div>
                {store?.slug && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Slug:</span>
                    <span className="font-mono text-xs text-muted-foreground">{store.slug}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-1"
                onClick={handleStartEdit}
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
