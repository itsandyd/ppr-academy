/**
 * Coaching Session - Type Definitions
 */

export type CoachingSessionType =
  | "production-coaching"
  | "mixing-service"
  | "mastering-service"
  | "feedback-session"
  | "custom";

export type SessionPlatform =
  | "zoom"
  | "google_meet"
  | "discord"
  | "phone"
  | "facetime"
  | "custom";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeWindow {
  start: string; // "09:00" in 24h format
  end: string; // "17:00"
}

/** Kept for backward compat with existing stored data */
export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface DaySchedule {
  day: DayOfWeek;
  enabled: boolean;
  timeWindows: TimeWindow[]; // availability windows (e.g., 9am-12pm + 2pm-5pm)
  timeSlots?: TimeSlot[]; // legacy field - read but not written
}

export interface WeekSchedule {
  timezone: string; // IANA timezone e.g., "America/New_York"
  schedule: DaySchedule[];
}

export interface DateOverride {
  date: string; // ISO date "2025-11-20"
  available: boolean;
  timeWindows?: TimeWindow[]; // if available=true, custom windows for that day
  reason?: string; // "Vacation", "Holiday", "Extra hours", etc.
}

export interface DiscordConfig {
  requireDiscord: boolean;
  autoCreateChannel: boolean;
  channelTemplate?: string;
  roleId?: string;
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
  pricingModel?: "free_with_gate" | "paid";

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

  // Discord Integration (legacy, kept for backward compat)
  discordConfig?: DiscordConfig;

  // Session Platform
  sessionPlatform?: SessionPlatform;
  sessionLink?: string;
  sessionPhone?: string;

  // Availability
  weekSchedule?: WeekSchedule;
  dateOverrides?: DateOverride[];
  sessionDurations?: number[]; // durations offered: [30, 45, 60, 90]
  bufferTime?: number; // minutes between sessions (0, 15, 30, 60)
  maxBookingsPerDay?: number;
  minNoticeHours?: number; // minimum scheduling notice in hours (e.g., 24)
  advanceBookingDays?: number; // how far out buyers can book (e.g., 30, 60)

  // Session details
  sessionFormat?: "video" | "audio" | "chat" | "in-person";
  preparationNotes?: string;
  deliverables?: string;

  // Cancellation
  lateCancellationFeePercent?: number;
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  followGate: boolean;
  platform: boolean;
  availability: boolean;
}
