import { RefObject, useEffect } from 'react'

// Calls `handler` when a pointer or focus event occurs outside every provided ref.
// Pass one or more refs (e.g. a menu panel and its trigger button) to treat them
// as a single "inside" region.
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  isActive = true
) {
  useEffect(() => {
    if (!isActive) return

    const refList = Array.isArray(refs) ? refs : [refs]

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const isInside = refList.some((ref) => ref.current?.contains(target))
      if (!isInside) {
        handler()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [refs, handler, isActive])
}
