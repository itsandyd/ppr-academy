import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Search, Grid, List } from 'lucide-react'
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

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch published samples
  const samples = useQuery(api.samples.getPublishedSamples, {
    genre: selectedGenre,
    searchQuery: searchQuery || undefined,
    limit: 50
  }) as Sample[] | undefined

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
      {/* Header with search and filters */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search samples..."
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

          {/* View toggle */}
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
        </div>
      </div>

      {/* Sample grid/list */}
      <div className="flex-1 overflow-auto p-4">
        {samples === undefined ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Loading samples...</div>
          </div>
        ) : samples.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
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
        )}
      </div>
    </div>
  )
}
