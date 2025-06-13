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