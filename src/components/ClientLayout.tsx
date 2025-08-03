'use client'

import Link from 'next/link'
import NavigationMenu from '@/components/NavigationMenu'
import { useLanguage } from '@/lib/languageContext'

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
  const { mounted } = useLanguage()

  // Don't render language-dependent content until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold page-text mb-1">Fjordle</h1>
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Header />
      <main>
        {children}
      </main>
    </div>
  )
} 