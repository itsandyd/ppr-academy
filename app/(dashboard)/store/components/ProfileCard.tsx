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
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Prioritize saved name over Clerk's firstName + lastName
  const displayName = convexUser?.name || 
    (user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || "User");
    
  const username = user.username || user.firstName?.toLowerCase() || "user";
  
  const initials = displayName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Use saved avatar or fallback to Clerk image
  const avatarUrl = convexUser?.imageUrl || user.imageUrl || "";

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
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
          userId: user.id
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
          userId: user.id
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
        description: `Failed to save store: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    <Card className="rounded-xl shadow-sm bg-card p-6 flex items-center gap-6">
      <Avatar className="w-16 h-16">
        <AvatarImage src={avatarUrl} alt={`${displayName}'s profile`} />
        <AvatarFallback className="text-lg font-semibold bg-muted">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          <Button variant="ghost" size="sm" className="p-1 h-auto w-auto" asChild>
            <Link href="/store/profile">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
        {convexUser?.bio ? (
          <p className="text-sm text-muted-foreground font-normal">{convexUser.bio}</p>
        ) : (
          <p className="text-sm text-muted-foreground font-normal">@{store?.slug?.toLowerCase().replace(/\s+/g, '') || username}</p>
        )}
        
        {/* Store Section */}
        <div className="flex flex-col gap-1 mt-1">
          {isEditingStore ? (
            <div className="space-y-2">
                             {/* Store Name */}
               <div className="flex items-center gap-2">
                 <span className="text-xs text-muted-foreground w-12">Name:</span>
                 <Input
                   value={storeName}
                   onChange={(e) => setStoreName(e.target.value)}
                   className="h-6 text-xs flex-1 min-w-0"
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
                 <span className="text-xs text-muted-foreground w-12">Slug:</span>
                 <Input
                   value={storeSlug}
                   onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                   className="h-6 text-xs flex-1 min-w-0 font-mono"
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
                  className="p-1 h-6 px-2"
                  onClick={handleSaveStore}
                  disabled={isLoading}
                >
                  <Check className="w-3 h-3 text-primary mr-1" />
                  <span className="text-xs">Save</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 px-2"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  <X className="w-3 h-3 text-destructive mr-1" />
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
                   <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs text-muted-foreground">Slug:</span>
                     <span className="text-xs text-muted-foreground font-mono">
                       {store.slug}
                     </span>
                   </div>
                 )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto w-auto"
                onClick={handleStartEdit}
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 