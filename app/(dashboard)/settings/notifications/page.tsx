"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Mail, Smartphone, Check, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotificationPreferencesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Get current preferences
  const preferences = useQuery(
    api.notificationPreferences.getUserPreferences,
    user?.id ? { userId: user.id } : "skip"
  );

  // Mutation
  const updatePreferences = useMutation(api.notificationPreferences.updatePreferences);

  // Local state for preferences
  const [emailPrefs, setEmailPrefs] = useState({
    announcements: true,
    courseUpdates: true,
    newContent: true,
    mentions: true,
    replies: true,
    purchases: true,
    earnings: true,
    systemAlerts: true,
    marketing: true,
  });

  const [inAppPrefs, setInAppPrefs] = useState({
    announcements: true,
    courseUpdates: true,
    newContent: true,
    mentions: true,
    replies: true,
    purchases: true,
    earnings: true,
    systemAlerts: true,
    marketing: true,
  });

  const [emailDigest, setEmailDigest] = useState<"realtime" | "daily" | "weekly" | "never">("realtime");

  // Load preferences when available
  useEffect(() => {
    if (preferences) {
      setEmailPrefs(preferences.emailNotifications);
      setInAppPrefs(preferences.inAppNotifications);
      setEmailDigest(preferences.emailDigest);
      setHasChanges(false);
    }
  }, [preferences]);

  const handleEmailToggle = (category: string, value: boolean) => {
    setEmailPrefs({ ...emailPrefs, [category]: value });
    setHasChanges(true);
  };

  const handleInAppToggle = (category: string, value: boolean) => {
    setInAppPrefs({ ...inAppPrefs, [category]: value });
    setHasChanges(true);
  };

  const handleDigestChange = (value: "realtime" | "daily" | "weekly" | "never") => {
    setEmailDigest(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      await updatePreferences({
        userId: user.id,
        emailNotifications: emailPrefs,
        inAppNotifications: inAppPrefs,
        emailDigest,
      });

      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated.",
      });

      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisableAll = () => {
    const allDisabled = {
      announcements: false,
      courseUpdates: false,
      newContent: false,
      mentions: false,
      replies: false,
      purchases: false,
      earnings: false,
      systemAlerts: false,
      marketing: false,
    };
    setEmailPrefs(allDisabled);
    setHasChanges(true);
  };

  const handleEnableAll = () => {
    const allEnabled = {
      announcements: true,
      courseUpdates: true,
      newContent: true,
      mentions: true,
      replies: true,
      purchases: true,
      earnings: true,
      systemAlerts: true,
      marketing: true,
    };
    setEmailPrefs(allEnabled);
    setHasChanges(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Please sign in to manage notification preferences.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const notificationCategories = [
    {
      id: "courseUpdates",
      label: "Course Updates",
      description: "When creators add new modules, lessons, or chapters to courses you're enrolled in",
      icon: Bell,
    },
    {
      id: "newContent",
      label: "New Content",
      description: "When new courses or products become available",
      icon: Smartphone,
    },
    {
      id: "announcements",
      label: "Platform Announcements",
      description: "Important updates and news from PPR Academy",
      icon: Bell,
    },
    {
      id: "purchases",
      label: "Purchases & Receipts",
      description: "Order confirmations, receipts, and purchase updates",
      icon: Check,
    },
    {
      id: "earnings",
      label: "Earnings & Payouts",
      description: "Sales notifications and payout updates (for creators)",
      icon: Check,
    },
    {
      id: "mentions",
      label: "Mentions",
      description: "When someone mentions you in comments or discussions",
      icon: Bell,
    },
    {
      id: "replies",
      label: "Replies",
      description: "When someone replies to your comments or questions",
      icon: Bell,
    },
    {
      id: "systemAlerts",
      label: "System Alerts",
      description: "Important system messages and account security alerts",
      icon: Bell,
    },
    {
      id: "marketing",
      label: "Marketing & Promotions",
      description: "Promotional offers, tips, and platform updates",
      icon: Mail,
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold mb-2">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Control how and when you receive notifications from PPR Academy
        </p>
      </div>

      {/* Email Digest Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Delivery
          </CardTitle>
          <CardDescription>
            Choose how you want to receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Digest Frequency</Label>
            <Select value={emailDigest} onValueChange={handleDigestChange}>
              <SelectTrigger className="w-full md:w-96 bg-white dark:bg-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black">
                <SelectItem value="realtime">Real-time (as they happen)</SelectItem>
                <SelectItem value="daily">Daily Digest (once per day)</SelectItem>
                <SelectItem value="weekly">Weekly Digest (once per week)</SelectItem>
                <SelectItem value="never">Never (no emails)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {emailDigest === "realtime" && "Get emails immediately when notifications arrive"}
              {emailDigest === "daily" && "Get a single email each day with all notifications"}
              {emailDigest === "weekly" && "Get a weekly summary of all notifications"}
              {emailDigest === "never" && "Only see notifications in-app, no emails"}
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Even if set to "Never", you'll still receive critical system alerts and purchase confirmations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Email Notification Categories */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose which notifications you want to receive via email
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleEnableAll} className="w-full sm:w-auto">
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisableAll} className="w-full sm:w-auto">
                Disable All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationCategories.map((category) => (
            <div key={category.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1 pr-4">
                <Label htmlFor={`email-${category.id}`} className="text-base font-medium cursor-pointer">
                  {category.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              </div>
              <Switch
                id={`email-${category.id}`}
                checked={emailPrefs[category.id as keyof typeof emailPrefs]}
                onCheckedChange={(checked) => handleEmailToggle(category.id, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* In-App Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications appear in your notification bell
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationCategories.map((category) => (
            <div key={category.id} className="flex items-start justify-between py-3 border-b border-border last:border-0">
              <div className="flex-1 pr-4">
                <Label htmlFor={`app-${category.id}`} className="text-base font-medium cursor-pointer">
                  {category.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              </div>
              <Switch
                id={`app-${category.id}`}
                checked={inAppPrefs[category.id as keyof typeof inAppPrefs]}
                onCheckedChange={(checked) => handleInAppToggle(category.id, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg border-2 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">You have unsaved changes</p>
                <Button onClick={handleSave} size="sm">
                  <Check className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

