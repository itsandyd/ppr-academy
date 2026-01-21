import { create } from 'zustand'

export interface Sample {
  id: string
  title: string
  fileUrl: string
  previewUrl?: string
  coverUrl?: string
  bpm?: number
  key?: string
  genre?: string
  duration?: number
  creditPrice?: number
}

type LoopMode = 'none' | 'one' | 'all'

interface PlayerState {
  // Current playback
  currentSample: Sample | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  loopMode: LoopMode

  // Queue
  queue: Sample[]
  queueIndex: number

  // Actions
  playSample: (sample: Sample) => void
  setIsPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setLoopMode: (mode: LoopMode) => void
  toggleLoop: () => void
  playNext: () => void
  playPrevious: () => void
  addToQueue: (sample: Sample) => void
  clearQueue: () => void
  setQueue: (samples: Sample[], startIndex?: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  currentSample: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  loopMode: 'none',
  queue: [],
  queueIndex: -1,

  // Actions
  playSample: (sample) => {
    set({
      currentSample: sample,
      isPlaying: true,
      currentTime: 0,
      duration: 0
    })
  },

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setVolume: (volume) => {
    set({ volume })
    // Persist volume preference
    window.electron.storeSet('playerVolume', volume)
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setLoopMode: (mode) => {
    set({ loopMode: mode })
    window.electron.storeSet('playerLoopMode', mode)
  },

  toggleLoop: () => {
    const { loopMode } = get()
    const modes: LoopMode[] = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(loopMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    set({ loopMode: nextMode })
    window.electron.storeSet('playerLoopMode', nextMode)
  },

  playNext: () => {
    const { queue, queueIndex, loopMode } = get()

    // Loop current track
    if (loopMode === 'one') {
      set({ currentTime: 0, isPlaying: true })
      return
    }

    // Play next in queue
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1
      set({
        currentSample: queue[nextIndex],
        queueIndex: nextIndex,
        isPlaying: true,
        currentTime: 0
      })
    } else if (loopMode === 'all' && queue.length > 0) {
      // Loop back to start of queue
      set({
        currentSample: queue[0],
        queueIndex: 0,
        isPlaying: true,
        currentTime: 0
      })
    }
  },

  playPrevious: () => {
    const { queue, queueIndex, currentTime } = get()
    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 })
      return
    }
    // Otherwise go to previous
    if (queueIndex > 0) {
      const prevIndex = queueIndex - 1
      set({
        currentSample: queue[prevIndex],
        queueIndex: prevIndex,
        isPlaying: true,
        currentTime: 0
      })
    }
  },

  addToQueue: (sample) => {
    const { queue } = get()
    set({ queue: [...queue, sample] })
  },

  clearQueue: () => {
    set({ queue: [], queueIndex: -1 })
  },

  setQueue: (samples, startIndex = 0) => {
    set({
      queue: samples,
      queueIndex: startIndex,
      currentSample: samples[startIndex] || null,
      isPlaying: true,
      currentTime: 0
    })
  }
}))

// Initialize preferences from storage
window.electron.storeGet('playerVolume').then((volume) => {
  if (typeof volume === 'number') {
    usePlayerStore.setState({ volume })
  }
})

window.electron.storeGet('playerLoopMode').then((mode) => {
  if (mode === 'none' || mode === 'one' || mode === 'all') {
    usePlayerStore.setState({ loopMode: mode })
  }
})
