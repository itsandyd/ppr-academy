"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Calendar,
  Clock,
  Video,
  Phone,
  MessageCircle,
  Monitor,
  Download,
  ArrowRight,
  Loader2,
  Globe,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { generateICSDataUri } from "@/lib/ics-generator";
import { format } from "date-fns";

function getPlatformLabel(platform: string | undefined): string {
  switch (platform) {
    case "zoom": return "Zoom";
    case "google_meet": return "Google Meet";
    case "discord": return "Discord";
    case "phone": return "Phone Call";
    case "facetime": return "FaceTime";
    case "custom": return "Custom Link";
    default: return "Video Call";
  }
}

function getPlatformIcon(platform: string | undefined) {
  switch (platform) {
    case "zoom": return <Video className="h-5 w-5" />;
    case "google_meet": return <Video className="h-5 w-5" />;
    case "discord": return <MessageCircle className="h-5 w-5" />;
    case "phone": return <Phone className="h-5 w-5" />;
    case "facetime": return <Phone className="h-5 w-5" />;
    case "custom": return <Monitor className="h-5 w-5" />;
    default: return <Video className="h-5 w-5" />;
  }
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const directSessionId = searchParams.get("session");
  const stripeSessionId = searchParams.get("stripe_session");

  const [resolvedPaymentIntentId, setResolvedPaymentIntentId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(!!stripeSessionId);

  // Resolve Stripe checkout session -> payment intent ID
  useEffect(() => {
    if (!stripeSessionId) return;
    let cancelled = false;

    async function resolve() {
      try {
        const res = await fetch(
          `/api/coaching/resolve-session?stripe_session=${encodeURIComponent(stripeSessionId!)}`
        );
        if (!res.ok) throw new Error("Failed to resolve");
        const data = await res.json();
        if (!cancelled) {
          setResolvedPaymentIntentId(data.paymentIntentId);
        }
      } catch {
        // Webhook may not have processed yet — retry after delay
        if (!cancelled) {
          setTimeout(resolve, 2000);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [stripeSessionId]);

  // Look up the coaching session by payment intent
  const sessionFromPayment = useQuery(
    api.coachingSessionQueries.getSessionByPaymentIntent,
    resolvedPaymentIntentId ? { paymentIntentId: resolvedPaymentIntentId } : "skip"
  );

  // The actual session ID — either directly provided or resolved from Stripe
  const sessionId = directSessionId || (sessionFromPayment as string | null);

  // Fetch full session details
  const session = useQuery(
    api.coachingSessionQueries.getSessionForConfirmation,
    sessionId ? { sessionId: sessionId as Id<"coachingSessions"> } : "skip"
  );

  const buyerTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);

  // Loading states
  if (!directSessionId && !stripeSessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No Session Found</h1>
          <p className="mt-2 text-muted-foreground">
            The booking session ID is missing.
          </p>
          <Link href="/library/coaching">
            <Button className="mt-4">View My Sessions</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (resolving || session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your booking details...</p>
          <p className="mt-2 text-xs text-muted-foreground">
            This may take a moment while we confirm your payment.
          </p>
        </div>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Confirming your booking...</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Your payment is being processed. This usually takes a few seconds.
          </p>
          <Link href="/library/coaching">
            <Button variant="outline" className="mt-6">
              Go to My Sessions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sessionDate = new Date(session.scheduledDate);
  const formattedDate = format(sessionDate, "EEEE, MMMM d, yyyy");
  const formattedTime = formatTime12h(session.startTime);
  const formattedEndTime = formatTime12h(session.endTime);
  const platform = getPlatformLabel(session.sessionPlatform);

  // Build .ics data
  const [startH, startM] = session.startTime.split(":").map(Number);
  const icsStartTime = new Date(session.scheduledDate);
  icsStartTime.setHours(startH, startM, 0, 0);

  const meetingLocation =
    session.sessionLink ||
    session.sessionPhone ||
    (session.sessionPlatform === "discord" ? "Discord (private channel)" : undefined);

  const icsDataUri = generateICSDataUri({
    title: `Coaching: ${session.productTitle}`,
    description: `${session.duration}-minute coaching session with ${session.coachName || "your coach"}${session.notes ? `\n\nNotes: ${session.notes}` : ""}`,
    startTime: icsStartTime,
    durationMinutes: session.duration,
    location: meetingLocation,
    organizerName: session.coachName,
    organizerEmail: session.coachEmail,
    attendeeName: session.studentName,
    attendeeEmail: session.studentEmail,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Success header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Session Booked!</h1>
          <p className="mt-2 text-muted-foreground">
            Your coaching session has been confirmed. Check your email for details.
          </p>
        </div>

        {/* Session details card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{session.productTitle}</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">
                    {formattedTime} - {formattedEndTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">{session.duration} minutes</p>
                  <p className="text-sm text-muted-foreground">Session duration</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getPlatformIcon(session.sessionPlatform)}</div>
                <div>
                  <p className="font-medium">{platform}</p>
                  {session.sessionLink && (
                    <a
                      href={session.sessionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {session.sessionLink}
                    </a>
                  )}
                  {session.sessionPhone && (
                    <p className="text-sm text-muted-foreground">{session.sessionPhone}</p>
                  )}
                  {session.sessionPlatform === "discord" && (
                    <p className="text-sm text-muted-foreground">
                      A private channel will be created before your session
                    </p>
                  )}
                </div>
              </div>

              {session.coachName && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/30">
                    <span className="text-xs font-bold text-purple-600">
                      {session.coachName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{session.coachName}</p>
                    <p className="text-sm text-muted-foreground">Your coach</p>
                  </div>
                </div>
              )}

              {session.totalCost > 0 && (
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">${session.totalCost}</p>
                    <p className="text-sm text-muted-foreground">Payment held until session confirmed</p>
                  </div>
                </div>
              )}

              {session.notes && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-1 text-sm font-medium">Your Notes</p>
                  <p className="text-sm text-muted-foreground">{session.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>Times shown in {buyerTimezone.replace(/_/g, " ")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <a href={icsDataUri} download={`coaching-session.ics`} className="block">
            <Button variant="outline" className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Add to Calendar (.ics)
            </Button>
          </a>

          <Link href="/library/coaching" className="block">
            <Button className="w-full" size="lg">
              View My Sessions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          {session.storeSlug && (
            <Link href={`/${session.storeSlug}`} className="block">
              <Button variant="ghost" className="w-full" size="lg">
                Back to {session.storeName || "Store"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
