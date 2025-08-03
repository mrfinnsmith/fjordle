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

  console.log('[DEBUG] NavigationMenu render - router object:', router)
  console.log('[DEBUG] NavigationMenu render - router type:', typeof router)
  console.log('[DEBUG] NavigationMenu render - router keys:', Object.keys(router || {}))
  console.log('[DEBUG] NavigationMenu render - isOpen:', isOpen)

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
    console.log('[DEBUG] handleNavigation called with path:', path)
    console.log('[DEBUG] typeof router:', typeof router)
    console.log('[DEBUG] router object:', router)
    console.log('[DEBUG] router.push exists:', typeof router?.push)
    console.log('[DEBUG] window.location before:', window.location.href)
    
    try {
      console.log('[DEBUG] About to call router.push with:', path)
      router.push(path)
      console.log('[DEBUG] router.push call completed')
      
      // Check if URL changed after a delay
      setTimeout(() => {
        console.log('[DEBUG] URL after 100ms:', window.location.href)
      }, 100)
      
      setTimeout(() => {
        console.log('[DEBUG] URL after 500ms:', window.location.href)
      }, 500)
      
    } catch (error) {
      console.error('[DEBUG] Error in router.push:', error)
      console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    }
  }

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    console.log('[DEBUG] Link clicked - path:', path)
    console.log('[DEBUG] Event object:', e)
    console.log('[DEBUG] Event type:', e.type)
    console.log('[DEBUG] Event target:', e.target)
    console.log('[DEBUG] Event currentTarget:', e.currentTarget)
    console.log('[DEBUG] Default prevented?:', e.defaultPrevented)
    
    e.preventDefault()
    console.log('[DEBUG] preventDefault called')
    
    handleNavigation(path)
    setIsOpen(false)
    console.log('[DEBUG] Menu closed')
  }

  const navigationLinks = [
    { href: '/past', label: t('past_fjordles') },
    { href: '/about', label: t('about') },
    { href: '/how-to-play', label: t('how_to_play') },
    { href: '/privacy', label: t('privacy') }
  ]

  console.log('[DEBUG] NavigationMenu navigationLinks:', navigationLinks)

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => {
          console.log('[DEBUG] Menu button clicked, current isOpen:', isOpen)
          setIsOpen(!isOpen)
          console.log('[DEBUG] Menu button clicked, new isOpen:', !isOpen)
        }}
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
