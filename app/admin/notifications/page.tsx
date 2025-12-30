"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Bell,
  Plus,
  Trash2,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  User,
  Globe,
  Target,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function AdminNotificationsPage() {
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch notifications and stats
  const notifications = useQuery(
    api.notifications.getAllNotifications,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const stats = useQuery(
    api.notifications.getNotificationStats,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Mutations
  const createNotification = useMutation(api.notifications.createNotification);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [targetType, setTargetType] = useState<"all" | "students" | "creators" | "specific">("all");
  const [category, setCategory] = useState<
    | "announcements"
    | "courseUpdates"
    | "newContent"
    | "mentions"
    | "replies"
    | "purchases"
    | "earnings"
    | "systemAlerts"
    | "marketing"
  >("announcements");
  const [sendEmail, setSendEmail] = useState(true);
  const [link, setLink] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!user?.id) {
      toast.error("Authentication required");
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setIsCreating(true);

    try {
      const result = await createNotification({
        clerkId: user.id,
        title: title.trim(),
        message: message.trim(),
        type,
        targetType,
        category,
        sendEmail,
        link: link.trim() || undefined,
        actionLabel: actionLabel.trim() || undefined,
      });

      toast.success(result.message);

      // Reset form
      setTitle("");
      setMessage("");
      setType("info");
      setTargetType("all");
      setCategory("announcements");
      setSendEmail(true);
      setLink("");
      setActionLabel("");
      setIsCreateOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create notification");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (notificationId: Id<"notifications">) => {
    if (!user?.id) return;

    try {
      await deleteNotification({
        clerkId: user.id,
        notificationId,
      });
      toast.success("Notification deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete notification");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "text-blue-600 bg-blue-500/10";
      case "success":
        return "text-green-600 bg-green-500/10";
      case "warning":
        return "text-orange-600 bg-orange-500/10";
      case "error":
        return "text-red-600 bg-red-500/10";
      default:
        return "text-gray-600 bg-gray-500/10";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!notifications || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 animate-pulse text-purple-600" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Notifications Manager</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Send and manage system notifications to users
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Create New Notification</DialogTitle>
                  <DialogDescription className="mt-1 text-base">
                    Send targeted notifications to your users
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              {/* Notification Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  NOTIFICATION DETAILS
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="New feature announcement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white dark:bg-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="We've launched a new feature that we think you'll love..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="bg-white dark:bg-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-base">
                      Notification Type
                    </Label>
                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="info">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span>Info</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="success">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Success</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="warning">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span>Warning</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="error">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Error</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetType" className="text-base">
                      Target Audience
                    </Label>
                    <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <div>
                              <p className="font-medium">All Users</p>
                              <p className="text-xs text-muted-foreground">
                                Everyone on the platform
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="students">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <p className="font-medium">Students</p>
                              <p className="text-xs text-muted-foreground">
                                Users with course enrollments
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="creators">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <div>
                              <p className="font-medium">Creators</p>
                              <p className="text-xs text-muted-foreground">
                                Users who created courses/stores
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Category and Email Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base">
                      Notification Category
                    </Label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="announcements">📢 Announcements</SelectItem>
                        <SelectItem value="courseUpdates">📚 Course Updates</SelectItem>
                        <SelectItem value="newContent">✨ New Content</SelectItem>
                        <SelectItem value="mentions">@️ Mentions</SelectItem>
                        <SelectItem value="replies">💬 Replies</SelectItem>
                        <SelectItem value="purchases">🛒 Purchases</SelectItem>
                        <SelectItem value="earnings">💰 Earnings</SelectItem>
                        <SelectItem value="systemAlerts">⚠️ System Alerts</SelectItem>
                        <SelectItem value="marketing">📧 Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Controls user email preferences</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Email Delivery</Label>
                    <div className="flex h-10 items-center space-x-2 rounded-md border bg-white px-3 dark:bg-black">
                      <input
                        type="checkbox"
                        id="sendEmail"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor="sendEmail" className="cursor-pointer text-sm font-medium">
                        Send email notifications
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">Respects user email preferences</p>
                  </div>
                </div>
              </div>

              {/* Optional Action */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  OPTIONAL ACTION (ADVANCED)
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionLabel" className="text-base">
                    Action Button Label
                  </Label>
                  <Input
                    id="actionLabel"
                    placeholder="Learn More"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    className="bg-white dark:bg-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link" className="text-base">
                    Link URL
                  </Label>
                  <Input
                    id="link"
                    placeholder="/home"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="bg-white dark:bg-black"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a relative path (e.g., /home) or full URL. Users will be redirected here
                    when clicking the notification.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !title.trim() || !message.trim()}
                  className="flex-1"
                  size="lg"
                >
                  {isCreating ? "Sending..." : "Send Notification"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.total.toLocaleString()}</p>
              <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.unread.toLocaleString()}</p>
              <p className="text-sm font-medium text-muted-foreground">Unread by Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {stats.byType.info.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Info Notifications</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">
                {stats.byType.success.toLocaleString()}
              </p>
              <p className="text-sm font-medium text-muted-foreground">Success Notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications List */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  No notifications sent yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first notification to reach your users
                </p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div
                  key={notification._id}
                  className="flex items-start gap-4 rounded-lg border-2 p-4 transition-all hover:shadow-md"
                >
                  <div className={`rounded-full p-3 ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold">{notification.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {notification.type}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>To: {notification.userId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                      {notification.read && (
                        <Badge variant="secondary" className="text-xs">
                          Read
                        </Badge>
                      )}
                    </div>

                    {notification.link && (
                      <div className="mt-2 truncate text-xs text-blue-600 dark:text-blue-400">
                        🔗 {notification.link}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(notification._id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
