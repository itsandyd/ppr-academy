"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

export function DiscordConnectionCard() {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  const discordConnection = useQuery(
    api.discordPublic.getUserDiscordConnection,
    user?.id ? { userId: user.id } : "skip"
  );

  const disconnectDiscord = useMutation(api.discordPublic.disconnectDiscord);

  // Check if Discord is configured
  const isDiscordConfigured = !!process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID && 
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID !== 'undefined';

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    
    // Check if Discord is configured
    if (!clientId || clientId === 'undefined') {
      toast.error("Discord not configured", {
        description: "Please add NEXT_PUBLIC_DISCORD_CLIENT_ID to your .env.local file. See DISCORD_QUICK_START.md for setup instructions.",
        duration: 10000,
      });
      return;
    }

    setIsConnecting(true);
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/auth/discord/callback`
    );
    const scope = encodeURIComponent("identify guilds.join");

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    window.location.href = discordAuthUrl;
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      await disconnectDiscord({ userId: user.id });
      toast.success("Discord disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting Discord:", error);
      toast.error("Failed to disconnect Discord");
    }
  };

  if (discordConnection === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discord Integration</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 127.14 96.36">
                <path
                  fill="currentColor"
                  d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                />
              </svg>
              Discord Integration
            </CardTitle>
            <CardDescription>
              Connect your Discord account to access the community
            </CardDescription>
          </div>
          {discordConnection && (
            <Badge variant="default" className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {discordConnection ? (
          <div className="space-y-4">
            {/* Connected User Info */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {discordConnection.discordAvatar ? (
                <Image
                  src={discordConnection.discordAvatar}
                  alt="Discord Avatar"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {discordConnection.discordUsername[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{discordConnection.discordUsername}</p>
                <p className="text-sm text-muted-foreground">
                  Connected{" "}
                  {new Date(discordConnection.connectedAt).toLocaleDateString()}
                </p>
              </div>
              {discordConnection.guildMemberStatus === "joined" && (
                <Badge variant="secondary">
                  <Check className="w-3 h-3 mr-1" />
                  In Server
                </Badge>
              )}
            </div>

            {/* Disconnect Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                Last synced: {new Date(discordConnection.lastSyncedAt).toLocaleString()}
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!isDiscordConfigured && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  ⚙️ Discord Not Configured
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  To enable Discord integration, add <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">NEXT_PUBLIC_DISCORD_CLIENT_ID</code> to your <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">.env.local</code> file.
                  See <strong>DISCORD_QUICK_START.md</strong> for setup instructions.
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Connect your Discord account to access the PPR Academy community, get course-specific roles, and chat with other students and instructors.
            </p>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Benefits:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 pl-5 list-disc">
                <li>Automatic access to course-specific channels</li>
                <li>Direct support from instructors</li>
                <li>Network with other music producers</li>
                <li>Exclusive community events and workshops</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !isDiscordConfigured}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : !isDiscordConfigured ? (
                <>
                  Setup Required
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                  Connect Discord
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

