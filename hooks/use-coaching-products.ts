"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

export interface CoachingProductData {
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  duration: number; // in minutes
  sessionType: "video" | "audio" | "phone";
  customFields?: Array<{
    label: string;
    type: "text" | "email" | "phone" | "textarea";
    required: boolean;
  }>;
  availability?: any;
  thumbnailStyle?: string;
}

export function useCoachingProducts(storeId?: string) {
  const { user } = useUser();

  const products = useQuery(
    api.coachingProducts.getCoachingProductsByStore,
    storeId ? { storeId } : "skip"
  );

  return {
    products: products || [],
    isLoading: products === undefined,
  };
}

export function useCreateCoachingProduct() {
  const { user } = useUser();
  const { toast } = useToast();
  const createProduct = useMutation(api.coachingProducts.createCoachingProduct);

  return {
    createProduct: async (storeId: string, data: CoachingProductData) => {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create a coaching product",
          variant: "destructive",
        });
        return null;
      }

      try {
        const result = await createProduct({
          ...data,
          storeId,
        });

        if (result.success && result.productId) {
          toast({
            title: "Success",
            description: "Coaching product created successfully",
            className: "bg-white dark:bg-black",
          });
          return result.productId;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create coaching product",
            variant: "destructive",
          });
          return null;
        }
      } catch (error: any) {
        console.error("Error creating coaching product:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create coaching product",
          variant: "destructive",
        });
        return null;
      }
    },
  };
}

export function useUpdateCoachingProduct() {
  const { toast } = useToast();
  const updateProduct = useMutation(api.coachingProducts.updateCoachingProduct);

  return {
    updateProduct: async (
      productId: Id<"digitalProducts">,
      data: Partial<CoachingProductData>
    ) => {
      try {
        const result = await updateProduct({
          productId,
          ...data,
        });

        if (result.success) {
          toast({
            title: "Success",
            description: "Coaching product updated successfully",
            className: "bg-white dark:bg-black",
          });
          return true;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update coaching product",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: any) {
        console.error("Error updating coaching product:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update coaching product",
          variant: "destructive",
        });
        return false;
      }
    },
  };
}

export function usePublishCoachingProduct() {
  const { toast } = useToast();
  const publishProduct = useMutation(api.coachingProducts.publishCoachingProduct);

  return {
    publishProduct: async (productId: Id<"digitalProducts">) => {
      try {
        const result = await publishProduct({ productId });

        if (result.success) {
          toast({
            title: "Success",
            description: "Coaching product published successfully",
            className: "bg-white dark:bg-black",
          });
          return true;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to publish coaching product",
            variant: "destructive",
          });
          return false;
        }
      } catch (error: any) {
        console.error("Error publishing coaching product:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to publish coaching product",
          variant: "destructive",
        });
        return false;
      }
    },
  };
}

export function useBookCoachingSession() {
  const { user } = useUser();
  const { toast } = useToast();
  const bookSession = useMutation(api.coachingProducts.bookCoachingSession);

  return {
    bookSession: async (
      productId: Id<"digitalProducts">,
      scheduledDate: Date,
      startTime: string,
      notes?: string
    ) => {
      if (!user?.id) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to book a coaching session",
          variant: "destructive",
        });
        return null;
      }

      try {
        const result = await bookSession({
          productId,
          scheduledDate: scheduledDate.getTime(),
          startTime,
          notes,
        });

        if (result.success && result.sessionId) {
          toast({
            title: "Session Booked!",
            description: "Your coaching session has been scheduled successfully",
            className: "bg-white dark:bg-black",
          });
          return result.sessionId;
        } else if (result.requiresDiscordAuth) {
          toast({
            title: "Discord Connection Required",
            description: "Please connect your Discord account to book coaching sessions",
            variant: "destructive",
          });
          return null;
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to book coaching session",
            variant: "destructive",
          });
          return null;
        }
      } catch (error: any) {
        console.error("Error booking coaching session:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to book coaching session",
          variant: "destructive",
        });
        return null;
      }
    },
  };
}

