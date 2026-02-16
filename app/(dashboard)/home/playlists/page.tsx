"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  List,
  Music,
  Settings,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ExternalLink,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";

export default function PlaylistsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editPlaylistDesc, setEditPlaylistDesc] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [submissionPrice, setSubmissionPrice] = useState("10");
  const [isPublic, setIsPublic] = useState(true);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Convex mutations for file upload
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getUrl);

  const handleCoverFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFile = files[0];

    if (!imageFile.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    if (imageFile.size > 4 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 4MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingCover(true);
    try {
      // Step 1: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload the file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await response.json();

      // Step 3: Get the public URL for the uploaded file
      const publicUrl = await getFileUrl({ storageId });

      if (publicUrl) {
        setCoverUrl(publicUrl);
        toast({
          title: "Cover uploaded!",
          description: "Your playlist cover has been uploaded",
          className: "bg-white dark:bg-black",
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload cover image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCover(false);
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Fetch user's tracks for Add Track selector
  const userTracks = useQuery(api.tracks.getUserTracks, user?.id ? { userId: user.id } : "skip");

  const addTrackToPlaylist = useMutation(api.playlists.addTrackToPlaylist);

  const playlists = useQuery(
    api.playlists.getCreatorPlaylists,
    user?.id ? { creatorId: user.id } : "skip"
  );

  const createPlaylist = useMutation(api.playlists.createPlaylist);
  const updatePlaylist = useMutation(api.playlists.updatePlaylist);

  const handleEdit = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setEditPlaylistName(playlist.name);
    setEditPlaylistDesc(playlist.description || "");
    setIsPublic(playlist.isPublic ?? true);
    setCoverUrl(playlist.coverUrl || "");
    setSelectedGenres(playlist.genres || []);
    setShowEditDialog(true);
  };

  const handleAddTrack = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setShowAddTrackDialog(true);
  };

  const handleAddTrackToPlaylist = async (trackId: string) => {
    if (!selectedPlaylist || !user?.id) return;

    try {
      await addTrackToPlaylist({
        playlistId: selectedPlaylist._id,
        trackId: trackId as any,
        addedBy: user.id,
      });

      toast({
        title: "Track Added!",
        description: "Track has been added to the playlist",
        className: "bg-white dark:bg-black",
      });

      setShowAddTrackDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add track",
        variant: "destructive",
      });
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSettings = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setIsPaid(!(playlist.submissionPricing?.isFree ?? true));
    setSubmissionPrice((playlist.submissionPricing?.price || 10).toString());
    setShowSettingsDialog(true);
  };

  const handleCopyLink = (playlist: any) => {
    const publicUrl = `${window.location.origin}/playlists/${playlist.customSlug || playlist._id}`;
    navigator.clipboard.writeText(publicUrl);
    toast({
      title: "Link Copied!",
      description: "Public playlist link copied to clipboard",
      className: "bg-white dark:bg-black",
    });
  };

  const handleOpenPublic = (playlist: any) => {
    const publicUrl = `/playlists/${playlist.customSlug || playlist._id}`;
    window.open(publicUrl, "_blank");
  };

  const handleSaveEdit = async () => {
    if (!selectedPlaylist) return;

    try {
      await updatePlaylist({
        playlistId: selectedPlaylist._id,
        name: editPlaylistName.trim() || undefined,
        description: editPlaylistDesc.trim() || undefined,
        isPublic: isPublic,
        coverUrl: coverUrl.trim() || undefined,
      });

      toast({
        title: "Playlist Updated!",
        description: isPublic ? "Playlist is now public" : "Playlist is now private",
        className: "bg-white dark:bg-black",
      });

      setShowEditDialog(false);
      setSelectedPlaylist(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedPlaylist) return;

    try {
      await updatePlaylist({
        playlistId: selectedPlaylist._id,
        acceptsSubmissions: selectedPlaylist.acceptsSubmissions,
        submissionPricing: {
          isFree: !isPaid,
          price: isPaid ? parseFloat(submissionPrice) : undefined,
          currency: "USD",
        },
      });

      toast({
        title: "Settings Saved!",
        description: "Submission settings updated",
        className: "bg-white dark:bg-black",
      });

      setShowSettingsDialog(false);
      setSelectedPlaylist(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleToggleSubmissions = async (enable: boolean) => {
    if (!selectedPlaylist) return;

    try {
      await updatePlaylist({
        playlistId: selectedPlaylist._id,
        acceptsSubmissions: enable,
      });

      toast({
        title: enable ? "Submissions Enabled!" : "Submissions Disabled",
        description: enable
          ? "Artists can now submit tracks to this playlist"
          : "Submission form has been closed",
        className: "bg-white dark:bg-black",
      });

      setShowSettingsDialog(false);
      setSelectedPlaylist(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (!user?.id || !newPlaylistName.trim()) return;

    try {
      await createPlaylist({
        creatorId: user.id,
        name: newPlaylistName.trim(),
        isPublic: true,
        acceptsSubmissions: false,
      });

      toast({
        title: "Playlist Created!",
        description: "Your new playlist is ready to curate",
        className: "bg-white dark:bg-black",
      });

      setShowCreateDialog(false);
      setNewPlaylistName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="mb-1 text-xl md:text-3xl font-bold">Playlists</h1>
          <p className="text-muted-foreground">Curate playlists and accept track submissions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Playlist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{playlists?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Playlists</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {playlists?.filter((p: any) => p.isPublic).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Public</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {playlists?.filter((p: any) => p.acceptsSubmissions).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Accepting Submissions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {playlists?.reduce((sum: number, p: any) => sum + (p.totalSubmissions || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Submissions</div>
          </CardContent>
        </Card>
      </div>

      {/* Playlists Grid */}
      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist: any) => (
            <Card key={playlist._id} className="group transition-all hover:shadow-lg">
              <CardContent className="space-y-4 p-6">
                {/* Cover */}
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                  {playlist.coverUrl ? (
                    <Image
                      src={playlist.coverUrl}
                      alt={playlist.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <List className="h-16 w-16 text-purple-400" />
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {playlist.isPublic ? (
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Private
                      </Badge>
                    )}
                    {playlist.acceptsSubmissions && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        Submissions Open
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{playlist.trackCount || 0} tracks</span>
                  <span>{playlist.totalSubmissions || 0} submissions</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleAddTrack(playlist)}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleEdit(playlist)}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleSettings(playlist)}
                  >
                    <Settings className="h-3 w-3" />
                    Settings
                  </Button>
                </div>

                {playlist.isPublic && (
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleCopyLink(playlist)}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Copy Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleOpenPublic(playlist)}
                    >
                      <Eye className="h-3 w-3" />
                      Open
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyStateEnhanced
          icon={List}
          title="No playlists yet"
          description="Create your first playlist to start curating tracks and accepting submissions from artists."
          actions={[
            {
              label: "Create Playlist",
              onClick: () => setShowCreateDialog(true),
              icon: Plus,
            },
          ]}
          tips={[
            {
              icon: List,
              title: "Curate by Theme",
              description: "Create playlists around specific moods, genres, or themes",
            },
            {
              icon: Music,
              title: "Accept Submissions",
              description: "Let artists submit tracks and monetize your curation",
            },
            {
              icon: ExternalLink,
              title: "Share Everywhere",
              description: "Public playlists can be shared on social media and in bios",
            },
          ]}
        />
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="playlist-name">Playlist Name *</Label>
              <Input
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g., Chill Beats for Study"
                className="mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newPlaylistName.trim()} className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Create Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Playlist Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>Update playlist name and description</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Playlist Name *</Label>
              <Input
                id="edit-name"
                value={editPlaylistName}
                onChange={(e) => setEditPlaylistName(e.target.value)}
                placeholder="e.g., Chill Beats for Study"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editPlaylistDesc}
                onChange={(e) => setEditPlaylistDesc(e.target.value)}
                placeholder="Describe what this playlist is about..."
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Cover Image Upload */}
            <div>
              <Label htmlFor="cover-url">Cover Image (Optional)</Label>
              <div className="mt-2 space-y-3">
                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="gap-2"
                  >
                    {isUploadingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploadingCover ? "Uploading..." : "Upload Image"}
                  </Button>
                  <span className="text-sm text-muted-foreground">or</span>
                </div>

                {/* URL Input */}
                <Input
                  id="cover-url"
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Paste image URL..."
                />

                {/* Preview */}
                {coverUrl && (
                  <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg border">
                    <Image
                      src={coverUrl}
                      alt="Cover preview"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setCoverUrl("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, 500x500px or larger
                </p>
              </div>
            </div>

            {/* Genres */}
            <div>
              <Label>Genres (Select all that apply)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Electronic",
                  "Hip-Hop",
                  "House",
                  "Techno",
                  "Trap",
                  "Lo-Fi",
                  "Ambient",
                  "Experimental",
                ].map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Helps artists find playlists that fit their music style
              </p>
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex-1">
                <h4 className="font-medium">Visibility</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isPublic ? "Anyone can view this playlist" : "Only you can see this playlist"}
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playlist Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Playlist Settings</DialogTitle>
            <DialogDescription>
              Configure submissions and monetization for "{selectedPlaylist?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Accept Submissions Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex-1">
                <h4 className="font-medium">Accept Track Submissions</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Allow artists to submit their tracks for consideration
                </p>
              </div>
              <Switch
                checked={selectedPlaylist?.acceptsSubmissions || false}
                onCheckedChange={handleToggleSubmissions}
              />
            </div>

            {/* Submission Pricing (if enabled) */}
            {selectedPlaylist?.acceptsSubmissions && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">Charge Submission Fee</h4>
                    <p className="text-sm text-muted-foreground">
                      {isPaid
                        ? `Artists pay $${submissionPrice} per submission`
                        : "Free submissions (no charge)"}
                    </p>
                  </div>
                  <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                </div>

                {/* Price Input (when paid) */}
                {isPaid && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="submission-price">Submission Fee (USD)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="submission-price"
                        type="number"
                        min="1"
                        max="100"
                        value={submissionPrice}
                        onChange={(e) => setSubmissionPrice(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: $5-$15 for quick reviews, $20-$50 for detailed feedback
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Guidelines */}
            <div>
              <Label>Submission Guidelines (Optional)</Label>
              <Textarea
                placeholder="Tell artists what you're looking for..."
                rows={3}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Help artists understand what tracks fit your playlist
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} className="flex-1">
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Track to Playlist Dialog */}
      <Dialog open={showAddTrackDialog} onOpenChange={setShowAddTrackDialog}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Add Track to "{selectedPlaylist?.name}"</DialogTitle>
            <DialogDescription>
              Select tracks from your library to add to this playlist
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {userTracks && userTracks.length > 0 ? (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {userTracks
                  .filter((t: any) => t.isPublic)
                  .map((track: any) => (
                    <div
                      key={track._id}
                      className="flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
                      onClick={() => handleAddTrackToPlaylist(track._id)}
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                        <Music className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium">{track.title}</h4>
                        <p className="truncate text-sm text-muted-foreground">
                          {track.artist || "Unknown Artist"}
                        </p>
                      </div>
                      {track.genre && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {track.genre}
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">You haven't shared any tracks yet</p>
                <Button asChild>
                  <a href="/dashboard">
                    <Plus className="mr-2 h-4 w-4" />
                    Share Your First Track
                  </a>
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setShowAddTrackDialog(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
