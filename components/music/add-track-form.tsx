"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Music, ExternalLink, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  extractMetadataFromUrl, 
  isValidMusicUrl, 
  detectPlatform, 
  getPlatformConfig,
  getPlatformDisplayName,
  type MusicTrackMetadata 
} from '@/lib/music-url-parser';

interface AddTrackFormProps {
  artistProfileId: string;
  storeId?: string;
  onSuccess?: () => void;
}

const MUSIC_GENRES = [
  'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', 'Blues', 
  'Country', 'Folk', 'Classical', 'Reggae', 'Funk', 'Soul', 'Gospel',
  'Trap', 'Drill', 'Afrobeats', 'Dancehall', 'House', 'Techno', 'Other'
];

export function AddTrackForm({ artistProfileId, storeId, onSuccess }: AddTrackFormProps) {
  const { user } = useUser();
  const addTrack = useMutation(api.musicShowcase.addTrackFromUrl);
  
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<MusicTrackMetadata | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState('');
  
  // Form fields
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);
    setUrlError('');
    setMetadata(null);
    
    if (!newUrl.trim()) return;
    
    if (!isValidMusicUrl(newUrl)) {
      setUrlError('Please enter a valid music URL from Spotify, SoundCloud, YouTube, Apple Music, or Bandcamp');
      return;
    }
    
    setIsExtracting(true);
    try {
      const extractedMetadata = await extractMetadataFromUrl(newUrl);
      setMetadata(extractedMetadata);
      
      // Pre-fill form with extracted data
      if (!customTitle) setCustomTitle(extractedMetadata.title);
      if (!customArtist) setCustomArtist(extractedMetadata.artist);
      if (!customDescription && extractedMetadata.description) {
        setCustomDescription(extractedMetadata.description);
      }
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      setUrlError('Failed to extract track information. You can still add it manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !metadata) return;
    
    setIsSubmitting(true);
    try {
      await addTrack({
        userId: user.id,
        artistProfileId: artistProfileId as any,
        storeId,
        // Basic info
        title: customTitle || metadata.title,
        artist: customArtist || metadata.artist,
        description: customDescription,
        genre: metadata.genre,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        // URL-based data
        originalUrl: metadata.originalUrl,
        platform: metadata.platform,
        embedUrl: metadata.embedUrl,
        // Extracted metadata
        artworkUrl: metadata.artworkUrl,
        duration: metadata.duration,
        releaseDate: metadata.releaseDate,
        // Custom overrides
        customGenre,
        customTags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        customDescription,
        // Settings
        isPublic,
        isFeatured,
      });
      
      toast({
        title: "Track added successfully!",
        description: `"${customTitle || metadata.title}" has been added to your showcase.`,
      });
      
      // Reset form
      setUrl('');
      setMetadata(null);
      setCustomTitle('');
      setCustomArtist('');
      setCustomGenre('');
      setCustomDescription('');
      setTags('');
      setIsPublic(true);
      setIsFeatured(false);
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add track:', error);
      toast({
        title: "Failed to add track",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const platformConfig = metadata ? getPlatformConfig(metadata.platform) : null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Add Track to Your Showcase
        </CardTitle>
        <CardDescription>
          Paste a URL from Spotify, SoundCloud, YouTube, Apple Music, or Bandcamp to add it to your music showcase.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="url">Music URL *</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://open.spotify.com/track/..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={urlError ? 'border-red-500' : ''}
          />
          {urlError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <X className="h-4 w-4" />
              {urlError}
            </p>
          )}
          {isExtracting && (
            <p className="text-sm text-blue-600 flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting track information...
            </p>
          )}
        </div>

        {/* Metadata Preview */}
        {metadata && (
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                {metadata.artworkUrl && (
                  <img 
                    src={metadata.artworkUrl} 
                    alt="Track artwork"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ backgroundColor: platformConfig?.color + '20', color: platformConfig?.color }}
                    >
                      {platformConfig?.icon} {getPlatformDisplayName(metadata.platform)}
                    </Badge>
                    <a 
                      href={metadata.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <h3 className="font-semibold truncate">{metadata.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{metadata.artist}</p>
                  {metadata.duration && (
                    <p className="text-xs text-gray-500">
                      Duration: {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Fields */}
        {metadata && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={metadata.title}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="artist">Artist Name *</Label>
                <Input
                  id="artist"
                  value={customArtist}
                  onChange={(e) => setCustomArtist(e.target.value)}
                  placeholder={metadata.artist}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={customGenre} onValueChange={setCustomGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {MUSIC_GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre.toLowerCase()}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Add a custom description for this track..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="trap, beats, instrumental (comma-separated)"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Make this track public</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Feature this track</span>
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !customTitle.trim() || !customArtist.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Track...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Add Track to Showcase
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
