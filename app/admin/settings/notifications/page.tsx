"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bell,
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Send,
  MessageSquare,
  Smartphone,
  TestTube,
  Check,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const emailTemplates = [
  { id: "welcome", name: "Welcome Email", description: "Sent when a user signs up" },
  { id: "password-reset", name: "Password Reset", description: "Sent when requesting password reset" },
  { id: "purchase-confirmation", name: "Purchase Confirmation", description: "Sent after successful purchase" },
  { id: "course-enrolled", name: "Course Enrollment", description: "Sent when enrolled in a course" },
  { id: "certificate", name: "Certificate Earned", description: "Sent when completing a course" },
  { id: "weekly-digest", name: "Weekly Digest", description: "Weekly summary of activity" },
];

export default function NotificationsSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("welcome");
  const [settings, setSettings] = useState({
    // Email Provider
    emailProvider: "resend",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@pauseplayrepeat.com",
    fromName: "PausePlayRepeat",
    replyToEmail: "support@pauseplayrepeat.com",
    // Notification Preferences
    enableEmailNotifications: true,
    enablePushNotifications: false,
    enableSmsNotifications: false,
    // Digest Settings
    enableWeeklyDigest: true,
    digestDay: "monday",
    digestTime: "09:00",
    // Templates
    templates: {
      welcome: {
        subject: "Welcome to PPR Academy!",
        content: "Hi {{name}},\n\nWelcome to PPR Academy! We're excited to have you join our community of music producers.\n\nGet started by exploring our courses and finding your next learning adventure.\n\nBest,\nThe PPR Academy Team",
        enabled: true,
      },
      "password-reset": {
        subject: "Reset your password",
        content: "Hi {{name}},\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n{{resetLink}}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest,\nThe PPR Academy Team",
        enabled: true,
      },
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Notification settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }
    setIsTesting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Test email sent to ${testEmail}`);
    } catch (error) {
      toast.error("Failed to send test email");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
            <Bell className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">Email templates and notification preferences</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="push" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Push
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Email Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Email Provider
                </CardTitle>
                <CardDescription>Configure your email delivery service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {["resend", "sendgrid", "mailgun", "smtp"].map((provider) => (
                    <Button
                      key={provider}
                      variant={settings.emailProvider === provider ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSettings({ ...settings, emailProvider: provider })}
                      className="capitalize"
                    >
                      {provider}
                    </Button>
                  ))}
                </div>

                {settings.emailProvider === "smtp" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host</Label>
                        <Input
                          id="smtpHost"
                          value={settings.smtpHost}
                          onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port</Label>
                        <Input
                          id="smtpPort"
                          value={settings.smtpPort}
                          onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                          placeholder="587"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input
                        id="smtpUser"
                        value={settings.smtpUser}
                        onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                        placeholder="username@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sender Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Sender Configuration
                </CardTitle>
                <CardDescription>Default sender information for emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                    placeholder="Your Platform Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.fromEmail}
                    onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyToEmail">Reply-To Email</Label>
                  <Input
                    id="replyToEmail"
                    type="email"
                    value={settings.replyToEmail}
                    onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                    <Button onClick={handleTestEmail} disabled={isTesting} variant="outline">
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Channels */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Enable or disable notification methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">Send email notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enableEmailNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enableEmailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Push</p>
                        <p className="text-sm text-muted-foreground">Browser notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enablePushNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enablePushNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">SMS</p>
                        <p className="text-sm text-muted-foreground">Text message alerts</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enableSmsNotifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, enableSmsNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="push" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notification Settings
              </CardTitle>
              <CardDescription>Configure web push notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Push notifications require setting up a service worker and obtaining VAPID keys.
                  This is currently not configured.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="vapidPublicKey">VAPID Public Key</Label>
                <Input
                  id="vapidPublicKey"
                  placeholder="BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vapidPrivateKey">VAPID Private Key</Label>
                <Input
                  id="vapidPrivateKey"
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  disabled
                />
              </div>
              <Button disabled variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Configure Push Notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Template List */}
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Select a template to edit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {emailTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      activeTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{template.name}</span>
                      <Check
                        className={`h-4 w-4 ${
                          activeTemplate === template.id ? "text-primary" : "text-transparent"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Template Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Edit Template</span>
                  <Badge variant="outline">
                    {emailTemplates.find((t) => t.id === activeTemplate)?.name}
                  </Badge>
                </CardTitle>
                <CardDescription>Customize the email content and subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="templateSubject">Subject Line</Label>
                  <Input
                    id="templateSubject"
                    value={
                      (settings.templates as any)[activeTemplate]?.subject ||
                      `Subject for ${activeTemplate}`
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        templates: {
                          ...settings.templates,
                          [activeTemplate]: {
                            ...(settings.templates as any)[activeTemplate],
                            subject: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Email subject line"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateContent">Email Body</Label>
                  <Textarea
                    id="templateContent"
                    value={
                      (settings.templates as any)[activeTemplate]?.content ||
                      `Content for ${activeTemplate}`
                    }
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        templates: {
                          ...settings.templates,
                          [activeTemplate]: {
                            ...(settings.templates as any)[activeTemplate],
                            content: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Email content with {{variables}}"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="mb-2 text-sm font-medium">Available Variables:</p>
                  <div className="flex flex-wrap gap-2">
                    {["{{name}}", "{{email}}", "{{link}}", "{{date}}", "{{courseName}}"].map(
                      (variable) => (
                        <Badge key={variable} variant="secondary" className="font-mono">
                          {variable}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
