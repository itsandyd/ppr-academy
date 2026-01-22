"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useProductCreationBase, createProductCreationContext, ProductConfig } from "@/lib/create/product-context-factory";
import { useDigitalProductById, useCreateUniversalProduct, useUpdateDigitalProduct, DigitalProduct } from "@/lib/convex-typed-hooks";
import { useSearchParams } from "next/navigation";

export interface ReleaseData {
  // Basic Info
  title?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];

  // Release Details
  releaseType?: "single" | "ep" | "album" | "mixtape" | "remix";
  trackTitle?: string;
  artistName?: string;
  featuredArtists?: string[];
  label?: string;
  genre?: string;

  // Release Date & Time
  releaseDate?: number; // Timestamp
  releaseTime?: string; // HH:MM format
  timezone?: string;

  // Streaming Platform Links
  spotifyUri?: string;
  spotifyAlbumId?: string;
  appleMusicUrl?: string;
  appleMusicAlbumId?: string;
  soundcloudUrl?: string;
  youtubeUrl?: string;
  tidalUrl?: string;
  deezerUrl?: string;
  amazonMusicUrl?: string;
  bandcampUrl?: string;
  smartLinkUrl?: string;

  // Pre-save Campaign
  preSaveEnabled?: boolean;
  preSaveStartDate?: number;

  // Cover Art
  coverArtUrl?: string;
  coverArtStorageId?: string;

  // Follow Gate (to capture emails)
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;

  // Drip Campaign
  dripCampaignEnabled?: boolean;
  dripCampaignId?: string;

  // Playlist Pitching
  playlistPitchEnabled?: boolean;
  playlistPitchMessage?: string;

  // Track Metadata
  isrc?: string;
  upc?: string;
  bpm?: number;
  key?: string;
}

export interface StepCompletion {
  basics: boolean;
  platforms: boolean;
  presave: boolean;
  drip: boolean;
}

type ReleaseSteps = keyof StepCompletion;

const releaseConfig: ProductConfig<ReleaseData, ReleaseSteps> = {
  productName: "Release",
  idParamName: "releaseId",
  routeBase: "/dashboard/create/release",
  steps: ["basics", "platforms", "presave", "drip"] as const,

  getDefaultData: (searchParams) => ({
    releaseType: "single",
    preSaveEnabled: true,
    dripCampaignEnabled: true,
    followGateEnabled: true,
    followGateRequirements: {
      requireEmail: true,
      requireSpotify: true,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),

  validateStep: (step, data) => {
    switch (step) {
      case "basics":
        return !!(data.title && data.releaseType && data.releaseDate);
      case "platforms":
        return !!(data.spotifyUri || data.appleMusicUrl || data.smartLinkUrl);
      case "presave":
        return !!(data.preSaveEnabled !== undefined);
      case "drip":
        return true; // Drip campaign is optional
      default:
        return false;
    }
  },

  mapToCreateParams: (data, storeId, userId) => {
    return {
      title: data.title || "Untitled Release",
      description: data.description,
      storeId,
      userId,
      productType: "digital",
      productCategory: "release",
      pricingModel: "free_with_gate", // Releases are free with follow gate
      price: 0,
      imageUrl: data.coverArtUrl || data.thumbnail,
      tags: data.tags,
      genre: data.genre ? [data.genre] : undefined,
      bpm: data.bpm,
      musicalKey: data.key,
      followGateConfig: data.followGateEnabled && data.followGateRequirements ? {
        requireEmail: data.followGateRequirements.requireEmail || false,
        requireInstagram: data.followGateRequirements.requireInstagram || false,
        requireTiktok: data.followGateRequirements.requireTiktok || false,
        requireYoutube: data.followGateRequirements.requireYoutube || false,
        requireSpotify: data.followGateRequirements.requireSpotify || false,
        minFollowsRequired: data.followGateRequirements.minFollowsRequired || 0,
        socialLinks: data.followGateSocialLinks || {},
        customMessage: data.followGateMessage,
      } : undefined,
      releaseConfig: {
        releaseDate: data.releaseDate,
        releaseTime: data.releaseTime,
        timezone: data.timezone,
        releaseType: data.releaseType,
        spotifyUri: data.spotifyUri,
        spotifyAlbumId: data.spotifyAlbumId,
        appleMusicUrl: data.appleMusicUrl,
        appleMusicAlbumId: data.appleMusicAlbumId,
        soundcloudUrl: data.soundcloudUrl,
        youtubeUrl: data.youtubeUrl,
        tidalUrl: data.tidalUrl,
        deezerUrl: data.deezerUrl,
        amazonMusicUrl: data.amazonMusicUrl,
        bandcampUrl: data.bandcampUrl,
        smartLinkUrl: data.smartLinkUrl,
        preSaveEnabled: data.preSaveEnabled,
        preSaveStartDate: data.preSaveStartDate,
        dripCampaignEnabled: data.dripCampaignEnabled,
        trackTitle: data.trackTitle || data.title,
        artistName: data.artistName,
        featuredArtists: data.featuredArtists,
        label: data.label,
        isrc: data.isrc,
        upc: data.upc,
        coverArtUrl: data.coverArtUrl,
        coverArtStorageId: data.coverArtStorageId,
        playlistPitchEnabled: data.playlistPitchEnabled,
        playlistPitchMessage: data.playlistPitchMessage,
      },
    };
  },

  mapToUpdateParams: (data, productId) => {
    return {
      id: productId as Id<"digitalProducts">,
      title: data.title,
      description: data.description,
      imageUrl: data.coverArtUrl || data.thumbnail,
      tags: data.tags,
      genre: data.genre ? [data.genre] : undefined,
      bpm: data.bpm,
      musicalKey: data.key,
      followGateEnabled: data.followGateEnabled,
      followGateRequirements: data.followGateRequirements,
      followGateSocialLinks: data.followGateSocialLinks,
      followGateMessage: data.followGateMessage,
      releaseConfig: {
        releaseDate: data.releaseDate,
        releaseTime: data.releaseTime,
        timezone: data.timezone,
        releaseType: data.releaseType,
        spotifyUri: data.spotifyUri,
        spotifyAlbumId: data.spotifyAlbumId,
        appleMusicUrl: data.appleMusicUrl,
        appleMusicAlbumId: data.appleMusicAlbumId,
        soundcloudUrl: data.soundcloudUrl,
        youtubeUrl: data.youtubeUrl,
        tidalUrl: data.tidalUrl,
        deezerUrl: data.deezerUrl,
        amazonMusicUrl: data.amazonMusicUrl,
        bandcampUrl: data.bandcampUrl,
        smartLinkUrl: data.smartLinkUrl,
        preSaveEnabled: data.preSaveEnabled,
        preSaveStartDate: data.preSaveStartDate,
        dripCampaignEnabled: data.dripCampaignEnabled,
        trackTitle: data.trackTitle || data.title,
        artistName: data.artistName,
        featuredArtists: data.featuredArtists,
        label: data.label,
        isrc: data.isrc,
        upc: data.upc,
        coverArtUrl: data.coverArtUrl,
        coverArtStorageId: data.coverArtStorageId,
        playlistPitchEnabled: data.playlistPitchEnabled,
        playlistPitchMessage: data.playlistPitchMessage,
      },
    };
  },
};

function mapFromExisting(existing: unknown): ReleaseData {
  const product = existing as DigitalProduct & { releaseConfig?: ReleaseData };
  const releaseConfig = product.releaseConfig || {};

  return {
    title: product.title || "",
    description: product.description || "",
    thumbnail: product.imageUrl || "",
    tags: product.tags || [],
    releaseType: releaseConfig.releaseType || "single",
    trackTitle: releaseConfig.trackTitle,
    artistName: releaseConfig.artistName,
    featuredArtists: releaseConfig.featuredArtists,
    label: releaseConfig.label,
    genre: product.genre?.[0] || "",
    releaseDate: releaseConfig.releaseDate,
    releaseTime: releaseConfig.releaseTime,
    timezone: releaseConfig.timezone,
    spotifyUri: releaseConfig.spotifyUri,
    spotifyAlbumId: releaseConfig.spotifyAlbumId,
    appleMusicUrl: releaseConfig.appleMusicUrl,
    appleMusicAlbumId: releaseConfig.appleMusicAlbumId,
    soundcloudUrl: releaseConfig.soundcloudUrl,
    youtubeUrl: releaseConfig.youtubeUrl,
    tidalUrl: releaseConfig.tidalUrl,
    deezerUrl: releaseConfig.deezerUrl,
    amazonMusicUrl: releaseConfig.amazonMusicUrl,
    bandcampUrl: releaseConfig.bandcampUrl,
    smartLinkUrl: releaseConfig.smartLinkUrl,
    preSaveEnabled: releaseConfig.preSaveEnabled,
    preSaveStartDate: releaseConfig.preSaveStartDate,
    coverArtUrl: releaseConfig.coverArtUrl,
    coverArtStorageId: releaseConfig.coverArtStorageId,
    followGateEnabled: product.followGateEnabled,
    followGateRequirements: product.followGateRequirements,
    followGateSocialLinks: product.followGateSocialLinks,
    followGateMessage: product.followGateMessage,
    dripCampaignEnabled: releaseConfig.dripCampaignEnabled,
    playlistPitchEnabled: releaseConfig.playlistPitchEnabled,
    playlistPitchMessage: releaseConfig.playlistPitchMessage,
    isrc: releaseConfig.isrc,
    upc: releaseConfig.upc,
    bpm: product.bpm,
    key: product.musicalKey,
  };
}

const { Context: ReleaseCreationContext, useCreationContext } = createProductCreationContext<ReleaseData, ReleaseSteps>("ReleaseCreation");

export function ReleaseCreationProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const releaseId = searchParams.get("releaseId") as Id<"digitalProducts"> | undefined;
  const createMutation = useCreateUniversalProduct();
  const updateMutation = useUpdateDigitalProduct();
  const existingRelease = useDigitalProductById(releaseId);

  const contextValue = useProductCreationBase(
    releaseConfig,
    createMutation as (args: Record<string, unknown>) => Promise<unknown>,
    updateMutation as (args: Record<string, unknown>) => Promise<unknown>,
    existingRelease,
    mapFromExisting
  );

  return (
    <ReleaseCreationContext.Provider value={contextValue}>
      {children}
    </ReleaseCreationContext.Provider>
  );
}

export function useReleaseCreation() {
  const context = useCreationContext();
  return {
    state: {
      ...context.state,
      releaseId: context.state.productId as Id<"digitalProducts"> | undefined,
    },
    updateData: context.updateData,
    saveRelease: context.saveProduct,
    validateStep: context.validateStep,
    canPublish: context.canPublish,
    publishRelease: context.publishProduct,
  };
}
