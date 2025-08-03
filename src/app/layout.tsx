import { LanguageProvider } from '@/lib/languageContext'
import ClientLayout from '@/components/ClientLayout'
import './globals.css'

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

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

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
          <ClientLayout>
            {children}
          </ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  )
}