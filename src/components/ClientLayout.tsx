'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
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