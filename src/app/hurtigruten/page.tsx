import { Metadata } from 'next'
import { getCoastalShipPositions } from '@/lib/hurtigrutenApi'
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

export default async function HurtigrutenPage() {
  const ships = await getCoastalShipPositions()

  return <HurtigrutenContent ships={ships} />
}
