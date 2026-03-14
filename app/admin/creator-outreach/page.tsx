"use client";

import { useState, useMemo, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminLoading } from "../components/admin-loading";
import { AdminPagination, usePagination } from "../components/admin-pagination";
import OutreachWorkflowEditor from "./components/OutreachWorkflowEditor";
import { cn } from "@/lib/utils";
import {
  Mail,
  Send,
  Users,
  UserX,
  Zap,
  CheckCircle,
  Circle,
  CreditCard,
  Package,
  Calendar,
  Search,
  Play,
  Pause,
  BarChart3,
  Plus,
  ListChecks,
  Eye,
  MousePointer,
  Ban,
  Pencil,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type FilterType = "all" | "inactive" | "active" | "no_stripe" | "no_products" | "churned";

export default function CreatorOutreachPage() {
  return (
    <Suspense fallback={<AdminLoading variant="dashboard" />}>
      <CreatorOutreachContent />
    </Suspense>
  );
}

function CreatorOutreachContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clerkId = user?.id;

  // State — all hooks must be called before any conditional returns
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [startSequenceOpen, setStartSequenceOpen] = useState(false);
  const [createSequenceOpen, setCreateSequenceOpen] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Email compose state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // New sequence state
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    steps: [{ subject: "", htmlContent: "", delayDays: 0 }],
  });

  // Queries
  const creators = useQuery(
    api.admin.creatorOutreach.getCreatorOutreachList,
    clerkId ? { clerkId, filter } : "skip"
  );
  const sequences = useQuery(
    api.admin.creatorOutreach.getOutreachSequences,
    clerkId ? { clerkId } : "skip"
  );
  const stats = useQuery(
    api.admin.creatorOutreach.getOutreachStats,
    clerkId ? { clerkId } : "skip"
  );

  // Mutations
  const sendOneOff = useMutation(api.admin.creatorOutreach.sendOneOffEmail);
  const enrollInSequence = useMutation(api.admin.creatorOutreach.enrollCreatorsInSequence);
  const createSequence = useMutation(api.admin.creatorOutreach.createOutreachSequence);
  const toggleSequence = useMutation(api.admin.creatorOutreach.toggleSequenceActive);

  // Search filter
  const filteredCreators = useMemo(() => {
    if (!creators) return [];
    if (!search) return creators;
    const q = search.toLowerCase();
    return creators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.storeName?.toLowerCase().includes(q)
    );
  }, [creators, search]);

  // Pagination
  const pagination = usePagination(filteredCreators, 20);

  // Get selected creator objects
  const selectedCreatorObjects = useMemo(
    () => filteredCreators.filter((c) => selectedCreators.includes(c.userId)),
    [filteredCreators, selectedCreators]
  );

  // Check if we should show the editor
  const editorSequenceId = searchParams.get("edit");
  const isNewSequence = searchParams.has("new");

  if ((isNewSequence || editorSequenceId) && clerkId) {
    return (
      <OutreachWorkflowEditor
        sequenceId={editorSequenceId || undefined}
        clerkId={clerkId}
      />
    );
  }

  // Selection helpers
  const toggleCreator = (userId: string) => {
    setSelectedCreators((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (selectedCreators.length === filteredCreators.length) {
      setSelectedCreators([]);
    } else {
      setSelectedCreators(filteredCreators.map((c) => c.userId));
    }
  };

  const selectAllInactive = () => {
    const inactive = filteredCreators.filter(
      (c) => c.status === "inactive" || c.productsUploaded === 0
    );
    setSelectedCreators(inactive.map((c) => c.userId));
  };

  // Send email handler
  const handleSendEmail = async () => {
    if (!clerkId || !emailSubject || !emailBody) return;
    setIsSending(true);
    try {
      // Wrap plain text in basic HTML
      const htmlContent = emailBody.includes("<")
        ? emailBody
        : `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">${emailBody.replace(/\n/g, "<br>")}</div>`;

      const result = await sendOneOff({
        clerkId,
        creators: selectedCreatorObjects.map((c) => ({
          userId: c.userId,
          email: c.email,
          name: c.name,
          storeId: c.storeId,
        })),
        subject: emailSubject,
        htmlContent,
        textContent: emailBody,
      });

      toast({
        title: `${result.queued} emails queued`,
        description: "Emails will be sent via the send queue.",
      });
      setSendEmailOpen(false);
      setEmailSubject("");
      setEmailBody("");
      setSelectedCreators([]);
    } catch (error) {
      toast({
        title: "Failed to send emails",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Enroll in sequence handler
  const handleEnrollInSequence = async () => {
    if (!clerkId || !selectedSequenceId) return;
    setIsSending(true);
    try {
      const result = await enrollInSequence({
        clerkId,
        sequenceId: selectedSequenceId as Id<"adminOutreachSequences">,
        creators: selectedCreatorObjects.map((c) => ({
          userId: c.userId,
          email: c.email,
          name: c.name,
          storeId: c.storeId,
          storeSlug: c.storeSlug,
        })),
      });

      toast({
        title: `${result.enrolled} creators enrolled`,
        description: result.skipped > 0 ? `${result.skipped} already enrolled (skipped)` : undefined,
      });
      setStartSequenceOpen(false);
      setSelectedSequenceId("");
      setSelectedCreators([]);
    } catch (error) {
      toast({
        title: "Failed to enroll creators",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Create sequence handler
  const handleCreateSequence = async () => {
    if (!clerkId || !newSequence.name) return;
    setIsSending(true);
    try {
      await createSequence({
        clerkId,
        name: newSequence.name,
        description: newSequence.description || undefined,
        steps: newSequence.steps.map((s) => ({
          subject: s.subject,
          htmlContent: s.htmlContent.includes("<")
            ? s.htmlContent
            : `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">${s.htmlContent.replace(/\n/g, "<br>")}</div>`,
          delayDays: s.delayDays,
        })),
      });

      toast({ title: "Sequence created" });
      setCreateSequenceOpen(false);
      setNewSequence({
        name: "",
        description: "",
        steps: [{ subject: "", htmlContent: "", delayDays: 0 }],
      });
    } catch (error) {
      toast({
        title: "Failed to create sequence",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format helpers
  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>;
      case "inactive":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Inactive</Badge>;
      case "churned":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Churned</Badge>;
      case "new":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">New</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!creators || !sequences || !stats) {
    return <AdminLoading variant="dashboard" />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Creator Outreach</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Email creators who need a nudge — activate, re-engage, and support
          </p>
        </div>
        <Button onClick={() => router.push("/admin/creator-outreach?new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Sequence
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{creators.length}</p>
                <p className="text-xs text-muted-foreground">Total Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-2">
                <UserX className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {creators.filter((c) => c.productsUploaded === 0).length}
                </p>
                <p className="text-xs text-muted-foreground">Zero Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-2">
                <Send className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalEmailsSent}</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.stoppedByAction}</p>
                <p className="text-xs text-muted-foreground">Activated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="creators" className="space-y-6">
        <TabsList className="h-12 grid w-full grid-cols-2">
          <TabsTrigger value="creators" className="gap-2">
            <Users className="h-4 w-4" />
            Creator List
          </TabsTrigger>
          <TabsTrigger value="sequences" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Sequences ({sequences.length})
          </TabsTrigger>
        </TabsList>

        {/* Creators Tab */}
        <TabsContent value="creators">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search creators..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="no_products">No Products</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="no_stripe">No Stripe</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedCreators.length === filteredCreators.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button variant="outline" size="sm" onClick={selectAllInactive}>
                  Select All Inactive
                </Button>

                {selectedCreators.length > 0 && (
                  <>
                    <div className="mx-2 h-6 w-px bg-border" />
                    <span className="text-sm text-muted-foreground">
                      {selectedCreators.length} selected
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setSendEmailOpen(true)}
                      className="gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Send Email
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setStartSequenceOpen(true)}
                      className="gap-1"
                      disabled={sequences.length === 0}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Start Sequence
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Creator</TableHead>
                      <TableHead className="hidden md:table-cell">Signed Up</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="hidden lg:table-cell text-center">Stripe</TableHead>
                      <TableHead className="hidden lg:table-cell text-right">Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Outreach</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedItems.map((creator) => (
                      <TableRow
                        key={creator.userId}
                        className={cn(
                          "cursor-pointer",
                          selectedCreators.includes(creator.userId) &&
                            "bg-purple-50 dark:bg-purple-900/10"
                        )}
                        onClick={() => toggleCreator(creator.userId)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedCreators.includes(creator.userId)}
                            onCheckedChange={() => toggleCreator(creator.userId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{creator.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {creator.email}
                            </p>
                            {creator.storeName && (
                              <p className="truncate text-xs text-muted-foreground">
                                {creator.storeName}
                                {creator.storeSlug && ` (/${creator.storeSlug})`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(creator.signupDate)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "font-medium",
                              creator.productsUploaded === 0
                                ? "text-red-600"
                                : "text-green-600"
                            )}
                          >
                            {creator.productsUploaded}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({creator.courseCount}c / {creator.digitalProductCount}p)
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {creator.stripeConnected ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          {creator.totalRevenue > 0 ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(creator.totalRevenue)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">$0</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(creator.status)}</TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {creator.outreachStatus ? (
                            <Badge variant="outline" className="text-xs">
                              {creator.outreachStatus}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredCreators.length > 20 && (
                <AdminPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  itemsPerPage={pagination.itemsPerPage}
                  onPageChange={pagination.handlePageChange}
                  onItemsPerPageChange={pagination.handleItemsPerPageChange}
                  className="mt-4 border-t pt-4"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences">
          <div className="space-y-4">
            {sequences.length === 0 ? (
              <Card className="border-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ListChecks className="mb-4 h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mb-2 text-xl font-semibold">No sequences yet</h3>
                  <p className="mb-6 text-muted-foreground">
                    Create an email sequence to automatically nurture inactive creators
                  </p>
                  <Button onClick={() => router.push("/admin/creator-outreach?new")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Sequence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sequences.map((seq) => (
                <Card key={seq._id} className="border-2 transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{seq.name}</CardTitle>
                        <Badge variant={seq.isActive ? "default" : "secondary"}>
                          {seq.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                          {seq.stepCount} steps
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {seq.stopOnProductUpload && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Ban className="h-3 w-3" />
                            Auto-stop
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/creator-outreach?edit=${seq._id}`)}
                          className="gap-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!clerkId) return;
                            try {
                              const result = await toggleSequence({
                                clerkId,
                                sequenceId: seq._id,
                              });
                              toast({
                                title: result.isActive
                                  ? "Sequence activated"
                                  : "Sequence paused",
                              });
                            } catch {
                              toast({
                                title: "Failed to toggle sequence",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="gap-1"
                        >
                          {seq.isActive ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          {seq.isActive ? "Pause" : "Activate"}
                        </Button>
                      </div>
                    </div>
                    {seq.description && (
                      <p className="text-sm text-muted-foreground">{seq.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      From: {seq.fromName} &lt;{seq.fromEmail}&gt;
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{seq.totalEnrolled}</span>
                        <span className="text-muted-foreground">enrolled</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{seq.totalCompleted}</span>
                        <span className="text-muted-foreground">completed</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{seq.totalStopped}</span>
                        <span className="text-muted-foreground">activated</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatDate(seq.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedCreators.length} Creator(s)</DialogTitle>
            <DialogDescription>
              Sends from Andrew &lt;andrew@pauseplayrepeat.com&gt; via SES
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex flex-wrap gap-1 rounded-md border p-2">
                {selectedCreatorObjects.slice(0, 5).map((c) => (
                  <Badge key={c.userId} variant="secondary" className="text-xs">
                    {c.name}
                  </Badge>
                ))}
                {selectedCreatorObjects.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedCreatorObjects.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Quick question about your PPR store"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Body{" "}
                <span className="text-xs text-muted-foreground">
                  (plain text or HTML)
                </span>
              </Label>
              <Textarea
                placeholder={`Hey {{firstName}},\n\nI noticed you signed up for PPR but haven't uploaded any products yet. I'd love to help you get started!\n\nWhat's holding you back? I'm here to help.\n\n- Andrew`}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Variables: {"{{firstName}}"}, {"{{name}}"}, {"{{email}}"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !emailSubject || !emailBody}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : `Send to ${selectedCreators.length} Creators`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Sequence Dialog */}
      <Dialog open={startSequenceOpen} onOpenChange={setStartSequenceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Enroll {selectedCreators.length} Creator(s) in Sequence
            </DialogTitle>
            <DialogDescription>
              Choose an existing sequence. Creators already enrolled will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sequence</Label>
              <Select
                value={selectedSequenceId}
                onValueChange={setSelectedSequenceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sequence" />
                </SelectTrigger>
                <SelectContent>
                  {sequences.map((seq) => (
                    <SelectItem key={seq._id} value={seq._id}>
                      {seq.name} ({seq.stepCount} steps)
                      {!seq.isActive && " [Paused]"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Selected creators:</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {selectedCreatorObjects.slice(0, 5).map((c) => (
                  <li key={c.userId}>
                    {c.name} ({c.email})
                  </li>
                ))}
                {selectedCreatorObjects.length > 5 && (
                  <li>...and {selectedCreatorObjects.length - 5} more</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStartSequenceOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnrollInSequence}
              disabled={isSending || !selectedSequenceId}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {isSending ? "Enrolling..." : "Enroll in Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sequence Dialog */}
      <Dialog open={createSequenceOpen} onOpenChange={setCreateSequenceOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Outreach Sequence</DialogTitle>
            <DialogDescription>
              Build an automated email sequence that targets inactive creators.
              Sends from Andrew &lt;andrew@pauseplayrepeat.com&gt;.
              Auto-stops if the creator uploads a product or replies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sequence Name</Label>
                <Input
                  placeholder="Inactive Creator Activation"
                  value={newSequence.name}
                  onChange={(e) =>
                    setNewSequence({ ...newSequence, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Re-engage creators with zero products"
                  value={newSequence.description}
                  onChange={(e) =>
                    setNewSequence({ ...newSequence, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Email Steps</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewSequence({
                      ...newSequence,
                      steps: [
                        ...newSequence.steps,
                        {
                          subject: "",
                          htmlContent: "",
                          delayDays: newSequence.steps.length === 0 ? 0 : 3,
                        },
                      ],
                    })
                  }
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Step
                </Button>
              </div>

              {newSequence.steps.map((step, index) => (
                <Card key={index} className="border">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Step {index + 1}</Badge>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Delay (days):</Label>
                        <Input
                          type="number"
                          min={0}
                          value={step.delayDays}
                          onChange={(e) => {
                            const steps = [...newSequence.steps];
                            steps[index] = {
                              ...steps[index],
                              delayDays: parseInt(e.target.value) || 0,
                            };
                            setNewSequence({ ...newSequence, steps });
                          }}
                          className="w-20"
                        />
                      </div>
                    </div>
                    <Input
                      placeholder="Subject line"
                      value={step.subject}
                      onChange={(e) => {
                        const steps = [...newSequence.steps];
                        steps[index] = { ...steps[index], subject: e.target.value };
                        setNewSequence({ ...newSequence, steps });
                      }}
                    />
                    <Textarea
                      placeholder={`Hey {{firstName}},\n\nYour email body here...`}
                      value={step.htmlContent}
                      onChange={(e) => {
                        const steps = [...newSequence.steps];
                        steps[index] = { ...steps[index], htmlContent: e.target.value };
                        setNewSequence({ ...newSequence, steps });
                      }}
                      rows={6}
                    />
                    {newSequence.steps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const steps = newSequence.steps.filter((_, i) => i !== index);
                          setNewSequence({ ...newSequence, steps });
                        }}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Remove Step
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSequenceOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSequence}
              disabled={
                isSending ||
                !newSequence.name ||
                newSequence.steps.some((s) => !s.subject || !s.htmlContent)
              }
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {isSending ? "Creating..." : "Create Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
