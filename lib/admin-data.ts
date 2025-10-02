/**
 * Admin data functions
 * @deprecated These functions are deprecated and return placeholder data.
 * The admin page now uses Convex queries directly.
 * 
 * TODO: Create Convex queries for admin stats and data
 */

import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function getAdminStats() {
  try {
    // TODO: Implement Convex queries for admin stats
    console.warn("⚠️ getAdminStats is deprecated - returning placeholder data");
    
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalReviews: 0,
      pendingApprovals: 0,
      newUsersThisMonth: 0,
      newCoursesThisMonth: 0,
      activeSessionsToday: 0,
      revenueThisMonth: 0,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalReviews: 0,
      pendingApprovals: 0,
      newUsersThisMonth: 0,
      newCoursesThisMonth: 0,
      activeSessionsToday: 0,
      revenueThisMonth: 0,
    };
  }
}

export async function getAllUsers() {
  try {
    // TODO: Implement Convex query to get all users
    console.warn("⚠️ getAllUsers is deprecated - returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function getPendingCourses() {
  try {
    // TODO: Implement Convex query to get pending courses
    console.warn("⚠️ getPendingCourses is deprecated - returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching pending courses:", error);
    return [];
  }
}

export async function getAllCourses() {
  try {
    // TODO: Implement Convex query to get all courses
    console.warn("⚠️ getAllCourses is deprecated - returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching all courses:", error);
    return [];
  }
}

export async function getRecentReviews() {
  try {
    // TODO: Implement Convex query for reviews when review system is built
    console.warn("⚠️ getRecentReviews is deprecated - returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    return [];
  }
}

export async function getCoachApplications() {
  try {
    // TODO: Implement Convex query for coach applications
    console.warn("⚠️ getCoachApplications is deprecated - returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching coach applications:", error);
    return [];
  }
}

export async function getSystemHealth() {
  try {
    console.warn("⚠️ getSystemHealth is deprecated - returning placeholder data");
    return {
      database: "healthy",
      cache: "healthy",
      storage: "healthy",
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching system health:", error);
    return {
      database: "unknown",
      cache: "unknown",
      storage: "unknown",
      lastChecked: new Date().toISOString(),
    };
  }
}
