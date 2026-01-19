"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  Grid3X3,
  UserPlus,
  DollarSign,
  Heart,
  GraduationCap,
  Hand,
  ShoppingBag,
  Sprout,
  Music,
  Loader2,
  Eye,
  Play,
} from "lucide-react";
import { workflowTemplates, templateCategories, WorkflowTemplate } from "./workflow-templates";

const iconMap: Record<string, React.ElementType> = {
  wave: Hand,
  shoppingBag: ShoppingBag,
  graduationCap: GraduationCap,
  heart: Heart,
  seedling: Sprout,
  music: Music,
  grid: Grid3X3,
  userPlus: UserPlus,
  dollarSign: DollarSign,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  onboarding: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/30",
  },
  sales: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  engagement: {
    bg: "bg-pink-500/10",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/30",
  },
  education: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
  },
};

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const storeId = user?.id ?? "";

  const store = useQuery(api.stores.getUserStore, user?.id ? { userId: user.id } : "skip");

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);

  const filteredTemplates =
    selectedCategory === "all"
      ? workflowTemplates
      : workflowTemplates.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    if (!storeId || !user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to create workflows",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const triggerNode = template.nodes.find((n) => n.type === "trigger");

      const nodesData = template.nodes.map((n) => ({
        id: n.id,
        type: n.type as "trigger" | "email" | "delay" | "condition" | "action",
        position: n.position,
        data: n.data,
      }));

      const edgesData = template.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
      }));

      const triggerData = {
        type: (triggerNode?.data.triggerType || "lead_signup") as
          | "lead_signup"
          | "product_purchase"
          | "tag_added"
          | "manual"
          | "time_delay"
          | "date_time"
          | "customer_action",
        config: triggerNode?.data || {},
      };

      const newId = await createWorkflow({
        name: template.name,
        storeId,
        userId: user.id,
        trigger: triggerData,
        nodes: nodesData,
        edges: edgesData,
      });

      toast({
        title: "Workflow Created",
        description: `"${template.name}" has been created from the template. You can now customize it.`,
      });

      router.push(`/dashboard/emails/workflows?mode=create&id=${newId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow from template",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
      setPreviewTemplate(null);
    }
  };

  const getNodeCount = (template: WorkflowTemplate) => {
    return template.nodes.length;
  };

  const getEmailCount = (template: WorkflowTemplate) => {
    return template.nodes.filter((n) => n.type === "email").length;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/emails?mode=create")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold md:text-2xl">Workflow Templates</h1>
              <p className="text-sm text-muted-foreground">
                Start with a pre-built automation and customize it for your needs
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {templateCategories.map((category) => {
            const Icon = iconMap[category.icon] || Grid3X3;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Templates Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const Icon = iconMap[template.icon] || Grid3X3;
            const colors = categoryColors[template.category];

            return (
              <Card
                key={template.id}
                className="group overflow-hidden transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-0">
                  {/* Card Header with Icon */}
                  <div className={`${colors.bg} p-4`}>
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-900`}
                      >
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{template.name}</h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="mb-4 flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{template.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-medium">{getNodeCount(template)}</span> nodes
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-medium">{getEmailCount(template)}</span> emails
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => handleUseTemplate(template)}
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No templates found in this category.</p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white dark:bg-black">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const Icon = iconMap[previewTemplate.icon] || Grid3X3;
                    const colors = categoryColors[previewTemplate.category];
                    return (
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}
                      >
                        <Icon className={`h-5 w-5 ${colors.text}`} />
                      </div>
                    );
                  })()}
                  {previewTemplate.name}
                </DialogTitle>
                <DialogDescription>{previewTemplate.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Stats */}
                <div className="flex flex-wrap gap-4 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Duration:</strong> {previewTemplate.estimatedTime}
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>{getNodeCount(previewTemplate)}</strong> total nodes
                  </div>
                  <div className="text-sm">
                    <strong>{getEmailCount(previewTemplate)}</strong> emails
                  </div>
                </div>

                {/* Workflow Steps */}
                <div>
                  <h4 className="mb-3 font-medium">Workflow Steps</h4>
                  <div className="space-y-2">
                    {previewTemplate.nodes.map((node, index) => (
                      <div
                        key={node.id}
                        className="flex items-start gap-3 rounded-lg border bg-white p-3 dark:bg-zinc-900"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {node.type}
                            </Badge>
                            {node.type === "email" && node.data.templateName && (
                              <span className="text-sm text-muted-foreground">
                                {node.data.templateName}
                              </span>
                            )}
                            {node.type === "delay" && (
                              <span className="text-sm text-muted-foreground">
                                Wait {node.data.delayValue} {node.data.delayUnit}
                              </span>
                            )}
                            {node.type === "trigger" && (
                              <span className="text-sm text-muted-foreground">
                                {node.data.description}
                              </span>
                            )}
                            {node.type === "condition" && (
                              <span className="text-sm text-muted-foreground">
                                {node.data.description}
                              </span>
                            )}
                            {node.type === "action" && (
                              <span className="text-sm text-muted-foreground">
                                {node.data.actionType}: {node.data.value}
                              </span>
                            )}
                          </div>
                          {node.type === "email" && node.data.subject && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Subject: {node.data.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUseTemplate(previewTemplate)}
                  disabled={isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
