"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, List, Music, Settings, Eye, EyeOff, Edit, Trash2, ExternalLink } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";
import Link from "next/link";

export default function PlaylistsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const playlists = useQuery(
    api.playlists.getCreatorPlaylists,
    user?.id ? { creatorId: user.id } : "skip"
  );

  const createPlaylist = useMutation(api.playlists.createPlaylist);

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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Playlists</h1>
          <p className="text-muted-foreground">
            Curate playlists and accept track submissions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Playlist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{playlists?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Playlists</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {playlists?.filter(p => p.isPublic).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Public</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {playlists?.filter(p => p.acceptsSubmissions).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Accepting Submissions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {playlists?.reduce((sum, p) => sum + (p.totalSubmissions || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Submissions</div>
          </CardContent>
        </Card>
      </div>

      {/* Playlists Grid */}
      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <Card key={playlist._id} className="group hover:shadow-lg transition-all">
              <CardContent className="p-6 space-y-4">
                {/* Cover */}
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {playlist.coverUrl ? (
                    <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
                  ) : (
                    <List className="w-16 h-16 text-purple-400" />
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1 mb-2">{playlist.name}</h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {playlist.isPublic ? (
                      <Badge variant="secondary" className="gap-1">
                        <Eye className="w-3 h-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="w-3 h-3" />
                        Private
                      </Badge>
                    )}
                    {playlist.acceptsSubmissions && (
                      <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
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
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Settings className="w-3 h-3" />
                    Settings
                  </Button>
                </div>

                {playlist.isPublic && (
                  <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
                    <ExternalLink className="w-3 h-3" />
                    View Public Link
                  </Button>
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
              icon: Plus
            }
          ]}
          tips={[
            {
              icon: List,
              title: "Curate by Theme",
              description: "Create playlists around specific moods, genres, or themes"
            },
            {
              icon: Music,
              title: "Accept Submissions",
              description: "Let artists submit tracks and monetize your curation"
            },
            {
              icon: ExternalLink,
              title: "Share Everywhere",
              description: "Public playlists can be shared on social media and in bios"
            }
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
              <Button 
                onClick={handleCreate}
                disabled={!newPlaylistName.trim()}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

