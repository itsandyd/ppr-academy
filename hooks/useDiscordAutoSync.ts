"use client";

import { useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

/**
 * Hook to automatically add user to Discord server and assign roles on course enrollment
 * Call this hook after a successful course enrollment
 */
export function useDiscordAutoSync() {
  const addToGuild = useAction(api.discord.addUserToGuild);
  const syncRoles = useAction(api.discord.syncUserRoles);

  const handleEnrollment = async (
    userId: string,
    courseId: Id<"courses">,
    storeId: Id<"stores">,
    guildId: string
  ) => {
    try {
      // Step 1: Add user to Discord server (if not already in)
      const addResult = await addToGuild({ userId, guildId });

      if (!addResult.success) {
        // User might not have connected Discord yet - show gentle prompt
        if (addResult.error?.includes("hasn't connected Discord")) {
          toast.info("💬 Want to join the community?", {
            description: "Connect your Discord account to access course channels and support!",
            action: {
              label: "Connect Discord",
              onClick: () => window.location.href = "/settings",
            },
          });
          return;
        }
        console.error("Failed to add to guild:", addResult.error);
      }

      // Step 2: Sync all course roles
      const syncResult = await syncRoles({ userId, storeId });

      if (syncResult.success && syncResult.rolesAssigned > 0) {
        toast.success("Discord roles updated!", {
          description: `You now have access to ${syncResult.rolesAssigned} course ${
            syncResult.rolesAssigned === 1 ? "channel" : "channels"
          }!`,
        });
      }
    } catch (error) {
      console.error("Error syncing Discord:", error);
    }
  };

  return { handleEnrollment };
}

