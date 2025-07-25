"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsPageProps {
  params: Promise<{ storeId: string }>;
}

export default function NotificationSettingsPage({ params }: NotificationSettingsPageProps) {
  const { toast } = useToast();
  const [storeId, setStoreId] = useState<string | null>(null);

  // Extract storeId from async params
  useState(() => {
    params.then((p) => setStoreId(p.storeId));
  });
  
  if (!storeId) {
    return <div>Loading...</div>;
  }
  
  // Get store data
  const store = useQuery(api.stores.getStoreById, { storeId: storeId as any });
  const updateNotificationSettings = useMutation(api.stores.updateAdminNotificationSettings);
  
  // Local state for form
  const [settings, setSettings] = useState({
    enabled: store?.emailConfig?.adminNotifications?.enabled ?? true,
    emailOnNewLead: store?.emailConfig?.adminNotifications?.emailOnNewLead ?? true,
    emailOnReturningUser: store?.emailConfig?.adminNotifications?.emailOnReturningUser ?? true,
    notificationEmail: store?.emailConfig?.adminNotifications?.notificationEmail ?? "",
    customSubjectPrefix: store?.emailConfig?.adminNotifications?.customSubjectPrefix ?? "",
    includeLeadDetails: store?.emailConfig?.adminNotifications?.includeLeadDetails ?? true,
    sendDigestInsteadOfInstant: store?.emailConfig?.adminNotifications?.sendDigestInsteadOfInstant ?? false,
    digestFrequency: store?.emailConfig?.adminNotifications?.digestFrequency ?? "daily",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!store) return;
    
    setIsLoading(true);
    try {
      const result = await updateNotificationSettings({
        storeId: storeId as any,
        ...settings,
      });
      
      if (result.success) {
        toast({
          title: "Settings saved",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!store) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">
          Customize how you receive notifications about new leads and customer activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notifications</CardTitle>
          <CardDescription>
            Configure when and how you receive email notifications about your store activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Admin Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive email notifications for store activity
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <Label className="text-base">Notification Types</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Lead Signups</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified when someone downloads a lead magnet for the first time
                </div>
              </div>
              <Switch
                checked={settings.emailOnNewLead}
                onCheckedChange={(checked) => setSettings({ ...settings, emailOnNewLead: checked })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Returning User Activity</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified when previous customers re-engage with your content
                </div>
              </div>
              <Switch
                checked={settings.emailOnReturningUser}
                onCheckedChange={(checked) => setSettings({ ...settings, emailOnReturningUser: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Email Customization */}
          <div className="space-y-4">
            <Label className="text-base">Email Customization</Label>
            
            <div className="space-y-2">
              <Label htmlFor="notificationEmail">Custom Notification Email</Label>
              <Input
                id="notificationEmail"
                placeholder="Leave empty to use your account email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
                disabled={!settings.enabled}
              />
              <div className="text-sm text-muted-foreground">
                Optional: Use a different email address for notifications
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectPrefix">Custom Subject Prefix</Label>
              <Input
                id="subjectPrefix"
                placeholder="🎯 (default)"
                value={settings.customSubjectPrefix}
                onChange={(e) => setSettings({ ...settings, customSubjectPrefix: e.target.value })}
                disabled={!settings.enabled}
              />
              <div className="text-sm text-muted-foreground">
                Customize the emoji or prefix for notification email subjects
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include Lead Details</Label>
                <div className="text-sm text-muted-foreground">
                  Show customer email, product name, and other details in notifications
                </div>
              </div>
              <Switch
                checked={settings.includeLeadDetails}
                onCheckedChange={(checked) => setSettings({ ...settings, includeLeadDetails: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Digest Settings */}
          <div className="space-y-4">
            <Label className="text-base">Delivery Preferences</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send Digest Instead of Instant</Label>
                <div className="text-sm text-muted-foreground">
                  Group notifications into periodic summaries instead of individual emails
                </div>
              </div>
              <Switch
                checked={settings.sendDigestInsteadOfInstant}
                onCheckedChange={(checked) => setSettings({ ...settings, sendDigestInsteadOfInstant: checked })}
                disabled={!settings.enabled}
              />
            </div>

            {settings.sendDigestInsteadOfInstant && (
              <div className="space-y-2">
                <Label htmlFor="digestFrequency">Digest Frequency</Label>
                <Select
                  value={settings.digestFrequency}
                  onValueChange={(value: "hourly" | "daily" | "weekly") => 
                    setSettings({ ...settings, digestFrequency: value })
                  }
                  disabled={!settings.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 