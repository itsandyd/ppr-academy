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
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  ChevronRight,
  Loader2,
  Mail,
  Package,
  GraduationCap,
  Sparkles,
  Zap,
  Users,
  ShoppingBag,
  Heart,
  ArrowLeft,
  Music,
  Mic2,
  Radio,
} from "lucide-react";
import { generateSmartWorkflows, type GeneratedWorkflow } from "./workflow-generator";

type WizardStep = "welcome" | "analyze" | "tone" | "preview" | "creating" | "complete";

type ToneOption = "professional" | "casual" | "hype";

const toneOptions: { id: ToneOption; label: string; description: string; icon: React.ReactNode }[] =
  [
    {
      id: "professional",
      label: "Professional",
      description: "Clean, polished, industry-standard communication",
      icon: <Mic2 className="h-6 w-6" />,
    },
    {
      id: "casual",
      label: "Casual & Friendly",
      description: "Warm, approachable, like texting a friend",
      icon: <Heart className="h-6 w-6" />,
    },
    {
      id: "hype",
      label: "Hype & Energetic",
      description: "High energy, exciting, gets people pumped",
      icon: <Zap className="h-6 w-6" />,
    },
  ];

export default function EmailSetupWizard() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedTone, setSelectedTone] = useState<ToneOption>("casual");
  const [generatedWorkflows, setGeneratedWorkflows] = useState<GeneratedWorkflow[]>([]);
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
    productTypes: [
      ...new Set(products?.map((p: any) => p.productCategory).filter(Boolean)),
    ] as string[],
    topProducts: products?.slice(0, 3) || [],
    topCourses: courses?.slice(0, 3) || [],
    hasExistingWorkflows: (existingWorkflows?.length || 0) > 0,
    existingWorkflowCount: existingWorkflows?.length || 0,
  };

  // Generate workflows when we have data and move to preview
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
        setStep("tone");
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
    }
  };

  // Create all workflows
  const handleCreateWorkflows = async () => {
    if (!storeId || !user?.id) return;

    setStep("creating");
    setIsCreating(true);
    setCreationProgress(0);

    try {
      for (let i = 0; i < generatedWorkflows.length; i++) {
        const workflow = generatedWorkflows[i];
        setCreationProgress(Math.round(((i + 1) / generatedWorkflows.length) * 100));

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
        description: `Created ${generatedWorkflows.length} automated workflows for your store.`,
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
                We'll analyze your store and create personalized email automations that run on
                autopilot. This takes about 2 minutes.
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-green-600" />
                  <h3 className="font-semibold">Welcome Series</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Automatically nurture new subscribers
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                  <h3 className="font-semibold">Purchase Follow-up</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thank customers & get reviews
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <GraduationCap className="mx-auto mb-3 h-8 w-8 text-purple-600" />
                  <h3 className="font-semibold">Course Onboarding</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Guide students to completion</p>
                </CardContent>
              </Card>
            </div>

            {storeAnalysis.hasExistingWorkflows && (
              <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You already have {storeAnalysis.existingWorkflowCount} workflow
                  {storeAnalysis.existingWorkflowCount !== 1 ? "s" : ""}. This wizard will create
                  additional workflows without affecting your existing ones.
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
                <span>Generating personalized emails...</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Tone Selection */}
        {step === "tone" && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold md:text-3xl">What's your vibe?</h1>
              <p className="mt-2 text-muted-foreground">
                Choose a tone that matches your brand personality
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
              <Button variant="outline" onClick={() => setStep("welcome")}>
                Back
              </Button>
              <Button onClick={() => setStep("preview")} className="gap-2">
                Preview Workflows
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold md:text-3xl">Here's what we'll create for you</h1>
              <p className="mt-2 text-muted-foreground">
                {generatedWorkflows.length} automated workflows, personalized for {storeName}
              </p>
            </div>

            <div className="space-y-4">
              {generatedWorkflows.map((workflow, index) => (
                <Card key={workflow.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          workflow.type === "welcome"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : workflow.type === "purchase"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : workflow.type === "course"
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        }`}
                      >
                        {workflow.type === "welcome" && <Users className="h-5 w-5" />}
                        {workflow.type === "purchase" && <ShoppingBag className="h-5 w-5" />}
                        {workflow.type === "course" && <GraduationCap className="h-5 w-5" />}
                        {workflow.type === "winback" && <Heart className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {workflow.nodes.filter((n) => n.type === "email").length} emails
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{workflow.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          <strong>Trigger:</strong> {workflow.triggerDescription}
                        </p>
                      </div>
                    </div>

                    {/* Email previews */}
                    <div className="border-t bg-zinc-50 p-4 dark:bg-zinc-900/50">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Email subjects:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {workflow.nodes
                          .filter((n) => n.type === "email")
                          .slice(0, 3)
                          .map((node, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal">
                              {node.data.subject}
                            </Badge>
                          ))}
                        {workflow.nodes.filter((n) => n.type === "email").length > 3 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            +{workflow.nodes.filter((n) => n.type === "email").length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep("tone")}>
                Back
              </Button>
              <Button onClick={handleCreateWorkflows} size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Create All Workflows
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
                Your email marketing is now running on autopilot. Here's what will happen:
              </p>
            </div>

            <div className="mx-auto max-w-lg space-y-3 text-left">
              {generatedWorkflows.map((workflow) => (
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

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/emails?mode=create")}
              >
                View All Workflows
              </Button>
              <Button onClick={() => router.push("/dashboard?mode=create")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
