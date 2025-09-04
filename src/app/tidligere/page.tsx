'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { formatDate } from '@/lib/utils'
import LoadingSpinner from '@/components/Game/LoadingSpinner'

interface PastPuzzle {
    puzzle_id: number
    puzzle_number: number
    fjord_name: string
    date: string
    difficulty_tier: number | null
}

interface FormattedPuzzle extends PastPuzzle {
    formattedDate: string
}

export default function PastPuzzlesPage() {
    const { t, language } = useLanguage()
    const router = useRouter()
    const [puzzles, setPuzzles] = useState<PastPuzzle[]>([])
    const [formattedPuzzles, setFormattedPuzzles] = useState<FormattedPuzzle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const getDifficultyBadge = (tier: number | null) => {
        if (tier === 1) return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{t('difficulty')}: {t('easy')}</span>
        if (tier === 2) return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">{t('difficulty')}: {t('medium')}</span>
        if (tier === 3) return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">{t('difficulty')}: {t('hard')}</span>
        return null
    }

    console.log('[DEBUG] PastPuzzlesPage render - router:', router)
    console.log('[DEBUG] PastPuzzlesPage render - language:', language)
    console.log('[DEBUG] PastPuzzlesPage render - puzzles count:', puzzles.length)
    console.log('[DEBUG] PastPuzzlesPage render - formatted puzzles count:', formattedPuzzles.length)

    useEffect(() => {
        console.log('[DEBUG] PastPuzzlesPage mounted')
        console.log('[DEBUG] Router in PastPuzzlesPage:', router)
        if (typeof window !== 'undefined') {
            console.log('[DEBUG] Current URL:', window.location.href)
        }
    }, [router])

    useEffect(() => {
        const fetchPuzzles = async () => {
            console.log('[DEBUG] Fetching past puzzles...')
            try {
                const response = await fetch('/api/past-puzzles')
                if (!response.ok) {
                    throw new Error('Failed to fetch puzzles')
                }
                const data = await response.json()
                console.log(`[DEBUG] Past puzzles fetched: ${data.length} puzzles`)
                setPuzzles(data)
            } catch (err) {
                console.error('[DEBUG] Error fetching puzzles:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                console.log('[DEBUG] Past puzzles loading completed')
                setLoading(false)
            }
        }

        fetchPuzzles()
    }, [])

    // Format dates when language or puzzles change
    useEffect(() => {
        if (puzzles.length > 0) {
            console.log('[DEBUG] Formatting puzzle dates with language:', language)
            const formatted = puzzles.map(puzzle => ({
                ...puzzle,
                formattedDate: formatDate(new Date(puzzle.date), language)
            }))
            console.log(`[DEBUG] Formatted ${formatted.length} puzzles`)
            setFormattedPuzzles(formatted)
        }
    }, [puzzles, language])

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">{t('past_fjordles')}</h1>
                <div className="flex flex-col items-center justify-center py-8">
                    <LoadingSpinner className="w-12 h-12 mb-4" />
                    <div className="text-lg">{t('loading_past_puzzles')}</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">{t('past_fjordles')}</h1>
                <div className="text-center text-red-600">{t('error')}: {error}</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('past_fjordles')}</h1>

            <div className="text-center">
                <Link
                    href="/"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {t('back_to_today')}
                </Link>
            </div>

            <div className="space-y-2">
                {formattedPuzzles.map((puzzle) => (
                    <div key={puzzle.puzzle_number} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div>
                            <h3 className="font-semibold">{t('fjordle_number').replace('{number}', puzzle.puzzle_number.toString())}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600">
                                    {puzzle.formattedDate}
                                </p>
                                {getDifficultyBadge(puzzle.difficulty_tier)}
                            </div>
                        </div>
                        <Link
                            href={`/puzzle/${puzzle.puzzle_number}`}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            {t('play')}
                        </Link>
                    </div>
                ))}
            </div>

            {formattedPuzzles.length === 0 && (
                <div className="text-center text-gray-600">
                    {t('no_past_puzzles')}
                </div>
            )}
        </div>
    )
}