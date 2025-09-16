/**
 * Music URL Parser - Extract metadata from music platform URLs
 * Supports Spotify, SoundCloud, YouTube, Apple Music, Bandcamp
 */

export interface MusicTrackMetadata {
  title: string;
  artist: string;
  platform: 'spotify' | 'soundcloud' | 'youtube' | 'apple_music' | 'bandcamp' | 'other';
  originalUrl: string;
  embedUrl?: string;
  artworkUrl?: string;
  duration?: number;
  releaseDate?: string;
  genre?: string;
  description?: string;
}

export interface PlatformConfig {
  name: string;
  urlPattern: RegExp;
  embedTemplate: string;
  apiEndpoint?: string;
}

// Platform configurations
const PLATFORMS: Record<string, PlatformConfig> = {
  spotify: {
    name: 'Spotify',
    urlPattern: /^https?:\/\/(open\.)?spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/,
    embedTemplate: 'https://open.spotify.com/embed/track/{id}',
    apiEndpoint: 'https://api.spotify.com/v1/tracks/{id}',
  },
  soundcloud: {
    name: 'SoundCloud',
    urlPattern: /^https?:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/,
    embedTemplate: 'https://w.soundcloud.com/player/?url={url}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true',
  },
  youtube: {
    name: 'YouTube',
    urlPattern: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    embedTemplate: 'https://www.youtube.com/embed/{id}',
  },
  apple_music: {
    name: 'Apple Music',
    urlPattern: /^https?:\/\/music\.apple\.com\/[a-z]{2}\/album\/[\w-]+\/(\d+)\?i=(\d+)/,
    embedTemplate: 'https://embed.music.apple.com/us/album/{id}',
  },
  bandcamp: {
    name: 'Bandcamp',
    urlPattern: /^https?:\/\/[\w-]+\.bandcamp\.com\/(track|album)\/[\w-]+/,
    embedTemplate: '{url}',
  },
};

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): keyof typeof PLATFORMS | 'other' {
  for (const [platform, config] of Object.entries(PLATFORMS)) {
    if (config.urlPattern.test(url)) {
      return platform as keyof typeof PLATFORMS;
    }
  }
  return 'other';
}

/**
 * Extract track ID from platform URLs
 */
export function extractTrackId(url: string, platform: string): string | null {
  const config = PLATFORMS[platform];
  if (!config) return null;

  const match = url.match(config.urlPattern);
  if (!match) return null;

  switch (platform) {
    case 'spotify':
      return match[3]; // Track ID from Spotify URL
    case 'youtube':
      return match[3]; // Video ID from YouTube URL
    case 'apple_music':
      return match[2]; // Track ID from Apple Music URL
    default:
      return null;
  }
}

/**
 * Generate embed URL for a platform
 */
export function generateEmbedUrl(originalUrl: string, platform: string): string {
  const config = PLATFORMS[platform];
  if (!config) return originalUrl;

  const trackId = extractTrackId(originalUrl, platform);
  
  if (trackId && config.embedTemplate.includes('{id}')) {
    return config.embedTemplate.replace('{id}', trackId);
  }
  
  if (config.embedTemplate.includes('{url}')) {
    return config.embedTemplate.replace('{url}', encodeURIComponent(originalUrl));
  }
  
  return originalUrl;
}

/**
 * Extract metadata using oEmbed APIs where available
 */
export async function extractMetadataFromUrl(url: string): Promise<MusicTrackMetadata> {
  const platform = detectPlatform(url);
  const embedUrl = generateEmbedUrl(url, platform);
  
  // Base metadata
  const metadata: MusicTrackMetadata = {
    title: 'Unknown Track',
    artist: 'Unknown Artist',
    platform,
    originalUrl: url,
    embedUrl,
  };

  try {
    // Try platform-specific extraction
    switch (platform) {
      case 'soundcloud':
        return await extractSoundCloudMetadata(url, metadata);
      case 'youtube':
        return await extractYouTubeMetadata(url, metadata);
      case 'spotify':
        return await extractSpotifyMetadata(url, metadata);
      default:
        return await extractGenericMetadata(url, metadata);
    }
  } catch (error) {
    console.warn('Failed to extract metadata:', error);
    return metadata;
  }
}

/**
 * Extract SoundCloud metadata using oEmbed
 */
async function extractSoundCloudMetadata(url: string, base: MusicTrackMetadata): Promise<MusicTrackMetadata> {
  try {
    const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    const data = await response.json();
    
    return {
      ...base,
      title: data.title || base.title,
      artist: data.author_name || base.artist,
      artworkUrl: data.thumbnail_url,
      description: data.description,
    };
  } catch (error) {
    console.warn('SoundCloud metadata extraction failed:', error);
    return base;
  }
}

/**
 * Extract YouTube metadata using oEmbed
 */
async function extractYouTubeMetadata(url: string, base: MusicTrackMetadata): Promise<MusicTrackMetadata> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    const data = await response.json();
    
    return {
      ...base,
      title: data.title || base.title,
      artist: data.author_name || base.artist,
      artworkUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.warn('YouTube metadata extraction failed:', error);
    return base;
  }
}

/**
 * Extract Spotify metadata (requires API key)
 */
async function extractSpotifyMetadata(url: string, base: MusicTrackMetadata): Promise<MusicTrackMetadata> {
  // Note: This would require Spotify API credentials
  // For now, return base metadata with improved embed URL
  const trackId = extractTrackId(url, 'spotify');
  if (trackId) {
    return {
      ...base,
      embedUrl: `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`,
    };
  }
  return base;
}

/**
 * Generic metadata extraction using Open Graph tags
 */
async function extractGenericMetadata(url: string, base: MusicTrackMetadata): Promise<MusicTrackMetadata> {
  try {
    // This would require a server-side proxy to avoid CORS issues
    // For now, return base metadata
    return base;
  } catch (error) {
    console.warn('Generic metadata extraction failed:', error);
    return base;
  }
}

/**
 * Validate music URL
 */
export function isValidMusicUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const platform = detectPlatform(url);
    return platform !== 'other' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
  return PLATFORMS[platform]?.name || 'Other';
}

/**
 * Get platform icon/color
 */
export function getPlatformConfig(platform: string) {
  const configs = {
    spotify: { color: '#1DB954', icon: '🎵' },
    soundcloud: { color: '#FF5500', icon: '🔊' },
    youtube: { color: '#FF0000', icon: '📺' },
    apple_music: { color: '#FA243C', icon: '🍎' },
    bandcamp: { color: '#629AA0', icon: '🎪' },
    other: { color: '#6B7280', icon: '🎶' },
  };
  
  return configs[platform as keyof typeof configs] || configs.other;
}
