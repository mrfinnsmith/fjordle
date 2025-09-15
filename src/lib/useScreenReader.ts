import { useEffect, useRef } from 'react'

export const useScreenReader = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.id = 'screen-reader-announcements'
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    return () => {
      // Cleanup on unmount
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current)
      }
    }
  }, [])

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return

    // Update aria-live attribute if needed
    if (liveRegionRef.current.getAttribute('aria-live') !== priority) {
      liveRegionRef.current.setAttribute('aria-live', priority)
    }

    // Clear and set new message
    liveRegionRef.current.textContent = ''
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message
      }
    }, 10)
  }

  return { announce }
}