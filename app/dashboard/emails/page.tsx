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
  const createTag = useMutation(api.emailTags.createTag);
  const deleteTag = useMutation(api.emailTags.deleteTag);

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
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-cyan-600" />
            Email Marketing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage contacts, tags, and automated email sequences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sequences" className="gap-2">
            <Send className="h-4 w-4" />
            Sequences
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Workflow className="h-4 w-4" />
            Automations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="mr-4 grid flex-1 grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-cyan-100 p-2 dark:bg-cyan-900">
                      <Send className="h-4 w-4 text-cyan-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{activeCampaigns}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{totalEnrolled}</div>
                      <div className="text-xs text-muted-foreground">Enrolled</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{totalCompleted}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Sequence
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Mail className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h3 className="mb-2 text-xl font-semibold">No email sequences yet</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  Create automated email sequences to nurture leads and drive sales on autopilot.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Sequence
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign: any) => (
                <Card
                  key={campaign._id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/dashboard/emails/sequences/${campaign._id}?mode=create`)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            campaign.isActive
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}
                        >
                          <Mail
                            className={cn(
                              "h-5 w-5",
                              campaign.isActive ? "text-green-600" : "text-slate-400"
                            )}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-semibold">
                            {campaign.name}
                            <Badge
                              variant={campaign.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {campaign.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {getTriggerIcon(campaign.triggerType)}
                            {getTriggerLabel(campaign.triggerType)}
                            {campaign.description && ` • ${campaign.description}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-medium">{campaign.totalEnrolled || 0}</div>
                          <div className="text-xs text-muted-foreground">enrolled</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{campaign.totalCompleted || 0}</div>
                          <div className="text-xs text-muted-foreground">completed</div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={campaign.isActive}
                            onCheckedChange={() => handleToggle(campaign._id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCampaign(campaign._id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="contacts" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="mr-4 grid flex-1 grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold">{contactStats?.total || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Contacts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold text-green-600">
                    {contactStats?.subscribed || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Subscribed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold text-amber-600">
                    {contactStats?.unsubscribed || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Unsubscribed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold">{contactStats?.avgEngagement || 0}%</div>
                  <div className="text-xs text-muted-foreground">Avg Engagement</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Dialog open={isCreateContactOpen} onOpenChange={setIsCreateContactOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Contact
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
            <div className="relative max-w-sm flex-1">
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h3 className="mb-2 text-xl font-semibold">No contacts yet</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  Add contacts manually or import from a CSV file to start building your email list.
                </p>
                <Button onClick={() => setIsCreateContactOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Your First Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
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
          )}
        </TabsContent>

        <TabsContent value="tags" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="mr-4 grid flex-1 grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold">{tagStats?.totalTags || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Tags</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold">{tagStats?.totalTaggedContacts || 0}</div>
                  <div className="text-xs text-muted-foreground">Tagged Contacts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-xl font-bold">
                    {tagStats?.mostUsedTags?.[0]?.name || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">Most Used Tag</div>
                </CardContent>
              </Card>
            </div>

            <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Tag
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Tag className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h3 className="mb-2 text-xl font-semibold">No tags yet</h3>
                <p className="mb-6 max-w-md text-center text-muted-foreground">
                  Create tags to segment your contacts and trigger automated sequences.
                </p>
                <Button onClick={() => setIsCreateTagOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Tag
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag: any) => (
                <Card key={tag._id} className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: tag.color || "#3b82f6" }}
                        />
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {tag.contactCount} contact{tag.contactCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
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
                      <p className="mt-2 text-sm text-muted-foreground">{tag.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations" className="mt-6 space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Workflow className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="mb-2 text-xl font-semibold">Visual Workflow Builder</h3>
              <p className="mb-6 max-w-md text-center text-muted-foreground">
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
