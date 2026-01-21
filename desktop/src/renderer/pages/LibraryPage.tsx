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

export function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Fetch user's library (purchased samples)
  const library = useQuery(api.samples.getUserLibrary) as Sample[] | undefined

  // Filter samples based on search
  const filteredSamples = library?.filter((sample: Sample) =>
    sample.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">My Library</h1>
        <p className="text-sm text-muted-foreground">
          Your purchased samples ready to drag into your DAW
        </p>

        <div className="mt-4 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your library..."
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
        {library === undefined ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Loading your library...</div>
          </div>
        ) : !filteredSamples || filteredSamples.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-medium">
                {searchQuery ? 'No samples found' : 'Your library is empty'}
              </div>
              <div className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Purchase samples from the Explore tab to build your collection'}
              </div>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredSamples.map((sample) => (
              <SampleCard key={sample._id} sample={{ ...sample, isOwned: true }} />
            ))}
          </div>
        ) : (
          <SampleList samples={filteredSamples.map((s) => ({ ...s, isOwned: true }))} />
        )}
      </div>
    </div>
  )
}
