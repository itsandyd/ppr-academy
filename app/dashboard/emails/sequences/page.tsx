"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Mail,
  Users,
  Clock,
  TrendingUp,
  UserPlus,
  ShoppingCart,
  GraduationCap,
  Sparkles,
  UserX,
  Loader2,
  Workflow,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Sequence type definitions - Creator-focused (for nurturing THEIR audience)
// Note: "coaching" in UI maps to "coaching_client" in schema
const sequenceTypes = [
  { id: "welcome", schemaId: "welcome", name: "Welcome Sequence", icon: UserPlus, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "buyer", schemaId: "buyer", name: "Purchase Thank You", icon: ShoppingCart, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  { id: "course_student", schemaId: "course_student", name: "Course Student", icon: GraduationCap, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "product_launch", schemaId: "product_launch", name: "Product Launch", icon: Sparkles, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "coaching", schemaId: "coaching_client", name: "Coaching Client", icon: Users, color: "text-cyan-600", bgColor: "bg-cyan-50 dark:bg-cyan-950/30" },
  { id: "lead_nurture", schemaId: "lead_nurture", name: "Lead Nurture", icon: TrendingUp, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
  { id: "reengagement", schemaId: "reengagement", name: "Re-engagement", icon: Clock, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  { id: "winback", schemaId: "winback", name: "Win-back", icon: UserX, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
  { id: "custom", schemaId: "custom", name: "Custom Sequence", icon: Workflow, color: "text-gray-600", bgColor: "bg-gray-50 dark:bg-gray-950/30" },
];

export default function SequencesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const storeId = user?.id ?? "";

  // Get filter type from URL query params
  const filterTypeFromUrl = searchParams.get("type");
  const [typeFilter, setTypeFilter] = useState<string | null>(filterTypeFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    type: filterTypeFromUrl || "custom",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Update type filter when URL changes
  useEffect(() => {
    setTypeFilter(filterTypeFromUrl);
    if (filterTypeFromUrl) {
      // Pre-fill the create dialog with the filtered type
      const seqType = sequenceTypes.find(t => t.id === filterTypeFromUrl || t.schemaId === filterTypeFromUrl);
      if (seqType) {
        setNewSequence(prev => ({ ...prev, type: seqType.id }));
      }
    }
  }, [filterTypeFromUrl]);

  // Queries - get all workflows, we'll filter client-side for flexibility
  const workflows = useQuery(api.emailWorkflows.listWorkflows, storeId ? { storeId } : "skip");
  const workflowCounts = useQuery(api.emailWorkflows.getWorkflowCountsByType, storeId ? { storeId } : "skip");

  // Get the active filter type details
  const activeFilterType = typeFilter ? sequenceTypes.find(t => t.id === typeFilter || t.schemaId === typeFilter) : null;

  // Helper function to get sequence type from workflow - defined before use
  const getSequenceType = (workflow: any) => {
    // First check if the workflow has an explicit sequenceType set
    if (workflow.sequenceType) {
      return sequenceTypes.find((t) => t.schemaId === workflow.sequenceType || t.id === workflow.sequenceType);
    }

    // Fall back to inferring from name for backwards compatibility
    const nameLC = workflow.name.toLowerCase();
    if (nameLC.includes("welcome")) return sequenceTypes.find((t) => t.id === "welcome");
    if (nameLC.includes("buyer") || nameLC.includes("purchase") || nameLC.includes("thank you")) return sequenceTypes.find((t) => t.id === "buyer");
    if (nameLC.includes("course") || nameLC.includes("student") || nameLC.includes("enrollment")) return sequenceTypes.find((t) => t.id === "course_student");
    if (nameLC.includes("launch") || nameLC.includes("release") || nameLC.includes("new product")) return sequenceTypes.find((t) => t.id === "product_launch");
    if (nameLC.includes("coaching") || nameLC.includes("session") || nameLC.includes("client")) return sequenceTypes.find((t) => t.id === "coaching");
    if (nameLC.includes("nurture") || nameLC.includes("lead")) return sequenceTypes.find((t) => t.id === "lead_nurture");
    if (nameLC.includes("reengag") || nameLC.includes("inactive")) return sequenceTypes.find((t) => t.id === "reengagement");
    if (nameLC.includes("winback") || nameLC.includes("win-back")) return sequenceTypes.find((t) => t.id === "winback");
    return sequenceTypes.find((t) => t.id === "custom");
  };

  // Filter workflows based on search and type
  const filteredWorkflows = workflows?.filter((w: any) => {
    // Text search filter
    const matchesSearch = !searchQuery ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter - check both the stored sequenceType and infer from name if not set
    if (!typeFilter) return matchesSearch;

    const workflowType = getSequenceType(w);
    const matchesType = workflowType?.id === typeFilter || workflowType?.schemaId === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleCreateSequence = async () => {
    if (!newSequence.name.trim()) {
      toast.error("Sequence name is required");
      return;
    }

    setIsCreating(true);
    try {
      // Map UI type to schema type
      const seqType = sequenceTypes.find(t => t.id === newSequence.type);
      const schemaType = seqType?.schemaId || newSequence.type;

      // Redirect to the workflow builder with the new sequence info
      router.push(
        `/dashboard/emails/workflows?mode=create&name=${encodeURIComponent(newSequence.name)}&type=${schemaType}`
      );
    } catch (error) {
      toast.error("Failed to create sequence");
    } finally {
      setIsCreating(false);
    }
  };

  const clearFilter = () => {
    setTypeFilter(null);
    router.push("/dashboard/emails/sequences");
  };

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/emails?mode=create">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              {activeFilterType ? (
                <span className="flex items-center gap-2">
                  <activeFilterType.icon className={cn("h-6 w-6", activeFilterType.color)} />
                  {activeFilterType.name}s
                </span>
              ) : (
                "Email Sequences"
              )}
            </h1>
            <p className="text-muted-foreground">
              {activeFilterType
                ? `Manage your ${activeFilterType.name.toLowerCase()} automations`
                : "Manage your automated email sequences"
              }
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New {activeFilterType ? activeFilterType.name : "Sequence"}
        </Button>
      </div>

      {/* Active Filter Banner */}
      {activeFilterType && (
        <div className={cn("flex items-center justify-between p-3 rounded-lg border", activeFilterType.bgColor)}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              Showing <strong>{activeFilterType.name}</strong> sequences only
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            <X className="h-4 w-4 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sequences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">
          {filteredWorkflows?.length || 0} {activeFilterType ? `of ${workflows?.length || 0}` : ""} sequences
        </Badge>

        {/* Type Filter Dropdown */}
        {!activeFilterType && (
          <Select
            value={typeFilter || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                clearFilter();
              } else {
                setTypeFilter(value);
                router.push(`/dashboard/emails/sequences?type=${value}`);
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {sequenceTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <type.icon className={cn("h-4 w-4", type.color)} />
                    {type.name}
                    {workflowCounts && (
                      <span className="text-muted-foreground text-xs ml-1">
                        ({workflowCounts[type.schemaId] || 0})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Main Content + Sidebar */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Left: Sequence Cards */}
        <div className="space-y-6">
          {!workflows ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredWorkflows?.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 via-zinc-50 to-stone-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/60 dark:from-zinc-800/60 dark:via-zinc-800/40 dark:to-zinc-900/60 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] dark:ring-zinc-700/40">
                <Workflow className="h-7 w-7 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">Nurture fans into customers</h3>
              <p className="text-muted-foreground mb-5 text-[13px] max-w-[340px] mx-auto leading-relaxed">
                Set up automated email sequences that welcome new subscribers, follow up after purchases, and re-engage inactive fans — on autopilot.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Sequence
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkflows?.map((workflow: any) => {
                const seqType = getSequenceType(workflow);
                const Icon = seqType?.icon || Workflow;

                return (
                  <Card
                    key={workflow._id}
                    className="group cursor-pointer hover:shadow-md transition-all"
                    onClick={() => router.push(`/dashboard/emails/workflows?mode=create&id=${workflow._id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", seqType?.bgColor || "bg-gray-50 dark:bg-gray-950/30")}>
                            <Icon className={cn("h-5 w-5", seqType?.color || "text-gray-600")} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {seqType?.name || "Custom Sequence"}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/emails/workflows?mode=create&id=${workflow._id}`);
                            }}>
                              Edit Sequence
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {workflow.steps?.length || 0} emails
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {workflow.enrolledCount || 0} enrolled
                          </span>
                        </div>
                        <Badge variant={workflow.isActive ? "default" : "secondary"}>
                          {workflow.isActive ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              Paused
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Quick Start Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {sequenceTypes.slice(0, 8).map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                      onClick={() => {
                        setNewSequence({ name: type.name, description: "", type: type.id });
                        setIsCreateOpen(true);
                      }}
                    >
                      <div className={cn("p-2 rounded-lg", type.bgColor)}>
                        <Icon className={cn("h-4 w-4", type.color)} />
                      </div>
                      <span className="font-medium text-sm">{type.name}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Sequences by Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Sequences by Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {sequenceTypes.filter(t => t.id !== "custom").map((type) => {
                const Icon = type.icon;
                const count = workflowCounts?.[type.schemaId] || 0;
                const isActive = typeFilter === type.id || typeFilter === type.schemaId;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (isActive) {
                        clearFilter();
                      } else {
                        setTypeFilter(type.id);
                        router.push(`/dashboard/emails/sequences?type=${type.id}`);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", type.color)} />
                    <span className="flex-1 text-left truncate">{type.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total sequences</span>
                <span className="font-medium">{workflows?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium text-green-600">
                  {workflows?.filter((w: any) => w.isActive).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paused</span>
                <span className="font-medium">
                  {workflows?.filter((w: any) => !w.isActive).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-900">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">How Sequences Work</h4>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <TrendingUp className="h-3 w-3 mt-0.5 text-cyan-600 shrink-0" />
                  <span>Users enter sequences based on triggers you set</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-3 w-3 mt-0.5 text-cyan-600 shrink-0" />
                  <span>Emails send on your configured schedule</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-3 w-3 mt-0.5 text-cyan-600 shrink-0" />
                  <span>Each sequence can have multiple emails with delays</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sequence</DialogTitle>
            <DialogDescription>
              Set up a new automated email sequence
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sequence Type</Label>
              <Select
                value={newSequence.type}
                onValueChange={(value) => setNewSequence({ ...newSequence, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sequenceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <type.icon className={cn("h-4 w-4", type.color)} />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Sequence Name</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome New Subscribers"
                value={newSequence.name}
                onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What does this sequence do?"
                value={newSequence.description}
                onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSequence} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
