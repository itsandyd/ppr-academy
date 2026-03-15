import { NextResponse } from "next/server";

/**
 * Legacy Resend webhook endpoint — no longer active.
 * Email delivery is now handled by AWS SES.
 * This route remains to prevent 404s from any lingering webhook configs.
 */
export async function POST() {
  return NextResponse.json({ received: true, status: "deprecated" });
}
