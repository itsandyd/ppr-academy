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
  Eye,
  EyeOff,
  Globe,
  Lock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

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
      const result = await updateStatus({ sessionId, status, notes });
      if (result.success) {
        toast.success(`Session marked as ${STATUS_CONFIG[status].label.toLowerCase()}`);
        setNotesDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update session");
      }
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete session");
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
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const now = Date.now();
  const upcomingSessions =
    sessions?.filter((s) => s.status === "SCHEDULED" && s.scheduledDate > now) || [];
  const pastSessions =
    sessions?.filter((s) => s.status !== "SCHEDULED" || s.scheduledDate <= now) || [];

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coaching Sessions</h1>
        <p className="mt-1 text-muted-foreground">Manage your coaching bookings</p>
      </div>

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
              {coachingProducts.map((product) => (
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
      </div>

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
            upcomingSessions.map((session) => (
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
            pastSessions.map((session) => (
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
  const statusConfig = STATUS_CONFIG[session.status as SessionStatus];
  const StatusIcon = statusConfig.icon;
  const sessionDate = new Date(session.scheduledDate);
  const isUpcoming = session.status === "SCHEDULED" && !isPast(sessionDate);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-semibold">{session.productTitle}</h3>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                with {session.studentName || session.studentEmail || "Student"}
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
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
              </div>
              {session.notes && (
                <p className="mt-2 rounded bg-muted p-2 text-sm">{session.notes}</p>
              )}
              {session.discordSetupComplete && (
                <Badge variant="outline" className="mt-2">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Discord Ready
                </Badge>
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
