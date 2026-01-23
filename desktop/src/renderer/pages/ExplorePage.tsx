import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Search, Grid, List, Music, Package, Loader2, X, SlidersHorizontal } from 'lucide-react'
import { SampleCard } from '../components/SampleCard'
import { SampleList } from '../components/SampleList'

interface Sample {
  _id: string
  title: string
  fileUrl?: string
  previewUrl?: string
  coverImageUrl?: string
  bpm?: number
  key?: string
  genre?: string
  duration?: number
  creditPrice?: number
}

// Filter options
const BPM_RANGES = [
  { label: '60-90 BPM', min: 60, max: 90 },
  { label: '90-120 BPM', min: 90, max: 120 },
  { label: '120-140 BPM', min: 120, max: 140 },
  { label: '140-160 BPM', min: 140, max: 160 },
  { label: '160+ BPM', min: 160, max: 999 },
]

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
]

const DURATION_RANGES = [
  { label: 'Short (<10s)', min: 0, max: 10 },
  { label: 'Medium (10-30s)', min: 10, max: 30 },
  { label: 'Long (30s+)', min: 30, max: 9999 },
]

interface Pack {
  _id: string
  title: string
  description: string
  price: number
  imageUrl?: string
  coverImage?: string
  genres: string[]
  sampleCount: number
  downloadCount: number
  creatorName?: string
  creatorAvatar?: string
}

type ExploreTab = 'samples' | 'packs'

export function ExplorePage() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('samples')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>()
  const [selectedBpmRange, setSelectedBpmRange] = useState<{ min: number; max: number } | undefined>()
  const [selectedKey, setSelectedKey] = useState<string | undefined>()
  const [selectedDuration, setSelectedDuration] = useState<{ min: number; max: number } | undefined>()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch published samples
  const allSamples = useQuery(api.samples.getPublishedSamples, {
    genre: selectedGenre,
    searchQuery: searchQuery || undefined,
    limit: 50
  }) as Sample[] | undefined

  // Apply client-side filters for BPM, key, and duration
  const samples = allSamples?.filter((sample) => {
    // BPM filter
    if (selectedBpmRange && sample.bpm) {
      if (sample.bpm < selectedBpmRange.min || sample.bpm > selectedBpmRange.max) {
        return false
      }
    }
    // Key filter
    if (selectedKey && sample.key) {
      if (!sample.key.toLowerCase().startsWith(selectedKey.toLowerCase())) {
        return false
      }
    }
    // Duration filter
    if (selectedDuration && sample.duration) {
      if (sample.duration < selectedDuration.min || sample.duration > selectedDuration.max) {
        return false
      }
    }
    return true
  })

  // Count active filters
  const activeFilterCount = [selectedGenre, selectedBpmRange, selectedKey, selectedDuration].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedGenre(undefined)
    setSelectedBpmRange(undefined)
    setSelectedKey(undefined)
    setSelectedDuration(undefined)
  }

  // Fetch published packs
  const packs = useQuery(api.samplePacks.getAllPublishedSamplePacks) as Pack[] | undefined

  // Filter packs by search and genre
  const filteredPacks = packs?.filter(pack => {
    const matchesSearch = !searchQuery ||
      pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = !selectedGenre || pack.genres.includes(selectedGenre)
    return matchesSearch && matchesGenre
  })

  // Genres for filter
  const genres = [
    'Hip Hop',
    'Trap',
    'R&B',
    'Pop',
    'Electronic',
    'House',
    'Techno',
    'Drill',
    'Lo-Fi',
    'Afrobeats'
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header with tabs, search and filters */}
      <div className="border-b border-border p-4">
        {/* Tabs */}
        <div className="mb-4 flex gap-1">
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'samples'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Music className="h-4 w-4" />
            Samples
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'packs'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Packs
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === 'samples' ? 'Search samples...' : 'Search packs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Genre filter */}
          <select
            value={selectedGenre || ''}
            onChange={(e) => setSelectedGenre(e.target.value || undefined)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          {/* Advanced filters toggle (samples only) */}
          {activeTab === 'samples' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* View toggle (samples only) */}
          {activeTab === 'samples' && (
            <div className="flex rounded-lg border border-input">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Advanced filter chips */}
        {activeTab === 'samples' && showFilters && (
          <div className="mt-4 space-y-3">
            {/* BPM Range */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-16">BPM:</span>
              {BPM_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setSelectedBpmRange(
                    selectedBpmRange?.min === range.min ? undefined : range
                  )}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedBpmRange?.min === range.min
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Musical Key */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-16">Key:</span>
              <select
                value={selectedKey || ''}
                onChange={(e) => setSelectedKey(e.target.value || undefined)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
              >
                <option value="">Any Key</option>
                <optgroup label="Major">
                  {MUSICAL_KEYS.slice(0, 12).map((key) => (
                    <option key={key} value={key}>{key} Major</option>
                  ))}
                </optgroup>
                <optgroup label="Minor">
                  {MUSICAL_KEYS.slice(12).map((key) => (
                    <option key={key} value={key}>{key.replace('m', '')} Minor</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Duration */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-16">Length:</span>
              {DURATION_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setSelectedDuration(
                    selectedDuration?.min === range.min ? undefined : range
                  )}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedDuration?.min === range.min
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Clear all filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips display (when panel is closed) */}
        {activeTab === 'samples' && !showFilters && activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedBpmRange && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                {BPM_RANGES.find(r => r.min === selectedBpmRange.min)?.label}
                <button onClick={() => setSelectedBpmRange(undefined)} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedKey && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                Key: {selectedKey}
                <button onClick={() => setSelectedKey(undefined)} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedDuration && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                {DURATION_RANGES.find(r => r.min === selectedDuration.min)?.label}
                <button onClick={() => setSelectedDuration(undefined)} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'samples' ? (
          // Samples view
          samples === undefined ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : samples.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Music className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium">No samples found</div>
                <div className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {samples.map((sample) => (
                <SampleCard key={sample._id} sample={sample} />
              ))}
            </div>
          ) : (
            <SampleList samples={samples} />
          )
        ) : (
          // Packs view
          filteredPacks === undefined ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Package className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                <div className="text-lg font-medium">No packs found</div>
                <div className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {filteredPacks.map((pack) => (
                <PackCard key={pack._id} pack={pack} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// Pack Card Component
function PackCard({ pack }: { pack: Pack }) {
  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden transition-colors hover:bg-secondary/30">
      {/* Cover Image */}
      <div className="aspect-square w-full overflow-hidden bg-secondary">
        {pack.imageUrl || pack.coverImage ? (
          <img
            src={pack.imageUrl || pack.coverImage}
            alt={pack.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-medium line-clamp-1">{pack.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {pack.description}
        </p>

        {/* Creator */}
        {pack.creatorName && (
          <div className="mt-2 flex items-center gap-2">
            {pack.creatorAvatar && (
              <img
                src={pack.creatorAvatar}
                alt={pack.creatorName}
                className="h-5 w-5 rounded-full"
              />
            )}
            <span className="text-xs text-muted-foreground">{pack.creatorName}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-border">
          <span className="text-xs text-muted-foreground">
            {pack.sampleCount} samples
          </span>
          <span className="text-sm font-medium">{pack.price} credits</span>
        </div>
      </div>
    </div>
  )
}
