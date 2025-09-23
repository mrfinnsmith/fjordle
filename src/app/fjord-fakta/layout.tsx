import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fjord Fakta | Lær om Norske Fjorder | Alt om Fjorder i Norge',
  description: 'Lær alt om norske fjorder! Oppdage fakta om Geirangerfjord, Sognefjord, Nærøyfjord og andre kjente fjorder. Lengste, dypeste og mest berømte fjorder i Norge.',
  keywords: 'fjorder i norge, norske fjorder, geirangerfjord, sognefjord, nærøyfjord, fjord fakta, norge geografi, fjorder unesco, lengste fjord norge, dypeste fjord norge, berømte fjorder',
  openGraph: {
    title: 'Fjord Fakta | Lær om Norske Fjorder',
    description: 'Oppdage fascinerende fakta om Norges spektakulære fjorder. Fra UNESCO-fjorder til rekordholding fjorder.',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/fjord-fakta`
  }
}

export default function FjordFactsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}