import { useEffect, useRef } from 'react'

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    const container = containerRef.current
    if (!container) return

    // Find all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>
    }

    const focusableElements = getFocusableElements()
    const firstFocusableElement = focusableElements[0]
    const lastFocusableElement = focusableElements[focusableElements.length - 1]

    // Focus the first focusable element
    if (firstFocusableElement) {
      firstFocusableElement.focus()
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab - moving backwards
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault()
          lastFocusableElement?.focus()
        }
      } else {
        // Tab - moving forwards
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault()
          firstFocusableElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}