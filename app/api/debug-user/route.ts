import { auth, currentUser } from "@clerk/nextjs/server";
// Prisma removed - using Convex instead
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`🔍 DEBUG: Starting debug for clerkId: ${clerkId}`);

    const debugInfo: any = {
      clerkId,
      steps: [],
      errors: [],
      user: null,
      clerkUser: null,
      databaseConnection: false
    };

    // Step 1: Test database connection
    try {
      await prisma.$connect();
      debugInfo.databaseConnection = true;
      debugInfo.steps.push("✅ Database connection successful");
    } catch (dbError) {
      debugInfo.errors.push(`❌ Database connection failed: ${dbError}`);
      debugInfo.steps.push("❌ Database connection failed");
    }

    // Step 2: Check if user exists in database
    try {
      const existingUser = await prisma.user.findUnique({
        where: { clerkId }
      });
      
      if (existingUser) {
        debugInfo.user = existingUser;
        debugInfo.steps.push(`✅ User found in database: ${existingUser.email}`);
        return NextResponse.json(debugInfo);
      } else {
        debugInfo.steps.push("⚠️ User not found in database");
      }
    } catch (findError) {
      debugInfo.errors.push(`❌ Error finding user in database: ${findError}`);
      debugInfo.steps.push("❌ Error finding user in database");
    }

    // Step 3: Fetch user from Clerk
    try {
      const clerkUser = await currentUser();
      
      if (!clerkUser) {
        debugInfo.errors.push("❌ User not found in Clerk");
        debugInfo.steps.push("❌ User not found in Clerk");
        return NextResponse.json(debugInfo);
      }

      debugInfo.clerkUser = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status,
        hasImage: !!clerkUser.imageUrl
      };
      debugInfo.steps.push(`✅ User found in Clerk: ${debugInfo.clerkUser.email}`);

    } catch (clerkError) {
      debugInfo.errors.push(`❌ Error fetching from Clerk: ${clerkError}`);
      debugInfo.steps.push("❌ Error fetching from Clerk");
      return NextResponse.json(debugInfo);
    }

    // Step 4: Try to create user in database
    try {
      const email = debugInfo.clerkUser.email;
      
      if (!email) {
        debugInfo.errors.push("❌ No email found for user");
        debugInfo.steps.push("❌ No email found for user");
        return NextResponse.json(debugInfo);
      }

      // Check if user exists by email first
      const existingByEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingByEmail) {
        debugInfo.steps.push(`⚠️ User exists by email but not clerkId: ${email}`);
        
        // Update existing user with clerkId
        const updatedUser = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { 
            clerkId,
            firstName: debugInfo.clerkUser.firstName,
            lastName: debugInfo.clerkUser.lastName,
            imageUrl: debugInfo.clerkUser.hasImage ? "present" : null,
          }
        });
        
        debugInfo.user = updatedUser;
        debugInfo.steps.push(`✅ Updated existing user with clerkId`);
        return NextResponse.json(debugInfo);
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName: debugInfo.clerkUser.firstName,
          lastName: debugInfo.clerkUser.lastName,
          imageUrl: debugInfo.clerkUser.hasImage ? "present" : null,
        },
      });

      debugInfo.user = newUser;
      debugInfo.steps.push(`✅ Successfully created new user: ${newUser.email}`);

    } catch (createError: any) {
      debugInfo.errors.push(`❌ Error creating user: ${createError.message}`);
      debugInfo.steps.push("❌ Error creating user in database");
      
      // Check for specific error types
      if (createError.code === 'P2002') {
        debugInfo.errors.push(`❌ Unique constraint violation: ${createError.meta?.target}`);
      }
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error }, 
      { status: 500 }
    );
  }
} 