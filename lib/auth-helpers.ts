/**
 * Authentication Helper Utilities
 * Provides consistent auth checking across all API routes
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Check if user is authenticated
 * Returns user or throws 401 error
 */
export async function requireAuth() {
  const user = await currentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

/**
 * Get authenticated user or return null
 * Use when auth is optional
 */
export async function getAuthUser() {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated via auth() helper
 * Returns auth object or throws 401
 */
export async function requireAuthSession() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  return { userId };
}

/**
 * Middleware wrapper for protected API routes
 * Usage: export const POST = withAuth(async (request, user) => { ... })
 */
export function withAuth<T extends any[]>(
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof currentUser>>>, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuth();
      return await handler(request, user, ...args);
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in." },
          { status: 401 }
        );
      }
      
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user is admin
 * Add admin role checking logic here
 */
export async function requireAdmin() {
  const user = await requireAuth();
  
  // TODO: Add actual admin role checking
  // For now, check if user has admin email or role
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user.emailAddresses[0]?.emailAddress || '');
  
  if (!isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }
  
  return user;
}

/**
 * Middleware wrapper for admin-only routes
 */
export function withAdmin<T extends any[]>(
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof currentUser>>>, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const user = await requireAdmin();
      return await handler(request, user, ...args);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Unauthorized") {
          return NextResponse.json(
            { error: "Unauthorized. Please sign in." },
            { status: 401 }
          );
        }
        if (error.message.includes("Forbidden")) {
          return NextResponse.json(
            { error: "Forbidden. Admin access required." },
            { status: 403 }
          );
        }
      }
      
      console.error("Admin middleware error:", error);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Error response helper
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

