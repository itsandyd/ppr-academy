import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Custom hook to safely extract and validate storeId from URL parameters
 * Prevents passing "undefined" string to Convex queries
 */
export function useStoreId(): string | undefined {
  const params = useParams();
  const storeId = params.storeId;

  // Return undefined if storeId is missing, "undefined" string, or invalid
  if (!storeId || 
      storeId === "undefined" || 
      storeId === "null" || 
      typeof storeId !== "string" ||
      storeId.trim() === "") {
    return undefined;
  }

  return storeId;
}

/**
 * Custom hook that returns a validated storeId as a Convex ID type
 * Returns undefined if the storeId is invalid
 */
export function useValidStoreId(): Id<"stores"> | undefined {
  const storeId = useStoreId();
  
  // Additional validation for Convex ID format
  if (!storeId || storeId.length < 10) {
    return undefined;
  }

  return storeId as Id<"stores">;
} 