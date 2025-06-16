import { auth } from "@clerk/nextjs/server";
import { getUserFromClerk } from "@/lib/data";
import NavbarClient from "./navbar-client";

export default async function NavbarWrapper() {
  // Check if Clerk is properly configured
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return <NavbarClient isAdmin={false} />;
  }

  try {
    const { userId: clerkId } = await auth();
    
    let isAdmin = false;
    if (clerkId) {
      const user = await getUserFromClerk(clerkId);
      isAdmin = user?.admin || false;
    }
    
    return <NavbarClient isAdmin={isAdmin} />;
  } catch (error) {
    // Fallback during build or when Clerk is not available
    console.warn("Clerk auth failed during render:", error);
    return <NavbarClient isAdmin={false} />;
  }
} 