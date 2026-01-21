"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PlaylistCurationData, StepCompletion } from "./types";
import { createProductCreationContext, ProductCreationContextType } from "@/lib/create/product-context-factory";

const { Context, useCreationContext } = createProductCreationContext<PlaylistCurationData, keyof StepCompletion>("PlaylistCuration");
const STEPS = ["basics", "submissionSettings", "pricing"] as const;

function validateStep(step: keyof StepCompletion, data: PlaylistCurationData): boolean {
  switch (step) {
    case "basics": return !!(data.name && data.description);
    case "submissionSettings": return data.acceptsSubmissions !== undefined;
    case "pricing": return data.pricingModel === "paid" ? !!(data.submissionFee && data.submissionFee > 0) : true;
    default: return false;
  }
}

export function PlaylistCurationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const playlistId = searchParams.get("playlistId") || undefined;

  const createPlaylistMutation = useMutation(api.playlists.createPlaylist);
  const updatePlaylistMutation = useMutation(api.playlists.updatePlaylist);
  const existingPlaylists = useQuery(api.playlists.getCreatorPlaylists, user?.id ? { creatorId: user.id } : "skip");

  const [state, setState] = useState({ data: { isPublic: true, acceptsSubmissions: true, pricingModel: "free" as const, currency: "USD", submissionSLA: 7, submissionRules: { requiresMessage: false } } as PlaylistCurationData, stepCompletion: { basics: false, submissionSettings: false, pricing: true } as Record<keyof StepCompletion, boolean>, isLoading: false, isSaving: false, productId: playlistId, lastSaved: undefined as Date | undefined });

  useEffect(() => {
    if (playlistId && existingPlaylists) {
      const playlist = existingPlaylists.find((p: { _id: Id<"curatorPlaylists"> }) => p._id === playlistId);
      if (playlist) {
        const newData: PlaylistCurationData = { name: playlist.name, description: playlist.description, coverUrl: playlist.coverUrl, genres: playlist.genres, customSlug: playlist.customSlug, isPublic: playlist.isPublic, acceptsSubmissions: playlist.acceptsSubmissions, submissionRules: playlist.submissionRules, submissionSLA: playlist.submissionSLA, pricingModel: playlist.submissionPricing?.isFree ? "free" : "paid", submissionFee: playlist.submissionPricing?.price, currency: playlist.submissionPricing?.currency || "USD" };
        setState(prev => ({ ...prev, productId: playlist._id, data: newData, stepCompletion: { basics: validateStep("basics", newData), submissionSettings: validateStep("submissionSettings", newData), pricing: validateStep("pricing", newData) } }));
      }
    }
  }, [playlistId, existingPlaylists]);

  const updateData = useCallback((step: string, newData: Partial<PlaylistCurationData>) => {
    setState(prev => { const updatedData = { ...prev.data, ...newData }; return { ...prev, data: updatedData, stepCompletion: { ...prev.stepCompletion, [step]: validateStep(step as keyof StepCompletion, updatedData) } }; });
  }, []);

  const saveProduct = useCallback(async () => {
    if (state.isSaving || !user?.id) return;
    setState(prev => ({ ...prev, isSaving: true }));
    try {
      if (state.productId) { await updatePlaylistMutation({ playlistId: state.productId as Id<"curatorPlaylists">, name: state.data.name, description: state.data.description, coverUrl: state.data.coverUrl, isPublic: state.data.isPublic, acceptsSubmissions: state.data.acceptsSubmissions, submissionPricing: { isFree: state.data.pricingModel === "free", price: state.data.submissionFee, currency: state.data.currency || "USD" } }); }
      else { const result = await createPlaylistMutation({ creatorId: user.id, name: state.data.name || "Untitled Playlist", description: state.data.description, coverUrl: state.data.coverUrl, genres: state.data.genres, isPublic: state.data.isPublic ?? true, acceptsSubmissions: state.data.acceptsSubmissions ?? true }); if (result) { setState(prev => ({ ...prev, productId: result })); router.replace(`/dashboard/create/playlist-curation?playlistId=${result}&step=${searchParams.get("step") || "basics"}`); } }
      setState(prev => ({ ...prev, isSaving: false, lastSaved: new Date() })); toast({ title: "Playlist Saved" });
    } catch { setState(prev => ({ ...prev, isSaving: false })); toast({ title: "Save Failed", variant: "destructive" }); }
  }, [state.isSaving, state.productId, state.data, user?.id, createPlaylistMutation, updatePlaylistMutation, router, searchParams, toast]);

  const canPublish = useCallback(() => STEPS.every(step => state.stepCompletion[step]), [state.stepCompletion]);

  const publishProduct = useCallback(async () => {
    if (!user?.id) return { success: false, error: "User not found." };
    if (!canPublish()) return { success: false, error: "Complete all steps first." };
    try {
      if (state.productId) { await updatePlaylistMutation({ playlistId: state.productId as Id<"curatorPlaylists">, isPublic: true, acceptsSubmissions: state.data.acceptsSubmissions, submissionPricing: { isFree: state.data.pricingModel === "free", price: state.data.submissionFee, currency: state.data.currency || "USD" } }); toast({ title: "Playlist Published!" }); return { success: true, productId: state.productId as string }; }
      return { success: false, error: "Playlist ID not found" };
    } catch { return { success: false, error: "Failed to publish." }; }
  }, [user?.id, state.productId, state.data, canPublish, updatePlaylistMutation, toast]);

  const contextValue: ProductCreationContextType<PlaylistCurationData, keyof StepCompletion> = { state, storeId: undefined, updateData, saveProduct, validateStep: (step) => validateStep(step, state.data), canPublish, publishProduct };
  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function usePlaylistCuration() {
  const ctx = useCreationContext();
  return { ...ctx, savePlaylist: ctx.saveProduct, publishPlaylist: ctx.publishProduct, state: { ...ctx.state, playlistId: ctx.state.productId } };
}
