"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  Key,
  Lock,
  UserCheck,
  ShieldAlert,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SecuritySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    // Authentication
    sessionTimeout: "24",
    maxLoginAttempts: "5",
    lockoutDuration: "30",
    requireMfa: false,
    allowSocialAuth: true,
    allowPasswordAuth: true,
    // Password Policy
    minPasswordLength: "8",
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiryDays: "90",
    // Access Control
    defaultRole: "student",
    allowGuestAccess: false,
    ipWhitelist: "",
    ipBlacklist: "",
    // API Security
    rateLimitRequests: "100",
    rateLimitWindow: "60",
    apiKeyRotationDays: "90",
    webhookSecret: "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Security settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSecret = () => {
    const newSecret = "whsec_" + Array.from({ length: 32 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
    ).join("");
    setSettings({ ...settings, webhookSecret: newSecret });
    toast.success("New webhook secret generated");
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
            <p className="text-muted-foreground">Authentication, permissions, and access control</p>
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

      <Alert variant="destructive" className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          Changes to security settings may affect user access. Please review carefully before saving.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>Configure login and session settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: e.target.value })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require MFA</Label>
                <p className="text-sm text-muted-foreground">
                  Require two-factor authentication for all users
                </p>
              </div>
              <Switch
                checked={settings.requireMfa}
                onCheckedChange={(checked) => setSettings({ ...settings, requireMfa: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Social Auth</Label>
                <p className="text-sm text-muted-foreground">
                  Allow login via Google, GitHub, etc.
                </p>
              </div>
              <Switch
                checked={settings.allowSocialAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, allowSocialAuth: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Password Auth</Label>
                <p className="text-sm text-muted-foreground">
                  Allow traditional email/password login
                </p>
              </div>
              <Switch
                checked={settings.allowPasswordAuth}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowPasswordAuth: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Policy
            </CardTitle>
            <CardDescription>Define password requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPasswordLength">Minimum Length</Label>
                <Input
                  id="minPasswordLength"
                  type="number"
                  value={settings.minPasswordLength}
                  onChange={(e) => setSettings({ ...settings, minPasswordLength: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordExpiryDays">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiryDays"
                  type="number"
                  value={settings.passwordExpiryDays}
                  onChange={(e) => setSettings({ ...settings, passwordExpiryDays: e.target.value })}
                  placeholder="0 = never"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Password Requirements</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require uppercase letters</span>
                <Switch
                  checked={settings.requireUppercase}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireUppercase: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require lowercase letters</span>
                <Switch
                  checked={settings.requireLowercase}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireLowercase: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require numbers</span>
                <Switch
                  checked={settings.requireNumbers}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireNumbers: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Require special characters</span>
                <Switch
                  checked={settings.requireSpecialChars}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, requireSpecialChars: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Access Control
            </CardTitle>
            <CardDescription>IP filtering and role-based access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultRole">Default User Role</Label>
              <Select
                value={settings.defaultRole}
                onValueChange={(value) => setSettings({ ...settings, defaultRole: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Guest Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow browsing without authentication
                </p>
              </div>
              <Switch
                checked={settings.allowGuestAccess}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allowGuestAccess: checked })
                }
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">IP Whitelist</Label>
              <Input
                id="ipWhitelist"
                value={settings.ipWhitelist}
                onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                placeholder="192.168.1.1, 10.0.0.0/24"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated IPs or CIDR ranges. Leave empty to allow all.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipBlacklist">IP Blacklist</Label>
              <Input
                id="ipBlacklist"
                value={settings.ipBlacklist}
                onChange={(e) => setSettings({ ...settings, ipBlacklist: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
          </CardContent>
        </Card>

        {/* API Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Security
            </CardTitle>
            <CardDescription>Rate limiting and webhook configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimitRequests">Rate Limit (requests)</Label>
                <Input
                  id="rateLimitRequests"
                  type="number"
                  value={settings.rateLimitRequests}
                  onChange={(e) =>
                    setSettings({ ...settings, rateLimitRequests: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateLimitWindow">Window (seconds)</Label>
                <Input
                  id="rateLimitWindow"
                  type="number"
                  value={settings.rateLimitWindow}
                  onChange={(e) =>
                    setSettings({ ...settings, rateLimitWindow: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyRotationDays">API Key Rotation (days)</Label>
              <Input
                id="apiKeyRotationDays"
                type="number"
                value={settings.apiKeyRotationDays}
                onChange={(e) =>
                  setSettings({ ...settings, apiKeyRotationDays: e.target.value })
                }
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="webhookSecret"
                    type={showApiKey ? "text" : "password"}
                    value={settings.webhookSecret}
                    onChange={(e) =>
                      setSettings({ ...settings, webhookSecret: e.target.value })
                    }
                    className="pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button variant="outline" onClick={handleRegenerateSecret}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used to verify incoming webhooks from external services
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
