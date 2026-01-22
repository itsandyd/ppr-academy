import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Repeat1 } from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'

export function AudioPlayer() {
  const {
    currentSample,
    isPlaying,
    volume,
    currentTime,
    duration,
    loopMode,
    setIsPlaying,
    setVolume,
    setCurrentTime,
    setDuration,
    toggleLoop,
    playNext,
    playPrevious
  } = usePlayerStore()

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(false)

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch(console.error)
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentSample])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Update time display
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // If no sample is loaded, show minimal player
  if (!currentSample) {
    return (
      <div className="h-20 shrink-0 border-t border-border bg-card/50">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No sample selected
        </div>
      </div>
    )
  }

  return (
    <div className="h-20 shrink-0 border-t border-border bg-card">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentSample.previewUrl || currentSample.fileUrl}
        loop={loopMode === 'one'}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onEnded={() => {
          if (loopMode === 'one') {
            // Native loop handles this
            return
          }
          setIsPlaying(false)
          playNext()
        }}
      />

      <div className="relative flex h-full items-center px-4">
        {/* Sample info - left */}
        <div className="flex w-48 items-center gap-3">
          {currentSample.coverUrl && (
            <img
              src={currentSample.coverUrl}
              alt={currentSample.title}
              className="h-12 w-12 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {currentSample.title}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {currentSample.bpm && `${currentSample.bpm} BPM`}
              {currentSample.key && ` • ${currentSample.key}`}
            </div>
          </div>
        </div>

        {/* Playback controls - absolutely centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={playPrevious}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 translate-x-0.5" />
                )}
              </button>
              <button
                onClick={playNext}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                onClick={toggleLoop}
                className={`rounded-full p-2 transition-colors ${
                  loopMode !== 'none'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={
                  loopMode === 'none'
                    ? 'Loop off'
                    : loopMode === 'one'
                      ? 'Loop current'
                      : 'Loop all'
                }
              >
                {loopMode === 'one' ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex w-96 items-center gap-2">
              <span className="w-10 text-right text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="w-10 text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Volume control - right */}
        <div className="ml-auto flex w-32 items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value))
              setIsMuted(false)
            }}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-secondary [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
        </div>
      </div>
    </div>
  )
}
