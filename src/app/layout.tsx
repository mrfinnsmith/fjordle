import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fjordle - Daily Norwegian Fjord Puzzle',
  description: 'Daily Norwegian fjord puzzle game. Guess the fjord from its distinctive outline shape. New puzzle every day featuring Norwegian geography.',
  keywords: ['fjord puzzle', 'norway geography', 'daily puzzle', 'fjord game', 'norwegian fjords', 'puzzle', 'game', 'geography', 'fjordle'],
  openGraph: {
    title: 'Fjordle - Daily Norwegian Fjord Puzzle',
    description: 'Daily Norwegian fjord puzzle game. Guess the fjord from its distinctive outline shape. New puzzle every day featuring Norwegian geography.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    type: 'website',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Fjordle - Daily Norwegian Fjord Puzzle Game'
      }
    ]
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL} />
      </head>
      <body className="min-h-screen page-container">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <header className="text-center mb-6">
            <Link href="/" className="block">
              <h1 className="text-4xl font-bold page-text mb-1">
                Fjordle
              </h1>
            </Link>
            <nav className="mt-3">
              <Link href="/past" className="page-link hover:underline text-sm mr-4">
                Past Fjordles
              </Link>
              <Link href="/about" className="page-link hover:underline text-sm mr-4">
                About
              </Link>
              <Link href="/how-to-play" className="page-link hover:underline text-sm">
                How to Play
              </Link>
            </nav>
          </header>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}