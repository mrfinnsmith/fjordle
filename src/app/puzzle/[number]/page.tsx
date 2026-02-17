import { Metadata } from 'next'
import PuzzlePageClient from './PuzzlePageClient'

export const metadata: Metadata = {
    robots: { index: false, follow: true },
}

interface PuzzlePageProps {
    params: { number: string }
}

export default function PuzzlePage({ params }: PuzzlePageProps) {
    return <PuzzlePageClient number={params.number} />
}
