import { auth } from "@clerk/nextjs/server";
import { getUserFromClerk } from "@/lib/data";
import NavbarClient from "./navbar-client";

export default async function NavbarWrapper() {
  const { userId: clerkId } = await auth();
  
  let isAdmin = false;
  if (clerkId) {
    const user = await getUserFromClerk(clerkId);
    isAdmin = user?.admin || false;
  }
  
  return <NavbarClient isAdmin={isAdmin} />;
} 