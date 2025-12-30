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

      if (result.combinedScript) {
        setCombinedScript(result.combinedScript);
        updateData("combine", { combinedScript: result.combinedScript });
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
  }, [combinedScript]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Combine Scripts & Add CTA</h2>
        <p className="text-muted-foreground">
          Merge your platform scripts into one unified script and add a call-to-action.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Call-to-Action
              </CardTitle>
              <CardDescription>Select a template or create a custom CTA</CardDescription>
            </div>
            <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
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
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Template</Label>
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
            <div className="space-y-2">
              <Label>Keyword</Label>
              <Input
                placeholder="e.g., COMPRESSION"
                value={ctaKeyword}
                onChange={(e) => setCtaKeyword(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>CTA Text</Label>
            <Textarea
              placeholder="Comment COMPRESSION and I'll DM you access to my free compression masterclass..."
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Combined Script
              </CardTitle>
              <CardDescription>The final unified script for all platforms</CardDescription>
            </div>
            <Button onClick={handleCombineScripts} disabled={isGenerating} className="gap-2">
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
        <CardContent>
          <Textarea
            value={combinedScript}
            onChange={(e) => setCombinedScript(e.target.value)}
            placeholder="Combined script will appear here..."
            className="min-h-[400px] font-mono text-sm"
          />
          {combinedScript && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">{combinedScript.length} characters</Badge>
              <Badge variant="outline">
                ~{Math.ceil(combinedScript.split(/\s+/).length / 150)} min read
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep("scripts")} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!combinedScript || state.isSaving}
          className="gap-2"
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
