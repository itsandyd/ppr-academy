"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  Search,
  CalendarPlus,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { format, isPast, formatDistanceToNow } from "date-fns";

type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Calendar,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "No Show",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: AlertCircle,
  },
};

export default function LibraryCoachingPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  const sessions = useQuery(
    api.coachingProducts.getStudentSessions,
    user?.id ? { studentId: user.id } : "skip"
  );

  const now = Date.now();
  const upcomingSessions =
    sessions?.filter((s) => s.status === "SCHEDULED" && s.scheduledDate > now) || [];
  const pastSessions =
    sessions?.filter((s) => s.status !== "SCHEDULED" || s.scheduledDate <= now) || [];

  const filteredUpcoming = upcomingSessions.filter(
    (s) =>
      s.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.coachName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPast = pastSessions.filter(
    (s) =>
      s.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.coachName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: sessions?.length || 0,
    upcoming: upcomingSessions.length,
    completed: sessions?.filter((s) => s.status === "COMPLETED").length || 0,
    cancelled: sessions?.filter((s) => s.status === "CANCELLED").length || 0,
  };

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Coaching</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your coaching sessions and connect with mentors
          </p>
        </div>
        <Button asChild>
          <Link href="/marketplace">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book New Session
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({filteredUpcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({filteredPast.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {sessions === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUpcoming.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">No upcoming sessions</h2>
                <p className="mb-6 text-muted-foreground">
                  Book a coaching session to get personalized guidance
                </p>
                <Button asChild>
                  <Link href="/marketplace">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Browse Coaches
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredUpcoming.map((session) => <SessionCard key={session._id} session={session} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
          {filteredPast.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No past sessions</p>
              </CardContent>
            </Card>
          ) : (
            filteredPast.map((session) => <SessionCard key={session._id} session={session} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionCard({ session }: { session: any }) {
  const statusConfig = STATUS_CONFIG[session.status as SessionStatus];
  const StatusIcon = statusConfig.icon;
  const sessionDate = new Date(session.scheduledDate);
  const isUpcoming = session.status === "SCHEDULED" && !isPast(sessionDate);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{session.productTitle}</h3>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">with {session.coachName || "Coach"}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(sessionDate, "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {session.startTime} - {session.endTime}
                  </span>
                </div>
                <span>{session.duration} min</span>
              </div>
              {isUpcoming && (
                <p className="mt-2 text-sm text-blue-600">
                  Starts {formatDistanceToNow(sessionDate, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {session.discordChannelId && isUpcoming && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://discord.com/channels/${session.discordChannelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Discord
                </a>
              </Button>
            )}
            {session.storeSlug && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/${session.storeSlug}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Coach
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
