"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, MessageSquare, Hash, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function IntegrationsSettingsPage() {
  const { user } = useUser();
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );
  const updateStoreIntegrations = useMutation(api.stores.updateNotificationIntegrations);

  const [isSaving, setIsSaving] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [discordEnabled, setDiscordEnabled] = useState(false);

  useEffect(() => {
    if (store?.notificationIntegrations) {
      setSlackWebhookUrl(store.notificationIntegrations.slackWebhookUrl || "");
      setSlackEnabled(store.notificationIntegrations.slackEnabled || false);
      setDiscordWebhookUrl(store.notificationIntegrations.discordWebhookUrl || "");
      setDiscordEnabled(store.notificationIntegrations.discordEnabled || false);
    }
  }, [store]);

  const handleSave = async () => {
    if (!store?._id) return;

    setIsSaving(true);
    try {
      await updateStoreIntegrations({
        storeId: store._id,
        notificationIntegrations: {
          slackWebhookUrl: slackWebhookUrl || undefined,
          slackEnabled,
          discordWebhookUrl: discordWebhookUrl || undefined,
          discordEnabled,
        },
      });
      toast.success("Integration settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const testSlackWebhook = async () => {
    if (!slackWebhookUrl) {
      toast.error("Please enter a Slack webhook URL first");
      return;
    }

    try {
      const response = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Test notification from PPR Academy! Your Slack integration is working.",
        }),
      });

      if (response.ok) {
        toast.success("Test message sent to Slack!");
      } else {
        toast.error("Failed to send test message. Check your webhook URL.");
      }
    } catch (error) {
      toast.error("Failed to send test message. Check your webhook URL.");
    }
  };

  const testDiscordWebhook = async () => {
    if (!discordWebhookUrl) {
      toast.error("Please enter a Discord webhook URL first");
      return;
    }

    try {
      const response = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "Test Notification",
              description: "Your Discord integration is working!",
              color: 0x5865f2,
              footer: { text: "PPR Academy" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (response.ok) {
        toast.success("Test message sent to Discord!");
      } else {
        toast.error("Failed to send test message. Check your webhook URL.");
      }
    } catch (error) {
      toast.error("Failed to send test message. Check your webhook URL.");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Notification Integrations</h1>
          <p className="mt-1 text-muted-foreground">
            Connect Slack and Discord to receive workflow notifications
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Slack</CardTitle>
                <CardDescription>
                  Send workflow notifications to a Slack channel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Slack Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in your Slack workspace
                </p>
              </div>
              <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slack-webhook">Webhook URL</Label>
              <Input
                id="slack-webhook"
                type="url"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                disabled={!slackEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Create an{" "}
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Incoming Webhook
                  <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>{" "}
                in your Slack workspace
              </p>
            </div>

            <div className="flex items-center gap-2">
              {slackEnabled && slackWebhookUrl && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Configured
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={testSlackWebhook}
                disabled={!slackEnabled || !slackWebhookUrl}
              >
                Send Test Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Discord Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5865F2]">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Discord</CardTitle>
                <CardDescription>
                  Send workflow notifications to a Discord channel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Discord Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in your Discord server
                </p>
              </div>
              <Switch checked={discordEnabled} onCheckedChange={setDiscordEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord-webhook">Webhook URL</Label>
              <Input
                id="discord-webhook"
                type="url"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                disabled={!discordEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Create a webhook in your Discord channel settings (Edit Channel &rarr; Integrations &rarr; Webhooks)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {discordEnabled && discordWebhookUrl && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Configured
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={testDiscordWebhook}
                disabled={!discordEnabled || !discordWebhookUrl}
              >
                Send Test Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                How to use these integrations
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Once configured, you can add "Notify Team" nodes to your email workflows
                and select Slack or Discord as the notification method. Your team will
                receive real-time alerts when contacts reach those nodes.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
