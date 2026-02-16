"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CoachingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "learn" | "create" | null;
  const { user, isLoaded: isUserLoaded } = useUser();

  useEffect(() => {
    if (!mode || mode !== "learn") {
      router.push("/dashboard/coaching?mode=learn");
    }
  }, [mode, router]);

  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  const studentSessions = useQuery(
    api.coachingProducts.getStudentSessions,
    convexUser?.clerkId ? { studentId: convexUser.clerkId } : "skip"
  );

  const isLoading =
    !isUserLoaded || (user && convexUser === undefined) || studentSessions === undefined;

  const now = Date.now();
  const upcomingSessions =
    studentSessions?.filter((s: any) => s.scheduledDate > now && s.status === "SCHEDULED") || [];
  const pastSessions =
    studentSessions?.filter((s: any) => s.scheduledDate <= now || s.status !== "SCHEDULED") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-500">
            <Clock className="mr-1 h-3 w-3" />
            Scheduled
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
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                <SessionCard key={session._id} session={session} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No Upcoming Sessions</h3>
                <p className="mb-4 text-muted-foreground">
                  Book a session with a coach to get personalized guidance
                </p>
                <Link href="/marketplace/creators">
                  <Button>Find Coaches</Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6 space-y-4">
            {pastSessions.length > 0 ? (
              pastSessions.map((session: any) => (
                <SessionCard key={session._id} session={session} getStatusBadge={getStatusBadge} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No Past Sessions</h3>
                <p className="text-muted-foreground">Your completed sessions will appear here</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6 space-y-4">
            {studentSessions.map((session: any) => (
              <SessionCard key={session._id} session={session} getStatusBadge={getStatusBadge} />
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-12 text-center">
          <Video className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No Coaching Sessions Yet</h3>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Book 1-on-1 sessions with experienced music producers and get personalized feedback on
            your tracks, production techniques, and more.
          </p>
          <Link href="/marketplace/creators">
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
              <User className="mr-2 h-4 w-4" />
              Find Coaches
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function SessionCard({
  session,
  getStatusBadge,
}: {
  session: any;
  getStatusBadge: (status: string) => React.ReactNode;
}) {
  const sessionDate = new Date(session.scheduledDate);
  const isUpcoming = session.scheduledDate > Date.now() && session.status === "SCHEDULED";

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
              </div>
              {session.notes && (
                <p className="mt-2 text-sm italic text-muted-foreground">Notes: {session.notes}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(session.status)}
            <span className="text-sm font-medium">${(session.totalCost / 100).toFixed(2)}</span>
            {isUpcoming && session.discordChannelId && (
              <Button size="sm" className="bg-[#5865F2] hover:bg-[#4752C4]">
                Join Discord
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
