"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface ImageData {
  storageId: Id<"_storage">;
  url: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  sentence?: string;
  embedding?: number[];
  // Prompt editing fields
  originalPrompt?: string;
  isPromptEdited?: boolean;
  // Source image for image-to-image generation
  sourceImageUrl?: string;
  sourceStorageId?: Id<"_storage">;
}

export interface SocialPostData {
  courseId?: Id<"courses">;
  chapterId?: Id<"courseChapters">;
  sourceContent: string;
  sourceType: "chapter" | "section" | "custom";
  selectedHeadings?: string[];
  title?: string;

  tiktokScript?: string;
  youtubeScript?: string;
  instagramScript?: string;

  combinedScript?: string;
  ctaTemplateId?: Id<"ctaTemplates">;
  ctaText?: string;
  ctaKeyword?: string;
  ctaProductId?: Id<"digitalProducts">;
  ctaCourseId?: Id<"courses">;

  images?: ImageData[];
  imageAspectRatio?: "16:9" | "9:16";

  audioStorageId?: Id<"_storage">;
  audioUrl?: string;
  audioVoiceId?: string;
  audioDuration?: number;
  audioScript?: string;

  instagramCaption?: string;
  tiktokCaption?: string;
}

export interface StepCompletion {
  content: boolean;
  scripts: boolean;
  combine: boolean;
  images: boolean;
  audio: boolean;
  review: boolean;
}

export type PostStatus =
  | "draft"
  | "scripts_generated"
  | "combined"
  | "images_generated"
  | "audio_generated"
  | "completed"
  | "published";

interface SocialPostState {
  data: SocialPostData;
  stepCompletion: StepCompletion;
  isLoading: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  postId?: Id<"socialMediaPosts">;
  lastSaved?: Date;
  status: PostStatus;
}

interface SocialPostContextType {
  state: SocialPostState;
  updateData: (step: string, data: Partial<SocialPostData>) => void;
  savePost: () => Promise<Id<"socialMediaPosts"> | null>;
  validateStep: (step: keyof StepCompletion) => boolean;
  canComplete: () => boolean;
  completePost: () => Promise<{ success: boolean; error?: string }>;
  setGenerating: (generating: boolean) => void;
  goToStep: (step: string) => void;
  currentStep: string;
}

const SocialPostContext = createContext<SocialPostContextType | undefined>(undefined);

export function SocialPostProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const postId = searchParams.get("postId") as Id<"socialMediaPosts"> | undefined;
  const currentStep = searchParams.get("step") || "content";

  // @ts-ignore - Convex type inference depth issue
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  const existingPost = useQuery(
    api.socialMediaPosts.getSocialMediaPostById,
    postId ? { postId } : "skip"
  );

  // @ts-ignore - Convex type inference depth issue
  const createPostMutation = useMutation(api.socialMediaPosts.createSocialMediaPost);
  const updateScriptsMutation = useMutation(api.socialMediaPosts.updateSocialMediaPostScripts);
  const updateCombinedMutation = useMutation(api.socialMediaPosts.updateSocialMediaPostCombined);
  const updateImagesMutation = useMutation(api.socialMediaPosts.updateSocialMediaPostImages);
  const updateAudioMutation = useMutation(api.socialMediaPosts.updateSocialMediaPostAudio);
  const updateCaptionsMutation = useMutation(api.socialMediaPosts.updateSocialMediaPostCaptions);
  const completePostMutation = useMutation(api.socialMediaPosts.completeSocialMediaPost);
  const updateTitleMutation = useMutation(api.socialMediaPosts.updateSocialMediaPostTitle);

  const [state, setState] = useState<SocialPostState>({
    data: {
      sourceContent: "",
      sourceType: "custom",
    },
    stepCompletion: {
      content: false,
      scripts: false,
      combine: false,
      images: false,
      audio: false,
      review: false,
    },
    isLoading: false,
    isSaving: false,
    isGenerating: false,
    status: "draft",
  });

  const validateStepWithData = useCallback(
    (step: keyof StepCompletion, data: SocialPostData): boolean => {
      switch (step) {
        case "content":
          return !!(data.sourceContent && data.sourceContent.trim().length >= 100);
        case "scripts":
          return !!(data.tiktokScript || data.youtubeScript || data.instagramScript);
        case "combine":
          return !!(data.combinedScript && data.combinedScript.trim().length > 0);
        case "images":
        case "audio":
          return true;
        case "review":
          return !!data.combinedScript;
        default:
          return false;
      }
    },
    []
  );

  useEffect(() => {
    if (existingPost && !state.postId) {
      const newData: SocialPostData = {
        courseId: existingPost.courseId,
        chapterId: existingPost.chapterId,
        sourceContent: existingPost.sourceContent || "",
        sourceType: existingPost.sourceType || "custom",
        selectedHeadings: existingPost.selectedHeadings,
        title: existingPost.title,
        tiktokScript: existingPost.tiktokScript,
        youtubeScript: existingPost.youtubeScript,
        instagramScript: existingPost.instagramScript,
        combinedScript: existingPost.combinedScript,
        ctaTemplateId: existingPost.ctaTemplateId,
        ctaText: existingPost.ctaText,
        ctaKeyword: existingPost.ctaKeyword,
        ctaProductId: existingPost.ctaProductId,
        ctaCourseId: existingPost.ctaCourseId,
        images: existingPost.images,
        audioStorageId: existingPost.audioStorageId,
        audioUrl: existingPost.audioUrl,
        audioVoiceId: existingPost.audioVoiceId,
        audioDuration: existingPost.audioDuration,
        audioScript: existingPost.audioScript,
        instagramCaption: existingPost.instagramCaption,
        tiktokCaption: existingPost.tiktokCaption,
      };

      const stepCompletion: StepCompletion = {
        content: validateStepWithData("content", newData),
        scripts: validateStepWithData("scripts", newData),
        combine: validateStepWithData("combine", newData),
        images: validateStepWithData("images", newData),
        audio: validateStepWithData("audio", newData),
        review: validateStepWithData("review", newData),
      };

      setState((prev) => ({
        ...prev,
        postId: existingPost._id,
        data: newData,
        stepCompletion,
        status: existingPost.status || "draft",
      }));
    }
  }, [existingPost, state.postId, validateStepWithData]);

  const validateStep = useCallback(
    (step: keyof StepCompletion): boolean => {
      return validateStepWithData(step, state.data);
    },
    [state.data, validateStepWithData]
  );

  const updateData = useCallback(
    (step: string, newData: Partial<SocialPostData>) => {
      setState((prev) => {
        const updatedData = { ...prev.data, ...newData };

        const stepCompletion = {
          ...prev.stepCompletion,
          [step]: validateStepWithData(step as keyof StepCompletion, updatedData),
        };

        return {
          ...prev,
          data: updatedData,
          stepCompletion,
        };
      });
    },
    [validateStepWithData]
  );

  const savePost = useCallback(async (): Promise<Id<"socialMediaPosts"> | null> => {
    if (state.isSaving || !convexUser?.clerkId) return null;

    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      let currentPostId = state.postId;

      if (!currentPostId) {
        currentPostId = await createPostMutation({
          userId: convexUser.clerkId,
          sourceContent: state.data.sourceContent,
          sourceType: state.data.sourceType,
          courseId: state.data.courseId,
          chapterId: state.data.chapterId,
          selectedHeadings: state.data.selectedHeadings,
          title: state.data.title,
        });

        setState((prev) => ({ ...prev, postId: currentPostId }));

        const currentSearch = new URLSearchParams(searchParams.toString());
        currentSearch.set("postId", currentPostId as string);
        router.replace(`/dashboard/social/create?${currentSearch.toString()}`);
      } else {
        if (state.data.tiktokScript || state.data.youtubeScript || state.data.instagramScript) {
          await updateScriptsMutation({
            postId: currentPostId,
            tiktokScript: state.data.tiktokScript,
            youtubeScript: state.data.youtubeScript,
            instagramScript: state.data.instagramScript,
          });
        }

        if (state.data.combinedScript) {
          await updateCombinedMutation({
            postId: currentPostId,
            combinedScript: state.data.combinedScript,
            ctaTemplateId: state.data.ctaTemplateId,
            ctaText: state.data.ctaText,
            ctaKeyword: state.data.ctaKeyword,
            ctaProductId: state.data.ctaProductId,
            ctaCourseId: state.data.ctaCourseId,
          });
        }

        if (state.data.images && state.data.images.length > 0) {
          const validImages = state.data.images.filter((img) => img.storageId && img.url);
          if (validImages.length > 0) {
            await updateImagesMutation({
              postId: currentPostId,
              images: validImages,
            });
          }
        }

        if (state.data.audioStorageId && state.data.audioUrl) {
          await updateAudioMutation({
            postId: currentPostId,
            audioStorageId: state.data.audioStorageId,
            audioUrl: state.data.audioUrl,
            audioVoiceId: state.data.audioVoiceId,
            audioDuration: state.data.audioDuration,
            audioScript: state.data.audioScript,
          });
        }

        if (state.data.title) {
          await updateTitleMutation({
            postId: currentPostId,
            title: state.data.title,
          });
        }

        if (state.data.instagramCaption || state.data.tiktokCaption) {
          await updateCaptionsMutation({
            postId: currentPostId,
            instagramCaption: state.data.instagramCaption,
            tiktokCaption: state.data.tiktokCaption,
          });
        }
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Post Saved",
        description: "Your social media post has been saved.",
      });

      return currentPostId ?? null;
    } catch (error) {
      console.error("Failed to save post:", error);
      setState((prev) => ({ ...prev, isSaving: false }));
      toast({
        title: "Save Failed",
        description: "Failed to save your post. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [
    state.isSaving,
    state.postId,
    state.data,
    convexUser,
    createPostMutation,
    updateScriptsMutation,
    updateCombinedMutation,
    updateImagesMutation,
    updateAudioMutation,
    updateCaptionsMutation,
    updateTitleMutation,
    searchParams,
    router,
    toast,
  ]);

  const canComplete = useCallback((): boolean => {
    return (
      state.stepCompletion.content && state.stepCompletion.scripts && state.stepCompletion.combine
    );
  }, [state.stepCompletion]);

  const completePost = useCallback(async () => {
    if (!state.postId) {
      return { success: false, error: "Post not saved yet" };
    }

    try {
      await completePostMutation({ postId: state.postId });

      setState((prev) => ({
        ...prev,
        status: "completed",
      }));

      toast({
        title: "Post Completed!",
        description: "Your social media post is ready to use.",
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Failed to complete post. Please try again.",
      };
    }
  }, [state.postId, completePostMutation, toast]);

  const setGenerating = useCallback((generating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating: generating }));
  }, []);

  const goToStep = useCallback(
    (step: string) => {
      const currentSearch = new URLSearchParams(searchParams.toString());
      currentSearch.set("step", step);
      router.push(`/dashboard/social/create?${currentSearch.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <SocialPostContext.Provider
      value={{
        state,
        updateData,
        savePost,
        validateStep,
        canComplete,
        completePost,
        setGenerating,
        goToStep,
        currentStep,
      }}
    >
      {children}
    </SocialPostContext.Provider>
  );
}

export function useSocialPost() {
  const context = useContext(SocialPostContext);
  if (context === undefined) {
    throw new Error("useSocialPost must be used within a SocialPostProvider");
  }
  return context;
}
