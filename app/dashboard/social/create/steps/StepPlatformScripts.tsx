"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Youtube,
  Instagram,
} from "lucide-react";

const TikTokIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export function StepPlatformScripts() {
  const { state, updateData, goToStep, savePost, setGenerating } = useSocialPost();
  const [activeTab, setActiveTab] = useState("tiktok");
  const [isGenerating, setIsGeneratingLocal] = useState(false);
  const [tiktokScript, setTiktokScript] = useState(state.data.tiktokScript || "");
  const [youtubeScript, setYoutubeScript] = useState(state.data.youtubeScript || "");
  const [instagramScript, setInstagramScript] = useState(state.data.instagramScript || "");
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (
      !hasInitialized &&
      (state.data.tiktokScript || state.data.youtubeScript || state.data.instagramScript)
    ) {
      if (state.data.tiktokScript) setTiktokScript(state.data.tiktokScript);
      if (state.data.youtubeScript) setYoutubeScript(state.data.youtubeScript);
      if (state.data.instagramScript) setInstagramScript(state.data.instagramScript);
      setHasInitialized(true);
    }
  }, [
    state.data.tiktokScript,
    state.data.youtubeScript,
    state.data.instagramScript,
    hasInitialized,
  ]);

  const generateScripts = useAction(api.masterAI.socialMediaGenerator.generatePlatformScripts);

  const handleGenerateAll = async () => {
    if (!state.data.sourceContent) return;

    setIsGeneratingLocal(true);
    setGenerating(true);

    try {
      const result = await generateScripts({
        sourceContent: state.data.sourceContent,
      });

      if (result.tiktokScript) setTiktokScript(result.tiktokScript);
      if (result.youtubeScript) setYoutubeScript(result.youtubeScript);
      if (result.instagramScript) setInstagramScript(result.instagramScript);

      updateData("scripts", {
        tiktokScript: result.tiktokScript,
        youtubeScript: result.youtubeScript,
        instagramScript: result.instagramScript,
      });
    } catch (error) {
      console.error("Failed to generate scripts:", error);
    } finally {
      setIsGeneratingLocal(false);
      setGenerating(false);
    }
  };

  const handleContinue = async () => {
    updateData("scripts", {
      tiktokScript,
      youtubeScript,
      instagramScript,
    });
    await savePost();
    goToStep("combine");
  };

  const hasAnyScript = tiktokScript || youtubeScript || instagramScript;

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="mb-1 text-lg font-bold text-foreground sm:mb-2 sm:text-2xl">
          Generate Platform Scripts
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          AI will create optimized scripts for TikTok, YouTube Shorts, and Instagram Reels.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Source Content</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {state.data.sourceContent?.length || 0} characters
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || !state.data.sourceContent}
              className="w-full gap-2 sm:w-auto"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : hasAnyScript ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate All
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Scripts
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tiktok" className="gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <TikTokIcon />
            <span className="xs:inline hidden">TikTok</span>
            {tiktokScript && (
              <Badge
                variant="secondary"
                className="ml-0.5 hidden text-[10px] sm:ml-1 sm:inline-flex sm:text-xs"
              >
                Ready
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="youtube" className="gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <Youtube className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="xs:inline hidden">YouTube</span>
            {youtubeScript && (
              <Badge
                variant="secondary"
                className="ml-0.5 hidden text-[10px] sm:ml-1 sm:inline-flex sm:text-xs"
              >
                Ready
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="instagram" className="gap-1 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm">
            <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="xs:inline hidden">IG</span>
            {instagramScript && (
              <Badge
                variant="secondary"
                className="ml-0.5 hidden text-[10px] sm:ml-1 sm:inline-flex sm:text-xs"
              >
                Ready
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tiktok" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TikTokIcon />
                TikTok Script
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Fast-paced, hook-driven, under 60 seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Textarea
                value={tiktokScript}
                onChange={(e) => setTiktokScript(e.target.value)}
                placeholder="TikTok script will appear here after generation..."
                className="min-h-[200px] font-mono text-sm sm:min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="youtube" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Youtube className="h-4 w-4 text-red-500 sm:h-5 sm:w-5" />
                YouTube Shorts Script
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Educational tone, clear structure
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Textarea
                value={youtubeScript}
                onChange={(e) => setYoutubeScript(e.target.value)}
                placeholder="YouTube Shorts script will appear here after generation..."
                className="min-h-[200px] font-mono text-sm sm:min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instagram" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Instagram className="h-4 w-4 text-pink-500 sm:h-5 sm:w-5" />
                Instagram Reels Script
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Visual-friendly, trendy language
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Textarea
                value={instagramScript}
                onChange={(e) => setInstagramScript(e.target.value)}
                placeholder="Instagram Reels script will appear here after generation..."
                className="min-h-[200px] font-mono text-sm sm:min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep("content")}
          className="order-2 gap-2 sm:order-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!hasAnyScript || state.isSaving}
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
              Continue to Combine
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
