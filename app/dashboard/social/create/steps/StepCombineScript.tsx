"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Plus,
  Megaphone,
} from "lucide-react";

export function StepCombineScript() {
  const { user } = useUser();
  const { state, updateData, goToStep, savePost, setGenerating } = useSocialPost();

  const [combinedScript, setCombinedScript] = useState(state.data.combinedScript || "");
  const [ctaKeyword, setCtaKeyword] = useState(state.data.ctaKeyword || "");
  const [ctaText, setCtaText] = useState(state.data.ctaText || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"ctaTemplates"> | undefined>(
    state.data.ctaTemplateId
  );
  const [isGenerating, setIsGeneratingLocal] = useState(false);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateKeyword, setNewTemplateKeyword] = useState("");
  const [newTemplateText, setNewTemplateText] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && state.data.combinedScript) {
      setCombinedScript(state.data.combinedScript);
      if (state.data.ctaKeyword) setCtaKeyword(state.data.ctaKeyword);
      if (state.data.ctaText) setCtaText(state.data.ctaText);
      if (state.data.ctaTemplateId) setSelectedTemplateId(state.data.ctaTemplateId);
      setHasInitialized(true);
    }
  }, [
    state.data.combinedScript,
    state.data.ctaKeyword,
    state.data.ctaText,
    state.data.ctaTemplateId,
    hasInitialized,
  ]);

  const ctaTemplates = useQuery(
    api.socialMediaPosts.getCTATemplatesByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  const combineScripts = useAction(api.masterAI.socialMediaGenerator.combineScripts);
  const createTemplate = useMutation(api.socialMediaPosts.createCTATemplate);

  const handleCombineScripts = async () => {
    setIsGeneratingLocal(true);
    setGenerating(true);

    try {
      const result = await combineScripts({
        tiktokScript: state.data.tiktokScript || "",
        youtubeScript: state.data.youtubeScript || "",
        instagramScript: state.data.instagramScript || "",
        ctaText: ctaText || undefined,
      });

      const finalScript = ctaText ? result.scriptWithCta : result.combinedScript;
      if (finalScript) {
        setCombinedScript(finalScript);
        updateData("combine", { combinedScript: finalScript });
      }
    } catch (error) {
      console.error("Failed to combine scripts:", error);
    } finally {
      setIsGeneratingLocal(false);
      setGenerating(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = ctaTemplates?.find((t: { _id: Id<"ctaTemplates"> }) => t._id === templateId);
    if (template) {
      setSelectedTemplateId(template._id);
      setCtaKeyword(template.keyword);
      setCtaText(template.template);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user?.id || !newTemplateName || !newTemplateKeyword || !newTemplateText) return;

    try {
      await createTemplate({
        userId: user.id,
        name: newTemplateName,
        keyword: newTemplateKeyword,
        template: newTemplateText,
      });
      setShowNewTemplateDialog(false);
      setNewTemplateName("");
      setNewTemplateKeyword("");
      setNewTemplateText("");
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleContinue = async () => {
    updateData("combine", {
      combinedScript,
      ctaTemplateId: selectedTemplateId,
      ctaText,
      ctaKeyword,
    });
    await savePost();
    goToStep("images");
  };

  useEffect(() => {
    updateData("combine", { combinedScript });
  }, [combinedScript, updateData]);

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-bold text-foreground sm:mb-2 sm:text-2xl">
          Combine Scripts & Add CTA
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Merge your platform scripts into one unified script and add a call-to-action.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                Call-to-Action
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Select a template or create a custom CTA
              </CardDescription>
            </div>
            <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-black">
                <DialogHeader>
                  <DialogTitle>Create CTA Template</DialogTitle>
                  <DialogDescription>
                    Save a reusable call-to-action for future posts
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      placeholder="e.g., Free Course Access"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keyword</Label>
                    <Input
                      placeholder="e.g., COMPRESSION"
                      value={newTemplateKeyword}
                      onChange={(e) => setNewTemplateKeyword(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Text</Label>
                    <Textarea
                      placeholder="Comment [KEYWORD] and I'll DM you access to..."
                      value={newTemplateText}
                      onChange={(e) => setNewTemplateText(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button onClick={handleCreateTemplate} className="w-full">
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Select Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a CTA template" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {ctaTemplates?.map(
                    (template: { _id: Id<"ctaTemplates">; name: string; keyword: string }) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.name} ({template.keyword})
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Keyword</Label>
              <Input
                placeholder="e.g., COMPRESSION"
                value={ctaKeyword}
                onChange={(e) => setCtaKeyword(e.target.value.toUpperCase())}
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">CTA Text</Label>
            <Textarea
              placeholder="Comment COMPRESSION and I'll DM you access..."
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="min-h-[80px] text-sm sm:min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                Combined Script
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                The final unified script
              </CardDescription>
            </div>
            <Button
              onClick={handleCombineScripts}
              disabled={isGenerating}
              className="w-full gap-2 sm:w-auto"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Combining...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {combinedScript ? "Re-combine" : "Combine Scripts"}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <Textarea
            value={combinedScript}
            onChange={(e) => setCombinedScript(e.target.value)}
            placeholder="Combined script will appear here..."
            className="min-h-[250px] font-mono text-sm sm:min-h-[400px]"
          />
          {combinedScript && (
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
              <Badge variant="secondary" className="text-xs">
                {combinedScript.length} chars
              </Badge>
              <Badge variant="outline" className="text-xs">
                ~{Math.ceil(combinedScript.split(/\s+/).length / 150)} min
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep("scripts")}
          className="order-2 gap-2 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!combinedScript || state.isSaving}
          className="order-1 gap-2 sm:order-2"
          size="lg"
        >
          {state.isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Images
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
