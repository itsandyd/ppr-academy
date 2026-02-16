"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Plus, Instagram, Play, Pause, Settings, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";
import { toast } from "sonner";

interface InstagramAutomationsProps {
  storeId: string;
  userId: string;
}

export function InstagramAutomations({ storeId, userId }: InstagramAutomationsProps) {
  const router = useRouter();
  const [creatingAutomation, setCreatingAutomation] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");

  // Get Convex user
  const convexUser = useQuery(api.users.getUserFromClerk, { clerkId: userId });

  // Fetch user's automations
  const automations = useQuery(api.automations.getUserAutomations, { clerkId: userId });

  // Get Instagram accounts for this store
  const socialAccounts = useQuery(api.socialMedia.getSocialAccounts, { storeId });

  const connectedInstagramAccounts =
    socialAccounts?.filter(
      (account: any) => account.platform === "instagram" && account.isConnected
    ) || [];

  const isInstagramConnected = connectedInstagramAccounts.length > 0;

  // Mutations
  const createAutomation = useMutation(api.automations.createAutomation);
  const deleteAutomation = useMutation(api.automations.deleteAutomation);

  const handleCreateAutomation = async () => {
    setCreatingAutomation(true);
    try {
      const result = await createAutomation({
        clerkId: userId,
        name: "Comment Reply Bot",
      });

      if (result.status === 201 && result.data) {
        router.push(`/dashboard/social/automation/${result.data._id}`);
      }
    } catch (error) {
      console.error("Failed to create automation:", error);
      toast.error("Failed to create automation");
    } finally {
      setCreatingAutomation(false);
    }
  };

  if (!isInstagramConnected) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Instagram className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-2xl font-bold">Connect Instagram to Get Started</h3>
          <p className="mb-6 text-muted-foreground">
            Automate your Instagram DMs and comments to capture leads and drive sales. Connect your
            Instagram Business account to enable automations.
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Instagram className="mr-2 h-5 w-5" />
            Connect Instagram Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter automations based on selected account
  const filteredAutomations =
    automations?.filter((automation: any) => {
      if (selectedAccountFilter === "all") return true;
      return automation.instagramAccountId === selectedAccountFilter;
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header with Account Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-2xl font-bold">Instagram Automations</h2>
          <p className="text-sm text-muted-foreground">
            Automate your Instagram DMs and comments to capture leads
            {connectedInstagramAccounts.length > 1 && (
              <span className="ml-2 text-blue-600">
                • {connectedInstagramAccounts.length} accounts connected
              </span>
            )}
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleCreateAutomation}
          disabled={creatingAutomation}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {creatingAutomation ? "Creating..." : "New Automation"}
        </Button>
      </div>

      {/* Account Filter */}
      {connectedInstagramAccounts.length > 1 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-950 dark:to-purple-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Instagram className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                  Filter Automations by Account
                </p>
                <Select value={selectedAccountFilter} onValueChange={setSelectedAccountFilter}>
                  <SelectTrigger className="w-full max-w-xs bg-white dark:bg-blue-950">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">
                      All Automations ({automations?.length || 0})
                    </SelectItem>
                    {connectedInstagramAccounts.map((account: any) => {
                      const accountAutomations =
                        automations?.filter(
                          (auto: any) => auto.instagramAccountId === account._id
                        ) || [];
                      return (
                        <SelectItem key={account._id} value={account._id}>
                          <div className="flex items-center gap-2">
                            <img
                              src={account.profileImageUrl}
                              alt={account.platformUsername}
                              className="h-4 w-4 rounded-full"
                            />
                            @{account.platformUsername} ({accountAutomations.length})
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automations Grid */}
      {filteredAutomations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAutomations.map((automation: any) => {
            const automationAccount = connectedInstagramAccounts.find(
              (account: any) => account._id === automation.instagramAccountId
            );

            return (
              <Card
                key={automation._id}
                className="group cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/dashboard/social/automation/${automation._id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl transition-colors group-hover:text-primary">
                        {automation.name}
                      </CardTitle>
                      {/* Show which Instagram account this automation uses */}
                      {automationAccount && (
                        <div className="mt-2 flex items-center gap-2">
                          <img
                            src={automationAccount.profileImageUrl}
                            alt={automationAccount.platformUsername}
                            className="h-4 w-4 rounded-full"
                          />
                          <span className="text-xs text-muted-foreground">
                            @{automationAccount.platformUsername}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={automation.active ? "default" : "secondary"}
                      className={automation.active ? "bg-green-600" : ""}
                    >
                      {automation.active ? (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Keywords */}
                  {automation.keywords && automation.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {automation.keywords.slice(0, 3).map((kw: any) => (
                        <Badge
                          key={kw._id}
                          variant="outline"
                          className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900"
                        >
                          {kw.word}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>

                <div
                  className="flex items-center border-t p-6 pt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div>{automation.totalTriggers || 0} triggers</div>
                      <div>💬 {automation.totalResponses || 0} sent</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Settings className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Zap}
          title={
            selectedAccountFilter === "all"
              ? "No automations yet"
              : `No automations for @${connectedInstagramAccounts.find((a: any) => a._id === selectedAccountFilter)?.platformUsername}`
          }
          description="Create your first automation to start capturing leads and driving sales on Instagram."
          action={{ label: creatingAutomation ? "Creating..." : "Create Automation", onClick: handleCreateAutomation }}
        />
      )}
    </div>
  );
}
