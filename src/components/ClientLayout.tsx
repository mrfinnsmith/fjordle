'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import NavigationMenu from '@/components/NavigationMenu'
import { useLanguage } from '@/lib/languageContext'
import DebugInfo from './DebugInfo'

function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setLanguage('no')}
        className={`text-2xl ${language === 'no' ? 'opacity-100' : 'opacity-50'}`}
        title="Norsk"
      >
        🇳🇴
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`text-2xl ${language === 'en' ? 'opacity-100' : 'opacity-50'}`}
        title="English"
      >
        🇬🇧
      </button>
    </div>
  )
}

function Header() {
  return (
    <header className="mb-6">
      <div className="flex justify-end items-center space-x-2 mb-4">
        <NavigationMenu />
        <LanguageToggle />
      </div>
      <div className="text-center">
        <Link href="/" className="block">
          <h1 className="text-4xl font-bold page-text mb-1">
            Fjordle
          </h1>
        </Link>
      </div>
    </header>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  console.log('[DEBUG] ClientLayout - router:', router)
  console.log('[DEBUG] ClientLayout - pathname:', pathname)

  useEffect(() => {
    console.log('[DEBUG] ClientLayout mounted')
    console.log('[DEBUG] Router available:', !!router)
    console.log('[DEBUG] Router push available:', typeof router?.push)
    console.log('[DEBUG] Current pathname:', pathname)
    if (typeof window !== 'undefined') {
      console.log('[DEBUG] Window location:', window.location.href)
    }

    // Test router functionality
    const testRouter = () => {
      try {
        console.log('[DEBUG] Testing router.push with current path')
        router.push(pathname)
        console.log('[DEBUG] Router test completed')
      } catch (error) {
        console.error('[DEBUG] Router test failed:', error)
      }
    }

    setTimeout(testRouter, 1000)
  }, [router, pathname])

  // Debug browser events
  useEffect(() => {
    const handleClick = (e: Event) => {
      console.log('[DEBUG] Global click event:', e.target)
      console.log('[DEBUG] Event details:', {
        type: e.type,
        target: e.target,
        currentTarget: e.currentTarget,
        defaultPrevented: e.defaultPrevented
      })
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('[DEBUG] Before unload event:', e)
    }

    const handlePopstate = (e: PopStateEvent) => {
      console.log('[DEBUG] Popstate event:', e)
      if (typeof window !== 'undefined') {
        console.log('[DEBUG] URL changed to:', window.location.href)
      }
    }

    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleClick, true)
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('popstate', handlePopstate)

      return () => {
        document.removeEventListener('click', handleClick, true)
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('popstate', handlePopstate)
      }
    }
  }, [])

  // Always render the full app immediately
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Header />
      <main>
        {children}
      </main>
      {process.env.NODE_ENV === 'development' && <DebugInfo />}
    </div>
  )
} 