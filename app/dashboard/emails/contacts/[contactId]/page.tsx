"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  Tag,
  Calendar,
  MousePointerClick,
  Eye,
  Send,
  UserMinus,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";
import { useState } from "react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ContactProfilePage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });

  const storeId = user?.id || "";

  const contact = useQuery(
    api.emailContacts.getContact,
    contactId ? { contactId: contactId as Id<"emailContacts"> } : "skip"
  );

  const activity = useQuery(
    api.emailContacts.getContactActivity,
    contactId ? { contactId: contactId as Id<"emailContacts">, limit: 50 } : "skip"
  );

  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : "skip");

  const updateContact = useMutation(api.emailContacts.updateContact);
  const deleteContact = useMutation(api.emailContacts.deleteContact);
  const addTag = useMutation(api.emailContacts.addTagToContact);
  const removeTag = useMutation(api.emailContacts.removeTagFromContact);
  const tagWithEnrollments = useMutation(api.emailContactSync.tagContactWithEnrollments);

  const [isTaggingEnrollments, setIsTaggingEnrollments] = useState(false);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  if (!contact) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  const availableTags = tags?.filter((tag: any) => !contact.tagIds?.includes(tag._id));

  const handleSaveEdit = async () => {
    try {
      await updateContact({
        userId: user?.id || "",
        contactId: contactId as Id<"emailContacts">,
        firstName: editForm.firstName || undefined,
        lastName: editForm.lastName || undefined,
      });
      toast({ title: "Contact updated" });
      setIsEditing(false);
    } catch {
      toast({ title: "Failed to update contact", variant: "destructive" });
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm("Unsubscribe this contact?")) return;

    try {
      await updateContact({
        userId: user?.id || "",
        contactId: contactId as Id<"emailContacts">,
        status: "unsubscribed",
      });
      toast({ title: "Contact unsubscribed" });
    } catch {
      toast({ title: "Failed to unsubscribe", variant: "destructive" });
    }
  };

  const handleResubscribe = async () => {
    try {
      await updateContact({
        userId: user?.id || "",
        contactId: contactId as Id<"emailContacts">,
        status: "subscribed",
      });
      toast({ title: "Contact resubscribed" });
    } catch {
      toast({ title: "Failed to resubscribe", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this contact and all their activity history?")) return;

    try {
      await deleteContact({ userId: user?.id || "", contactId: contactId as Id<"emailContacts"> });
      toast({ title: "Contact deleted" });
      router.push("/dashboard/emails?mode=create");
    } catch {
      toast({ title: "Failed to delete contact", variant: "destructive" });
    }
  };

  const handleAddTag = async () => {
    if (!selectedTagId) return;

    try {
      await addTag({
        contactId: contactId as Id<"emailContacts">,
        tagId: selectedTagId as Id<"emailTags">,
      });
      toast({ title: "Tag added" });
      setIsAddTagOpen(false);
      setSelectedTagId("");
    } catch {
      toast({ title: "Failed to add tag", variant: "destructive" });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await removeTag({
        contactId: contactId as Id<"emailContacts">,
        tagId: tagId as Id<"emailTags">,
      });
      toast({ title: "Tag removed" });
    } catch {
      toast({ title: "Failed to remove tag", variant: "destructive" });
    }
  };

  const handleTagWithEnrollments = async () => {
    setIsTaggingEnrollments(true);
    try {
      const result = await tagWithEnrollments({
        storeId,
        contactId: contactId as Id<"emailContacts">,
      });
      if (result.success) {
        toast({
          title: "Tags added from enrollments",
          description: `Added ${result.tagsAdded.length} tags: ${result.tagsAdded.slice(0, 3).join(", ")}${result.tagsAdded.length > 3 ? "..." : ""}`,
        });
      } else {
        toast({
          title: "Could not add enrollment tags",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to tag enrollments",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTaggingEnrollments(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "subscribed":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "unsubscribed":
        return <UserMinus className="h-4 w-4 text-amber-600" />;
      case "email_sent":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "email_opened":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "email_clicked":
        return <MousePointerClick className="h-4 w-4 text-cyan-600" />;
      case "tag_added":
        return <Tag className="h-4 w-4 text-green-600" />;
      case "tag_removed":
        return <Tag className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (type: string, metadata: any) => {
    switch (type) {
      case "subscribed":
        return "Subscribed to list";
      case "unsubscribed":
        return "Unsubscribed from list";
      case "email_sent":
        return metadata?.emailSubject ? `Email sent: "${metadata.emailSubject}"` : "Email sent";
      case "email_opened":
        return "Opened email";
      case "email_clicked":
        return metadata?.linkClicked
          ? `Clicked link: ${metadata.linkClicked}`
          : "Clicked link in email";
      case "tag_added":
        return `Tag added: ${metadata?.tagName || "Unknown"}`;
      case "tag_removed":
        return `Tag removed: ${metadata?.tagName || "Unknown"}`;
      case "campaign_enrolled":
        return "Enrolled in sequence";
      case "campaign_completed":
        return "Completed sequence";
      default:
        return type.replace(/_/g, " ");
    }
  };

  const displayName =
    contact.firstName || contact.lastName
      ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
      : contact.email;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/emails?mode=create")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold">{displayName}</h1>
          <p className="text-muted-foreground">{contact.email}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {contact.status === "subscribed" ? (
            <Button variant="outline" onClick={handleUnsubscribe}>
              <UserMinus className="mr-2 h-4 w-4" />
              Unsubscribe
            </Button>
          ) : (
            <Button variant="outline" onClick={handleResubscribe}>
              <Plus className="mr-2 h-4 w-4" />
              Resubscribe
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Contact Details</CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditForm({
                      firstName: contact.firstName || "",
                      lastName: contact.lastName || "",
                    });
                    setIsEditing(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">First Name</div>
                    <div className="font-medium">{contact.firstName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Name</div>
                    <div className="font-medium">{contact.lastName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{contact.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge
                      className={cn(
                        contact.status === "subscribed" &&
                          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                        contact.status === "unsubscribed" &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      )}
                    >
                      {contact.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Source</div>
                    <div className="font-medium">{contact.source || "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Subscribed</div>
                    <div className="font-medium">
                      {new Date(contact.subscribedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tags</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTagWithEnrollments}
                  disabled={isTaggingEnrollments}
                >
                  <Tag className={cn("mr-2 h-4 w-4", isTaggingEnrollments && "animate-pulse")} />
                  {isTaggingEnrollments ? "Tagging..." : "Tag from Enrollments"}
                </Button>
                <Dialog open={isAddTagOpen} onOpenChange={setIsAddTagOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!availableTags?.length}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Add Tag</DialogTitle>
                      <DialogDescription>Select a tag to add to this contact</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tag" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {availableTags?.map((tag: any) => (
                            <SelectItem key={tag._id} value={tag._id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddTagOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTag} disabled={!selectedTagId}>
                        Add Tag
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contact.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag: any) => (
                    <Badge
                      key={tag._id}
                      variant="outline"
                      style={{ borderColor: tag.color, color: tag.color }}
                      className="pr-1"
                    >
                      {tag.name}
                      <button
                        onClick={() => handleRemoveTag(tag._id)}
                        className="ml-2 rounded-full p-0.5 hover:bg-muted"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {activity?.length ? (
                <div className="space-y-4">
                  {activity.map((item: any) => (
                    <div key={item._id} className="flex items-start gap-3">
                      <div className="mt-1">{getActivityIcon(item.activityType)}</div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {getActivityLabel(item.activityType, item.metadata)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Emails Sent</span>
                </div>
                <span className="font-bold">{contact.emailsSent}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Opens</span>
                </div>
                <span className="font-bold">{contact.emailsOpened}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Clicks</span>
                </div>
                <span className="font-bold">{contact.emailsClicked}</span>
              </div>
              <hr />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Open Rate</span>
                <span className="font-bold">
                  {contact.emailsSent > 0
                    ? Math.round((contact.emailsOpened / contact.emailsSent) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Click Rate</span>
                <span className="font-bold">
                  {contact.emailsSent > 0
                    ? Math.round((contact.emailsClicked / contact.emailsSent) * 100)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Subscribed:</span>
                <span>{new Date(contact.subscribedAt).toLocaleDateString()}</span>
              </div>
              {contact.lastOpenedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Open:</span>
                  <span>{new Date(contact.lastOpenedAt).toLocaleDateString()}</span>
                </div>
              )}
              {contact.lastClickedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Click:</span>
                  <span>{new Date(contact.lastClickedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
