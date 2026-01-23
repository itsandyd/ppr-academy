import { useState, useRef, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  Upload,
  Music,
  Play,
  Pause,
  Plus,
  X,
  Loader2,
  ArrowLeft,
  Check,
  FileAudio,
  Package
} from 'lucide-react'
import { Id } from '@convex/_generated/dataModel'

const GENRES = [
  'Hip Hop',
  'Trap',
  'R&B',
  'Pop',
  'Electronic',
  'House',
  'Techno',
  'Drum & Bass',
  'Dubstep',
  'Lo-Fi',
  'Ambient',
  'Indie',
  'Rock',
  'Jazz',
  'Afrobeats',
  'Drill'
]

const CATEGORIES = [
  { value: 'drums', label: 'Drums' },
  { value: 'bass', label: 'Bass' },
  { value: 'synth', label: 'Synth' },
  { value: 'vocals', label: 'Vocals' },
  { value: 'fx', label: 'FX' },
  { value: 'melody', label: 'Melody' },
  { value: 'loops', label: 'Loops' },
  { value: 'one-shots', label: 'One-shots' }
]

const LICENSE_TYPES = [
  { value: 'royalty-free', label: 'Royalty Free', desc: 'Can be used in any project without royalties' },
  { value: 'commercial', label: 'Commercial', desc: 'Can be used in commercial projects' },
  { value: 'exclusive', label: 'Exclusive', desc: 'Only one buyer can use this sample' }
]

type CategoryValue = typeof CATEGORIES[number]['value']
type LicenseType = 'royalty-free' | 'commercial' | 'exclusive'

interface FileData {
  name: string
  size: number
  format: string
  buffer: string // Base64 encoded
  localUrl: string | null
  duration: number
  storageId: string | null
}

type CreatorTab = 'upload' | 'my-samples' | 'my-packs'

export function UploadPage() {
  const [activeTab, setActiveTab] = useState<CreatorTab>('upload')
  const { user } = useUser()

  // Get user's store
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : 'skip')
  const primaryStore = stores?.[0]

  // If no store, show message
  if (stores !== undefined && !primaryStore) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <FileAudio className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Create Your Store First</h2>
        <p className="mb-4 text-center text-muted-foreground">
          You need to create a creator store before uploading samples.
        </p>
        <button
          onClick={() => window.electron.openExternal('https://academy.pauseplayrepeat.com/dashboard')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Store on Web
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tabs Header */}
      <div className="border-b border-border p-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab('my-samples')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'my-samples'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Music className="h-4 w-4" />
            My Samples
          </button>
          <button
            onClick={() => setActiveTab('my-packs')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'my-packs'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            My Packs
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'upload' && <SampleUploadForm storeId={primaryStore?._id} />}
      {activeTab === 'my-samples' && <MySamplesManager storeId={primaryStore?._id} />}
      {activeTab === 'my-packs' && <PacksManager storeId={primaryStore?._id} />}
    </div>
  )
}

// Sample Upload Form Component
function SampleUploadForm({ storeId }: { storeId: string | undefined }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  // State
  const [isUploading, setIsUploading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    category: '' as CategoryValue | '',
    bpm: '',
    key: '',
    creditPrice: '5',
    licenseType: 'royalty-free' as LicenseType,
    tags: [] as string[]
  })

  // File data
  const [fileData, setFileData] = useState<FileData | null>(null)

  // Selected pack to add sample to
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)

  // Get user's packs
  const packs = useQuery(
    api.samplePacks.getPacksByStore,
    storeId ? { storeId } : 'skip'
  ) as Array<{ _id: Id<'samplePacks'>; name: string }> | undefined

  // Mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createSample = useMutation(api.samples.createSample)
  const addSamplesToPack = useMutation(api.samplePacks.addSamplesToPack)

  // Clear messages after a delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const updateFormData = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSelectFile = async () => {
    try {
      const result = await window.electron.selectAudioFile()
      if (!result) return

      // Validate file size (max 50MB)
      if (result.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }

      // Create a local URL from the base64 data for preview
      const blob = new Blob(
        [Uint8Array.from(atob(result.buffer), c => c.charCodeAt(0))],
        { type: `audio/${result.format}` }
      )
      const localUrl = URL.createObjectURL(blob)

      // Get duration
      const audio = new Audio(localUrl)
      audio.addEventListener('loadedmetadata', () => {
        setFileData((prev) => prev ? { ...prev, duration: audio.duration } : prev)
      })

      setFileData({
        name: result.name,
        size: result.size,
        format: result.format,
        buffer: result.buffer,
        localUrl,
        duration: 0,
        storageId: null
      })

      // Auto-fill title from filename if empty
      if (!formData.title) {
        const title = result.name.replace(/\.(wav|mp3|aiff|flac|ogg)$/i, '')
        updateFormData('title', title)
      }

      setError(null)
    } catch (err) {
      console.error('File select error:', err)
      setError('Failed to select file')
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current || !fileData?.localUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.src = fileData.localUrl
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    updateFormData('tags', formData.tags.filter((t) => t !== tag))
  }

  const clearFile = () => {
    if (fileData?.localUrl) {
      URL.revokeObjectURL(fileData.localUrl)
    }
    setFileData(null)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const handlePublish = async (asDraft: boolean = false) => {
    if (!storeId) {
      setError('Please create a store on the web first')
      return
    }

    if (!fileData) {
      setError('Please select an audio file')
      return
    }

    if (!formData.title || !formData.genre || !formData.category) {
      setError('Please fill in all required fields (Title, Genre, Category)')
      return
    }

    setIsPublishing(true)
    setError(null)

    try {
      // Upload file to Convex storage
      setIsUploading(true)
      const uploadUrl = await generateUploadUrl()

      // Convert base64 to blob for upload
      const binaryString = atob(fileData.buffer)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: `audio/${fileData.format}` })

      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob
      })

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file to storage')
      }

      const { storageId: uploadedStorageId } = await uploadResult.json()
      setIsUploading(false)

      // Create sample in database
      const sampleId = await createSample({
        storeId,
        title: formData.title,
        description: formData.description || undefined,
        storageId: uploadedStorageId,
        fileUrl: '', // Will be populated by backend
        fileName: fileData.name,
        fileSize: fileData.size,
        duration: fileData.duration,
        format: fileData.format,
        bpm: formData.bpm ? parseInt(formData.bpm) : undefined,
        key: formData.key || undefined,
        genre: formData.genre,
        tags: formData.tags,
        category: formData.category as 'drums' | 'bass' | 'synth' | 'vocals' | 'fx' | 'melody' | 'loops' | 'one-shots',
        creditPrice: parseInt(formData.creditPrice) || 5,
        licenseType: formData.licenseType
      })

      // Add to pack if selected
      if (selectedPackId && sampleId) {
        try {
          await addSamplesToPack({
            packId: selectedPackId as Id<'samplePacks'>,
            sampleIds: [sampleId]
          })
          const packName = packs?.find(p => p._id === selectedPackId)?.name || 'pack'
          setSuccess(asDraft ? 'Sample saved as draft!' : `Sample uploaded and added to "${packName}"!`)
        } catch (packErr) {
          console.error('Failed to add to pack:', packErr)
          setSuccess(asDraft ? 'Sample saved as draft!' : 'Sample uploaded! (Failed to add to pack)')
        }
      } else {
        setSuccess(asDraft ? 'Sample saved as draft!' : 'Sample uploaded successfully!')
      }

      // Reset form
      clearFile()
      setSelectedPackId(null)
      setFormData({
        title: '',
        description: '',
        genre: '',
        category: '',
        bpm: '',
        key: '',
        creditPrice: '5',
        licenseType: 'royalty-free',
        tags: []
      })
    } catch (err: unknown) {
      console.error('Publish error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload sample')
    } finally {
      setIsPublishing(false)
      setIsUploading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canPublish = !!(
    fileData &&
    formData.title &&
    formData.genre &&
    formData.category &&
    storeId
  )

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 space-y-6 p-4">
        {/* File Upload */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-medium">Audio File *</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            WAV, MP3, AIFF, FLAC, OGG - Max 50MB
          </p>

          {fileData ? (
            <div className="flex items-center gap-4 rounded-lg border bg-secondary/30 p-4">
              <button
                onClick={handlePlayPause}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-secondary"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 text-primary" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{fileData.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatFileSize(fileData.size)}</span>
                  <span>•</span>
                  <span>{formatDuration(fileData.duration)}</span>
                  <span>•</span>
                  <span>{fileData.format.toUpperCase()}</span>
                </div>
              </div>

              <button
                onClick={clearFile}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSelectFile}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary hover:bg-secondary/50"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="font-medium">Click to select audio file</p>
              <p className="text-sm text-muted-foreground">Select from your computer</p>
            </button>
          )}
        </div>

        {/* Basic Info */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">Sample Information</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input
                type="text"
                placeholder="e.g., Punchy Kick 01"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe your sample..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Genre *</label>
                <select
                  value={formData.genre}
                  onChange={(e) => updateFormData('genre', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select genre</option>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">BPM (optional)</label>
                <input
                  type="number"
                  placeholder="120"
                  value={formData.bpm}
                  onChange={(e) => updateFormData('bpm', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Key (optional)</label>
                <input
                  type="text"
                  placeholder="C Minor"
                  value={formData.key}
                  onChange={(e) => updateFormData('key', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & License */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">Pricing & License</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Price (credits) *</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={formData.creditPrice}
                onChange={(e) => updateFormData('creditPrice', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                1 credit = $1 USD. Recommended: 3-10 credits for individual samples.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">License Type</label>
              <div className="space-y-2">
                {LICENSE_TYPES.map((license) => (
                  <button
                    key={license.value}
                    onClick={() => updateFormData('licenseType', license.value)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      formData.licenseType === license.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                        formData.licenseType === license.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {formData.licenseType === license.value && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{license.label}</p>
                      <p className="text-xs text-muted-foreground">{license.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 font-medium">Tags</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Add tags to help buyers find your sample
          </p>

          <div className="flex gap-2">
            <input
              placeholder="Add tag (e.g., punchy, analog)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={addTag}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add to Pack (optional) */}
        {packs && packs.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Add to Pack (optional)</h3>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Optionally add this sample to an existing pack
            </p>

            <select
              value={selectedPackId || ''}
              onChange={(e) => setSelectedPackId(e.target.value || null)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Don't add to any pack</option>
              {packs.map((pack) => (
                <option key={pack._id} value={pack._id}>
                  {pack.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handlePublish(true)}
            disabled={!canPublish || isPublishing || isUploading}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              'Save as Draft'
            )}
          </button>
          <button
            onClick={() => handlePublish(false)}
            disabled={!canPublish || isPublishing || isUploading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publish Sample
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// My Samples Manager Component
import {
  Eye,
  EyeOff,
  Trash2,
  Search,
  FolderOpen
} from 'lucide-react'

interface ManagedSample {
  _id: Id<'audioSamples'>
  title: string
  genre?: string
  category?: string
  duration?: number
  bpm?: number
  key?: string
  creditPrice?: number
  isPublished?: boolean
  downloadCount?: number
  _creationTime: number
}

function MySamplesManager({ storeId }: { storeId: string | undefined }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null) // Track which sample is loading

  // Get user's samples
  const samples = useQuery(
    api.samples.getStoreSamples,
    storeId ? { storeId } : 'skip'
  ) as ManagedSample[] | undefined

  // Mutations
  const togglePublish = useMutation(api.samples.toggleSamplePublish)
  const deleteSample = useMutation(api.samples.deleteSample)

  // Clear messages after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Filter samples
  const filteredSamples = samples?.filter((sample) => {
    const matchesSearch = !searchQuery ||
      sample.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.category?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && sample.isPublished) ||
      (filterStatus === 'draft' && !sample.isPublished)

    return matchesSearch && matchesStatus
  })

  const handleTogglePublish = async (sampleId: Id<'audioSamples'>) => {
    setIsLoading(sampleId)
    try {
      const result = await togglePublish({ sampleId })
      setSuccess(result.isPublished ? 'Sample published!' : 'Sample unpublished')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sample')
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async (sampleId: Id<'audioSamples'>, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }
    setIsLoading(sampleId)
    try {
      await deleteSample({ sampleId })
      setSuccess('Sample deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sample')
    } finally {
      setIsLoading(null)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Header with filters */}
      <div className="flex items-center gap-4 p-4">
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

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>

        {/* Sample count */}
        <span className="text-sm text-muted-foreground">
          {filteredSamples?.length ?? 0} sample{(filteredSamples?.length ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Samples list */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {samples === undefined ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSamples?.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Music className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-medium">
              {samples.length === 0 ? 'No samples uploaded yet' : 'No matching samples'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {samples.length === 0
                ? 'Go to the Upload tab to add your first sample'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_80px_80px_100px_120px] gap-4 border-b border-border p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Title</span>
              <span>Genre</span>
              <span>BPM</span>
              <span>Duration</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Sample rows */}
            <div className="divide-y divide-border">
              {filteredSamples?.map((sample) => (
                <div
                  key={sample._id}
                  className="grid grid-cols-[1fr_100px_80px_80px_100px_120px] gap-4 items-center p-3 hover:bg-secondary/30"
                >
                  {/* Title & category */}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{sample.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sample.category || 'Uncategorized'} • {formatDate(sample._creationTime)}
                    </p>
                  </div>

                  {/* Genre */}
                  <span className="text-sm text-muted-foreground truncate">
                    {sample.genre || '-'}
                  </span>

                  {/* BPM */}
                  <span className="text-sm text-muted-foreground">
                    {sample.bpm || '-'}
                  </span>

                  {/* Duration */}
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(sample.duration)}
                  </span>

                  {/* Status badge */}
                  <div>
                    {sample.isPublished ? (
                      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-yellow-500" />
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleTogglePublish(sample._id)}
                      disabled={isLoading === sample._id}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                      title={sample.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {isLoading === sample._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : sample.isPublished ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(sample._id, sample.title)}
                      disabled={isLoading === sample._id}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Packs Manager Component

interface Pack {
  _id: Id<'samplePacks'>
  _creationTime: number
  name: string
  description: string
  coverImageUrl?: string
  creditPrice: number
  totalSamples: number
  isPublished: boolean
  genres: string[]
  sampleIds: Id<'audioSamples'>[]
}

interface Sample {
  _id: Id<'audioSamples'>
  title: string
  genre?: string
  category?: string
  duration?: number
  bpm?: number
  key?: string
}

type PackViewMode = 'list' | 'detail' | 'create'

const PACK_GENRES = [
  'Hip Hop', 'Trap', 'R&B', 'Pop', 'Electronic', 'House',
  'Techno', 'Drum & Bass', 'Lo-Fi', 'Afrobeats', 'Drill'
]

function PacksManager({ storeId }: { storeId: string | undefined }) {
  const [viewMode, setViewMode] = useState<PackViewMode>('list')
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get packs for the store
  const packs = useQuery(
    api.samplePacks.getPacksByStore,
    storeId ? { storeId } : 'skip'
  ) as Pack[] | undefined

  // Get user's samples for adding to packs
  const samples = useQuery(
    api.samples.getStoreSamples,
    storeId ? { storeId } : 'skip'
  ) as Sample[] | undefined

  // Clear messages after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const handleSelectPack = (pack: Pack) => {
    setSelectedPack(pack)
    setViewMode('detail')
  }

  const handleBack = () => {
    setViewMode('list')
    setSelectedPack(null)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {viewMode === 'list' && (
        <PackListView
          packs={packs}
          onSelectPack={handleSelectPack}
          onCreateNew={() => setViewMode('create')}
        />
      )}

      {viewMode === 'detail' && selectedPack && (
        <PackDetailView
          pack={selectedPack}
          samples={samples}
          onBack={handleBack}
          onSuccess={setSuccess}
          onError={setError}
        />
      )}

      {viewMode === 'create' && storeId && (
        <CreatePackView
          storeId={storeId}
          onBack={handleBack}
          onSuccess={(msg) => {
            setSuccess(msg)
            setViewMode('list')
          }}
          onError={setError}
        />
      )}
    </div>
  )
}

function PackListView({
  packs,
  onSelectPack,
  onCreateNew
}: {
  packs: Pack[] | undefined
  onSelectPack: (pack: Pack) => void
  onCreateNew: () => void
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <p className="text-sm text-muted-foreground">
          Create and manage your sample packs
        </p>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Pack
        </button>
      </div>

      {/* Pack Grid */}
      <div className="flex-1 overflow-auto p-4 pt-0">
        {packs === undefined ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : packs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-medium">No packs yet</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first sample pack to bundle your samples together
            </p>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Pack
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <button
                key={pack._id}
                onClick={() => onSelectPack(pack)}
                className="flex flex-col rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="mb-3 aspect-video w-full overflow-hidden rounded-lg bg-secondary">
                  {pack.coverImageUrl ? (
                    <img
                      src={pack.coverImageUrl}
                      alt={pack.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{pack.name}</h3>
                    {pack.isPublished ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{pack.totalSamples} samples</span>
                  <span className="font-medium text-foreground">{pack.creditPrice} credits</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PackDetailView({
  pack,
  samples,
  onBack,
  onSuccess,
  onError
}: {
  pack: Pack
  samples: Sample[] | undefined
  onBack: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [isAddingSamples, setIsAddingSamples] = useState(false)
  const [selectedSampleIds, setSelectedSampleIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addSamplesToPack = useMutation(api.samplePacks.addSamplesToPack)
  const removeSampleFromPack = useMutation(api.samplePacks.removeSampleFromPack)
  const togglePublish = useMutation(api.samplePacks.togglePackPublish)

  const packData = useQuery(api.samplePacks.getPackWithSamples, { packId: pack._id })

  const availableSamples = samples?.filter(
    (s) => !pack.sampleIds.includes(s._id)
  ) || []

  const filteredSamples = availableSamples.filter(
    (s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleTogglePublish = async () => {
    setIsLoading(true)
    try {
      const result = await togglePublish({ packId: pack._id })
      onSuccess(result.isPublished ? 'Pack published!' : 'Pack unpublished')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update pack')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSamples = async () => {
    if (selectedSampleIds.size === 0) return
    setIsLoading(true)
    try {
      const sampleIds = Array.from(selectedSampleIds) as Id<'audioSamples'>[]
      await addSamplesToPack({ packId: pack._id, sampleIds })
      onSuccess(`Added ${sampleIds.length} sample(s) to pack`)
      setSelectedSampleIds(new Set())
      setIsAddingSamples(false)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add samples')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSample = async (sampleId: Id<'audioSamples'>) => {
    setIsLoading(true)
    try {
      await removeSampleFromPack({ packId: pack._id, sampleId })
      onSuccess('Sample removed from pack')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to remove sample')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSampleSelection = (sampleId: string) => {
    const newSelection = new Set(selectedSampleIds)
    if (newSelection.has(sampleId)) {
      newSelection.delete(sampleId)
    } else {
      newSelection.add(sampleId)
    }
    setSelectedSampleIds(newSelection)
  }

  return (
    <>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-medium">{pack.name}</h2>
            <p className="text-sm text-muted-foreground">
              {pack.totalSamples} samples • {pack.creditPrice} credits
            </p>
          </div>
        </div>
        <button
          onClick={handleTogglePublish}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
            pack.isPublished
              ? 'border border-input bg-background hover:bg-secondary'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {pack.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {pack.isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 pt-0">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-medium">Samples</span>
            {!isAddingSamples && (
              <button
                onClick={() => setIsAddingSamples(true)}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            )}
          </div>

          {isAddingSamples && (
            <div className="border-b border-border bg-secondary/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Select samples</span>
                <button onClick={() => { setIsAddingSamples(false); setSelectedSampleIds(new Set()) }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <div className="max-h-40 overflow-auto rounded-lg border bg-background">
                {filteredSamples.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    {availableSamples.length === 0 ? 'All samples in pack' : 'No matches'}
                  </div>
                ) : (
                  filteredSamples.map((sample) => (
                    <button
                      key={sample._id}
                      onClick={() => toggleSampleSelection(sample._id)}
                      className={`flex w-full items-center gap-2 border-b p-2 text-left text-sm last:border-0 ${selectedSampleIds.has(sample._id) ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
                    >
                      <div className={`flex h-4 w-4 items-center justify-center rounded border ${selectedSampleIds.has(sample._id) ? 'border-primary bg-primary text-white' : ''}`}>
                        {selectedSampleIds.has(sample._id) && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{sample.title}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={handleAddSamples}
                disabled={selectedSampleIds.size === 0 || isLoading}
                className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Add {selectedSampleIds.size} Sample{selectedSampleIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          <div className="divide-y">
            {packData?.samples && packData.samples.length > 0 ? (
              packData.samples.map((sample: Sample) => (
                <div key={sample._id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sample.title}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSample(sample._id)}
                    disabled={isLoading}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No samples yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function CreatePackView({
  storeId,
  onBack,
  onSuccess,
  onError
}: {
  storeId: string
  onBack: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    creditPrice: '10',
    genres: [] as string[],
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')

  const createPack = useMutation(api.samplePacks.createSamplePack)

  const toggleGenre = (genre: string) => {
    const newGenres = formData.genres.includes(genre)
      ? formData.genres.filter((g) => g !== genre)
      : [...formData.genres, genre]
    setFormData(prev => ({ ...prev, genres: newGenres }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.description || formData.genres.length === 0) {
      onError('Please fill in all required fields')
      return
    }
    setIsCreating(true)
    try {
      await createPack({
        storeId,
        name: formData.name,
        description: formData.description,
        creditPrice: parseInt(formData.creditPrice) || 10,
        genres: formData.genres,
        categories: [],
        tags: formData.tags
      })
      onSuccess('Pack created!')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create pack')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4">
        <button onClick={onBack} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="font-medium">Create Pack</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 pt-0">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input
              type="text"
              placeholder="Pack name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description *</label>
            <textarea
              placeholder="Describe your pack"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price (credits)</label>
            <input
              type="number"
              value={formData.creditPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, creditPrice: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Genres *</label>
            <div className="flex flex-wrap gap-2">
              {PACK_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`rounded-full px-3 py-1 text-sm ${formData.genres.includes(genre) ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <input
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              <button onClick={addTag} className="rounded-lg border px-3 py-2 hover:bg-secondary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-sm">
                    {tag}
                    <button onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t p-4">
        <button
          onClick={handleCreate}
          disabled={!formData.name || !formData.description || formData.genres.length === 0 || isCreating}
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Pack'}
        </button>
      </div>
    </>
  )
}
