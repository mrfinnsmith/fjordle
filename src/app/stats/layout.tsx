import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Statistikk | Fjordle',
  description:
    'Se din Fjordle-statistikk. Spor fremgang, streaker og spillhistorikk for det daglige fjordpuslespillet.',
  openGraph: {
    title: 'Statistikk | Fjordle',
    description:
      'Se din Fjordle-statistikk. Spor fremgang, streaker og spillhistorikk for det daglige fjordpuslespillet.',
  },
}

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
