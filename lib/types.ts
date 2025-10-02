/**
 * Type definitions for the application
 * Updated to work with Convex instead of Prisma
 */

import { Doc, Id } from "@/convex/_generated/dataModel";

// Re-export Convex document types
export type User = Doc<"users"> & {
  // Add backward compatibility fields
  id?: string | Id<"users">;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Course = Doc<"courses"> & {
  // Add backward compatibility fields
  id?: string | Id<"courses">;
  instructorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Enrollment = Doc<"enrollments"> & {
  // Add backward compatibility fields
  id?: string | Id<"enrollments">;
  createdAt?: Date;
  updatedAt?: Date;
};

// Composite types
export type CourseWithDetails = Course & {
  instructor?: User | null;
  _count?: {
    enrollments: number;
  };
};

export type EnrollmentWithCourse = Enrollment & {
  course: Course & {
    instructor?: User | null;
  };
};

// Digital Product types
export type DigitalProduct = Doc<"digitalProducts"> & {
  id?: string | Id<"digitalProducts">;
  createdAt?: Date;
  updatedAt?: Date;
};

// Store types
export type Store = Doc<"stores"> & {
  id?: string | Id<"stores">;
  createdAt?: Date;
  updatedAt?: Date;
};

// Sample types (for Splice clone)
export type AudioSample = Doc<"audioSamples"> & {
  id?: string | Id<"audioSamples">;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SamplePack = Doc<"samplePacks"> & {
  id?: string | Id<"samplePacks">;
  createdAt?: Date;
  updatedAt?: Date;
};

// User roles enum
export type UserRole = 
  | "AGENCY_OWNER"
  | "AGENCY_ADMIN"
  | "SUBACCOUNT_USER"
  | "SUBACCOUNT_GUEST";

// Stripe account status enum
export type StripeAccountStatus = 
  | "pending"
  | "restricted"
  | "enabled";
