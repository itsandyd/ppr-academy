"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Zap,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Instagram,
  Send,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

// Template definitions
const AUTOMATION_TEMPLATES = [
  {
    id: "lead-magnet",
    name: "Lead Magnet Delivery",
    description: "Automatically send download links when someone DMs a keyword",
    trigger: "DM",
    listener: "MESSAGE",
    icon: Send,
    color: "bg-blue-500",
  },
  {
    id: "comment-reply",
    name: "Comment Auto-Reply",
    description: "Reply to comments and send a DM with more info",
    trigger: "COMMENT",
    listener: "MESSAGE",
    icon: MessageCircle,
    color: "bg-green-500",
  },
  {
    id: "smart-ai",
    name: "Smart AI Responder",
    description: "Use AI to have intelligent conversations with your audience",
    trigger: "DM",
    listener: "SMARTAI",
    icon: Sparkles,
    color: "bg-purple-500",
  },
  {
    id: "blank",
    name: "Blank Automation",
    description: "Start from scratch with a custom automation",
    trigger: null,
    listener: null,
    icon: Zap,
    color: "bg-gray-500",
  },
];

interface Automation {
  _id: Id<"automations">;
  name: string;
  active: boolean;
  _creationTime: number;
  keywords: Array<{ _id: Id<"keywords">; word: string }>;
  trigger: { _id: Id<"triggers">; type: "COMMENT" | "DM" } | null;
  listener: {
    _id: Id<"listeners">;
    listener: "MESSAGE" | "SMARTAI";
    prompt?: string;
  } | null;
  posts: Array<{ _id: Id<"posts">; postId: string }>;
}

export default function AutomationsListPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"automations"> | null>(null);

  // Queries
  const automations = useQuery(
    api.automations.getUserAutomations,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  ) as Automation[] | undefined;

  // Mutations
  const createAutomation = useMutation(api.automations.createAutomation);
  const updateAutomation = useMutation(api.automations.updateAutomation);
  const deleteAutomation = useMutation(api.automations.deleteAutomation);

  const handleCreateAutomation = async (templateId: string) => {
    if (!clerkUser?.id) return;

    setIsCreating(true);
    try {
      const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId);
      const result = await createAutomation({
        clerkId: clerkUser.id,
        name: template?.name || "Untitled Automation",
      });

      if (result.status === 201 && result.data?._id) {
        setIsCreateDialogOpen(false);
        toast.success("Automation created!");
        router.push(
          `/dashboard/social/automation/${result.data._id}${templateId !== "blank" ? `?template=${templateId}` : ""}`
        );
      } else {
        toast.error("Failed to create automation");
      }
    } catch (error) {
      console.error("Error creating automation:", error);
      toast.error("Failed to create automation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (
    automationId: Id<"automations">,
    currentActive: boolean
  ) => {
    try {
      await updateAutomation({
        automationId,
        active: !currentActive,
      });
      toast.success(currentActive ? "Automation paused" : "Automation activated");
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast.error("Failed to update automation");
    }
  };

  const handleDelete = async (automationId: Id<"automations">) => {
    if (!clerkUser?.id) return;

    setDeletingId(automationId);
    try {
      const result = await deleteAutomation({
        automationId,
        clerkId: clerkUser.id,
      });

      if (result.status === 200) {
        toast.success("Automation deleted");
      } else {
        toast.error(result.message || "Failed to delete automation");
      }
    } catch (error) {
      console.error("Error deleting automation:", error);
      toast.error("Failed to delete automation");
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (!isLoaded || automations === undefined) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (automations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No automations yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first automation to start engaging with your audience
            automatically. Respond to DMs, comments, and more.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Automation</DialogTitle>
                <DialogDescription>
                  Choose a template to get started quickly, or start from scratch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                {AUTOMATION_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateAutomation(template.id)}
                    disabled={isCreating}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center flex-shrink-0`}
                    >
                      <template.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">DM Automations</h1>
          <p className="text-muted-foreground">
            Automate responses to keywords in DMs and comments
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
              <DialogDescription>
                Choose a template to get started quickly, or start from scratch.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              {AUTOMATION_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleCreateAutomation(template.id)}
                  disabled={isCreating}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <template.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((automation) => (
          <Card key={automation._id} className="relative">
            <CardContent className="p-4">
              {/* Header with name and toggle */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{automation.name}</h3>
                  <Badge
                    variant={automation.active ? "default" : "secondary"}
                    className={`mt-1 ${automation.active ? "bg-green-500 hover:bg-green-600" : ""}`}
                  >
                    {automation.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <Switch
                  checked={automation.active}
                  onCheckedChange={() =>
                    handleToggleActive(automation._id, automation.active)
                  }
                />
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {automation.keywords.slice(0, 3).map((keyword) => (
                  <Badge
                    key={keyword._id}
                    variant="outline"
                    className="text-xs font-mono"
                  >
                    {keyword.word}
                  </Badge>
                ))}
                {automation.keywords.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{automation.keywords.length - 3} more
                  </Badge>
                )}
                {automation.keywords.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No keywords set
                  </span>
                )}
              </div>

              {/* Trigger & Listener Info */}
              <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                {automation.trigger && (
                  <div className="flex items-center gap-1">
                    {automation.trigger.type === "DM" ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    <span>{automation.trigger.type}</span>
                  </div>
                )}
                {automation.listener && (
                  <div className="flex items-center gap-1">
                    {automation.listener.listener === "SMARTAI" ? (
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>
                      {automation.listener.listener === "SMARTAI"
                        ? "Smart AI"
                        : "Message"}
                    </span>
                  </div>
                )}
                {!automation.trigger && !automation.listener && (
                  <span className="text-muted-foreground">Not configured</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`/dashboard/social/automation/${automation._id}`)
                  }
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === automation._id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Automation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{automation.name}
                        &quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(automation._id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
