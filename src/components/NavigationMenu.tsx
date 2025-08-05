'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/languageContext'

export default function NavigationMenu() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    handleNavigation(path)
  }

  const navigationLinks = [
    { href: '/past', label: t('past_fjordles') },
    { href: '/about', label: t('about') },
    { href: '/how-to-play', label: t('how_to_play') },
    { href: '/privacy', label: t('privacy') }
  ]

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="text-2xl hover:opacity-70 transition-opacity p-1"
        title={t('how_to_play')}
        aria-label={t('how_to_play')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        ❓
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-50"
        >
          {navigationLinks.map((link) => (
            <button
              key={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap text-left w-full"
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}