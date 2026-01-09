import { auth, currentUser } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get the full user object from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found in Clerk" }, { status: 404 });
    }

    // Sync to Convex database
    const userId = await fetchMutation(api.users.createOrUpdateUserFromClerk, {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      firstName: clerkUser.firstName || null,
      lastName: clerkUser.lastName || null,
      imageUrl: clerkUser.imageUrl || null,
    });

    return NextResponse.json({
      message: "User synced successfully",
      userId
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
} 