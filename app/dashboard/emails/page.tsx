"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Play,
  Upload,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EmailCampaignsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("sequences");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    triggerType: "lead_signup" as "lead_signup" | "product_purchase" | "tag_added" | "manual",
  });

  const [newContact, setNewContact] = useState({ email: "", firstName: "", lastName: "" });
  const [newTag, setNewTag] = useState({ name: "", color: "#3b82f6", description: "" });

  const storeId = user?.id ?? "";

  const campaigns = useQuery(api.dripCampaigns.getCampaignsByStore, storeId ? { storeId } : "skip");
  const contacts = useQuery(api.emailContacts.listContacts, storeId ? { storeId } : "skip");
  const contactStats = useQuery(api.emailContacts.getContactStats, storeId ? { storeId } : "skip");
  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : "skip");
  const tagStats = useQuery(api.emailTags.getTagStats, storeId ? { storeId } : "skip");

  const createCampaign = useMutation(api.dripCampaigns.createCampaign);
  const toggleCampaign = useMutation(api.dripCampaigns.toggleCampaign);
  const deleteCampaign = useMutation(api.dripCampaigns.deleteCampaign);
  const createContact = useMutation(api.emailContacts.createContact);
  const deleteContact = useMutation(api.emailContacts.deleteContact);
  const syncEnrolledUsers = useMutation(api.emailContacts.syncEnrolledUsersToEmailContacts);
  const createTag = useMutation(api.emailTags.createTag);
  const deleteTag = useMutation(api.emailTags.deleteTag);

  const [isSyncing, setIsSyncing] = useState(false);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    try {
      await createCampaign({
        storeId,
        name: newCampaign.name,
        description: newCampaign.description,
        triggerType: newCampaign.triggerType,
      });

      toast({ title: "Sequence created!" });
      setIsCreateOpen(false);
      setNewCampaign({ name: "", description: "", triggerType: "lead_signup" });
    } catch {
      toast({ title: "Failed to create sequence", variant: "destructive" });
    }
  };

  const handleToggle = async (campaignId: string) => {
    try {
      const result = await toggleCampaign({ campaignId: campaignId as any });
      toast({
        title: result.isActive ? "Sequence activated" : "Sequence paused",
      });
    } catch {
      toast({ title: "Failed to toggle sequence", variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Delete this sequence and all its steps?")) return;

    try {
      await deleteCampaign({ campaignId: campaignId as any });
      toast({ title: "Sequence deleted" });
    } catch {
      toast({ title: "Failed to delete sequence", variant: "destructive" });
    }
  };

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
      const result = await syncEnrolledUsers({ storeId });
      const description = result.errors.length > 0
        ? `Added ${result.synced} contacts, ${result.skipped} already existed. ${result.errors.length} errors.`
        : `Added ${result.synced} contacts, ${result.skipped} already existed (${result.total} total enrolled users)`;
      toast({
        title: "Sync Complete",
        description,
      });
    } catch {
      toast({ title: "Failed to sync enrolled users", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "lead_signup":
        return <Users className="h-4 w-4" />;
      case "product_purchase":
        return <CheckCircle2 className="h-4 w-4" />;
      case "tag_added":
        return <Zap className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
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

  const totalEnrolled =
    campaigns?.reduce((sum: number, c: any) => sum + (c.totalEnrolled || 0), 0) || 0;
  const totalCompleted =
    campaigns?.reduce((sum: number, c: any) => sum + (c.totalCompleted || 0), 0) || 0;
  const activeCampaigns = campaigns?.filter((c: any) => c.isActive).length || 0;

  const filteredContacts = contacts?.filter((c: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.email?.toLowerCase().includes(query) ||
      c.firstName?.toLowerCase().includes(query) ||
      c.lastName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
            <Mail className="h-5 w-5 text-cyan-600 md:h-6 md:w-6" />
            Email Marketing
          </h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            Manage contacts, tags, and automated email sequences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 md:grid md:grid-cols-4 md:gap-0 md:bg-muted md:p-1">
          <TabsTrigger
            value="sequences"
            className="gap-1.5 rounded-md border border-transparent bg-muted px-3 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background md:gap-2 md:border-0 md:bg-transparent md:px-4 md:py-2 md:data-[state=active]:border-0"
          >
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="xs:inline hidden">Sequences</span>
            <span className="xs:hidden">Seq</span>
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

        <TabsContent value="sequences" className="mt-4 space-y-4 md:mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid flex-1 grid-cols-3 gap-2 md:mr-4 md:gap-4">
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="rounded-lg bg-cyan-100 p-1.5 dark:bg-cyan-900 md:p-2">
                      <Send className="h-3.5 w-3.5 text-cyan-600 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold md:text-xl">{activeCampaigns}</div>
                      <div className="text-[10px] text-muted-foreground md:text-xs">Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900 md:p-2">
                      <Users className="h-3.5 w-3.5 text-blue-600 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold md:text-xl">{totalEnrolled}</div>
                      <div className="text-[10px] text-muted-foreground md:text-xs">Enrolled</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="rounded-lg bg-green-100 p-1.5 dark:bg-green-900 md:p-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 md:h-4 md:w-4" />
                    </div>
                    <div>
                      <div className="text-lg font-bold md:text-xl">{totalCompleted}</div>
                      <div className="text-[10px] text-muted-foreground md:text-xs">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 self-end md:self-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Sequence</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-black">
                <DialogHeader>
                  <DialogTitle>Create Email Sequence</DialogTitle>
                  <DialogDescription>Set up an automated drip campaign</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Sequence Name</Label>
                    <Input
                      placeholder="7-Day Welcome Sequence"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Welcomes new subscribers..."
                      value={newCampaign.description}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trigger</Label>
                    <Select
                      value={newCampaign.triggerType}
                      onValueChange={(v: any) => setNewCampaign({ ...newCampaign, triggerType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="lead_signup">When someone joins your list</SelectItem>
                        <SelectItem value="product_purchase">After a purchase</SelectItem>
                        <SelectItem value="tag_added">When tag is added</SelectItem>
                        <SelectItem value="manual">Manual enrollment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCampaign}>Create Sequence</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!campaigns || campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 md:py-16">
                <Mail className="mb-3 h-12 w-12 text-muted-foreground/30 md:mb-4 md:h-16 md:w-16" />
                <h3 className="mb-2 text-lg font-semibold md:text-xl">No email sequences yet</h3>
                <p className="mb-4 max-w-md text-center text-sm text-muted-foreground md:mb-6">
                  Create automated email sequences to nurture leads and drive sales on autopilot.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Sequence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {campaigns.map((campaign: any) => (
                <Card
                  key={campaign._id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/dashboard/emails/sequences/${campaign._id}?mode=create`)
                  }
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div
                          className={cn(
                            "shrink-0 rounded-lg p-1.5 md:p-2",
                            campaign.isActive
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <Mail
                            className={cn(
                              "h-4 w-4 md:h-5 md:w-5",
                              campaign.isActive ? "text-green-600" : "text-slate-400"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <span className="truncate text-sm font-semibold md:text-base">
                              {campaign.name}
                            </span>
                            <Badge
                              variant={campaign.isActive ? "default" : "secondary"}
                              className="shrink-0 text-[10px] md:text-xs"
                            >
                              {campaign.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground md:gap-2 md:text-sm">
                            {getTriggerIcon(campaign.triggerType)}
                            <span className="truncate">
                              {getTriggerLabel(campaign.triggerType)}
                              {campaign.description && ` • ${campaign.description}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-2 md:justify-end md:gap-6 md:border-t-0 md:pt-0">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="text-center md:text-right">
                            <div className="text-xs font-medium md:text-sm">
                              {campaign.totalEnrolled || 0}
                            </div>
                            <div className="text-[10px] text-muted-foreground md:text-xs">
                              enrolled
                            </div>
                          </div>
                          <div className="text-center md:text-right">
                            <div className="text-xs font-medium md:text-sm">
                              {campaign.totalCompleted || 0}
                            </div>
                            <div className="text-[10px] text-muted-foreground md:text-xs">
                              completed
                            </div>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1 md:gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={campaign.isActive}
                            onCheckedChange={() => handleToggle(campaign._id)}
                            className="scale-90 md:scale-100"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCampaign(campaign._id)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 md:h-9 md:w-9"
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
              {/* Mobile: Card-based layout */}
              <div className="space-y-2 md:hidden">
                {filteredContacts.slice(0, 50).map((contact: any) => (
                  <Card key={contact._id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
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
                        <tr key={contact._id} className="border-b hover:bg-muted/50">
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
                Create Workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
