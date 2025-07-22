"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper function to get or create user from Clerk
export async function getUserFromClerk(clerkId: string) {
  console.log(`🔍 Looking up user with clerkId: ${clerkId}`);
  
  try {
    // First, try to find the user in our database
    let user = await convex.query(api.users.getUserByClerkId, { clerkId });

    if (user) {
      console.log(`✅ Found existing user in database: ${user.email}`);
      return user;
    }

    console.log(`⚠️ User not found in database, fetching from Clerk...`);

    // If user doesn't exist, fetch from Clerk and create in database
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      
      console.log(`📡 Fetching user data from Clerk...`);
      const clerkUser = await client.users.getUser(clerkId);
      
      if (!clerkUser) {
        console.error(`❌ User not found in Clerk: ${clerkId}`);
        return null;
      }

      console.log(`📋 Clerk user data:`, {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        hasImage: !!clerkUser.imageUrl
      });
      
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      
      if (!email) {
        console.error(`❌ No email found for Clerk user: ${clerkId}`);
        return null;
      }

      // Create user in database
      console.log(`🔨 Creating user in database...`);
      const userId = await convex.mutation(api.users.createUser, {
        clerkId,
        email,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        imageUrl: clerkUser.imageUrl,
        name: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.firstName || clerkUser.lastName || undefined
      });
      
      // Fetch the created user
      user = await convex.query(api.users.getUserByClerkId, { clerkId });
      
      console.log(`✅ Successfully created user: ${user?.email} (ID: ${userId})`);
      return user;

    } catch (createError: any) {
      console.error("💥 Error creating user from Clerk data:", createError);
      
      // If user might already exist by email, try to link them
      if (createError?.message?.includes('already exists') || createError?.code === 'P2002') {
        console.log(`🔄 User might exist by email, checking...`);
        
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(clerkId);
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          
          if (email) {
            // Try to find user by email and link their clerkId
            const existingUser = await convex.query(api.users.getUserByEmail, { email });
            
            if (existingUser) {
              if (!existingUser.clerkId) {
                // Update existing user with clerkId
                await convex.mutation(api.users.linkClerkIdToUser, {
                  email,
                  clerkId,
                  firstName: clerkUser.firstName || undefined,
                  lastName: clerkUser.lastName || undefined,
                  imageUrl: clerkUser.imageUrl,
                });
                
                user = await convex.query(api.users.getUserByClerkId, { clerkId });
                console.log(`✅ Updated existing user with clerkId: ${user?.email}`);
                return user;
              } else if (existingUser.clerkId === clerkId) {
                // User already exists with this clerkId
                console.log(`✅ Found existing user by email: ${existingUser.email}`);
                return existingUser;
              }
            }
          }
        } catch (linkError) {
          console.error("💥 Error linking user:", linkError);
        }
      }
      
      return null;
    }

  } catch (error) {
    console.error("💥 Error in getUserFromClerk:", error);
    return null;
  }
}

// Course functions
export async function getCourses() {
  return await convex.query(api.courses.getCourses);
}

export async function getCourseBySlug(slug: string) {
  return await convex.query(api.courses.getCourseBySlug, { slug });
}

export async function getCoursesByUser(userId: string) {
  return await convex.query(api.courses.getCoursesByUser, { userId });
}

// Store functions
export async function getStoresByUser(userId: string) {
  return await convex.query(api.stores.getStoresByUser, { userId });
}

// Digital product functions
export async function getDigitalProductsByStore(storeId: string) {
  return await convex.query(api.digitalProducts.getProductsByStore, { storeId });
}

export async function getDigitalProductsByUser(userId: string) {
  return await convex.query(api.digitalProducts.getProductsByUser, { userId });
} 