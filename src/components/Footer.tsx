'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'

export default function Footer() {
  const { t } = useLanguage()

  const footerLinks = [
    { href: '/hvordan-spille', label: t('how_to_play') },
    { href: '/om', label: t('about') },
    { href: '/spoersmaal-og-svar', label: t('faq') },
    { href: '/fjord-fakta', label: t('fjord_facts') },
    { href: '/tidligere', label: t('past_fjordles') },
    { href: '/stats', label: t('statistics') },
    { href: '/personvern', label: t('privacy') }
  ]

  return (
    <footer className="mt-12 pt-8 border-t border-gray-200">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Fjordle
      </div>
    </footer>
  )
}
