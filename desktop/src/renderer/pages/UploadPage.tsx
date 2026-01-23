import { useState, useRef, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useNavigate } from 'react-router-dom'
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
  FileAudio
} from 'lucide-react'

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

export function UploadPage() {
  const navigate = useNavigate()
  const { user } = useUser()
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

  // Get user's store
  const stores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : 'skip')
  const primaryStore = stores?.[0]

  // Mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createSample = useMutation(api.samples.createSample)

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
    if (!primaryStore) {
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

      const { storageId } = await uploadResult.json()
      setIsUploading(false)

      // Create sample in database
      await createSample({
        storeId: primaryStore._id,
        title: formData.title,
        description: formData.description || undefined,
        storageId: storageId,
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

      setSuccess(asDraft ? 'Sample saved as draft!' : 'Sample uploaded successfully!')

      // Reset form
      clearFile()
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
    primaryStore
  )

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
    <div className="flex h-full flex-col overflow-auto">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Upload Sample</h1>
            <p className="text-sm text-muted-foreground">
              Create an individual sample to sell on the marketplace
            </p>
          </div>
        </div>
      </div>

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
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4">
        <div className="flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Cancel
          </button>
          <div className="flex gap-3">
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
                  <Music className="h-4 w-4" />
                  Publish Sample
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
