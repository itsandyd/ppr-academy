"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface InstagramDebugProps {
  userId: string;
}

export function InstagramDebug({ userId }: InstagramDebugProps) {
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    { clerkId: userId }
  );

  const instagramStatus = useQuery(
    api.integrations.queries.isInstagramConnected,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const integration = useQuery(
    api.integrations.queries.getInstagramIntegration,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  if (!convexUser || instagramStatus === undefined || integration === undefined) {
    return null;
  }

  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🔍 Debug Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm font-mono">
        <div className="flex items-center justify-between">
          <span>Convex User ID:</span>
          <Badge variant="outline">{convexUser._id}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Instagram Connected:</span>
          {instagramStatus?.connected ? (
            <Badge className="bg-green-600 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Yes
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              No
            </Badge>
          )}
        </div>

        {instagramStatus?.connected && (
          <>
            <div className="flex items-center justify-between">
              <span>Username:</span>
              <Badge variant="outline">{instagramStatus.username || "N/A"}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>Instagram ID:</span>
              <Badge variant="outline" className="text-xs">
                {instagramStatus.instagramId || "N/A"}
              </Badge>
            </div>

            {integration && (
              <>
                <div className="flex items-center justify-between">
                  <span>Token:</span>
                  <Badge variant="outline" className="text-xs">
                    {integration.token ? `${integration.token.substring(0, 20)}...` : "N/A"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Active:</span>
                  <Badge variant={integration.isActive ? "default" : "secondary"}>
                    {integration.isActive ? "Yes" : "No"}
                  </Badge>
                </div>

                {integration.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span>Expires:</span>
                    <Badge variant="outline" className="text-xs">
                      {new Date(integration.expiresAt).toLocaleDateString()}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!instagramStatus?.connected && (
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
            No integration found in database. Try reconnecting Instagram.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

