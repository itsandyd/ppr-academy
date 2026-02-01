"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  MarketingCampaignTemplate,
  Platform,
  campaignCategories,
} from "@/lib/marketing-campaigns/types";
import {
  getTemplateById,
} from "@/lib/marketing-campaigns/templates";
import { replaceTemplateVariables, validateVariables } from "@/lib/marketing-campaigns/utils";
import { CampaignBrowser } from "@/components/marketing/CampaignBrowser";
import { CampaignPreview } from "@/components/marketing/CampaignPreview";
import { PlatformTabs } from "@/components/marketing/PlatformTabs";
import { PlatformContentEditor } from "@/components/marketing/PlatformContentEditor";
import { VariableFiller } from "@/components/marketing/VariableFiller";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Megaphone,
  Save,
  LayoutTemplate,
  Edit3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function AdminNewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const { user } = useUser();

  const [step, setStep] = useState<"template" | "variables" | "customize" | "preview">(
    templateId ? "variables" : "template"
  );
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingCampaignTemplate | null>(
    templateId ? getTemplateById(templateId) || null : null
  );
  const [campaignName, setCampaignName] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [activePlatform, setActivePlatform] = useState<Platform>("email");
  const [customContent, setCustomContent] = useState<Record<Platform, unknown>>({} as Record<Platform, unknown>);
  const [isSaving, setIsSaving] = useState(false);

  const createCampaign = useMutation(api.marketingCampaigns.createCampaign);

  // Initialize custom content when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const content = replaceTemplateVariables(selectedTemplate, variableValues);
      setCustomContent({
        email: content.email,
        instagram: content.instagram,
        twitter: content.twitter,
        facebook: content.facebook,
        linkedin: content.linkedin,
        tiktok: content.tiktok,
      } as Record<Platform, unknown>);
    }
  }, [selectedTemplate, variableValues]);

  // Set default campaign name from template
  useEffect(() => {
    if (selectedTemplate && !campaignName) {
      setCampaignName(selectedTemplate.name);
    }
  }, [selectedTemplate, campaignName]);

  const handleSelectTemplate = (template: MarketingCampaignTemplate) => {
    setSelectedTemplate(template);
    setStep("variables");
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  };

  const handlePlatformContentChange = (platform: Platform, content: unknown) => {
    setCustomContent((prev) => ({ ...prev, [platform]: content }));
  };

  const handleSave = async (asDraft = true) => {
    if (!user || !selectedTemplate) return;

    setIsSaving(true);
    try {
      const campaignId = await createCampaign({
        storeId: "admin", // Admin campaigns use "admin" as storeId
        userId: user.id,
        templateId: selectedTemplate.id,
        name: campaignName || selectedTemplate.name,
        description: selectedTemplate.description,
        campaignType: selectedTemplate.campaignType,
        variableValues,
        emailContent: customContent.email,
        instagramContent: customContent.instagram,
        twitterContent: customContent.twitter,
        facebookContent: customContent.facebook,
        linkedinContent: customContent.linkedin,
        tiktokContent: customContent.tiktok,
      });

      toast.success(asDraft ? "Campaign saved as draft" : "Campaign created");
      router.push(`/admin/marketing/campaigns/${campaignId}`);
    } catch (error) {
      toast.error("Failed to create campaign");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case "template":
        return !!selectedTemplate;
      case "variables":
        if (!selectedTemplate) return false;
        const { valid } = validateVariables(selectedTemplate.variables, variableValues);
        return valid && campaignName.trim() !== "";
      case "customize":
        return true;
      case "preview":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const steps: ("template" | "variables" | "customize" | "preview")[] = [
      "template",
      "variables",
      "customize",
      "preview",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: ("template" | "variables" | "customize" | "preview")[] = [
      "template",
      "variables",
      "customize",
      "preview",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const category = selectedTemplate
    ? campaignCategories.find((c) => c.type === selectedTemplate.campaignType)
    : null;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/marketing/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Create Admin Campaign
            </h1>
            {selectedTemplate && (
              <p className="text-muted-foreground">
                Using template: {selectedTemplate.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={!selectedTemplate || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[
          { key: "template", label: "Template", icon: LayoutTemplate },
          { key: "variables", label: "Fill Details", icon: Edit3 },
          { key: "customize", label: "Customize", icon: Edit3 },
          { key: "preview", label: "Preview", icon: Eye },
        ].map(({ key, label, icon: Icon }, index) => {
          const steps = ["template", "variables", "customize", "preview"];
          const currentIndex = steps.indexOf(step);
          const stepIndex = steps.indexOf(key);
          const isActive = step === key;
          const isComplete = stepIndex < currentIndex;

          return (
            <div key={key} className="flex items-center">
              <button
                onClick={() => {
                  if (isComplete || isActive) {
                    setStep(key as "template" | "variables" | "customize" | "preview");
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
                disabled={!isComplete && !isActive}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden md:inline">{label}</span>
              </button>
              {index < 3 && (
                <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardContent className="p-6">
          {/* Step 1: Select Template */}
          {step === "template" && (
            <CampaignBrowser
              onSelectTemplate={handleSelectTemplate}
              selectedTemplateId={selectedTemplate?.id}
              maxHeight="500px"
            />
          )}

          {/* Step 2: Fill Variables */}
          {step === "variables" && selectedTemplate && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Template</Label>
                  <div className="flex items-center gap-2 mt-2 p-3 border rounded-lg">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category?.color}20` }}
                    >
                      <Megaphone
                        className="h-5 w-5"
                        style={{ color: category?.color }}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTemplate.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category?.label}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setStep("template")}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <VariableFiller
                variables={selectedTemplate.variables}
                values={variableValues}
                onChange={handleVariableChange}
              />
            </div>
          )}

          {/* Step 3: Customize Content */}
          {step === "customize" && selectedTemplate && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Edit Platform Content</h3>
                <PlatformTabs
                  activePlatform={activePlatform}
                  onPlatformChange={setActivePlatform}
                  enabledPlatforms={
                    Object.entries({
                      email: selectedTemplate.email,
                      instagram: selectedTemplate.instagram,
                      twitter: selectedTemplate.twitter,
                      facebook: selectedTemplate.facebook,
                      linkedin: selectedTemplate.linkedin,
                      tiktok: selectedTemplate.tiktok,
                    })
                      .filter(([, content]) => content)
                      .map(([platform]) => platform) as Platform[]
                  }
                  showLabels={true}
                  variant="default"
                />
                <div className="mt-4">
                  <PlatformContentEditor
                    platform={activePlatform}
                    content={(customContent[activePlatform] || {}) as Parameters<typeof PlatformContentEditor>[0]["content"]}
                    onChange={(content) =>
                      handlePlatformContentChange(activePlatform, content)
                    }
                    originalContent={
                      replaceTemplateVariables(selectedTemplate, variableValues)[
                        activePlatform
                      ] as Parameters<typeof PlatformContentEditor>[0]["originalContent"]
                    }
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Preview</h3>
                <ScrollArea className="h-[500px]">
                  <CampaignPreview
                    template={selectedTemplate}
                    variableValues={variableValues}
                    showPlatform={activePlatform}
                    compact={true}
                  />
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Step 4: Final Preview */}
          {step === "preview" && selectedTemplate && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{campaignName}</h3>
                  <p className="text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                </div>
                <Badge style={{ backgroundColor: category?.color }}>
                  {category?.label}
                </Badge>
              </div>

              <Separator />

              <CampaignPreview
                template={selectedTemplate}
                variableValues={variableValues}
                showPlatform="all"
                className="max-h-[500px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === "template"}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <div className="flex gap-2">
          {step === "preview" ? (
            <Button onClick={() => handleSave(false)} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Create Campaign
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminNewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AdminNewCampaignContent />
    </Suspense>
  );
}
