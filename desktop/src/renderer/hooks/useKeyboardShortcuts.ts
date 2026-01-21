import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../stores/playerStore'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const {
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    currentSample
  } = usePlayerStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const isMod = e.metaKey || e.ctrlKey

      switch (e.key) {
        // Playback controls
        case ' ':
          e.preventDefault()
          if (currentSample) {
            setIsPlaying(!isPlaying)
          }
          break

        case 'ArrowUp':
          if (!isMod) {
            e.preventDefault()
            playPrevious()
          }
          break

        case 'ArrowDown':
          if (!isMod) {
            e.preventDefault()
            playNext()
          }
          break

        // Navigation
        case 'f':
          if (isMod) {
            e.preventDefault()
            // Focus search input
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
            searchInput?.focus()
          }
          break

        case '1':
          if (isMod) {
            e.preventDefault()
            navigate('/explore')
          }
          break

        case '2':
          if (isMod) {
            e.preventDefault()
            navigate('/library')
          }
          break

        case '3':
          if (isMod) {
            e.preventDefault()
            navigate('/downloads')
          }
          break

        case '4':
          if (isMod) {
            e.preventDefault()
            navigate('/favorites')
          }
          break

        case ',':
          if (isMod) {
            e.preventDefault()
            navigate('/settings')
          }
          break

        case 'Escape':
          // Close modals, clear selection
          const modal = document.querySelector('[role="dialog"]')
          if (modal) {
            const closeBtn = modal.querySelector('button[aria-label="Close"]') as HTMLButtonElement
            closeBtn?.click()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, setIsPlaying, playNext, playPrevious, currentSample, navigate])
}
