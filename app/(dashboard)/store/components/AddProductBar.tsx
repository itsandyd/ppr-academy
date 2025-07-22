"use client";

import { Button } from "@/components/ui/button";
import { Plus, Store } from "lucide-react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AddProductBarProps {
  storeId?: string;
  userId?: string;
}

export function AddProductBar({ storeId, userId }: AddProductBarProps) {
  const { toast } = useToast();
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const createStore = useMutation(api.stores.createStore);

  const handleCreateStore = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please sign in to create a store",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingStore(true);
    try {
      await createStore({
        name: "My Store",
        userId: userId,
      });
      
      toast({
        title: "Store created",
        description: "Your store has been created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingStore(false);
    }
  };

  // If no store exists, show create store button
  if (!storeId) {
    return (
      <Button 
        onClick={handleCreateStore}
        disabled={isCreatingStore}
        className="w-full h-12 rounded-lg bg-[#6356FF] hover:bg-[#5248E6] flex items-center justify-center gap-2 text-white font-medium"
      >
        <Store className="w-5 h-5" />
        {isCreatingStore ? "Creating Store..." : "Create Your Store"}
      </Button>
    );
  }

  // If store exists, show add product button
  return (
    <Button 
      asChild
      className="w-full h-12 rounded-lg bg-[#6356FF] hover:bg-[#5248E6] flex items-center justify-center gap-2 text-white font-medium"
    >
      <Link href={`/store/${storeId}/products`}>
        <Plus className="w-5 h-5" />
        Add Product
      </Link>
    </Button>
  );
} 