/**
 * Coaching Session - Type Definitions
 */

export type CoachingSessionType =
  | "production-coaching"
  | "mixing-service"
  | "mastering-service"
  | "feedback-session"
  | "custom";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeSlot {
  start: string; // "09:00" in 24h format
  end: string; // "10:00"
  available: boolean;
}

export interface DaySchedule {
  day: DayOfWeek;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export interface WeekSchedule {
  timezone: string; // IANA timezone e.g., "America/New_York"
  schedule: DaySchedule[];
}

// Override for specific dates
export interface DateOverride {
  date: string; // ISO date "2025-11-20"
  available: boolean;
  timeSlots?: TimeSlot[];
  reason?: string; // "Busy", "Vacation", etc.
}

export interface DiscordConfig {
  requireDiscord: boolean;
  autoCreateChannel: boolean;
  channelTemplate?: string;
  roleId?: string; // Discord role ID for access
  notifyOnBooking: boolean;
}

export interface CoachingData {
  // Basic info
  title?: string;
  description?: string;
  sessionType?: CoachingSessionType;
  duration?: number; // in minutes
  tags?: string[];
  thumbnail?: string;

  // Pricing
  price?: string;
  pricingModel?: "free_with_gate" | "paid"; // Can be free or paid

  // Follow Gate (if free)
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;

  // Discord Integration
  discordConfig?: DiscordConfig;

  // Availability
  weekSchedule?: WeekSchedule;
  dateOverrides?: DateOverride[]; // Specific date exceptions
  bufferTime?: number; // Minutes between sessions
  maxBookingsPerDay?: number;
  advanceBookingDays?: number; // How far in advance can people book?

  // Session details
  sessionFormat?: "video" | "audio" | "chat" | "in-person";
  preparationNotes?: string; // What students should prepare
  deliverables?: string; // What they'll get (e.g., "Mixed track", "Feedback document")
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  followGate: boolean;
  discord: boolean;
  availability: boolean;
}
