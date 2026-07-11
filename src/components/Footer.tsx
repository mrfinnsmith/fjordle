'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { navLinks } from '@/lib/navLinks'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="mt-12 pt-8 border-t border-gray-200">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t(link.labelKey)}
          </Link>
        ))}
      </nav>
      <div className="text-center text-xs text-gray-500">
        © {new Date().getFullYear()} <span translate="no">Fjordle</span>
      </div>
    </footer>
  )
}
