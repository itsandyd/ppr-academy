"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  MessageSquare,
  Sparkles,
  Plus,
  X,
  Play,
  Pause,
  Save,
  Instagram,
  AlertCircle,
  Lock,
  ArrowRight,
  ChevronLeft,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { InstagramPostSelector } from "./components/instagram-post-selector";

interface AutomationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DashboardAutomationBuilderPage({ params }: AutomationPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();

  // Get user's store
  const stores = useQuery(
    api.stores.getStoresByUser,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );
  const storeId = stores?.[0]?._id;

  // State
  const [name, setName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedTriggers, setSelectedTriggers] = useState<Array<"COMMENT" | "DM">>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [listenerType, setListenerType] = useState<"MESSAGE" | "SMART_AI">("MESSAGE");
  const [message, setMessage] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [commentReply, setCommentReply] = useState("");
  const [selectedInstagramAccount, setSelectedInstagramAccount] = useState<string>("");

  // Queries
  const automation = useQuery(api.automations.getAutomationById, {
    automationId: id as Id<"automations">,
  });

  // Get Instagram accounts for this store
  const socialAccounts = useQuery(api.socialMedia.getSocialAccounts, { 
    storeId: storeId || "" 
  });
  
  const instagramAccounts = socialAccounts?.filter(
    (account: any) => account.platform === "instagram" && account.isConnected
  ) || [];

  // Mutations
  const updateAutomation = useMutation(api.automations.updateAutomation);
  const addKeyword = useMutation(api.automations.addKeyword);
  const deleteKeyword = useMutation(api.automations.deleteKeyword);
  const saveTrigger = useMutation(api.automations.saveTrigger);
  const saveListener = useMutation(api.automations.saveListener);

  // Sync state with fetched data (only once)
  if (automation && !name) {
    setName(automation.name);
    if (automation.trigger) {
      setSelectedTriggers([automation.trigger.type]);
    }
    if (automation.listener) {
      setListenerType(automation.listener.listener);
      setMessage(automation.listener.prompt || "");
      setAiPrompt(automation.listener.prompt || "");
      setCommentReply(automation.listener.commentReply || "");
    }
    // Set selected Instagram account if available
    if (automation.instagramAccountId && !selectedInstagramAccount) {
      setSelectedInstagramAccount(automation.instagramAccountId);
    } else if (instagramAccounts.length > 0 && !selectedInstagramAccount) {
      // Default to first account if none selected
      setSelectedInstagramAccount(instagramAccounts[0]._id);
    }
  }

  // Handlers
  const handleUpdateName = async () => {
    if (!name.trim()) return;
    
    try {
      await updateAutomation({
        automationId: id as Id<"automations">,
        name: name.trim(),
      });
      setIsEditingName(false);
      toast.success("Name updated");
    } catch (error) {
      toast.error("Failed to update name");
    }
  };

  const handleAddKeyword = async () => {
    if (!keywordInput.trim()) return;

    try {
      await addKeyword({
        automationId: id as Id<"automations">,
        keyword: keywordInput.trim(),
      });
      setKeywordInput("");
      toast.success("Keyword added");
    } catch (error) {
      toast.error("Failed to add keyword");
    }
  };

  const handleDeleteKeyword = async (keywordId: Id<"keywords">) => {
    try {
      await deleteKeyword({ keywordId });
      toast.success("Keyword removed");
    } catch (error) {
      toast.error("Failed to remove keyword");
    }
  };

  const handleToggleTrigger = (type: "COMMENT" | "DM") => {
    setSelectedTriggers((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleSaveTrigger = async () => {
    if (selectedTriggers.length === 0) {
      toast.error("Select at least one trigger type");
      return;
    }

    try {
      await saveTrigger({
        automationId: id as Id<"automations">,
        types: selectedTriggers,
      });
      toast.success("Trigger saved");
    } catch (error) {
      toast.error("Failed to save trigger");
    }
  };

  const handleSaveListener = async () => {
    const promptValue = listenerType === "SMART_AI" ? aiPrompt : message;

    if (!promptValue.trim()) {
      toast.error(listenerType === "SMART_AI" ? "Enter AI prompt" : "Enter message");
      return;
    }

    if (!selectedInstagramAccount && instagramAccounts.length > 1) {
      toast.error("Please select an Instagram account for this automation");
      return;
    }

    try {
      await saveListener({
        automationId: id as Id<"automations">,
        listenerType,
        prompt: promptValue,
        reply: commentReply,
      });

      // Save selected Instagram account
      if (selectedInstagramAccount) {
        await updateAutomation({
          automationId: id as Id<"automations">,
          instagramAccountId: selectedInstagramAccount,
        });
      }

      toast.success("Action saved");
    } catch (error) {
      toast.error("Failed to save action");
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateAutomation({
        automationId: id as Id<"automations">,
        active: !automation?.active,
      });
      toast.success(automation?.active ? "Automation deactivated" : "Automation activated");
    } catch (error) {
      toast.error("Failed to toggle automation");
    }
  };

  // Loading state
  if (!isLoaded || automation === undefined || stores === undefined) {
    return (
      <div className="space-y-6 px-4 sm:px-6">
        <Skeleton className="h-12 w-full sm:w-96 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (automation === null) {
    return (
      <Card className="p-8 sm:p-12 text-center mx-4 sm:mx-6">
        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl sm:text-2xl font-bold mb-2">Automation not found</h3>
        <Button onClick={() => router.push("/dashboard/social?mode=create")}>
          Back to Social Media
        </Button>
      </Card>
    );
  }

  // TODO: Revert to subscription check when ready for production
  // const isPro = automation?.user?.subscription?.plan === "PRO";
  const isPro = true; // Temporarily unlocked for development/testing
  const hasCommentTrigger = selectedTriggers.includes("COMMENT");

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Back Button + Header */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/social?mode=create")}
          className="gap-2 -ml-2 sm:ml-0"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:flex-1 sm:items-center gap-3 sm:gap-4">
          {isEditingName ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleUpdateName}
              onKeyPress={(e) => e.key === "Enter" && handleUpdateName()}
              className="text-xl sm:text-2xl font-bold border-2 w-full sm:max-w-md"
              autoFocus
            />
          ) : (
            <button
              className="flex items-center gap-2 group text-left"
              onClick={() => setIsEditingName(true)}
            >
              <h1 className="text-2xl sm:text-3xl font-bold group-hover:text-primary transition-colors truncate">
                {automation.name}
              </h1>
              <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}

          <Button
            size="default"
            variant={automation.active ? "destructive" : "default"}
            onClick={handleToggleActive}
            className={`w-full sm:w-auto ${automation.active ? "" : "bg-green-600 hover:bg-green-700"}`}
          >
            {automation.active ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground">
        All changes are saved automatically
      </p>

      {/* Instagram Account Selection */}
      {instagramAccounts.length > 1 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Instagram className="w-5 h-5 text-purple-600" />
              Instagram Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose which Instagram account this automation should use:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {instagramAccounts.map((account: any) => {
                const isSelected = selectedInstagramAccount === account._id;
                return (
                  <div 
                    key={account._id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-900/30"
                        : "border-border hover:border-purple-200 dark:hover:border-purple-800"
                    }`}
                    onClick={() => setSelectedInstagramAccount(account._id)}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={account.profileImageUrl} 
                        alt={account.platformUsername}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">@{account.platformUsername}</p>
                        <p className="text-xs text-muted-foreground">{account.platformDisplayName}</p>
                      </div>
                      {isSelected && (
                        <Badge className="bg-purple-600 text-white text-xs">Selected</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedInstagramAccount && (
              <div className="flex items-center justify-between gap-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ This automation will use <strong>@{instagramAccounts.find(a => a._id === selectedInstagramAccount)?.platformUsername}</strong> 
                  for posting replies and sending messages.
                </p>
                {selectedInstagramAccount !== automation?.instagramAccountId && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateAutomation({
                          automationId: id as Id<"automations">,
                          instagramAccountId: selectedInstagramAccount as Id<"socialAccounts">,
                        });
                        toast.success("Instagram account saved!");
                      } catch (error) {
                        toast.error("Failed to save account");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                )}
                {selectedInstagramAccount === automation?.instagramAccountId && (
                  <Badge className="bg-green-600 text-white shrink-0">Saved ✓</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* STEP 1: Trigger Configuration */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                1
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl">When</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose how this automation triggers
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Trigger Type Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Comment Trigger */}
              <div
                onClick={() => handleToggleTrigger("COMMENT")}
                className={`
                  p-4 sm:p-6 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedTriggers.includes("COMMENT")
                    ? "border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950"
                    : "border-border hover:border-purple-400"
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  {selectedTriggers.includes("COMMENT") && (
                    <Badge className="bg-purple-600 text-xs">Selected</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">User comments on my post</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Trigger when someone comments with a specific keyword
                </p>
              </div>

              {/* DM Trigger */}
              <div
                onClick={() => handleToggleTrigger("DM")}
                className={`
                  p-4 sm:p-6 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedTriggers.includes("DM")
                    ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                    : "border-border hover:border-blue-400"
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <Instagram className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  {selectedTriggers.includes("DM") && (
                    <Badge className="bg-blue-600 text-xs">Selected</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">User sends me a DM</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Trigger when someone DMs you with a keyword
                </p>
              </div>
            </div>

            {/* Keywords Input */}
            {selectedTriggers.length > 0 && (
              <>
                <Separator />
                
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-sm sm:text-base font-semibold">Trigger Keywords</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Add keywords that will trigger this automation (case-insensitive)
                  </p>

                  {/* Existing Keywords */}
                  {automation.keywords && automation.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {automation.keywords.map((kw: any, index: number) => {
                        const colors = [
                          "bg-purple-600 text-white",
                          "bg-blue-600 text-white",
                          "bg-indigo-600 text-white",
                          "bg-pink-600 text-white",
                        ];
                        const colorClass = colors[index % colors.length];

                        return (
                          <Badge
                            key={kw._id}
                            className={`${colorClass} text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 gap-2`}
                          >
                            {kw.word}
                            <X
                              className="w-3 h-3 cursor-pointer hover:opacity-75"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteKeyword(kw._id);
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Keyword Input */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="e.g., STEMS, LEARN, COACHING"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddKeyword} disabled={!keywordInput.trim()} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {automation.keywords && automation.keywords.length === 0 && (
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 sm:p-6 text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        No keywords yet. Add your first trigger keyword above.
                      </p>
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveTrigger} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Save Trigger
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* STEP 2: Action Configuration */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                2
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl">Then</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose what happens when triggered
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Listener Type Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Simple Message */}
              <div
                onClick={() => {
                  if (listenerType !== "MESSAGE") {
                    setListenerType("MESSAGE");
                    // Don't carry over AI prompt to message field
                  }
                }}
                className={`
                  p-4 sm:p-6 rounded-xl border-2 cursor-pointer transition-all
                  ${listenerType === "MESSAGE"
                    ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                    : "border-border hover:border-blue-400"
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  {listenerType === "MESSAGE" && (
                    <Badge className="bg-blue-600 text-xs">Selected</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Send a message</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Send a single automated message (Free plan)
                </p>
              </div>

              {/* Smart AI */}
              <div
                onClick={() => {
                  if (isPro && listenerType !== "SMART_AI") {
                    setListenerType("SMART_AI");
                    // Clear AI prompt when switching - don't use the static message as AI instructions
                    setAiPrompt("");
                  }
                }}
                className={`
                  p-4 sm:p-6 rounded-xl border-2 cursor-pointer transition-all relative
                  ${listenerType === "SMART_AI"
                    ? "border-purple-600 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950"
                    : isPro
                      ? "border-border hover:border-purple-400"
                      : "border-border opacity-60 cursor-not-allowed"
                  }
                `}
              >
                {!isPro && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs">
                      <Lock className="w-3 h-3 mr-1 sm:mr-2" />
                      Pro Plan Required
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  {listenerType === "SMART_AI" && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Smart AI Conversation</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  AI chatbot that remembers context (Pro plan) 
                </p>
              </div>
            </div>

            <Separator />

            {/* Message Input */}
            {listenerType === "MESSAGE" && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="message" className="text-sm sm:text-base font-semibold mb-2 block">
                    Message to Send
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter the message you want to send...&#10;&#10;Example:&#10;🔥 Here's the free sample pack: [link]&#10;&#10;Want the full library? Reply 'PRO' for 50% off!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="resize-none text-sm"
                  />
                </div>

                {hasCommentTrigger && (
                  <div>
                    <Label htmlFor="commentReply" className="text-xs sm:text-sm mb-2 block">
                      Reply to Comment (Optional)
                    </Label>
                    <Input
                      id="commentReply"
                      placeholder="e.g., 'Check your DMs! 🎵'"
                      value={commentReply}
                      onChange={(e) => setCommentReply(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Publicly reply to the comment before sending DM
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Smart AI Prompt Input */}
            {listenerType === "SMART_AI" && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="aiPrompt" className="text-sm sm:text-base font-semibold mb-2 block flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    AI System Prompt
                  </Label>
                  <Textarea
                    id="aiPrompt"
                    placeholder="You are a music production assistant for a producer selling sample packs and courses.&#10;&#10;Your goals:&#10;- Understand the user's skill level and needs&#10;- Recommend relevant products (sample packs, courses, coaching)&#10;- Keep responses under 2 sentences&#10;- Be enthusiastic and helpful&#10;&#10;Products available:&#10;- Free Drum Kit ($0)&#10;- Trap Essentials Pack ($14)&#10;- Mixing Masterclass Course ($97)&#10;- 1-on-1 Coaching Session ($199)"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={8}
                    className="resize-none font-mono text-xs sm:text-sm"
                    disabled={!isPro}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Be specific about products, prices, and desired outcomes
                  </p>
                </div>

                {!isPro && (
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Upgrade to unlock Smart AI</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                          Get AI-powered conversations that remember context, qualify leads, and close sales automatically.
                        </p>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
                          onClick={() => router.push(storeId ? `/store/${storeId}/settings/billing` : "/dashboard?mode=create")}
                        >
                          Upgrade to Pro - $29/mo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button onClick={handleSaveListener} className="w-full sm:w-auto" size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save Action
            </Button>
          </CardContent>
        </Card>

        {/* STEP 3: Post Attachment (for comment triggers) */}
        {hasCommentTrigger && automation?.user && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  3
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">Attach Posts</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Select which Instagram posts this automation applies to
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <InstagramPostSelector
                userId={automation.user._id}
                automationId={id as Id<"automations">}
                selectedPostIds={automation.posts?.map((p: any) => p.postId) || []}
                selectedInstagramAccount={selectedInstagramAccount}
              />
            </CardContent>
          </Card>
        )}

        {/* Flow Preview */}
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              Automation Flow Preview
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
              {/* Preview Step 1 */}
              <div className="flex items-start gap-2 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs sm:text-sm">
                  1
                </div>
                <div className="flex-1 bg-white dark:bg-black border rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">When</p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {selectedTriggers.length > 0
                      ? selectedTriggers.map(t => `User ${t === "COMMENT" ? "comments on post" : "sends DM"}`).join(" OR ")
                      : "No trigger selected"}
                    {automation.keywords && automation.keywords.length > 0 && (
                      <span className="block sm:inline mt-1 sm:mt-0"> with keyword: <Badge variant="outline" className="ml-0 sm:ml-1 text-xs">{automation.keywords[0].word}</Badge></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground rotate-90 sm:rotate-0" />
              </div>

              {/* Preview Step 2 */}
              <div className="flex items-start gap-2 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-xs sm:text-sm">
                  2
                </div>
                <div className="flex-1 bg-white dark:bg-black border rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Then</p>
                  <p className="text-muted-foreground text-xs sm:text-sm break-words">
                    {listenerType === "SMART_AI" ? (
                      <>🤖 Smart AI starts conversation</>
                    ) : (
                      <>💬 Send message: "{message ? (message.length > 50 ? message.substring(0, 50) + "..." : message) : "..."}"</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
