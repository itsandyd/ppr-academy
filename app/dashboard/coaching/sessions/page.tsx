"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageCircle,
  Settings,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Star,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { SessionConfirmationCard } from "@/components/coaching/SessionConfirmationCard";

type SessionStatus = "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "PAID_OUT" | "CANCELLED" | "NO_SHOW" | "NO_SHOW_CREATOR" | "NO_SHOW_BUYER" | "DISPUTED" | "UNDER_REVIEW";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Calendar,
  },
  CONFIRMED: {
    label: "Awaiting Confirmation",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: AlertCircle,
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
  PAID_OUT: {
    label: "Paid Out",
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
  NO_SHOW_CREATOR: {
    label: "Coach No-Show",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
  NO_SHOW_BUYER: {
    label: "Student No-Show",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: AlertCircle,
  },
  DISPUTED: {
    label: "Disputed",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertCircle,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertCircle,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  held: { label: "Held", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  released: { label: "Released", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  refunded: { label: "Refunded", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  partial_refund: { label: "Partial Refund", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
    </div>
  );
}

export default function CoachSessionsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");

  const stats = useQuery(
    api.coachingProducts.getCoachSessionStats,
    user?.id ? { coachId: user.id } : "skip"
  );

  const sessions = useQuery(
    api.coachingProducts.getCoachSessions,
    user?.id ? { coachId: user.id } : "skip"
  );

  const coachingProducts = useQuery(
    api.coachingProducts.getCoachingProductsByCoach,
    user?.id ? { coachId: user.id } : "skip"
  );

  const calendarStatus = useQuery(
    api.googleCalendarQueries.isCalendarConnected,
    user?.id ? { userId: user.id } : "skip"
  );

  const updateStatus = useMutation(api.coachingProducts.updateSessionStatus);
  const deleteSession = useMutation(api.coachingProducts.deleteCoachingSession);
  const publishProduct = useMutation(api.coachingProducts.publishCoachingProduct);
  const unpublishProduct = useMutation(api.coachingProducts.unpublishCoachingProduct);

  const handleStatusChange = async (
    sessionId: Id<"coachingSessions">,
    status: SessionStatus,
    notes?: string
  ) => {
    try {
      const result = await updateStatus({ sessionId, status: status as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW", notes });
      if (result.success) {
        toast.success(`Session marked as ${STATUS_CONFIG[status].label.toLowerCase()}`);
        setNotesDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update session");
      }
    } catch {
      toast.error("Failed to update session");
    }
  };

  const handleDeleteSession = async (sessionId: Id<"coachingSessions">) => {
    if (!confirm("Are you sure you want to delete this session? This cannot be undone.")) {
      return;
    }
    try {
      const result = await deleteSession({ sessionId });
      if (result.success) {
        toast.success("Session deleted");
      } else {
        toast.error(result.error || "Failed to delete session");
      }
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnectCalendar = async () => {
    if (!user?.id) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/google/disconnect", { method: "POST" });
      if (res.ok) {
        toast.success("Google Calendar disconnected");
      } else {
        toast.error("Failed to disconnect Google Calendar");
      }
    } catch {
      toast.error("Failed to disconnect Google Calendar");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTogglePublish = async (
    productId: Id<"digitalProducts">,
    isCurrentlyPublished: boolean
  ) => {
    try {
      const result = isCurrentlyPublished
        ? await unpublishProduct({ productId })
        : await publishProduct({ productId });
      if (result.success) {
        toast.success(isCurrentlyPublished ? "Product is now private" : "Product is now public");
      } else {
        toast.error(result.error || "Failed to update product");
      }
    } catch {
      toast.error("Failed to update product");
    }
  };

  const now = Date.now();
  const todaySessions =
    sessions?.filter((s: any) => s.status === "SCHEDULED" && isToday(new Date(s.scheduledDate)))
      .sort((a: any, b: any) => a.scheduledDate - b.scheduledDate) || [];
  const upcomingSessions =
    sessions?.filter((s: any) => s.status === "SCHEDULED" && s.scheduledDate > now) || [];
  const pastSessions =
    sessions?.filter((s: any) => s.status !== "SCHEDULED" || s.scheduledDate <= now) || [];

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold">Coaching Sessions</h1>
        <p className="mt-1 text-muted-foreground">Manage your coaching bookings</p>
      </div>

      {/* Today View */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            {todaySessions.length > 0
              ? `You have ${todaySessions.length} session${todaySessions.length === 1 ? "" : "s"} today`
              : "No sessions scheduled for today"}
          </CardTitle>
        </CardHeader>
        {todaySessions.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {todaySessions.map((session: any) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {session.startTime} - {session.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.studentName || "Student"} · {session.duration} min
                        {session.sessionPlatform && ` · ${session.sessionPlatform.replace("_", " ")}`}
                      </p>
                    </div>
                  </div>
                  {session.sessionLink && (
                    <Button size="sm" asChild>
                      <a href={session.sessionLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Join
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {coachingProducts && coachingProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Your Coaching Products
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coachingProducts.map((product: any) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{product.title}</p>
                        {product.isPublished ? (
                          <Badge variant="default" className="bg-green-600">
                            <Globe className="mr-1 h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Lock className="mr-1 h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.duration || 60} min · ${product.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
                      <span className="text-xs text-muted-foreground">
                        {product.isPublished ? "Public" : "Private"}
                      </span>
                      <Switch
                        checked={product.isPublished || false}
                        onCheckedChange={() =>
                          handleTogglePublish(product._id, product.isPublished || false)
                        }
                      />
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/coaching/${product._id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                {calendarStatus?.connected ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Connected {calendarStatus.connectedAt && `· synced ${formatDistanceToNow(calendarStatus.connectedAt, { addSuffix: true })}`}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Avoid double-bookings and auto-add sessions to your calendar
                  </p>
                )}
              </div>
            </div>
            <div>
              {calendarStatus?.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectCalendar}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/google/auth?returnUrl=/dashboard/coaching/sessions`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Connect
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats?.upcoming || 0}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">${stats?.revenue || 0}</div>
            <div className="text-sm text-muted-foreground">Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {stats?.reviewCount && stats.reviewCount > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-600">{stats.averageRating}</span>
                  <StarRating rating={Math.round(stats.averageRating)} />
                </div>
                <div className="text-sm text-muted-foreground">{stats.reviewCount} review{stats.reviewCount === 1 ? "" : "s"}</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">--</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      {stats && (stats.pendingRevenue > 0 || stats.releasedRevenue > 0) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Coaching Earnings</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-xl font-bold text-amber-600">${stats.pendingRevenue}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Released</div>
                <div className="text-xl font-bold text-green-600">${stats.releasedRevenue}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Payments are released after the session is confirmed by both parties.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming sessions</p>
              </CardContent>
            </Card>
          ) : (
            upcomingSessions.map((session: any) => (
              <SessionCard
                key={session._id}
                session={session}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteSession}
                onAddNotes={(s) => {
                  setSelectedSession(s);
                  setSessionNotes(s.notes || "");
                  setNotesDialogOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-4">
          {pastSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No past sessions</p>
              </CardContent>
            </Card>
          ) : (
            pastSessions.map((session: any) => (
              <SessionCard
                key={session._id}
                session={session}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteSession}
                onAddNotes={(s) => {
                  setSelectedSession(s);
                  setSessionNotes(s.notes || "");
                  setNotesDialogOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Session Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add notes about this session..."
                rows={4}
                className="mt-2 bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSession) {
                  handleStatusChange(selectedSession._id, selectedSession.status, sessionNotes);
                }
              }}
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionCard({
  session,
  onStatusChange,
  onDelete,
  onAddNotes,
}: {
  session: any;
  onStatusChange: (id: Id<"coachingSessions">, status: SessionStatus, notes?: string) => void;
  onDelete: (id: Id<"coachingSessions">) => void;
  onAddNotes: (session: any) => void;
}) {
  const { user } = useUser();
  const statusConfig = STATUS_CONFIG[session.status as SessionStatus] || STATUS_CONFIG.SCHEDULED;
  const StatusIcon = statusConfig.icon;
  const sessionDate = new Date(session.scheduledDate);
  const isUpcoming = session.status === "SCHEDULED" && !isPast(sessionDate);
  const paymentConfig = session.paymentStatus ? PAYMENT_STATUS_CONFIG[session.paymentStatus] : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{session.productTitle}</h3>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {paymentConfig && (
                  <Badge className={paymentConfig.color}>
                    <DollarSign className="mr-1 h-3 w-3" />
                    {paymentConfig.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                with {session.studentName || session.studentEmail || "Student"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(sessionDate, "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {session.startTime} - {session.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${session.totalCost}</span>
                </div>
                {session.sessionPlatform && (
                  <Badge variant="outline" className="text-xs">
                    {session.sessionPlatform.replace("_", " ")}
                  </Badge>
                )}
              </div>

              {/* Join Session button for upcoming sessions with a link */}
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

              {session.notes && (
                <div className="mt-2 rounded bg-muted p-2 text-sm">
                  <span className="font-medium text-xs text-muted-foreground">Student notes:</span>
                  <p className="mt-0.5">{session.notes}</p>
                </div>
              )}
              {session.discordSetupComplete && (
                <Badge variant="outline" className="mt-2">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Discord Ready
                </Badge>
              )}
              {session.status === "CONFIRMED" && user?.id && (
                <div className="mt-3">
                  <SessionConfirmationCard
                    sessionId={session._id}
                    userId={user.id}
                    isCoach={true}
                    otherPartyName={session.studentName || session.studentEmail || "Student"}
                  />
                </div>
              )}

              {/* Review display for past sessions */}
              {session.review && (
                <div className="mt-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={session.review.rating} />
                    <span className="text-xs text-muted-foreground">
                      from {session.studentName || "Student"}
                    </span>
                  </div>
                  {session.review.reviewText && (
                    <p className="text-sm text-muted-foreground">{session.review.reviewText}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black">
              {isUpcoming && session.sessionLink && (
                <DropdownMenuItem asChild>
                  <a href={session.sessionLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Join Session
                  </a>
                </DropdownMenuItem>
              )}
              {isUpcoming && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(session._id, "IN_PROGRESS")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Start Session
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(session._id, "CANCELLED")}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
              {session.status === "IN_PROGRESS" && (
                <DropdownMenuItem onClick={() => onStatusChange(session._id, "COMPLETED")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {session.status === "SCHEDULED" && isPast(sessionDate) && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(session._id, "COMPLETED")}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(session._id, "NO_SHOW")}>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    No Show
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => onAddNotes(session)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {session.notes ? "Edit Notes" : "Add Notes"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(session._id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
