"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Filter,
  RefreshCw,
  Copy,
  MoreHorizontal,
  Zap,
  Save,
  Eye,
  X,
  ChevronDown,
  Tag,
  Mail,
  Calendar,
  MousePointerClick,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Segment field definitions
const segmentFields = [
  { value: "email", label: "Email", type: "text", icon: Mail },
  { value: "firstName", label: "First Name", type: "text", icon: Users },
  { value: "lastName", label: "Last Name", type: "text", icon: Users },
  { value: "fullName", label: "Full Name", type: "text", icon: Users },
  { value: "tags", label: "Tags", type: "tags", icon: Tag },
  { value: "tagCount", label: "Number of Tags", type: "number", icon: Tag },
  { value: "emailsSent", label: "Emails Sent", type: "number", icon: Mail },
  { value: "emailsOpened", label: "Emails Opened", type: "number", icon: Eye },
  { value: "emailsClicked", label: "Emails Clicked", type: "number", icon: MousePointerClick },
  { value: "openRate", label: "Open Rate (%)", type: "number", icon: Eye },
  { value: "clickRate", label: "Click Rate (%)", type: "number", icon: MousePointerClick },
  { value: "daysSinceSignup", label: "Days Since Signup", type: "number", icon: Calendar },
  { value: "daysSinceLastOpen", label: "Days Since Last Open", type: "number", icon: Clock },
  { value: "status", label: "Status", type: "select", icon: Zap, options: ["subscribed", "unsubscribed", "bounced"] },
];

// Operators by field type
const operatorsByType: Record<string, Array<{ value: string; label: string }>> = {
  text: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  number: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
    { value: "greater_than", label: "is greater than" },
    { value: "less_than", label: "is less than" },
    { value: "between", label: "is between" },
  ],
  tags: [
    { value: "contains", label: "includes" },
    { value: "not_contains", label: "does not include" },
    { value: "is_empty", label: "has no tags" },
    { value: "is_not_empty", label: "has any tags" },
  ],
  select: [
    { value: "equals", label: "is" },
    { value: "not_equals", label: "is not" },
  ],
  date: [
    { value: "before", label: "before" },
    { value: "after", label: "after" },
    { value: "between", label: "between" },
  ],
};

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: "AND" | "OR";
}

// Condition Builder Component
function ConditionBuilder({
  condition,
  index,
  tags,
  onUpdate,
  onRemove,
  showLogic,
}: {
  condition: Condition;
  index: number;
  tags: Array<{ _id: Id<"emailTags">; name: string }>;
  onUpdate: (condition: Condition) => void;
  onRemove: () => void;
  showLogic: boolean;
}) {
  const field = segmentFields.find((f) => f.value === condition.field);
  const fieldType = field?.type || "text";
  const operators = operatorsByType[fieldType] || operatorsByType.text;
  const Icon = field?.icon || Filter;

  const needsValue = !["is_empty", "is_not_empty"].includes(condition.operator);
  const isBetween = condition.operator === "between";

  return (
    <div className="space-y-3">
      {/* Logic operator (AND/OR) */}
      {showLogic && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <button
              onClick={() => onUpdate({ ...condition, logic: "AND" })}
              className={cn(
                "rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                condition.logic !== "OR"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-primary/10"
              )}
            >
              AND
            </button>
            <button
              onClick={() => onUpdate({ ...condition, logic: "OR" })}
              className={cn(
                "rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                condition.logic === "OR"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-primary/10"
              )}
            >
              OR
            </button>
          </div>
        </div>
      )}

      {/* Condition row */}
      <div className="flex items-start gap-2 rounded-lg border bg-white p-3 dark:bg-zinc-900">
        <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>

        <div className="grid flex-1 gap-2 md:grid-cols-3">
          {/* Field selector */}
          <Select
            value={condition.field}
            onValueChange={(v) => onUpdate({ ...condition, field: v, value: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {segmentFields.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Operator selector */}
          <Select
            value={condition.operator}
            onValueChange={(v) =>
              onUpdate({
                ...condition,
                operator: v,
                value: v === "between" ? [0, 100] : "",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Value input */}
          {needsValue && (
            <>
              {fieldType === "tags" ? (
                <Select
                  value={condition.value || ""}
                  onValueChange={(v) => onUpdate({ ...condition, value: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag._id} value={tag.name}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : fieldType === "select" && field?.options ? (
                <Select
                  value={condition.value || ""}
                  onValueChange={(v) => onUpdate({ ...condition, value: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : isBetween ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={Array.isArray(condition.value) ? condition.value[0] : 0}
                    onChange={(e) =>
                      onUpdate({
                        ...condition,
                        value: [
                          Number(e.target.value),
                          Array.isArray(condition.value) ? condition.value[1] : 100,
                        ],
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={Array.isArray(condition.value) ? condition.value[1] : 100}
                    onChange={(e) =>
                      onUpdate({
                        ...condition,
                        value: [
                          Array.isArray(condition.value) ? condition.value[0] : 0,
                          Number(e.target.value),
                        ],
                      })
                    }
                    className="w-20"
                  />
                </div>
              ) : (
                <Input
                  type={fieldType === "number" ? "number" : "text"}
                  placeholder="Enter value"
                  value={condition.value || ""}
                  onChange={(e) =>
                    onUpdate({
                      ...condition,
                      value: fieldType === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                />
              )}
            </>
          )}
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SegmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const editId = searchParams.get("edit");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: "1", field: "status", operator: "equals", value: "subscribed" },
  ]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Id<"creatorEmailSegments"> | null>(null);

  const storeId = user?.id || "";

  // Queries
  const segments = useQuery(
    api.emailCreatorSegments.getCreatorSegments,
    storeId ? { storeId } : "skip"
  );

  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : "skip");

  const previewResult = useQuery(
    api.emailCreatorSegments.previewSegment,
    storeId && isPreviewOpen
      ? { storeId, conditions, limit: 20 }
      : "skip"
  );

  const segmentToEdit = useQuery(
    api.emailCreatorSegments.getSegmentById,
    editingSegment ? { segmentId: editingSegment } : "skip"
  );

  // Mutations
  const createSegment = useMutation(api.emailCreatorSegments.createSegment);
  const updateSegment = useMutation(api.emailCreatorSegments.updateSegment);
  const deleteSegment = useMutation(api.emailCreatorSegments.deleteSegment);
  const refreshSegment = useMutation(api.emailCreatorSegments.refreshSegment);
  const duplicateSegment = useMutation(api.emailCreatorSegments.duplicateSegment);

  // Load segment for editing
  useEffect(() => {
    if (segmentToEdit) {
      setSegmentName(segmentToEdit.name);
      setSegmentDescription(segmentToEdit.description || "");
      setIsDynamic(segmentToEdit.isDynamic);
      setConditions(segmentToEdit.conditions);
    }
  }, [segmentToEdit]);

  // Handle edit from URL
  useEffect(() => {
    if (editId) {
      setEditingSegment(editId as Id<"creatorEmailSegments">);
      setIsCreateOpen(true);
    }
  }, [editId]);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: String(Date.now()),
        field: "email",
        operator: "contains",
        value: "",
        logic: "AND",
      },
    ]);
  };

  const updateCondition = (index: number, updated: Condition) => {
    const newConditions = [...conditions];
    newConditions[index] = updated;
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!segmentName.trim()) {
      toast({ title: "Please enter a segment name", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (editingSegment) {
        await updateSegment({
          segmentId: editingSegment,
          name: segmentName,
          description: segmentDescription,
          conditions,
          isDynamic,
        });
        toast({ title: "Segment updated" });
      } else {
        await createSegment({
          storeId,
          name: segmentName,
          description: segmentDescription,
          conditions,
          isDynamic,
        });
        toast({ title: "Segment created" });
      }
      handleCloseCreate();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setEditingSegment(null);
    setSegmentName("");
    setSegmentDescription("");
    setIsDynamic(true);
    setConditions([{ id: "1", field: "status", operator: "equals", value: "subscribed" }]);
    router.replace("/dashboard/emails/segments?mode=create");
  };

  const handleDelete = async (segmentId: Id<"creatorEmailSegments">) => {
    if (!confirm("Are you sure you want to delete this segment?")) return;
    try {
      await deleteSegment({ segmentId });
      toast({ title: "Segment deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRefresh = async (segmentId: Id<"creatorEmailSegments">) => {
    try {
      const result = await refreshSegment({ segmentId });
      toast({ title: "Segment refreshed", description: `${result.memberCount} contacts` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (segmentId: Id<"creatorEmailSegments">) => {
    try {
      await duplicateSegment({ segmentId });
      toast({ title: "Segment duplicated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/emails?mode=create")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Email Segments</h1>
              <p className="text-sm text-muted-foreground">
                Create targeted groups for your broadcasts
              </p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Segment
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Segments List */}
        {segments && segments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {segments.map((segment: any) => (
              <Card key={segment._id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      {segment.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {segment.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingSegment(segment._id);
                            setIsCreateOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(segment._id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRefresh(segment._id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Count
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(segment._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{segment.memberCount}</span>
                      <span className="text-sm text-muted-foreground">contacts</span>
                    </div>
                    <Badge variant={segment.isDynamic ? "default" : "secondary"}>
                      {segment.isDynamic ? "Dynamic" : "Static"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {segment.conditions.slice(0, 3).map((c: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {segmentFields.find((f) => f.value === c.field)?.label || c.field}
                      </Badge>
                    ))}
                    {segment.conditions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{segment.conditions.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Updated {new Date(segment.lastUpdated).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No segments yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create segments to target specific groups of contacts
              </p>
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Segment
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create/Edit Segment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleCloseCreate()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSegment ? "Edit Segment" : "Create Segment"}
            </DialogTitle>
            <DialogDescription>
              Define conditions to filter your contacts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name and Description */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Segment Name *</Label>
                <Input
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g., Highly Engaged"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={segmentDescription}
                  onChange={(e) => setSegmentDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>

            {/* Dynamic toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label className="font-medium">Dynamic Segment</Label>
                <p className="text-xs text-muted-foreground">
                  Auto-update when contacts change
                </p>
              </div>
              <Switch checked={isDynamic} onCheckedChange={setIsDynamic} />
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Conditions</Label>
                <Button variant="outline" size="sm" onClick={addCondition} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Condition
                </Button>
              </div>

              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <ConditionBuilder
                    key={condition.id}
                    condition={condition}
                    index={index}
                    tags={tags || []}
                    onUpdate={(updated) => updateCondition(index, updated)}
                    onRemove={() => removeCondition(index)}
                    showLogic={index > 0}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Preview</Label>
                  <p className="text-xs text-muted-foreground">
                    See which contacts match your conditions
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  {isPreviewOpen ? "Hide" : "Show"} Preview
                </Button>
              </div>

              {isPreviewOpen && previewResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">{previewResult.count}</span>
                    <span className="text-muted-foreground">contacts match</span>
                  </div>

                  {previewResult.contacts.length > 0 && (
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {previewResult.contacts.map((contact) => (
                        <div
                          key={contact._id}
                          className="flex items-center justify-between rounded bg-white p-2 text-sm dark:bg-zinc-900"
                        >
                          <div>
                            <p className="font-medium">
                              {contact.firstName || contact.lastName
                                ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                : contact.email}
                            </p>
                            {(contact.firstName || contact.lastName) && (
                              <p className="text-xs text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                          {contact.tags.length > 0 && (
                            <div className="flex gap-1">
                              {contact.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreate}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editingSegment ? "Update" : "Create"} Segment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
