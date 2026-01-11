"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PlaylistCurationData, StepCompletion } from "./types";

interface PlaylistCurationState {
  data: PlaylistCurationData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  playlistId?: Id<"curatorPlaylists">;
  lastSaved?: Date;
}

interface PlaylistCurationContextType {
  state: PlaylistCurationState;
  updateData: (step: string, data: Partial<PlaylistCurationData>) => void;
  savePlaylist: () => Promise<void>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canPublish: () => boolean;
  publishPlaylist: () => Promise<{
    success: boolean;
    error?: string;
    playlistId?: Id<"curatorPlaylists">;
  }>;
}

const PlaylistCurationContext = createContext<PlaylistCurationContextType | undefined>(undefined);

export function PlaylistCurationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const playlistId = searchParams.get("playlistId") as Id<"curatorPlaylists"> | undefined;

  const createPlaylistMutation = useMutation(api.playlists.createPlaylist);
  const updatePlaylistMutation = useMutation(api.playlists.updatePlaylist);

  // Get existing playlist if editing
  const existingPlaylist = useQuery(
    api.playlists.getCreatorPlaylists,
    user?.id ? { creatorId: user.id } : "skip"
  );

  const [state, setState] = useState<PlaylistCurationState>({
    data: {
      isPublic: true,
      acceptsSubmissions: true,
      pricingModel: "free",
      currency: "USD",
      submissionSLA: 7,
      submissionRules: {
        requiresMessage: false,
      },
    },
    stepCompletion: {
      basics: false,
      submissionSettings: false,
      pricing: true, // Default to free, so it's valid
    },
    isLoading: false,
    isSaving: false,
  });

  // Load existing playlist if editing
  useEffect(() => {
    if (playlistId && existingPlaylist) {
      const playlist = existingPlaylist.find((p: any) => p._id === playlistId);
      if (playlist) {
        const newData: PlaylistCurationData = {
          name: playlist.name,
          description: playlist.description,
          coverUrl: playlist.coverUrl,
          genres: playlist.genres,
          customSlug: playlist.customSlug,
          isPublic: playlist.isPublic,
          acceptsSubmissions: playlist.acceptsSubmissions,
          submissionRules: playlist.submissionRules,
          submissionSLA: playlist.submissionSLA,
          pricingModel: playlist.submissionPricing?.isFree ? "free" : "paid",
          submissionFee: playlist.submissionPricing?.price,
          currency: playlist.submissionPricing?.currency || "USD",
        };

        const stepCompletion = {
          basics: !!(newData.name && newData.description),
          submissionSettings: !!newData.acceptsSubmissions,
          pricing: true,
        };

        setState((prev) => ({
          ...prev,
          playlistId: playlist._id,
          data: newData,
          stepCompletion,
        }));
      }
    }
  }, [playlistId, existingPlaylist]);

  const validateStep = (step: keyof StepCompletion): boolean => {
    switch (step) {
      case "basics":
        return !!(state.data.name && state.data.description);
      case "submissionSettings":
        return state.data.acceptsSubmissions !== undefined;
      case "pricing":
        if (state.data.pricingModel === "paid") {
          return !!(state.data.submissionFee && state.data.submissionFee > 0);
        }
        return true;
      default:
        return false;
    }
  };

  const updateData = (step: string, newData: Partial<PlaylistCurationData>) => {
    setState((prev) => {
      const updatedData = { ...prev.data, ...newData };
      const stepCompletion = {
        ...prev.stepCompletion,
        [step]: validateStep(step as keyof StepCompletion),
      };
      return {
        ...prev,
        data: updatedData,
        stepCompletion,
      };
    });
  };

  const savePlaylist = async () => {
    if (state.isSaving || !user?.id) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      if (state.playlistId) {
        // Update existing playlist
        await updatePlaylistMutation({
          playlistId: state.playlistId,
          name: state.data.name,
          description: state.data.description,
          coverUrl: state.data.coverUrl,
          isPublic: state.data.isPublic,
          acceptsSubmissions: state.data.acceptsSubmissions,
          submissionPricing: {
            isFree: state.data.pricingModel === "free",
            price: state.data.submissionFee,
            currency: state.data.currency || "USD",
          },
        });
      } else {
        // Create new playlist
        const result = await createPlaylistMutation({
          creatorId: user.id,
          name: state.data.name || "Untitled Playlist",
          description: state.data.description,
          coverUrl: state.data.coverUrl,
          genres: state.data.genres,
          isPublic: state.data.isPublic ?? true,
          acceptsSubmissions: state.data.acceptsSubmissions ?? true,
        });

        if (result) {
          setState((prev) => ({ ...prev, playlistId: result }));
          const currentStep = searchParams.get("step") || "basics";
          router.replace(`/dashboard/create/playlist-curation?playlistId=${result}&step=${currentStep}`);
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Playlist Saved",
        description: "Your playlist has been saved.",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      console.error("Failed to save playlist:", error);
      setState((prev) => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canPublish = (): boolean => {
    return state.stepCompletion.basics && state.stepCompletion.submissionSettings;
  };

  const publishPlaylist = async () => {
    if (!user?.id) {
      return { success: false, error: "User not found." };
    }

    if (!canPublish()) {
      return { success: false, error: "Please complete required steps before publishing." };
    }

    try {
      if (state.playlistId) {
        await updatePlaylistMutation({
          playlistId: state.playlistId,
          isPublic: true,
          acceptsSubmissions: state.data.acceptsSubmissions,
          submissionPricing: {
            isFree: state.data.pricingModel === "free",
            price: state.data.submissionFee,
            currency: state.data.currency || "USD",
          },
        });

        toast({
          title: "Playlist Published!",
          description: state.data.acceptsSubmissions
            ? "Your playlist is now live and accepting submissions."
            : "Your playlist is now public.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, playlistId: state.playlistId };
      }

      // Create and publish in one go
      const result = await createPlaylistMutation({
        creatorId: user.id,
        name: state.data.name || "Untitled Playlist",
        description: state.data.description,
        coverUrl: state.data.coverUrl,
        genres: state.data.genres,
        isPublic: true,
        acceptsSubmissions: state.data.acceptsSubmissions ?? true,
      });

      if (result) {
        // Update with pricing
        await updatePlaylistMutation({
          playlistId: result,
          submissionPricing: {
            isFree: state.data.pricingModel === "free",
            price: state.data.submissionFee,
            currency: state.data.currency || "USD",
          },
        });

        toast({
          title: "Playlist Published!",
          description: "Your playlist is now live and accepting submissions.",
          className: "bg-white dark:bg-black",
        });

        return { success: true, playlistId: result };
      }

      return { success: false, error: "Failed to create playlist." };
    } catch (error) {
      return { success: false, error: "Failed to publish playlist." };
    }
  };

  return (
    <PlaylistCurationContext.Provider
      value={{
        state,
        updateData,
        savePlaylist,
        validateStep,
        canPublish,
        publishPlaylist,
      }}
    >
      {children}
    </PlaylistCurationContext.Provider>
  );
}

export function usePlaylistCuration() {
  const context = useContext(PlaylistCurationContext);
  if (context === undefined) {
    throw new Error("usePlaylistCuration must be used within a PlaylistCurationProvider");
  }
  return context;
}
