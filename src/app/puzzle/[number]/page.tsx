'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import GameBoard from '@/components/Game/GameBoard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Puzzle } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'
import LoadingSpinner from '@/components/Game/LoadingSpinner'

interface PuzzlePageProps {
    params: { number: string }
}

export default function PuzzlePage({ params }: PuzzlePageProps) {
    const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { t } = useLanguage()

    useEffect(() => {
        const fetchPuzzle = async () => {
            try {
                const response = await fetch(`/api/puzzle/${params.number}`)
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(t('no_past_puzzles'))
                    }
                    throw new Error('Failed to fetch puzzle')
                }
                const data = await response.json()
                setPuzzle(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchPuzzle()
    }, [params.number, t])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="flex flex-col items-center justify-center py-8">
                    <LoadingSpinner className="w-12 h-12 mb-4" />
                    <div className="text-lg">{t('loading')}</div>
                </div>
            </div>
        )
    }

    if (error || !puzzle) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="w-full max-w-lg mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">{t('error')}</h1>
                    <p className="mb-6">{error || t('no_past_puzzles')}</p>
                    <Link
                        href="/tidligere"
                        className="px-6 py-2 rounded-lg transition-colors norwegian-button"
                    >
                        {t('past_fjordles')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="w-full max-w-lg mx-auto mb-6">
                <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold">{t('fjordle_number').replace('{number}', puzzle.puzzle_number.toString())}</h1>
                    <p className="text-gray-600">{t('past_fjordles')}</p>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                    <Link
                        href="/"
                        className="px-6 py-2 rounded-lg transition-colors norwegian-button"
                    >
                        {t('back_to_today')}
                    </Link>
                    <Link
                        href="/tidligere"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        {t('past_fjordles')}
                    </Link>
                </div>
            </div>

            <ErrorBoundary>
                <GameBoard puzzle={puzzle} puzzleId={puzzle.id} />
            </ErrorBoundary>
        </div>
    )
}