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
 * Checks multiple sources: environment variable, Clerk metadata, and role
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const userEmail = user.emailAddresses[0]?.emailAddress || '';

  // Check 1: Environment variable list of admin emails
  const adminEmails = (process.env.ADMIN_EMAILS?.split(',') || []).map(e => e.trim().toLowerCase());
  const isAdminByEmail = adminEmails.includes(userEmail.toLowerCase());

  // Check 2: Clerk public metadata (can be set in Clerk dashboard)
  const clerkMetadata = user.publicMetadata as { role?: string; isAdmin?: boolean } | undefined;
  const isAdminByMetadata = clerkMetadata?.isAdmin === true ||
    clerkMetadata?.role === 'admin' ||
    clerkMetadata?.role === 'AGENCY_OWNER' ||
    clerkMetadata?.role === 'AGENCY_ADMIN';

  // Check 3: Clerk private metadata (more secure)
  const privateMetadata = user.privateMetadata as { role?: string; isAdmin?: boolean } | undefined;
  const isAdminByPrivate = privateMetadata?.isAdmin === true || privateMetadata?.role === 'admin';

  const isAdmin = isAdminByEmail || isAdminByMetadata || isAdminByPrivate;

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

/**
 * Admin role levels for granular permission checking
 */
export type AdminRole = 'admin' | 'AGENCY_OWNER' | 'AGENCY_ADMIN' | 'MODERATOR';

/**
 * Check if user is admin without throwing
 * Returns { isAdmin: boolean, role?: AdminRole }
 */
export async function checkIsAdmin(): Promise<{ isAdmin: boolean; role?: AdminRole; userId?: string }> {
  try {
    const user = await currentUser();

    if (!user) {
      return { isAdmin: false };
    }

    const userEmail = user.emailAddresses[0]?.emailAddress || '';

    // Check 1: Environment variable list of admin emails
    const adminEmails = (process.env.ADMIN_EMAILS?.split(',') || []).map(e => e.trim().toLowerCase());
    if (adminEmails.includes(userEmail.toLowerCase())) {
      return { isAdmin: true, role: 'admin', userId: user.id };
    }

    // Check 2: Clerk public metadata
    const clerkMetadata = user.publicMetadata as { role?: string; isAdmin?: boolean } | undefined;
    if (clerkMetadata?.isAdmin === true || clerkMetadata?.role === 'admin') {
      return { isAdmin: true, role: 'admin', userId: user.id };
    }
    if (clerkMetadata?.role === 'AGENCY_OWNER') {
      return { isAdmin: true, role: 'AGENCY_OWNER', userId: user.id };
    }
    if (clerkMetadata?.role === 'AGENCY_ADMIN') {
      return { isAdmin: true, role: 'AGENCY_ADMIN', userId: user.id };
    }
    if (clerkMetadata?.role === 'MODERATOR') {
      return { isAdmin: true, role: 'MODERATOR', userId: user.id };
    }

    // Check 3: Clerk private metadata (more secure)
    const privateMetadata = user.privateMetadata as { role?: string; isAdmin?: boolean } | undefined;
    if (privateMetadata?.isAdmin === true || privateMetadata?.role === 'admin') {
      return { isAdmin: true, role: 'admin', userId: user.id };
    }

    return { isAdmin: false, userId: user.id };
  } catch {
    return { isAdmin: false };
  }
}

/**
 * Check if user has a specific admin role or higher
 * Role hierarchy: admin > AGENCY_OWNER > AGENCY_ADMIN > MODERATOR
 */
export async function requireRole(requiredRole: AdminRole) {
  const user = await requireAuth();
  const { isAdmin, role } = await checkIsAdmin();

  if (!isAdmin || !role) {
    throw new Error("Forbidden: Admin access required");
  }

  // Role hierarchy check
  const roleHierarchy: Record<AdminRole, number> = {
    'admin': 4,
    'AGENCY_OWNER': 3,
    'AGENCY_ADMIN': 2,
    'MODERATOR': 1,
  };

  if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
    throw new Error(`Forbidden: ${requiredRole} access or higher required`);
  }

  return { user, role };
}

/**
 * Middleware wrapper for role-based routes
 */
export function withRole<T extends any[]>(
  requiredRole: AdminRole,
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof currentUser>>>, role: AdminRole, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const { user, role } = await requireRole(requiredRole);
      return await handler(request, user, role, ...args);
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
            { error: error.message },
            { status: 403 }
          );
        }
      }

      console.error("Role middleware error:", error);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

