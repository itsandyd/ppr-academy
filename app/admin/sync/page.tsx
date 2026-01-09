"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Database,
  Cloud,
  ArrowRight,
  Info,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function ClerkSyncPage() {
  const [clerkSecretKey, setClerkSecretKey] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is admin
  const adminCheck = useQuery(
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get sync stats
  const syncStats = useQuery(
    api.clerkSync.getSyncStats,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );

  // Sync actions - cast to any to bypass generated type limitations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clerkSyncApi = api.clerkSync as any;
  const syncUsers = useAction(clerkSyncApi.syncClerkUsers);
  const quickSync = useAction(clerkSyncApi.quickSyncClerkUsers);

  // Redirect non-admin users
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in?redirect_url=/admin/sync");
    } else if (adminCheck !== undefined && !adminCheck.isAdmin) {
      router.push("/");
    }
  }, [isLoaded, user, adminCheck, router]);

  // Show loading state
  if (!isLoaded || adminCheck === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied
  if (!adminCheck.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  You don't have permission to access the sync tool.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleQuickSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await quickSync({
        clerkId: user!.id,
      });

      setSyncResult(result);

      if (result.success) {
        toast({
          title: "Sync Completed",
          description: `Added ${result.usersAdded} users, updated ${result.usersUpdated} users`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: "Check the results below for details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive",
      });
      setSyncResult({
        success: false,
        errors: [error.message],
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!clerkSecretKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Clerk Secret Key",
        variant: "destructive",
      });
      return;
    }

    if (!clerkSecretKey.startsWith("sk_")) {
      toast({
        title: "Invalid Key",
        description: "Clerk secret keys start with 'sk_'",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncUsers({
        clerkId: user!.id,
        clerkSecretKey: clerkSecretKey.trim(),
      });

      setSyncResult(result);

      if (result.success) {
        toast({
          title: "Sync Completed",
          description: `Added ${result.usersAdded} users, updated ${result.usersUpdated} users`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: "Check the results below for details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive",
      });
      setSyncResult({
        success: false,
        errors: [error.message],
      });
    } finally {
      setIsSyncing(false);
      setClerkSecretKey(""); // Clear the key for security
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Clerk User Sync</h1>
        <p className="text-muted-foreground">
          Sync users from Clerk to Convex database
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What does this do?</AlertTitle>
        <AlertDescription>
          This tool fetches all users from your Clerk account and adds/updates them in your Convex database.
          Use this if you have users in Clerk that aren't showing up in your app.
        </AlertDescription>
      </Alert>

      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStats?.totalInConvex || 0}</p>
                <p className="text-sm text-muted-foreground">Users in Convex</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Cloud className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {syncStats?.syncStatus === "completed" ? "Synced" : "Not Synced"}
                </p>
                <p className="text-sm text-muted-foreground">Sync Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <RefreshCw className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(syncStats?.lastSyncTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Sync (Recommended)</CardTitle>
          <CardDescription>
            Use your environment variable to sync users with one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Environment Variable Setup</AlertTitle>
            <AlertDescription>
              Make sure <code className="text-xs bg-muted px-1 py-0.5 rounded">CLERK_SECRET_KEY</code> is set in your Convex environment variables.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleQuickSync}
            disabled={isSyncing}
            size="lg"
            className="w-full"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Quick Sync Users
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ No need to paste your secret key</p>
            <p>✓ Secure - uses environment variable</p>
            <p>✓ Perfect for regular syncs</p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Sync Form */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync (Alternative)</CardTitle>
          <CardDescription>
            Enter your Clerk Secret Key manually if environment variable isn't set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clerkKey">Clerk Secret Key</Label>
            <Input
              id="clerkKey"
              type="password"
              placeholder="sk_test_..."
              value={clerkSecretKey}
              onChange={(e) => setClerkSecretKey(e.target.value)}
              disabled={isSyncing}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your{" "}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Clerk Dashboard
              </a>{" "}
              → API Keys → Secret keys
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleManualSync}
              disabled={isSyncing || !clerkSecretKey.trim()}
              className="w-full sm:w-auto"
              variant="outline"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Manual Sync
                </>
              )}
            </Button>
          </div>

          {/* How it Works */}
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">How it works:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>1. Fetches all users from Clerk API</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>2. Compares with existing users in Convex</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>3. Adds missing users and updates existing ones</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                <span>4. Reports the results</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Results */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {syncResult.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Sync Completed Successfully
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Sync Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncResult.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{syncResult.totalClerkUsers}</p>
                  <p className="text-sm text-muted-foreground">Clerk Users</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{syncResult.totalConvexUsers}</p>
                  <p className="text-sm text-muted-foreground">Convex Users</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{syncResult.usersAdded}</p>
                  <p className="text-sm text-muted-foreground">Added</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{syncResult.usersUpdated}</p>
                  <p className="text-sm text-muted-foreground">Updated</p>
                </div>
              </div>
            )}

            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-red-600">Errors ({syncResult.errors.length}):</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {syncResult.errors.map((error: string, index: number) => (
                    <div key={index} className="p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm text-red-600">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Security Note</AlertTitle>
        <AlertDescription>
          Your Clerk Secret Key is only used for this sync operation and is never stored anywhere.
          The key is cleared from memory immediately after the sync completes.
        </AlertDescription>
      </Alert>
    </div>
  );
}

