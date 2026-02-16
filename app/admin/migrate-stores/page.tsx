"use client";

/**
 * ONE-TIME MIGRATION SCRIPT
 * 
 * Run this in the Convex dashboard or via a temporary API call to migrate all existing stores
 * to be public and published by default (for Early Access rollout).
 * 
 * Instructions:
 * 1. Go to your Convex dashboard: https://dashboard.convex.dev
 * 2. Navigate to "Functions" tab
 * 3. Find "stores:migrateStoresToPublic"
 * 4. Click "Run" with empty arguments: {}
 * 5. Verify the output shows how many stores were updated
 * 6. Delete this file after running the migration
 * 
 * Alternative: Run via command line:
 * npx convex run stores:migrateStoresToPublic
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function MigrationPage() {
  const [result, setResult] = useState<{ updated: number; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const migrateStores = useMutation(api.stores.migrateStoresToPublic);

  const runMigration = async () => {
    setLoading(true);
    try {
      const res = await migrateStores({});
      setResult(res);
    } catch (error) {
      console.error("Migration failed:", error);
      setResult({ updated: 0, message: `Error: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Store Migration: Make All Profiles Public</h1>
          <p className="text-muted-foreground mb-6">
            This migration will set all existing stores to <code>isPublic: true</code> and{" "}
            <code>isPublishedProfile: true</code> so they appear on the homepage and marketplace.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-500">One-Time Migration</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  This should only be run once. All new stores will be public by default.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={runMigration}
            disabled={loading || result !== null}
            size="lg"
            className="w-full"
          >
            {loading ? "Running Migration..." : result ? "Migration Complete" : "Run Migration"}
          </Button>

          {result && (
            <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-500">Migration Complete!</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">{result.message}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    <strong>{result.updated}</strong> stores updated
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-sm text-muted-foreground">
            <p className="font-medium mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Makes all existing creator profiles visible on the homepage</li>
              <li>Enables all creators to appear in the marketplace</li>
              <li>Sets profiles to "published" status</li>
              <li>Does not affect any other store settings</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

