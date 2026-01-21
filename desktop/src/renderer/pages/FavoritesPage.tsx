import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Search, Grid, List, Heart } from 'lucide-react'
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

export function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch user's favorite samples
  const favorites = useQuery(api.samples.getFavoriteSamples) as Sample[] | undefined

  // Filter samples based on search
  const filteredSamples = favorites?.filter((sample: Sample) =>
    sample.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold">Favorites</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Samples you've saved for later
        </p>

        <div className="mt-4 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

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

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {favorites === undefined ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Loading favorites...</div>
          </div>
        ) : !filteredSamples || filteredSamples.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <div className="mt-4 text-lg font-medium">
                {searchQuery ? 'No favorites found' : 'No favorites yet'}
              </div>
              <div className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Heart samples while browsing to save them here'}
              </div>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredSamples.map((sample) => (
              <SampleCard key={sample._id} sample={sample} />
            ))}
          </div>
        ) : (
          <SampleList samples={filteredSamples} />
        )}
      </div>
    </div>
  )
}
