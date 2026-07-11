'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { useClickOutside } from '@/lib/useClickOutside'
import { navLinks } from '@/lib/navLinks'

export default function NavigationMenu() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setIsOpen(false), [])
  const outsideRefs = useMemo(() => [menuRef, buttonRef], [])
  useClickOutside(outsideRefs, close, isOpen)

  // Close on Escape and return focus to the trigger button.
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      buttonRef.current?.focus()
    }
  }, [])

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((open) => !open)}
        className="text-2xl hover:opacity-70 transition-opacity p-1"
        title="Menu"
        aria-label="Navigation menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        ☰
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] max-w-[calc(100vw-1rem)] z-50"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={close}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
