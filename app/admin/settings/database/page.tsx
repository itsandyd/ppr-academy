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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Database,
  ArrowLeft,
  Save,
  Loader2,
  HardDrive,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Clock,
  FileArchive,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const recentBackups = [
  {
    id: "1",
    name: "backup_2024-01-15_auto",
    date: "2024-01-15T08:00:00Z",
    size: "245 MB",
    type: "automatic",
    status: "completed",
  },
  {
    id: "2",
    name: "backup_2024-01-14_auto",
    date: "2024-01-14T08:00:00Z",
    size: "243 MB",
    type: "automatic",
    status: "completed",
  },
  {
    id: "3",
    name: "backup_2024-01-13_manual",
    date: "2024-01-13T14:30:00Z",
    size: "242 MB",
    type: "manual",
    status: "completed",
  },
  {
    id: "4",
    name: "backup_2024-01-12_auto",
    date: "2024-01-12T08:00:00Z",
    size: "240 MB",
    type: "automatic",
    status: "failed",
  },
];

export default function DatabaseSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [settings, setSettings] = useState({
    // Backup Settings
    autoBackupEnabled: true,
    backupFrequency: "daily",
    backupTime: "08:00",
    backupRetention: "30",
    backupLocation: "cloud",
    // Storage
    storageProvider: "convex",
    storageRegion: "us-east-1",
    // Data Management
    enableDataPurge: false,
    purgeInactiveUsers: "365",
    purgeDeletedContent: "90",
    // Performance
    enableQueryCaching: true,
    cacheExpiry: "3600",
    enableIndexOptimization: true,
  });

  const storageUsed = 2.4; // GB
  const storageLimit = 10; // GB
  const storagePercentage = (storageUsed / storageLimit) * 100;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Database settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setBackupProgress(i);
      }
      toast.success("Backup created successfully!");
    } catch (error) {
      toast.error("Backup failed");
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return;
    }
    setIsRestoring(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Database restored successfully!");
    } catch (error) {
      toast.error("Restore failed");
    } finally {
      setIsRestoring(false);
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500">
            <Database className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Settings</h1>
            <p className="text-muted-foreground">Data management and backup settings</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Storage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Overview
            </CardTitle>
            <CardDescription>Current database storage usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: {storageUsed} GB</span>
                <span>Limit: {storageLimit} GB</span>
              </div>
              <Progress value={storagePercentage} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {(storageLimit - storageUsed).toFixed(1)} GB available
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">12,450</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">456</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold">8,760</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" />
              Backup Configuration
            </CardTitle>
            <CardDescription>Configure automatic backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup your database
                </p>
              </div>
              <Switch
                checked={settings.autoBackupEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoBackupEnabled: checked })
                }
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Frequency</Label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupTime">Time (UTC)</Label>
                <Input
                  id="backupTime"
                  type="time"
                  value={settings.backupTime}
                  onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupRetention">Retention (days)</Label>
              <Input
                id="backupRetention"
                type="number"
                value={settings.backupRetention}
                onChange={(e) => setSettings({ ...settings, backupRetention: e.target.value })}
              />
            </div>
            <Separator />
            <Button onClick={handleBackup} disabled={isBackingUp} className="w-full">
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup... {backupProgress}%
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Create Manual Backup
                </>
              )}
            </Button>
            {isBackingUp && <Progress value={backupProgress} className="h-2" />}
          </CardContent>
        </Card>

        {/* Recent Backups */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Backups
            </CardTitle>
            <CardDescription>View and restore previous backups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {backup.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(backup.date).toLocaleString()} • {backup.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={backup.type === "automatic" ? "secondary" : "outline"}>
                      {backup.type}
                    </Badge>
                    {backup.status === "completed" && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(backup.id)}
                          disabled={isRestoring}
                        >
                          <RefreshCw className={`h-4 w-4 ${isRestoring ? "animate-spin" : ""}`} />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Purging
            </CardTitle>
            <CardDescription>Configure automatic data cleanup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Caution</AlertTitle>
              <AlertDescription>
                Enabling data purging will permanently delete old records.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Data Purging</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically delete old data
                </p>
              </div>
              <Switch
                checked={settings.enableDataPurge}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableDataPurge: checked })
                }
              />
            </div>
            {settings.enableDataPurge && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="purgeInactiveUsers">Purge Inactive Users (days)</Label>
                  <Input
                    id="purgeInactiveUsers"
                    type="number"
                    value={settings.purgeInactiveUsers}
                    onChange={(e) =>
                      setSettings({ ...settings, purgeInactiveUsers: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Delete users inactive for this many days
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purgeDeletedContent">Purge Deleted Content (days)</Label>
                  <Input
                    id="purgeDeletedContent"
                    type="number"
                    value={settings.purgeDeletedContent}
                    onChange={(e) =>
                      setSettings({ ...settings, purgeDeletedContent: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Permanently remove soft-deleted content after this period
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>Database performance optimization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Query Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Cache frequently accessed data
                </p>
              </div>
              <Switch
                checked={settings.enableQueryCaching}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableQueryCaching: checked })
                }
              />
            </div>
            {settings.enableQueryCaching && (
              <div className="space-y-2">
                <Label htmlFor="cacheExpiry">Cache Expiry (seconds)</Label>
                <Input
                  id="cacheExpiry"
                  type="number"
                  value={settings.cacheExpiry}
                  onChange={(e) => setSettings({ ...settings, cacheExpiry: e.target.value })}
                />
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Index Optimization</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically optimize database indexes
                </p>
              </div>
              <Switch
                checked={settings.enableIndexOptimization}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableIndexOptimization: checked })
                }
              />
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Index Optimization
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
