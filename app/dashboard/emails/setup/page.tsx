"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  ChevronRight,
  Loader2,
  Mail,
  GraduationCap,
  Sparkles,
  Zap,
  Users,
  ShoppingBag,
  Heart,
  ArrowLeft,
  Mic2,
} from "lucide-react";
import { generateSmartWorkflows, type GeneratedWorkflow } from "./workflow-generator";

type WizardStep = "welcome" | "analyze" | "select" | "tone" | "preview" | "creating" | "complete";

type ToneOption = "professional" | "casual" | "hype";

const toneOptions: { id: ToneOption; label: string; description: string; icon: React.ReactNode }[] =
  [
    {
      id: "professional",
      label: "Professional",
      description: "Clean, polished, industry-standard",
      icon: <Mic2 className="h-6 w-6" />,
    },
    {
      id: "casual",
      label: "Casual & Friendly",
      description: "Warm, approachable, conversational",
      icon: <Heart className="h-6 w-6" />,
    },
    {
      id: "hype",
      label: "Hype & Energetic",
      description: "High energy, exciting, bold",
      icon: <Zap className="h-6 w-6" />,
    },
  ];

const workflowTypeInfo = {
  welcome: {
    icon: Users,
    label: "Welcome Series",
    description: "Automatically welcome new subscribers and introduce them to your content",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  purchase: {
    icon: ShoppingBag,
    label: "Purchase Follow-up",
    description: "Thank customers, check on their progress, and request reviews",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  course: {
    icon: GraduationCap,
    label: "Course Onboarding",
    description: "Guide students through your course with check-ins and encouragement",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  winback: {
    icon: Heart,
    label: "Win Back Inactive",
    description: "Re-engage subscribers who haven't opened emails in a while",
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
};

export default function EmailSetupWizard() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedTone, setSelectedTone] = useState<ToneOption>("casual");
  const [generatedWorkflows, setGeneratedWorkflows] = useState<GeneratedWorkflow[]>([]);
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);

  // Fetch store data
  const store = useQuery(api.stores.getUserStore, user?.id ? { userId: user.id } : "skip") as
    | { _id: Id<"stores">; name?: string; bio?: string }
    | null
    | undefined;

  // Fetch products
  const products = useQuery(
    api.digitalProducts.getProductsByStore,
    store?._id ? { storeId: store._id } : "skip"
  );

  // Fetch courses
  const courses = useQuery(
    api.courses.getCoursesByStore,
    store?._id ? { storeId: store._id } : "skip"
  );

  // Existing workflows to avoid duplicates
  const existingWorkflows = useQuery(
    api.emailWorkflows.listWorkflows,
    user?.id ? { storeId: user.id } : "skip"
  );

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);

  const storeId = user?.id || "";
  const storeName = store?.name || "your store";

  // Analyze store data
  const storeAnalysis = {
    hasProducts: (products?.length || 0) > 0,
    hasCourses: (courses?.length || 0) > 0,
    productCount: products?.length || 0,
    courseCount: courses?.length || 0,
    hasExistingWorkflows: (existingWorkflows?.length || 0) > 0,
    existingWorkflowCount: existingWorkflows?.length || 0,
  };

  // Generate workflows when we have data
  useEffect(() => {
    if (step === "analyze" && store && (products !== undefined || courses !== undefined)) {
      const timer = setTimeout(() => {
        const workflows = generateSmartWorkflows({
          storeName: store.name || "Your Store",
          creatorName: user?.firstName || "there",
          tone: selectedTone,
          products: products || [],
          courses: courses || [],
          storeUrl: `{{storeUrl}}`,
        });
        setGeneratedWorkflows(workflows);
        // Select all by default
        setSelectedWorkflowIds(new Set(workflows.map((w) => w.id)));
        setStep("select");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, store, products, courses, selectedTone, user?.firstName]);

  // Regenerate when tone changes
  const handleToneChange = (tone: ToneOption) => {
    setSelectedTone(tone);
    if (store) {
      const workflows = generateSmartWorkflows({
        storeName: store.name || "Your Store",
        creatorName: user?.firstName || "there",
        tone,
        products: products || [],
        courses: courses || [],
        storeUrl: `{{storeUrl}}`,
      });
      setGeneratedWorkflows(workflows);
      // Keep same selections
      const newIds = new Set(workflows.map((w) => w.id));
      setSelectedWorkflowIds((prev) => new Set([...prev].filter((id) => newIds.has(id))));
    }
  };

  // Toggle workflow selection
  const toggleWorkflow = (workflowId: string) => {
    setSelectedWorkflowIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(workflowId)) {
        newSet.delete(workflowId);
      } else {
        newSet.add(workflowId);
      }
      return newSet;
    });
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedWorkflowIds.size === generatedWorkflows.length) {
      setSelectedWorkflowIds(new Set());
    } else {
      setSelectedWorkflowIds(new Set(generatedWorkflows.map((w) => w.id)));
    }
  };

  // Get selected workflows
  const selectedWorkflows = generatedWorkflows.filter((w) => selectedWorkflowIds.has(w.id));

  // Create selected workflows
  const handleCreateWorkflows = async () => {
    if (!storeId || !user?.id || selectedWorkflows.length === 0) return;

    setStep("creating");
    setIsCreating(true);
    setCreationProgress(0);

    try {
      for (let i = 0; i < selectedWorkflows.length; i++) {
        const workflow = selectedWorkflows[i];
        setCreationProgress(Math.round(((i + 1) / selectedWorkflows.length) * 100));

        const triggerNode = workflow.nodes.find((n) => n.type === "trigger");

        await createWorkflow({
          name: workflow.name,
          storeId,
          userId: user.id,
          trigger: {
            type: triggerNode?.data.triggerType || "lead_signup",
            config: triggerNode?.data || {},
          },
          nodes: workflow.nodes.map((n) => ({
            id: n.id,
            type: n.type as any,
            position: n.position,
            data: n.data,
          })),
          edges: workflow.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle || undefined,
            targetHandle: e.targetHandle || undefined,
          })),
        });

        // Small delay between creations
        await new Promise((r) => setTimeout(r, 300));
      }

      setStep("complete");
      toast({
        title: "Email marketing is ready!",
        description: `Created ${selectedWorkflows.length} automated workflows for your store.`,
      });
    } catch (error) {
      toast({
        title: "Error creating workflows",
        description: "Some workflows may not have been created. Please try again.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state
  if (store === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/emails?mode=create")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Emails
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Email Setup Wizard</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">Let's set up your email marketing</h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                We'll analyze your store and create personalized email automations. You choose which
                ones to activate.
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-green-600" />
                  <h3 className="font-semibold">Welcome Series</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Nurture new subscribers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                  <h3 className="font-semibold">Purchase Follow-up</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Thank & get reviews</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <GraduationCap className="mx-auto mb-3 h-8 w-8 text-purple-600" />
                  <h3 className="font-semibold">Course Onboarding</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Guide students</p>
                </CardContent>
              </Card>
            </div>

            {storeAnalysis.hasExistingWorkflows && (
              <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You have {storeAnalysis.existingWorkflowCount} existing workflow
                  {storeAnalysis.existingWorkflowCount !== 1 ? "s" : ""}. New workflows will be
                  added without affecting them.
                </p>
              </div>
            )}

            <Button size="lg" onClick={() => setStep("analyze")} className="gap-2">
              Analyze My Store
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyze" && (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="text-2xl font-bold">Analyzing your store...</h1>
              <p className="text-muted-foreground">
                Looking at your products, courses, and content
              </p>
            </div>

            <div className="mx-auto max-w-md space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-zinc-900">
                <Check className="h-5 w-5 text-green-600" />
                <span>Found {storeAnalysis.productCount} products</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-zinc-900">
                <Check className="h-5 w-5 text-green-600" />
                <span>Found {storeAnalysis.courseCount} courses</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-zinc-900">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Generating personalized workflows...</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Select Workflows */}
        {step === "select" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold md:text-3xl">Choose your workflows</h1>
              <p className="mt-2 text-muted-foreground">
                Select which automations you want to create for {storeName}
              </p>
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between rounded-lg border bg-white p-4 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedWorkflowIds.size === generatedWorkflows.length}
                  onCheckedChange={toggleAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="cursor-pointer font-medium">
                  Select All ({generatedWorkflows.length} workflows)
                </label>
              </div>
              <Badge variant="secondary">{selectedWorkflowIds.size} selected</Badge>
            </div>

            {/* Workflow List */}
            <div className="space-y-3">
              {generatedWorkflows.map((workflow) => {
                const typeInfo = workflowTypeInfo[workflow.type];
                const Icon = typeInfo.icon;
                const isSelected = selectedWorkflowIds.has(workflow.id);

                return (
                  <Card
                    key={workflow.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"
                    }`}
                    onClick={() => toggleWorkflow(workflow.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleWorkflow(workflow.id)}
                          className="mt-1"
                        />
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeInfo.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {workflow.nodes.filter((n) => n.type === "email").length} emails
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {workflow.description}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            <strong>Trigger:</strong> {workflow.triggerDescription}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep("welcome")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("tone")}
                disabled={selectedWorkflowIds.size === 0}
                className="gap-2"
              >
                Continue ({selectedWorkflowIds.size} selected)
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Tone Selection */}
        {step === "tone" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold md:text-3xl">What's your vibe?</h1>
              <p className="mt-2 text-muted-foreground">
                Choose a tone for your emails - this affects how they're written
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-3">
              {toneOptions.map((tone) => (
                <Card
                  key={tone.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTone === tone.id
                      ? "border-primary ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleToneChange(tone.id)}
                >
                  <CardContent className="pt-6 text-center">
                    <div
                      className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                        selectedTone === tone.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tone.icon}
                    </div>
                    <h3 className="font-semibold">{tone.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tone.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={() => setStep("preview")} className="gap-2">
                Preview Emails
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold md:text-3xl">Preview your workflows</h1>
              <p className="mt-2 text-muted-foreground">
                {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? "s" : ""} ready
                to create
              </p>
            </div>

            <div className="space-y-4">
              {selectedWorkflows.map((workflow) => {
                const typeInfo = workflowTypeInfo[workflow.type];
                const Icon = typeInfo.icon;

                return (
                  <Card key={workflow.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeInfo.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {workflow.nodes.filter((n) => n.type === "email").length} emails
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {workflow.triggerDescription}
                          </p>
                        </div>
                      </div>

                      {/* Email previews */}
                      <div className="border-t bg-zinc-50 p-4 dark:bg-zinc-900/50">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Email subjects:
                        </p>
                        <div className="space-y-1">
                          {workflow.nodes
                            .filter((n) => n.type === "email")
                            .map((node, i) => (
                              <div
                                key={i}
                                className="truncate rounded bg-white px-2 py-1 text-sm dark:bg-zinc-800"
                              >
                                {i + 1}. {node.data.subject}
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep("tone")}>
                Back
              </Button>
              <Button onClick={handleCreateWorkflows} size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create {selectedWorkflows.length} Workflow
                {selectedWorkflows.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Creating */}
        {step === "creating" && (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="text-2xl font-bold">Creating your workflows...</h1>
              <p className="text-muted-foreground">This will just take a moment</p>
            </div>

            <div className="mx-auto max-w-md">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${creationProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{creationProgress}% complete</p>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <div className="space-y-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold">You're all set!</h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground">
                Your email marketing is now ready. Here's what will happen:
              </p>
            </div>

            <div className="mx-auto max-w-lg space-y-3 text-left">
              {selectedWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-zinc-900"
                >
                  <Check className="h-5 w-5 shrink-0 text-green-600" />
                  <span className="text-sm">
                    <strong>{workflow.triggerDescription}</strong> → {workflow.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Workflows are created as drafts. Go to each workflow to
                review and activate when ready.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => router.push("/dashboard/emails?mode=create")} size="lg">
                View My Workflows
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
