import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Search, Grid, List, Music, Package, Loader2 } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch published samples
  const samples = useQuery(api.samples.getPublishedSamples, {
    genre: selectedGenre,
    searchQuery: searchQuery || undefined,
    limit: 50
  }) as Sample[] | undefined

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
