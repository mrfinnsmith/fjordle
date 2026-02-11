import { LanguageProvider } from '@/lib/languageContext'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import { Language } from '@/types/game'
import ClientLayout from '@/components/ClientLayout'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import Script from 'next/script'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read language from cookies on server-side
  let initialLanguage: Language = 'no'

  try {
    initialLanguage = getLanguageFromCookies()
  } catch {
    // Fallback to Norwegian if cookie reading fails
    initialLanguage = 'no'
  }

  return (
    <html lang={initialLanguage}>
      <head>
        <title>Fjordle | Fjord Spill | Gjenkjenn Norske Fjorder Daglig</title>
        <meta name="description" content="Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder." />
        <meta name="keywords" content="fjordspill, wordle norge, norge quiz, geografispill, fjord, fjorder, norske fjorder quiz, fjord gjenkjenning, geografi spill norge, fjordpuslespill, norge geografi, daglig puslespill, fjordle, norsk geografi spill, norgesquiz" />

        <meta property="og:title" content="Fjordle | Fjord Spill | Gjenkjenn Norske Fjorder Daglig" />
        <meta property="og:description" content="Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder." />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`} />
        <meta name="twitter:title" content="Fjordle | Fjord Spill | Gjenkjenn Norske Fjorder Daglig" />
        <meta name="twitter:description" content="Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`} />

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Preload Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />

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
              "inLanguage": initialLanguage,
              "keywords": "fjordspill, wordle norge, norge quiz, geografispill, fjord, fjorder, norske fjorder quiz, fjord gjenkjenning, geografi spill norge, fjordpuslespill, norge geografi, daglig puslespill, fjordle, norsk geografi spill, norgesquiz",
              "image": `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.png`
            })
          }}
        />
      </head>
      <body className="min-h-screen page-container">
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H8KHXYN6MC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H8KHXYN6MC');
            
            // Error tracking
            window.addEventListener('error', function(e) {
              if (typeof gtag !== 'undefined') {
                if (e.target !== window && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
                  // Resource loading error
                  gtag('event', 'resource_load_failed', {
                    'event_category': 'Resource Loading',
                    'event_label': e.target.src || e.target.href,
                    'resource_type': e.target.tagName
                  });
                } else {
                  // JavaScript error
                  gtag('event', 'exception', {
                    'description': e.message + ' at ' + e.filename + ':' + e.lineno,
                    'fatal': false,
                    'user_agent': navigator.userAgent,
                    'page_url': window.location.href
                  });
                }
              }
            }, true);

            window.addEventListener('unhandledrejection', function(e) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'exception', {
                  'description': 'Unhandled Promise Rejection: ' + e.reason,
                  'fatal': false,
                  'user_agent': navigator.userAgent
                });
              }
            });

            // Track browser capabilities
            if (typeof gtag !== 'undefined') {
              gtag('event', 'browser_capabilities', {
                'event_category': 'Environment',
                'webgl_supported': !!window.WebGLRenderingContext,
                'canvas_supported': !!document.createElement('canvas').getContext,
                'local_storage_supported': !!window.localStorage,
                'service_worker_supported': !!navigator.serviceWorker
              });
            }

            // Track page load performance
            window.addEventListener('load', function() {
              if (typeof gtag !== 'undefined') {
                const perfData = performance.getEntriesByType('navigation')[0];
                gtag('event', 'page_load_performance', {
                  'event_category': 'Performance',
                  'dom_complete': perfData.domComplete,
                  'load_complete': perfData.loadEventEnd,
                  'dns_time': perfData.domainLookupEnd - perfData.domainLookupStart
                });
              }
            });
          `}
        </Script>

        <LanguageProvider initialLanguage={initialLanguage}>
          <ClientLayout>
            <PerformanceMonitor />
            {children}
          </ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  )
}