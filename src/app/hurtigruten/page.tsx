import { Metadata } from 'next'
import { getCoastalShipPositions } from '@/lib/hurtigrutenApi'
import { ROUTE_FJORDS, COASTAL_PORTS } from '@/lib/hurtigrutenData'
import HurtigrutenContent from './HurtigrutenContent'

export const revalidate = 900 // Revalidate every 15 minutes

export const metadata: Metadata = {
  title: 'Hurtigruten Skipssporing | Kystruten Bergen-Kirkenes | Fjordle',
  description: 'Følg Hurtigruten og Havila Kystruten langs norskekysten i sanntid. Se skipsposisjoner, vær, og utforsk fjordene langs ruten fra Bergen til Kirkenes.',
  keywords: 'hurtigruten, hurtigruten skipssporing, kystruten, hurtigruten posisjon, hurtigruten live, havila kystruten, bergen kirkenes, norske fjorder',
  openGraph: {
    title: 'Hurtigruten Skipssporing | Kystruten Bergen-Kirkenes',
    description: 'Følg Hurtigruten og Havila Kystruten langs norskekysten i sanntid. Se skipsposisjoner, vær, og utforsk fjordene langs ruten.',
  },
  alternates: {
    canonical: 'https://fjordle.lol/hurtigruten',
  },
}

function buildJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fjordle.lol'

  const touristRoute = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: 'Hurtigruten Kystruten Bergen\u2013Kirkenes',
    description: 'The Norwegian coastal route from Bergen to Kirkenes, passing through 34 ports and some of Norway\'s most spectacular fjords.',
    touristType: 'Coastal voyage',
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: COASTAL_PORTS.length,
      itemListElement: COASTAL_PORTS.map(port => ({
        '@type': 'ListItem',
        position: port.order,
        item: {
          '@type': 'Place',
          name: port.name,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: port.lat,
            longitude: port.lng,
          },
        },
      })),
    },
  }

  const fjordList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Fjords along the Hurtigruten coastal route',
    numberOfItems: ROUTE_FJORDS.length,
    itemListElement: ROUTE_FJORDS.map((fjord, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'BodyOfWater',
        name: fjord.name,
        url: `${siteUrl}/fjorder/${fjord.slug}`,
      },
    })),
  }

  return [touristRoute, fjordList]
}

export default async function HurtigrutenPage() {
  const ships = await getCoastalShipPositions()
  const jsonLd = buildJsonLd()

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <HurtigrutenContent ships={ships} />
    </>
  )
}
