'use client'

import Link from 'next/link'
import NavigationMenu from '@/components/NavigationMenu'
import { useLanguage } from '@/lib/languageContext'
import { useFormattedDate } from '@/lib/useFormattedDate'
import { shouldUseEmojiFallback } from '@/lib/platformDetection'
import DebugInfo from './DebugInfo'

function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const useFallback = shouldUseEmojiFallback()

  if (useFallback) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setLanguage('no')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'no' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="Norsk"
        >
          Norsk
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'en' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          title="English"
        >
          English
        </button>
      </div>
    )
  }

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
  const { language } = useLanguage()
  const formattedDate = useFormattedDate(language)

  return (
    <header className="mb-6">
      {/* Mobile layout */}
      <div className="md:hidden">
        <div className="flex justify-end items-center space-x-2 mb-4">
          <NavigationMenu />
          <LanguageToggle />
        </div>
        <div className="text-center">
          <Link href="/" className="block">
            <h1 className="text-4xl font-bold page-text mb-1 fjordle-title">
              Fjordle
            </h1>
          </Link>
        </div>
        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex md:items-center md:justify-between md:mb-4">
        <div className="text-gray-600 text-sm">
          {formattedDate}
        </div>
        <div className="text-center">
          <Link href="/" className="block">
            <h1 className="text-4xl font-bold page-text fjordle-title">
              Fjordle
            </h1>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <NavigationMenu />
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
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