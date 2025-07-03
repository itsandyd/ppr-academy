"use server";

import { auth } from "@clerk/nextjs/server";
import { getUserFromClerk } from "@/lib/data";

export async function checkUserRole() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { isAdmin: false, isSignedIn: false };
    
    const user = await getUserFromClerk(clerkId);
    if (!user) return { isAdmin: false, isSignedIn: true };
    
    return {
      isAdmin: user.admin || false,
      isSignedIn: true,
      role: user.role
    };
  } catch (error) {
    console.error("Error checking user role:", error);
    return { isAdmin: false, isSignedIn: false };
  }
}

export async function ensureUserExists() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    console.log(`🔄 Ensuring user exists for clerkId: ${clerkId}`);
    
    // This will automatically create the user if they don't exist
    const user = await getUserFromClerk(clerkId);
    
    if (!user) {
      console.error(`❌ Failed to create/find user for clerkId: ${clerkId}`);
      return { success: false, error: "Failed to create user" };
    }

    console.log(`✅ User exists/created: ${user.email}`);
    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        admin: user.admin
      }
    };
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return { success: false, error: "Unexpected error" };
  }
} 