"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Video,
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionConfirmationCard } from "@/components/coaching/SessionConfirmationCard";
import { CoachingReviewDialog } from "@/components/coaching/CoachingReviewDialog";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export const dynamic = "force-dynamic";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
    </div>
  );
}

export default function CoachingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "learn" | "create" | null;
  const { user, isLoaded: isUserLoaded } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);
  const [reviewSession, setReviewSession] = useState<any>(null);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; session: any }>({ open: false, session: null });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!mode || mode !== "learn") {
      router.push("/dashboard/coaching?mode=learn");
    }
  }, [mode, router]);

  const convexUser = useQuery(api.users.getUserFromClerk, effectiveUserId ? { clerkId: effectiveUserId } : "skip");

  const studentSessions = useQuery(
    api.coachingProducts.getStudentSessions,
    convexUser?.clerkId ? { studentId: convexUser.clerkId } : "skip"
  );

  const cancelSession = useMutation(api.coachingCancellation.cancelSession);

  const isLoading =
    !isUserLoaded || (user && convexUser === undefined) || studentSessions === undefined;

  const now = Date.now();
  const upcomingSessions =
    studentSessions?.filter((s: any) => s.scheduledDate > now && s.status === "SCHEDULED") || [];
  const pastSessions =
    studentSessions?.filter((s: any) => s.scheduledDate <= now || s.status !== "SCHEDULED") || [];

  // Sessions needing action from the student
  const needsConfirmation = studentSessions?.filter(
    (s: any) => s.status === "CONFIRMED" && s.studentConfirmed === undefined
  ) || [];
  const needsReview = studentSessions?.filter(
    (s: any) =>
      (s.status === "COMPLETED" || s.status === "NO_SHOW_BUYER") && !s.review
  ) || [];
  const needsActionCount = needsConfirmation.length + needsReview.length;

  const handleCancelSession = async () => {
    if (!cancelDialog.session || !user?.id) return;
    setCancelling(true);
    try {
      const result = await cancelSession({
        sessionId: cancelDialog.session._id,
        userId: user.id,
        reason: "Cancelled by student",
      });
      if (result.success) {
        if (result.refundType === "full") {
          toast.success("Session cancelled. A full refund will be issued.");
        } else if (result.refundType === "partial") {
          toast.success("Session cancelled. A partial refund will be issued per the cancellation policy.");
        } else {
          toast.success("Session cancelled.");
        }
        setCancelDialog({ open: false, session: null });
      } else {
        toast.error(result.error || "Failed to cancel session");
      }
    } catch {
      toast.error("Failed to cancel session");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">
            <Clock className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge className="border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Awaiting Confirmation
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="border-green-500/20 bg-green-500/10 text-green-500">
            <Video className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="border-red-500/20 bg-red-500/10 text-red-500">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      case "NO_SHOW":
      case "NO_SHOW_CREATOR":
        return (
          <Badge className="border-red-500/20 bg-red-500/10 text-red-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Coach No-Show
          </Badge>
        );
      case "NO_SHOW_BUYER":
        return (
          <Badge className="border-orange-500/20 bg-orange-500/10 text-orange-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            No Show
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">My Coaching Sessions</h1>
            <p className="text-muted-foreground">
              {studentSessions && studentSessions.length > 0
                ? `${upcomingSessions.length} upcoming, ${pastSessions.length} past`
                : "Book sessions with expert coaches"}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/marketplace/creators">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Find Coaches
            </Button>
          </Link>
          <Link href="/dashboard?mode=learn">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Needs Action Section */}
      {needsActionCount > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Needs Your Action ({needsActionCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsConfirmation.map((session: any) => (
              <div key={`confirm-${session._id}`} className="rounded-lg border bg-white dark:bg-black p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{session.productTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      with {session.coachName || "Coach"} · {new Date(session.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-amber-600">Did this session happen?</div>
                </div>
                {user?.id && (
                  <div className="mt-3">
                    <SessionConfirmationCard
                      sessionId={session._id}
                      userId={user.id}
                      isCoach={false}
                      otherPartyName={session.coachName || "Coach"}
                    />
                  </div>
                )}
              </div>
            ))}
            {needsReview.map((session: any) => (
              <div key={`review-${session._id}`} className="flex items-center justify-between rounded-lg border bg-white dark:bg-black p-4">
                <div>
                  <p className="font-medium">{session.productTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    with {session.coachName || "Coach"} · {new Date(session.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewSession(session)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Leave a Review
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {studentSessions && studentSessions.length > 0 ? (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
            <TabsTrigger value="all">All ({studentSessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6 space-y-4">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session: any) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  getStatusBadge={getStatusBadge}
                  onCancel={(s) => setCancelDialog({ open: true, session: s })}
                  onReview={(s) => setReviewSession(s)}
                />
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title="No upcoming sessions"
                description="Book a session with a coach to get personalized guidance on your production."
                action={{ label: "Find Coaches", href: "/marketplace/creators" }}
                compact
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6 space-y-4">
            {pastSessions.length > 0 ? (
              pastSessions.map((session: any) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  getStatusBadge={getStatusBadge}
                  onCancel={(s) => setCancelDialog({ open: true, session: s })}
                  onReview={(s) => setReviewSession(s)}
                />
              ))
            ) : (
              <EmptyState
                icon={Video}
                title="No past sessions"
                description="Your completed coaching sessions and notes will appear here."
                compact
              />
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-4">
            {studentSessions.map((session: any) => (
              <SessionCard
                key={session._id}
                session={session}
                getStatusBadge={getStatusBadge}
                onCancel={(s) => setCancelDialog({ open: true, session: s })}
                onReview={(s) => setReviewSession(s)}
              />
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyState
          icon={Video}
          title="Get personalized coaching"
          description="Book 1-on-1 sessions with experienced producers. Get feedback on your mixes, learn new techniques, and level up your sound."
          action={{ label: "Find Coaches", href: "/marketplace/creators" }}
        />
      )}

      {/* Cancel Session Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({ open, session: open ? cancelDialog.session : null })}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this coaching session?
            </DialogDescription>
          </DialogHeader>
          {cancelDialog.session && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{cancelDialog.session.productTitle}</p>
              <p className="text-muted-foreground">
                with {cancelDialog.session.coachName || "Coach"} · {new Date(cancelDialog.session.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <div className="mt-2 rounded bg-muted p-2 text-xs">
                {(cancelDialog.session.scheduledDate - Date.now()) > 24 * 60 * 60 * 1000
                  ? "Full refund — you are cancelling more than 24 hours before the session."
                  : "Partial refund — less than 24 hours until session. A cancellation fee may apply."}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, session: null })} disabled={cancelling}>
              Keep Session
            </Button>
            <Button variant="destructive" onClick={handleCancelSession} disabled={cancelling}>
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      {reviewSession && (
        <CoachingReviewDialog
          open={!!reviewSession}
          onOpenChange={(open) => { if (!open) setReviewSession(null); }}
          sessionId={reviewSession._id}
          coachName={reviewSession.coachName || "Coach"}
        />
      )}
    </div>
  );
}

function SessionCard({
  session,
  getStatusBadge,
  onCancel,
  onReview,
}: {
  session: any;
  getStatusBadge: (status: string) => React.ReactNode;
  onCancel: (session: any) => void;
  onReview: (session: any) => void;
}) {
  const { user } = useUser();
  const sessionDate = new Date(session.scheduledDate);
  const isUpcoming = session.scheduledDate > Date.now() && session.status === "SCHEDULED";
  const canReview = (session.status === "COMPLETED" || session.status === "NO_SHOW_BUYER") && !session.review;

  return (
    <Card className={isUpcoming ? "border-teal-500/30 bg-teal-500/5" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/20">
              <Video className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">{session.productTitle}</h3>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>with {session.coachName || "Coach"}</span>
                {session.storeSlug && (
                  <Link
                    href={`/${session.storeSlug}`}
                    className="flex items-center gap-1 text-teal-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Profile
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {sessionDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {session.startTime} - {session.endTime} ({session.duration} min)
                </div>
                {session.sessionPlatform && (
                  <Badge variant="outline" className="text-xs">
                    {session.sessionPlatform.replace("_", " ")}
                  </Badge>
                )}
              </div>
              {session.notes && (
                <p className="mt-2 text-sm italic text-muted-foreground">Notes: {session.notes}</p>
              )}

              {/* Join Session button */}
              {isUpcoming && session.sessionLink && (
                <div className="mt-3">
                  <Button size="sm" asChild>
                    <a href={session.sessionLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Session
                    </a>
                  </Button>
                </div>
              )}

              {session.status === "CONFIRMED" && user?.id && (
                <div className="mt-3">
                  <SessionConfirmationCard
                    sessionId={session._id}
                    userId={user.id}
                    isCoach={false}
                    otherPartyName={session.coachName || "Coach"}
                  />
                </div>
              )}

              {/* Review display */}
              {session.review && (
                <div className="mt-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={session.review.rating} />
                    <span className="text-xs text-muted-foreground">Your review</span>
                  </div>
                  {session.review.reviewText && (
                    <p className="text-sm text-muted-foreground">{session.review.reviewText}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(session.status)}
            <span className="text-sm font-medium">${session.totalCost}</span>
            {isUpcoming && session.discordChannelId && (
              <Button size="sm" className="bg-[#5865F2] hover:bg-[#4752C4]">
                Join Discord
              </Button>
            )}
            {isUpcoming && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => onCancel(session)}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            )}
            {canReview && (
              <Button size="sm" variant="outline" onClick={() => onReview(session)}>
                <Star className="mr-1 h-3 w-3" />
                Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
