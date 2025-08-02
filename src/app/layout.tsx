'use client'

import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/lib/languageContext'
import './globals.css'

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
  const { t } = useLanguage()

  return (
    <header className="flex justify-between items-start mb-6">
      <div className="text-center flex-1">
        <Link href="/" className="block">
          <h1 className="text-4xl font-bold page-text mb-1">
            Fjordle
          </h1>
        </Link>
        <nav className="mt-3">
          <Link href="/past" className="page-link hover:underline text-sm mr-4">
            {t('past_fjordles')}
          </Link>
          <Link href="/about" className="page-link hover:underline text-sm mr-4">
            {t('about')}
          </Link>
          <Link href="/how-to-play" className="page-link hover:underline text-sm mr-4">
            {t('how_to_play')}
          </Link>
          <Link href="/privacy" className="page-link hover:underline text-sm">
            {t('privacy')}
          </Link>
        </nav>
      </div>
      <div className="ml-4">
        <LanguageToggle />
      </div>
    </header>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <head>
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL} />

        <title>Fjordle - Daglig fjordpuslespill</title>
        <meta name="description" content="Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder." />
        <meta name="keywords" content="fjordpuslespill, norge geografi, daglig puslespill, norske fjorder, puslespill, geografi, fjordle" />

        <meta property="og:title" content="Fjordle - Daglig fjordpuslespill" />
        <meta property="og:description" content="Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder." />

        <meta name="twitter:title" content="Fjordle - Daglig fjordpuslespill" />
        <meta name="twitter:description" content="Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`} />

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-H8KHXYN6MC"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-H8KHXYN6MC');
            `,
          }}
        />

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Fjordle",
              "description": "Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder.",
              "url": process.env.NEXT_PUBLIC_SITE_URL,
              "applicationCategory": "Game",
              "operatingSystem": "Web Browser",
              "inLanguage": "no",
              "keywords": "fjord puslespill, norge geografi, daglig puslespill, fjord spill, norske fjorder, puslespill, spill, geografi",
              "image": `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`
            })
          }}
        />
      </head>
      <body className="min-h-screen page-container">
        <LanguageProvider>
          <div className="container mx-auto px-4 py-6 max-w-2xl">
            <Header />
            <main>
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}