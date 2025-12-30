"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Loader2,
  Sparkles,
  Send,
  Clock,
  Users,
  Mail,
  Edit3,
  Check,
  AlertCircle,
  TrendingUp,
  History,
  Eye,
} from "lucide-react";

export default function CourseNotificationsPage() {
  const params = useParams();
  const { user } = useUser();
  const courseId = params.courseId as Id<"courses">;

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [editedCopy, setEditedCopy] = useState<any>(null);

  // Convex queries
  const changes = useQuery(
    api.courseNotificationQueries.detectCourseChanges,
    user?.id && courseId ? { courseId, userId: user.id } : "skip"
  );
  const notificationHistory = useQuery(
    api.courseNotificationQueries.getCourseNotificationHistory,
    user?.id && courseId ? { courseId, userId: user.id } : "skip"
  );
  const stats = useQuery(
    api.courseNotificationQueries.getCourseNotificationStats,
    courseId ? { courseId } : "skip"
  );
  const course = useQuery(
    api.courses.getCourseForEdit,
    user?.id && courseId ? { courseId, userId: user.id } : "skip"
  );

  // Convex actions/mutations
  const generateCopy = useAction(api.courseNotifications.generateNotificationCopy);
  const sendNotification = useMutation(api.courseNotificationQueries.sendCourseUpdateNotification);

  const handleGenerateCopy = async () => {
    if (!user || !courseId || !changes?.changes) return;

    setIsGenerating(true);

    try {
      const result = await generateCopy({
        courseId,
        userId: user.id,
        changes: changes.changes,
      });

      if (result.success && result.copy) {
        setGeneratedCopy(result.copy);
        setEditedCopy(result.copy);
      } else {
        alert(result.error || "Failed to generate notification");
      }
    } catch (error) {
      console.error("Error generating notification:", error);
      alert("Failed to generate notification. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendNotification = async (customCopy?: any) => {
    if (!user || !courseId) return;

    const copyToSend = customCopy || editedCopy;
    if (!copyToSend) return;

    const studentCount = changes?.enrolledStudentCount || 0;

    if (studentCount === 0) {
      alert(
        "⚠️ No enrolled students yet. Add students to the course first before sending notifications."
      );
      return;
    }

    if (
      !confirm(
        `📢 Send notification to ${studentCount} enrolled student${studentCount !== 1 ? "s" : ""}?\n\nThey will receive:\n• In-app notification\n${sendEmail ? "• Email notification" : "• No email (disabled)"}`
      )
    ) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendNotification({
        courseId,
        userId: user.id,
        title: copyToSend.title,
        message: copyToSend.message,
        emailSubject: copyToSend.emailSubject || copyToSend.title,
        emailPreview: copyToSend.emailPreview || copyToSend.message.substring(0, 100),
        sendEmail,
      });

      if (result.success) {
        alert(`✅ Notification sent to ${result.recipientCount} students!`);
        setGeneratedCopy(null);
        setEditedCopy(null);
        setEditMode(false);
      } else {
        alert(result.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleResendNotification = async (notification: any) => {
    if (
      !confirm(
        `Resend this notification to currently enrolled students?\n\n"${notification.title}"`
      )
    ) {
      return;
    }

    await handleSendNotification({
      title: notification.title,
      message: notification.message,
      emailSubject: notification.title,
      emailPreview: notification.message.substring(0, 100),
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please sign in to access notifications.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (changes === undefined || course === undefined) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const currentCopy = editMode ? editedCopy : generatedCopy;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Course Update Notifications</h1>
          <p className="text-muted-foreground">
            Notify your students about new content and updates
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalSent}</div>
                <div className="text-sm text-muted-foreground">Total Sent</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalRecipients}</div>
                <div className="text-sm text-muted-foreground">Total Reach</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.averageRecipients}</div>
                <div className="text-sm text-muted-foreground">Avg. Recipients</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.lastSentAt
                    ? Math.floor((Date.now() - stats.lastSentAt) / (1000 * 60 * 60 * 24))
                    : "-"}
                </div>
                <div className="text-sm text-muted-foreground">Days Since Last</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enrolled Students Info */}
      <Card
        className={
          changes.enrolledStudentCount > 0
            ? "border-green-200 dark:border-green-800"
            : "border-amber-200 dark:border-amber-800"
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  changes.enrolledStudentCount > 0
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-amber-100 dark:bg-amber-900"
                }`}
              >
                <Users
                  className={`h-6 w-6 ${
                    changes.enrolledStudentCount > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {changes.enrolledStudentCount} Enrolled Student
                  {changes.enrolledStudentCount !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {changes.enrolledStudentCount > 0
                    ? "Will receive your course update notifications"
                    : "No students enrolled yet - notifications will be queued"}
                </p>
              </div>
            </div>
            <Badge
              variant={changes.enrolledStudentCount > 0 ? "default" : "secondary"}
              className="px-4 py-2 text-lg"
            >
              {changes.enrolledStudentCount}
            </Badge>
          </div>
          {changes.enrolledStudentCount === 0 && (
            <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                Notifications will be sent automatically to students as they enroll in your course.
                Consider sharing your course to get students enrolled!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Change Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Detected Changes
          </CardTitle>
          <CardDescription>
            {changes.lastNotification
              ? `Since last notification on ${new Date(changes.lastNotification.sentAt).toLocaleDateString()}`
              : "This will be your first notification"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {changes.hasChanges ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-950">
                  <div className="text-2xl font-bold text-blue-600">
                    +{changes.changes?.newModules || 0}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">New Modules</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600">
                    +{changes.changes?.newLessons || 0}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">New Lessons</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-950">
                  <div className="text-2xl font-bold text-purple-600">
                    +{changes.changes?.newChapters || 0}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">New Chapters</div>
                </div>
              </div>

              {changes.changes?.newModulesList && changes.changes.newModulesList.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">New Modules Added:</Label>
                  <ul className="space-y-1">
                    {changes.changes.newModulesList.map((module: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span>{module}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <Users className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  <span className="font-semibold">
                    {changes.enrolledStudentCount} enrolled student
                    {changes.enrolledStudentCount !== 1 ? "s" : ""}
                  </span>{" "}
                  will receive this notification.
                  {changes.enrolledStudentCount === 0 && (
                    <span className="mt-1 block text-amber-700 dark:text-amber-400">
                      ⚠️ No enrolled students yet. Notifications will be sent when students enroll.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No changes detected since your last notification. Add new content to notify
                students!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generate & Send Notification */}
      {changes.hasChanges && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {generatedCopy ? "Review Notification" : "Generate Notification"}
            </CardTitle>
            <CardDescription>
              {generatedCopy
                ? "Review and customize your notification before sending"
                : "AI will create an engaging update notification for your students"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!generatedCopy ? (
              <Button
                onClick={handleGenerateCopy}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating notification...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Notification with AI
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-6">
                {/* Edit Mode Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Edit notification before sending</Label>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                    {editMode ? (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </>
                    ) : (
                      <>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>

                {/* Notification Title */}
                <div className="space-y-2">
                  <Label>Notification Title</Label>
                  {editMode ? (
                    <Input
                      value={currentCopy.title}
                      onChange={(e) => setEditedCopy({ ...editedCopy, title: e.target.value })}
                      className="text-base font-semibold"
                    />
                  ) : (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="font-semibold text-foreground">{currentCopy.title}</p>
                    </div>
                  )}
                </div>

                {/* Notification Message */}
                <div className="space-y-2">
                  <Label>In-App Message</Label>
                  {editMode ? (
                    <Textarea
                      value={currentCopy.message}
                      onChange={(e) => setEditedCopy({ ...editedCopy, message: e.target.value })}
                      rows={6}
                      className="text-base"
                    />
                  ) : (
                    <div className="rounded-lg bg-muted p-4">
                      <p className="whitespace-pre-wrap text-foreground">{currentCopy.message}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Email Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label>Also send via email</Label>
                    </div>
                    <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                  </div>

                  {sendEmail && (
                    <>
                      <div className="space-y-2">
                        <Label>Email Subject Line</Label>
                        {editMode ? (
                          <Input
                            value={currentCopy.emailSubject}
                            onChange={(e) =>
                              setEditedCopy({ ...editedCopy, emailSubject: e.target.value })
                            }
                          />
                        ) : (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-foreground">{currentCopy.emailSubject}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Email Preview Text</Label>
                        {editMode ? (
                          <Input
                            value={currentCopy.emailPreview}
                            onChange={(e) =>
                              setEditedCopy({ ...editedCopy, emailPreview: e.target.value })
                            }
                          />
                        ) : (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-sm text-muted-foreground">
                              {currentCopy.emailPreview}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Send Actions */}
                <div className="flex items-center justify-between gap-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Ready to send to {changes?.enrolledStudentCount || 0} enrolled student
                        {(changes?.enrolledStudentCount || 0) !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {sendEmail ? "In-app notification + Email" : "In-app notification only"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedCopy(null);
                        setEditedCopy(null);
                        setEditMode(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendNotification} disabled={isSending} size="lg">
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Notification
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Notification History
          </CardTitle>
          <CardDescription>Past notifications sent to your students</CardDescription>
        </CardHeader>
        <CardContent>
          {notificationHistory && notificationHistory.length > 0 ? (
            <div className="space-y-4">
              {notificationHistory.map((notification: any) => (
                <div
                  key={notification._id}
                  className="space-y-3 rounded-lg border p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {notification.emailSent && (
                        <Badge variant="secondary" className="w-fit">
                          <Mail className="mr-1 h-3 w-3" />
                          Email
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendNotification(notification)}
                        disabled={isSending}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Resend
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(notification.sentAt).toLocaleDateString()} at{" "}
                      {new Date(notification.sentAt).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {notification.recipientCount} recipients
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {notification.changes.newModules > 0 && (
                      <Badge variant="outline">+{notification.changes.newModules} modules</Badge>
                    )}
                    {notification.changes.newLessons > 0 && (
                      <Badge variant="outline">+{notification.changes.newLessons} lessons</Badge>
                    )}
                    {notification.changes.newChapters > 0 && (
                      <Badge variant="outline">+{notification.changes.newChapters} chapters</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications sent yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Info */}
      {course && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Course Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-lg font-bold">{changes.currentState.totalModules}</div>
                <div className="text-muted-foreground">Modules</div>
              </div>
              <div>
                <div className="text-lg font-bold">{changes.currentState.totalLessons}</div>
                <div className="text-muted-foreground">Lessons</div>
              </div>
              <div>
                <div className="text-lg font-bold">{changes.currentState.totalChapters}</div>
                <div className="text-muted-foreground">Chapters</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
