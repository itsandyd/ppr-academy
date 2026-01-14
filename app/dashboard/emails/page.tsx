"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Zap,
  Send,
  Tag,
  Workflow,
  MoreHorizontal,
  Search,
  Upload,
  UserPlus,
  RefreshCw,
  Pencil,
  Power,
  Megaphone,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EmailCampaignsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("broadcast");
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  const [newContact, setNewContact] = useState({ email: "", firstName: "", lastName: "" });
  const [newTag, setNewTag] = useState({ name: "", color: "#3b82f6", description: "" });

  const storeId = user?.id ?? "";

  const contacts = useQuery(
    api.emailContacts.listContacts,
    storeId
      ? {
          storeId,
          ...(selectedTagFilter ? { tagId: selectedTagFilter as Id<"emailTags"> } : {}),
        }
      : "skip"
  );
  // Unfiltered contacts for broadcast (so it's not affected by contacts tab filter)
  const allContacts = useQuery(
    api.emailContacts.listContacts,
    storeId ? { storeId } : "skip"
  );
  const contactStats = useQuery(api.emailContacts.getContactStats, storeId ? { storeId } : "skip");
  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : "skip");
  const tagStats = useQuery(api.emailTags.getTagStats, storeId ? { storeId } : "skip");
  const workflows = useQuery(api.emailWorkflows.listWorkflows, storeId ? { storeId } : "skip");

  const createContact = useMutation(api.emailContacts.createContact);
  const deleteContact = useMutation(api.emailContacts.deleteContact);
  const syncCustomers = useMutation(api.emailContacts.syncCustomersToEmailContacts);
  const createTag = useMutation(api.emailTags.createTag);
  const deleteTag = useMutation(api.emailTags.deleteTag);
  const enrollContact = useMutation(api.emailWorkflows.enrollContactInWorkflow);
  const bulkEnrollContacts = useMutation(api.emailWorkflows.bulkEnrollContactsInWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const toggleWorkflowActive = useMutation(api.emailWorkflows.toggleWorkflowActive);

  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [renameWorkflowId, setRenameWorkflowId] = useState<string | null>(null);
  const [renameWorkflowName, setRenameWorkflowName] = useState("");

  // Broadcast email state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [selectedBroadcastContacts, setSelectedBroadcastContacts] = useState<Set<string>>(new Set());
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSearchQuery, setBroadcastSearchQuery] = useState("");
  const [broadcastTagFilter, setBroadcastTagFilter] = useState<string | null>(null);
  const sendBroadcastEmail = useAction(api.emails.sendBroadcastEmail);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const handleCreateContact = async () => {
    if (!newContact.email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    try {
      await createContact({
        storeId,
        email: newContact.email,
        firstName: newContact.firstName || undefined,
        lastName: newContact.lastName || undefined,
        source: "manual",
      });

      toast({ title: "Contact added!" });
      setIsCreateContactOpen(false);
      setNewContact({ email: "", firstName: "", lastName: "" });
    } catch (error: any) {
      toast({ title: error.message || "Failed to add contact", variant: "destructive" });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Delete this contact?")) return;

    try {
      await deleteContact({ contactId: contactId as any });
      toast({ title: "Contact deleted" });
    } catch {
      toast({ title: "Failed to delete contact", variant: "destructive" });
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast({ title: "Tag name required", variant: "destructive" });
      return;
    }

    try {
      await createTag({
        storeId,
        name: newTag.name,
        color: newTag.color,
        description: newTag.description || undefined,
      });

      toast({ title: "Tag created!" });
      setIsCreateTagOpen(false);
      setNewTag({ name: "", color: "#3b82f6", description: "" });
    } catch {
      toast({ title: "Failed to create tag", variant: "destructive" });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Delete this tag?")) return;

    try {
      await deleteTag({ tagId: tagId as any });
      toast({ title: "Tag deleted" });
    } catch {
      toast({ title: "Failed to delete tag", variant: "destructive" });
    }
  };

  const handleSyncCustomers = async () => {
    setIsSyncing(true);
    try {
      const result = await syncCustomers({ storeId });
      toast({
        title: "Sync Complete",
        description: `Added ${result.synced} contacts, ${result.skipped} already existed`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to sync customers",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEnrollContact = async (contactId: string, workflowId: string) => {
    try {
      await enrollContact({ contactId: contactId as any, workflowId: workflowId as any });
      toast({ title: "Contact enrolled in automation" });
    } catch (error: any) {
      toast({
        title: "Failed to enroll",
        description: error.message || "Contact may already be enrolled",
        variant: "destructive",
      });
    }
  };

  const handleBulkEnroll = async (workflowId: string) => {
    if (selectedContacts.size === 0) return;
    setIsEnrolling(true);
    try {
      const result = await bulkEnrollContacts({
        workflowId: workflowId as any,
        contactIds: Array.from(selectedContacts) as any[],
      });
      toast({
        title: "Bulk Enrollment Complete",
        description: `Enrolled ${result.enrolled}, skipped ${result.skipped} (already enrolled)`,
      });
      setSelectedContacts(new Set());
    } catch {
      toast({ title: "Failed to enroll contacts", variant: "destructive" });
    } finally {
      setIsEnrolling(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const toggleAllContacts = () => {
    if (!filteredContacts) return;
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c: any) => c._id)));
    }
  };

  const handleRenameWorkflow = async () => {
    if (!renameWorkflowId || !renameWorkflowName.trim()) return;
    try {
      await updateWorkflow({
        workflowId: renameWorkflowId as any,
        name: renameWorkflowName.trim(),
      });
      toast({ title: "Workflow renamed" });
      setRenameWorkflowId(null);
      setRenameWorkflowName("");
    } catch {
      toast({ title: "Failed to rename workflow", variant: "destructive" });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm("Delete this workflow and all its executions?")) return;
    try {
      await deleteWorkflow({ workflowId: workflowId as any });
      toast({ title: "Workflow deleted" });
    } catch {
      toast({ title: "Failed to delete workflow", variant: "destructive" });
    }
  };

  const handleToggleWorkflow = async (workflowId: string, currentState: boolean) => {
    try {
      await toggleWorkflowActive({ workflowId: workflowId as any, isActive: !currentState });
      toast({ title: !currentState ? "Workflow activated" : "Workflow paused" });
    } catch {
      toast({ title: "Failed to toggle workflow", variant: "destructive" });
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "lead_signup":
        return "Lead Signup";
      case "product_purchase":
        return "Purchase";
      case "tag_added":
        return "Tag Added";
      case "manual":
        return "Manual";
      default:
        return type;
    }
  };

  const filteredContacts = contacts?.filter((c: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.email?.toLowerCase().includes(query) ||
      c.firstName?.toLowerCase().includes(query) ||
      c.lastName?.toLowerCase().includes(query)
    );
  });

  // Filtered contacts for broadcast
  const filteredBroadcastContacts = allContacts?.filter((c: any) => {
    if (c.status !== "subscribed") return false;
    // Apply tag filter
    if (broadcastTagFilter && !c.tagIds?.includes(broadcastTagFilter)) return false;
    // Apply search filter
    if (!broadcastSearchQuery) return true;
    const query = broadcastSearchQuery.toLowerCase();
    return (
      c.email?.toLowerCase().includes(query) ||
      c.firstName?.toLowerCase().includes(query) ||
      c.lastName?.toLowerCase().includes(query)
    );
  });

  const toggleBroadcastContactSelection = (contactId: string) => {
    setSelectedBroadcastContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const toggleAllBroadcastContacts = () => {
    if (!filteredBroadcastContacts) return;
    if (selectedBroadcastContacts.size === filteredBroadcastContacts.length) {
      setSelectedBroadcastContacts(new Set());
    } else {
      setSelectedBroadcastContacts(new Set(filteredBroadcastContacts.map((c: any) => c._id)));
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim()) {
      toast({ title: "Subject line required", variant: "destructive" });
      return;
    }
    if (!broadcastContent.trim()) {
      toast({ title: "Email content required", variant: "destructive" });
      return;
    }
    if (selectedBroadcastContacts.size === 0) {
      toast({ title: "Select at least one recipient", variant: "destructive" });
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const result = await sendBroadcastEmail({
        storeId,
        subject: broadcastSubject,
        htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">${broadcastContent.replace(/\n/g, "<br>")}<br><br><p style="color: #6b7280; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;"><a href="{{unsubscribeLink}}" style="color: #6b7280;">Unsubscribe</a></p></div>`,
        contactIds: Array.from(selectedBroadcastContacts) as any[],
      });

      if (result.success) {
        toast({ title: "Broadcast sent!", description: result.message });
        setBroadcastSubject("");
        setBroadcastContent("");
        setSelectedBroadcastContacts(new Set());
      } else {
        toast({ title: "Failed to send", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({
        title: "Failed to send broadcast",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <Mail className="h-5 w-5 text-cyan-600 md:h-6 md:w-6" />
            Email Marketing
          </h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            Manage contacts, send broadcasts, and create automated workflows
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 md:grid md:grid-cols-4 md:gap-0 md:bg-muted md:p-1">
          <TabsTrigger
            value="broadcast"
            className="gap-1.5 rounded-md border border-transparent bg-muted px-3 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background md:gap-2 md:border-0 md:bg-transparent md:px-4 md:py-2 md:data-[state=active]:border-0"
          >
            <Megaphone className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden xs:inline">Broadcast</span>
            <span className="xs:hidden">Send</span>
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="gap-1.5 rounded-md border border-transparent bg-muted px-3 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background md:gap-2 md:border-0 md:bg-transparent md:px-4 md:py-2 md:data-[state=active]:border-0"
          >
            <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger
            value="tags"
            className="gap-1.5 rounded-md border border-transparent bg-muted px-3 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background md:gap-2 md:border-0 md:bg-transparent md:px-4 md:py-2 md:data-[state=active]:border-0"
          >
            <Tag className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger
            value="automations"
            className="gap-1.5 rounded-md border border-transparent bg-muted px-3 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background md:gap-2 md:border-0 md:bg-transparent md:px-4 md:py-2 md:data-[state=active]:border-0"
          >
            <Workflow className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="xs:inline hidden">Automations</span>
            <span className="xs:hidden">Auto</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="mt-4 space-y-4 md:mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Compose Email */}
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-4 p-4 md:p-6">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Megaphone className="h-5 w-5 text-cyan-600" />
                      Compose Email
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Send a one-time email to your subscribers
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broadcast-subject">Subject Line</Label>
                    <Input
                      id="broadcast-subject"
                      placeholder="Hey {{firstName}}, check this out..."
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{firstName}}"} or {"{{name}}"} for personalization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="broadcast-content">Email Content</Label>
                    <Textarea
                      id="broadcast-content"
                      placeholder="Write your message here...

Use {{firstName}} to personalize your email.

The unsubscribe link will be added automatically."
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                    <div className="text-sm">
                      <span className="font-medium">{selectedBroadcastContacts.size}</span>{" "}
                      recipient{selectedBroadcastContacts.size !== 1 ? "s" : ""} selected
                    </div>
                    <Button
                      onClick={handleSendBroadcast}
                      disabled={
                        isSendingBroadcast ||
                        selectedBroadcastContacts.size === 0 ||
                        !broadcastSubject.trim() ||
                        !broadcastContent.trim()
                      }
                      className="gap-2"
                    >
                      {isSendingBroadcast ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Broadcast
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Select Recipients */}
            <div className="space-y-4">
              <Card className="h-fit">
                <CardContent className="space-y-4 p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Select Recipients</h3>
                      <p className="text-sm text-muted-foreground">
                        {filteredBroadcastContacts?.length || 0} subscribed contacts
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllBroadcastContacts}
                      disabled={!filteredBroadcastContacts?.length}
                    >
                      {selectedBroadcastContacts.size === filteredBroadcastContacts?.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      className="pl-10"
                      value={broadcastSearchQuery}
                      onChange={(e) => setBroadcastSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Tag filter chips */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={broadcastTagFilter === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBroadcastTagFilter(null)}
                      className="h-7 text-xs"
                    >
                      All ({allContacts?.filter((c: any) => c.status === "subscribed").length || 0})
                    </Button>
                    {tags?.map((tag: any) => {
                      const count = allContacts?.filter(
                        (c: any) => c.status === "subscribed" && c.tagIds?.includes(tag._id)
                      ).length || 0;
                      return (
                        <Button
                          key={tag._id}
                          variant={broadcastTagFilter === tag._id ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setBroadcastTagFilter(broadcastTagFilter === tag._id ? null : tag._id)
                          }
                          className="h-7 gap-1.5 text-xs"
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name} ({count})
                        </Button>
                      );
                    })}
                  </div>

                  <div className="max-h-[400px] space-y-1 overflow-y-auto">
                    {!filteredBroadcastContacts || filteredBroadcastContacts.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No subscribed contacts found
                      </div>
                    ) : (
                      filteredBroadcastContacts.slice(0, 100).map((contact: any) => (
                        <div
                          key={contact._id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                            selectedBroadcastContacts.has(contact._id)
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted/50"
                          )}
                          onClick={() => toggleBroadcastContactSelection(contact._id)}
                        >
                          <Checkbox
                            checked={selectedBroadcastContacts.has(contact._id)}
                            onCheckedChange={() => toggleBroadcastContactSelection(contact._id)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {contact.firstName || contact.lastName
                                ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                : contact.email}
                            </div>
                            {(contact.firstName || contact.lastName) && (
                              <div className="truncate text-xs text-muted-foreground">
                                {contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {filteredBroadcastContacts && filteredBroadcastContacts.length > 100 && (
                      <div className="py-2 text-center text-xs text-muted-foreground">
                        Showing 100 of {filteredBroadcastContacts.length} contacts
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4 space-y-4 md:mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-2 md:mr-4 md:grid-cols-4 md:gap-4">
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="text-lg font-bold md:text-xl">{contactStats?.total || 0}</div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Total Contacts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="text-lg font-bold text-green-600 md:text-xl">
                    {contactStats?.subscribed || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Subscribed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="text-lg font-bold text-amber-600 md:text-xl">
                    {contactStats?.unsubscribed || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Unsubscribed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="text-lg font-bold md:text-xl">
                    {contactStats?.avgEngagement || 0}%
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Avg Engagement</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 md:h-10 md:px-4"
                onClick={handleSyncCustomers}
                disabled={isSyncing}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isSyncing && "animate-spin")}
                />
                <span className="hidden sm:inline">
                  {isSyncing ? "Syncing..." : "Sync Enrolled Users"}
                </span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 md:h-10 md:px-4">
                <Upload className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Dialog open={isCreateContactOpen} onOpenChange={setIsCreateContactOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 md:h-10 md:px-4">
                    <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">Add Contact</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-black">
                  <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>Add a new subscriber to your list</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          placeholder="John"
                          value={newContact.firstName}
                          onChange={(e) =>
                            setNewContact({ ...newContact, firstName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          placeholder="Doe"
                          value={newContact.lastName}
                          onChange={(e) =>
                            setNewContact({ ...newContact, lastName: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateContactOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateContact}>Add Contact</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={selectedTagFilter || "all"}
              onValueChange={(v) => setSelectedTagFilter(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                {tags?.map((tag: any) => (
                  <SelectItem key={tag._id} value={tag._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                      <span className="text-muted-foreground">({tag.contactCount || 0})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!filteredContacts || filteredContacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 md:py-16">
                <Users className="mb-3 h-12 w-12 text-muted-foreground/30 md:mb-4 md:h-16 md:w-16" />
                <h3 className="mb-2 text-lg font-semibold md:text-xl">No contacts yet</h3>
                <p className="mb-4 max-w-md text-center text-sm text-muted-foreground md:mb-6">
                  Add contacts manually or import from a CSV file to start building your email list.
                </p>
                <Button onClick={() => setIsCreateContactOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Your First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Bulk Action Bar */}
              {selectedContacts.size > 0 ? (
                <Card className="sticky top-0 z-10 border-primary bg-primary/10 shadow-md">
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {selectedContacts.size}
                      </div>
                      <span className="text-sm font-medium">
                        contact{selectedContacts.size > 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" disabled={isEnrolling} className="gap-2">
                            <Workflow className="h-4 w-4" />
                            {isEnrolling ? "Enrolling..." : "Add to Automation"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-black">
                          {workflows && workflows.length > 0 ? (
                            workflows.map((workflow: any) => (
                              <DropdownMenuItem
                                key={workflow._id}
                                onClick={() => handleBulkEnroll(workflow._id)}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    workflow.isActive ? "bg-green-500" : "bg-gray-400"
                                  )}
                                />
                                {workflow.name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <DropdownMenuItem disabled>No automations yet</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContacts(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
                  Select contacts to add them to an automation workflow
                </div>
              )}

              {/* Mobile: Card-based layout */}
              <div className="space-y-2 md:hidden">
                {filteredContacts.slice(0, 50).map((contact: any) => (
                  <Card
                    key={contact._id}
                    className={cn(
                      "overflow-hidden",
                      selectedContacts.has(contact._id) && "ring-2 ring-primary"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedContacts.has(contact._id)}
                            onCheckedChange={() => toggleContactSelection(contact._id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {contact.firstName || contact.lastName
                                  ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                  : "—"}
                              </span>
                              <Badge
                                className={cn(
                                  "shrink-0 text-[10px]",
                                  contact.status === "subscribed" &&
                                    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                                  contact.status === "unsubscribed" &&
                                    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                                  contact.status === "bounced" &&
                                    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                )}
                              >
                                {contact.status}
                              </Badge>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                              {contact.email}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/emails/contacts/${contact._id}?mode=create`)
                              }
                            >
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>Add Tag</DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <Workflow className="mr-2 h-4 w-4" />
                                Add to Automation
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-white dark:bg-black">
                                {workflows && workflows.length > 0 ? (
                                  workflows.map((workflow: any) => (
                                    <DropdownMenuItem
                                      key={workflow._id}
                                      onClick={() => handleEnrollContact(contact._id, workflow._id)}
                                    >
                                      {workflow.name}
                                    </DropdownMenuItem>
                                  ))
                                ) : (
                                  <DropdownMenuItem disabled>No automations yet</DropdownMenuItem>
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteContact(contact._id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {contact.emailsOpened}/{contact.emailsSent} opened
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </span>
                        {contact.tags?.slice(0, 2).map((tag: any) => (
                          <Badge
                            key={tag._id}
                            variant="outline"
                            style={{ borderColor: tag.color, color: tag.color }}
                            className="text-[10px]"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {contact.tags?.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{contact.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredContacts.length > 50 && (
                  <div className="py-3 text-center text-xs text-muted-foreground">
                    Showing 50 of {filteredContacts.length} contacts
                  </div>
                )}
              </div>

              {/* Desktop: Table layout */}
              <Card className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="w-12 p-4">
                          <Checkbox
                            checked={
                              filteredContacts &&
                              filteredContacts.length > 0 &&
                              selectedContacts.size === filteredContacts.length
                            }
                            onCheckedChange={toggleAllContacts}
                          />
                        </th>
                        <th className="p-4 font-medium">Contact</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Tags</th>
                        <th className="p-4 font-medium">Engagement</th>
                        <th className="p-4 font-medium">Added</th>
                        <th className="w-10 p-4 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.slice(0, 50).map((contact: any) => (
                        <tr
                          key={contact._id}
                          className={cn(
                            "border-b hover:bg-muted/50",
                            selectedContacts.has(contact._id) && "bg-primary/5"
                          )}
                        >
                          <td className="p-4">
                            <Checkbox
                              checked={selectedContacts.has(contact._id)}
                              onCheckedChange={() => toggleContactSelection(contact._id)}
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-medium">
                              {contact.firstName || contact.lastName
                                ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                : "—"}
                            </div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={cn(
                                contact.status === "subscribed" &&
                                  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                                contact.status === "unsubscribed" &&
                                  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
                                contact.status === "bounced" &&
                                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              )}
                            >
                              {contact.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {contact.tags?.slice(0, 3).map((tag: any) => (
                                <Badge
                                  key={tag._id}
                                  variant="outline"
                                  style={{ borderColor: tag.color, color: tag.color }}
                                  className="text-xs"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                              {contact.tags?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{contact.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {contact.emailsOpened}/{contact.emailsSent} opened
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/emails/contacts/${contact._id}?mode=create`
                                    )
                                  }
                                >
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>Add Tag</DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Workflow className="mr-2 h-4 w-4" />
                                    Add to Automation
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent className="bg-white dark:bg-black">
                                    {workflows && workflows.length > 0 ? (
                                      workflows.map((workflow: any) => (
                                        <DropdownMenuItem
                                          key={workflow._id}
                                          onClick={() =>
                                            handleEnrollContact(contact._id, workflow._id)
                                          }
                                        >
                                          {workflow.name}
                                        </DropdownMenuItem>
                                      ))
                                    ) : (
                                      <DropdownMenuItem disabled>
                                        No automations yet
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteContact(contact._id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredContacts.length > 50 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Showing 50 of {filteredContacts.length} contacts
                  </div>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="tags" className="mt-4 space-y-4 md:mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid flex-1 grid-cols-3 gap-2 md:mr-4 md:gap-4">
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="text-lg font-bold md:text-xl">{tagStats?.totalTags || 0}</div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Total Tags</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="text-lg font-bold md:text-xl">
                    {tagStats?.totalTaggedContacts || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Tagged</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="truncate text-lg font-bold md:text-xl">
                    {tagStats?.mostUsedTags?.[0]?.name || "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground md:text-xs">Most Used</div>
                </CardContent>
              </Card>
            </div>

            <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 self-end md:h-10 md:self-auto md:px-4">
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">New Tag</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-black">
                <DialogHeader>
                  <DialogTitle>Create Tag</DialogTitle>
                  <DialogDescription>Tags help you segment and organize contacts</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tag Name</Label>
                    <Input
                      placeholder="VIP Customer"
                      value={newTag.name}
                      onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      {[
                        "#ef4444",
                        "#f97316",
                        "#eab308",
                        "#22c55e",
                        "#3b82f6",
                        "#8b5cf6",
                        "#ec4899",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "h-8 w-8 rounded-full border-2",
                            newTag.color === color
                              ? "border-black dark:border-white"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTag({ ...newTag, color })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      placeholder="Customers who have made multiple purchases"
                      value={newTag.description}
                      onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateTagOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTag}>Create Tag</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!tags || tags.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 md:py-16">
                <Tag className="mb-3 h-12 w-12 text-muted-foreground/30 md:mb-4 md:h-16 md:w-16" />
                <h3 className="mb-2 text-lg font-semibold md:text-xl">No tags yet</h3>
                <p className="mb-4 max-w-md text-center text-sm text-muted-foreground md:mb-6">
                  Create tags to segment your contacts and trigger automated sequences.
                </p>
                <Button onClick={() => setIsCreateTagOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Tag
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
              {tags.map((tag: any) => (
                <Card key={tag._id} className="group">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className="h-3.5 w-3.5 shrink-0 rounded-full md:h-4 md:w-4"
                          style={{ backgroundColor: tag.color || "#3b82f6" }}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium md:text-base">
                            {tag.name}
                          </div>
                          <div className="text-xs text-muted-foreground md:text-sm">
                            {tag.contactCount} contact{tag.contactCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-100 transition-opacity md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                          <DropdownMenuItem>Edit Tag</DropdownMenuItem>
                          <DropdownMenuItem>View Contacts</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteTag(tag._id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {tag.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground md:mt-2 md:text-sm">
                        {tag.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations" className="mt-4 space-y-4 md:mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Automations</h2>
              <p className="text-sm text-muted-foreground">
                {workflows?.length || 0} workflow{workflows?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/emails/workflows?mode=create")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Workflow</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>

          {!workflows || workflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 md:py-16">
                <Workflow className="mb-3 h-12 w-12 text-muted-foreground/30 md:mb-4 md:h-16 md:w-16" />
                <h3 className="mb-2 text-lg font-semibold md:text-xl">Visual Workflow Builder</h3>
                <p className="mb-4 max-w-md text-center text-sm text-muted-foreground md:mb-6">
                  Build complex automation workflows with our drag-and-drop visual editor.
                </p>
                <Button
                  onClick={() => router.push("/dashboard/emails/workflows?mode=create")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {workflows.map((workflow: any) => (
                <Card
                  key={workflow._id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/dashboard/emails/workflows?mode=create&id=${workflow._id}`)
                  }
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div
                          className={cn(
                            "shrink-0 rounded-lg p-1.5 md:p-2",
                            workflow.isActive
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <Workflow
                            className={cn(
                              "h-4 w-4 md:h-5 md:w-5",
                              workflow.isActive ? "text-green-600" : "text-slate-400"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <span className="truncate text-sm font-semibold md:text-base">
                              {workflow.name}
                            </span>
                            <Badge
                              variant={workflow.isActive ? "default" : "secondary"}
                              className="shrink-0 text-[10px] md:text-xs"
                            >
                              {workflow.isActive ? "Active" : "Draft"}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground md:gap-2 md:text-sm">
                            <span>
                              {workflow.trigger?.type
                                ? getTriggerLabel(workflow.trigger.type)
                                : "No trigger"}
                            </span>
                            <span>•</span>
                            <span>{workflow.nodes?.length || 0} nodes</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-2 md:justify-end md:gap-6 md:border-t-0 md:pt-0">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="text-center md:text-right">
                            <div className="text-xs font-medium md:text-sm">
                              {workflow.totalExecutions || 0}
                            </div>
                            <div className="text-[10px] text-muted-foreground md:text-xs">
                              executions
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="text-xs font-medium md:text-sm">
                              {workflow.lastExecuted
                                ? new Date(workflow.lastExecuted).toLocaleDateString()
                                : "Never"}
                            </div>
                            <div className="text-[10px] text-muted-foreground md:text-xs">
                              last run
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameWorkflowId(workflow._id);
                                setRenameWorkflowName(workflow.name);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWorkflow(workflow._id, workflow.isActive);
                              }}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {workflow.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkflow(workflow._id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!renameWorkflowId} onOpenChange={(open) => !open && setRenameWorkflowId(null)}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Rename Workflow</DialogTitle>
            <DialogDescription>Enter a new name for this workflow</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              value={renameWorkflowName}
              onChange={(e) => setRenameWorkflowName(e.target.value)}
              placeholder="Workflow name"
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && handleRenameWorkflow()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameWorkflowId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameWorkflow} disabled={!renameWorkflowName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
