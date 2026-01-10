import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "invalid_token", message: "No token provided" },
        { status: 400 }
      );
    }

    const email = verifyUnsubscribeToken(token);

    if (!email) {
      return NextResponse.json(
        { success: false, error: "invalid_token", message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailUnsubscribeApi: any = api.emailUnsubscribe;
    const result = await fetchMutation(emailUnsubscribeApi.unsubscribeByEmail, {
      email,
      reason: "One-click unsubscribe from email link",
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        message: result.message,
      });
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Unsubscribe API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process unsubscribe request" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const email = verifyUnsubscribeToken(token);

  if (!email) {
    return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
  });
}
