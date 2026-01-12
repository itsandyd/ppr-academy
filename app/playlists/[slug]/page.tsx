"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  List,
  Clock,
  Music,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  Send,
  Loader2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSignedIn, isLoaded } = useUser();
  const slug = params.slug as string;

  const [selectedTrackId, setSelectedTrackId] = useState<Id<"userTracks"> | null>(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const playlist = useQuery(api.playlists.getPlaylistByIdOrSlug, { identifier: slug });
  const userTracks = useQuery(
    api.tracks.getUserTracks,
    isSignedIn && user?.id ? { userId: user.id } : "skip"
  );
  const submitTrack = useMutation(api.submissions.submitTrack);

  // Handle success/cancelled return from Stripe
  useEffect(() => {
    const submission = searchParams.get("submission");
    if (submission === "success") {
      setShowSuccessDialog(true);
      // Clean up URL
      router.replace(`/playlists/${slug}`, { scroll: false });
    } else if (submission === "cancelled") {
      toast.error("Payment was cancelled. Your track was not submitted.");
      router.replace(`/playlists/${slug}`, { scroll: false });
    }
  }, [searchParams, slug, router]);

  const handleSubmit = async () => {
    if (!selectedTrackId || !playlist || !user?.id) return;

    const isFreeSubmission = playlist.submissionPricing?.isFree;
    const submissionFee = isFreeSubmission ? 0 : playlist.submissionPricing?.price || 0;

    setIsSubmitting(true);
    try {
      // For paid submissions, redirect to Stripe checkout
      if (!isFreeSubmission && submissionFee > 0) {
        const selectedTrack = userTracks?.find((t: { _id: string; title?: string }) => t._id === selectedTrackId);

        const response = await fetch("/api/submissions/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playlistId: playlist._id,
            playlistName: playlist.name,
            trackId: selectedTrackId,
            trackTitle: selectedTrack?.title || "Track",
            creatorId: playlist.creatorId,
            creatorStripeAccountId: playlist.creatorStripeAccountId,
            submissionFee,
            message: pitchMessage || undefined,
            customerEmail: user.emailAddresses?.[0]?.emailAddress,
          }),
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = data.checkoutUrl;
          return;
        } else {
          throw new Error(data.error || "Failed to create checkout session");
        }
      }

      // For free submissions, create directly
      await submitTrack({
        submitterId: user.id,
        creatorId: playlist.creatorId,
        trackId: selectedTrackId,
        playlistId: playlist._id as Id<"curatorPlaylists">,
        message: pitchMessage || undefined,
        submissionFee: 0,
      });

      setShowSuccessDialog(true);
      setSelectedTrackId(null);
      setPitchMessage("");
    } catch (error) {
      toast.error("Failed to submit track. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (playlist === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (playlist === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <List className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Playlist Not Found</h1>
        <p className="text-muted-foreground">This playlist doesn&apos;t exist or has been removed.</p>
        <Button asChild>
          <Link href="/playlists">Browse Playlists</Link>
        </Button>
      </div>
    );
  }

  const isFreeSubmission = playlist.submissionPricing?.isFree;
  const submissionPrice = playlist.submissionPricing?.price || 0;
  const requiresMessage = playlist.submissionRules?.requiresMessage;

  return (
    <div className="min-h-screen bg-background">
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Submission Sent!
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                Your track has been submitted to <strong>{playlist.name}</strong>.
              </p>
              <p>
                The curator will review your submission within{" "}
                <strong>{playlist.submissionSLA || 7} days</strong>.
              </p>
              <p className="text-sm">
                You can track your submission status in your dashboard.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Submit Another
            </Button>
            <Button onClick={() => router.push("/dashboard/home/submissions")}>
              View My Submissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/playlists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Playlists
            </Link>
          </Button>

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* Cover Image */}
            <motion.div
              className="relative h-64 w-64 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {playlist.coverUrl ? (
                <Image
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  fill
                  className="object-cover"
                  sizes="256px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <List className="h-24 w-24 text-purple-400" />
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              className="flex-1 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div>
                <h1 className="text-4xl font-bold">{playlist.name}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{playlist.description}</p>
              </div>

              {/* Curator */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={playlist.creatorAvatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {playlist.creatorName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Curated by {playlist.creatorName}</div>
                  <div className="text-sm text-muted-foreground">
                    {playlist.trackCount || 0} tracks
                  </div>
                </div>
              </div>

              {/* Genres */}
              {playlist.genres && playlist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {playlist.genres.map((genre: string) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{playlist.submissionSLA || 7} day review</span>
                </div>
                {isFreeSubmission ? (
                  <Badge className="bg-green-500 text-white">Free Submissions</Badge>
                ) : (
                  <Badge className="bg-purple-500 text-white">
                    <DollarSign className="mr-1 h-3 w-3" />
                    {submissionPrice} per submission
                  </Badge>
                )}
              </div>

              {/* External Links */}
              <div className="flex flex-wrap gap-2">
                {playlist.spotifyPlaylistUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={playlist.spotifyPlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Spotify
                    </a>
                  </Button>
                )}
                {playlist.applePlaylistUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={playlist.applePlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Apple Music
                    </a>
                  </Button>
                )}
                {playlist.soundcloudPlaylistUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={playlist.soundcloudPlaylistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      SoundCloud
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Submission Form */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Guidelines */}
            {playlist.submissionRules?.guidelines && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Submission Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {playlist.submissionRules.guidelines}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Accepted Genres */}
            {playlist.submissionRules?.allowedGenres &&
              playlist.submissionRules.allowedGenres.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Music className="h-5 w-5" />
                      Accepted Genres
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {playlist.submissionRules.allowedGenres.map((genre: string) => (
                        <Badge key={genre} variant="outline">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Track Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Submit Your Track
                </CardTitle>
                <CardDescription>
                  Select a track from your library to submit for consideration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isLoaded ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !isSignedIn ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">Sign in to Submit</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Create an account or sign in to submit your tracks to this playlist.
                    </p>
                    <SignInButton mode="modal">
                      <Button>Sign In</Button>
                    </SignInButton>
                  </div>
                ) : userTracks === undefined ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : userTracks.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No Tracks Yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Upload your first track to start submitting to playlists.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard/home/tracks">Upload Track</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      value={selectedTrackId || ""}
                      onValueChange={(v) => setSelectedTrackId(v as Id<"userTracks">)}
                      className="space-y-3"
                    >
                      {userTracks.map((track: any) => (
                        <div
                          key={track._id}
                          className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                            selectedTrackId === track._id
                              ? "border-purple-500 bg-purple-500/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <RadioGroupItem value={track._id} id={track._id} />
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                            {track.coverUrl ? (
                              <Image
                                src={track.coverUrl}
                                alt={track.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <Music className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <Label htmlFor={track._id} className="flex-1 cursor-pointer">
                            <div className="font-medium">{track.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {track.artist || "Unknown Artist"}
                              {track.genre && ` • ${track.genre}`}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Pitch Message */}
                    <div className="space-y-2">
                      <Label htmlFor="pitch">
                        Pitch Message{" "}
                        {requiresMessage && <span className="text-red-500">*</span>}
                      </Label>
                      <Textarea
                        id="pitch"
                        value={pitchMessage}
                        onChange={(e) => setPitchMessage(e.target.value)}
                        placeholder="Tell the curator why your track is a great fit for this playlist..."
                        rows={4}
                        className="bg-white dark:bg-black"
                      />
                      <p className="text-xs text-muted-foreground">
                        {requiresMessage
                          ? "A pitch message is required for this playlist"
                          : "Optional but recommended - a good pitch increases your chances"}
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={
                        !selectedTrackId ||
                        (requiresMessage && !pitchMessage.trim()) ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Track
                          {!isFreeSubmission && ` ($${submissionPrice})`}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium">
                    {isFreeSubmission ? "Free" : `$${submissionPrice}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Review Time</span>
                  <span className="font-medium">{playlist.submissionSLA || 7} days</span>
                </div>
                {playlist.submissionRules?.maxLengthSeconds && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Length</span>
                    <span className="font-medium">
                      {Math.floor(playlist.submissionRules.maxLengthSeconds / 60)}:
                      {String(playlist.submissionRules.maxLengthSeconds % 60).padStart(2, "0")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pitch Required</span>
                  <span className="font-medium">{requiresMessage ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Select Your Track</div>
                    <div className="text-sm text-muted-foreground">
                      Choose a track from your library
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Write Your Pitch</div>
                    <div className="text-sm text-muted-foreground">
                      Tell the curator why it fits
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Get Reviewed</div>
                    <div className="text-sm text-muted-foreground">
                      Receive feedback within {playlist.submissionSLA || 7} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curator Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Curator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={playlist.creatorAvatar} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {playlist.creatorName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{playlist.creatorName}</div>
                    <div className="text-sm text-muted-foreground">Playlist Curator</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
