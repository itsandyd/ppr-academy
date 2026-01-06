"use server";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface Coach {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  specialties: string[];
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  availability: string;
  bio: string;
  experience: string;
  location?: string;
  isActive: boolean;
}

export async function getCoaches(): Promise<Coach[]> {
  try {
    return [];
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return [];
  }
}

export async function getCoachById(id: string): Promise<Coach | null> {
  try {
    return null;
  } catch (error) {
    console.error("Error fetching coach:", error);
    return null;
  }
}

interface CoachProfile {
  category?: string;
  title?: string;
  description?: string;
  basePrice?: number;
  location?: string;
  timezone?: string;
  availableDays?: string;
  availableHours?: string;
  isActive?: boolean;
  createdAt?: Date;
}

type GetUserCoachProfileResult =
  | { success: true; profile: CoachProfile | null }
  | { success: false; error: string };

export async function getUserCoachProfile(): Promise<GetUserCoachProfileResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    return { success: true, profile: null };
  } catch (error) {
    console.error("Error fetching user coach profile:", error);
    return { success: false, error: "Failed to fetch coach profile" };
  }
}

type UpdateCoachApplicationResult =
  | { success: true; message: string; profile: CoachProfile | null }
  | { success: false; error: string };

export async function updateCoachApplication(applicationData: {
  category: string;
  location: string;
  title: string;
  description: string;
  basePrice: number;
  timezone?: string;
  availableDays?: string;
  availableHours?: string;
}): Promise<UpdateCoachApplicationResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    return {
      success: true,
      message: "Coach profile updated successfully",
      profile: null,
    };
  } catch (error) {
    console.error("Error updating coach application:", error);
    return { success: false, error: "Failed to update coach profile" };
  }
}

export async function createCoachingSession(sessionData: {
  coachId: string;
  scheduledDate: Date;
  startTime: string;
  duration: number;
  notes?: string;
  sessionType?: string;
}) {
  try {
    const { userId: studentId } = await auth();

    if (!studentId) {
      throw new Error("User not authenticated");
    }

    return {
      success: false,
      error:
        "Coaching sessions are currently unavailable. Please use the new coaching products system.",
    };
  } catch (error) {
    console.error("Error creating coaching session:", error);
    return { success: false, error: "Failed to book session" };
  }
}

export async function getCoachAvailability(coachIdOrDate: string | Date, date?: Date) {
  try {
    return { success: true, availability: [] };
  } catch (error) {
    console.error("Error fetching coach availability:", error);
    return { success: false, error: "Failed to fetch availability" };
  }
}

export async function setCoachAvailability(availabilityData: {
  date: Date;
  timeSlots: Array<{ startTime: string; endTime: string }>;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    return {
      success: true,
      message: "Availability updated successfully",
      slots: availabilityData.timeSlots.length,
    };
  } catch (error) {
    console.error("Error setting coach availability:", error);
    return { success: false, error: "Failed to update availability" };
  }
}

export async function initializeDiscordAuth() {
  const discordClientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/discord/callback`;

  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds.join`;

  return { success: true, authUrl: discordAuthUrl };
}

export async function verifyDiscordAuth(code: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    return {
      success: false,
      error: "Discord verification not available",
    };
  } catch (error) {
    console.error("Error verifying Discord auth:", error);
    return { success: false, error: "Failed to link Discord account" };
  }
}

export async function createCoachApplication(applicationData: {
  category: string;
  location: string;
  title: string;
  description: string;
  basePrice: number;
  professionalBackground?: string;
  certifications?: string;
  notableProjects?: string;
  discordUsername?: string;
  alternativeContact?: string;
  timezone?: string;
  availableDays?: string;
  availableHours?: string;
  portfolioUrl?: string;
  socialLinks?: string;
}) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    return {
      success: true,
      message: "Coach application submitted successfully",
      profileId: `coach_${userId}_${Date.now()}`,
    };
  } catch (error) {
    console.error("Error creating coach application:", error);
    return { success: false, error: "Failed to submit application" };
  }
}

export async function processScheduledSessions(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // TODO: Implement actual session processing (reminders, status updates)
    return {
      success: true,
      message: "Scheduled sessions processed successfully",
    };
  } catch (error) {
    console.error("Error processing scheduled sessions:", error);
    return {
      success: false,
      error: "Failed to process scheduled sessions",
    };
  }
}
