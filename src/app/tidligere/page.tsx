'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { formatDate } from '@/lib/utils'
import LoadingSpinner from '@/components/Game/LoadingSpinner'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { trackGamePerformance } from '@/lib/performance'

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


    useEffect(() => {
        const fetchPuzzles = async () => {
            const fetchStartTime = performance.now()
            
            try {
                const response = await fetch('/api/past-puzzles')
                if (!response.ok) {
                    throw new Error('Failed to fetch puzzles')
                }
                const data = await response.json()
                setPuzzles(data)
                
                const fetchDuration = performance.now() - fetchStartTime
                trackGamePerformance('past_puzzles_fetch', fetchDuration)
            } catch (err) {
                console.error('Error fetching puzzles:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchPuzzles()
    }, [])

    // Format dates when language or puzzles change - use requestIdleCallback for better LCP
    useEffect(() => {
        if (puzzles.length > 0) {
            const formatStartTime = performance.now()
            
            // Format dates in chunks to avoid blocking the main thread
            const formatInBatches = () => {
                const batchSize = 10
                const formatted: FormattedPuzzle[] = []
                
                const processBatch = (startIndex: number) => {
                    const endIndex = Math.min(startIndex + batchSize, puzzles.length)
                    
                    for (let i = startIndex; i < endIndex; i++) {
                        formatted.push({
                            ...puzzles[i],
                            formattedDate: formatDate(new Date(puzzles[i].date), language)
                        })
                    }
                    
                    // Update state progressively for better perceived performance
                    setFormattedPuzzles([...formatted])
                    
                    if (endIndex < puzzles.length) {
                        // Use setTimeout to yield control back to browser
                        setTimeout(() => processBatch(endIndex), 0)
                    } else {
                        const formatDuration = performance.now() - formatStartTime
                        trackGamePerformance('date_formatting', formatDuration)
                    }
                }
                
                processBatch(0)
            }
            
            // Use requestIdleCallback if available, otherwise setTimeout
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(formatInBatches)
            } else {
                setTimeout(formatInBatches, 0)
            }
        }
    }, [puzzles, language])

    if (loading) {
        return (
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {t('past_fjordles')}
                </h1>
                <div>
                    <Link
                        href="/"
                        className="px-6 py-2 rounded-lg transition-colors norwegian-button"
                    >
                        {t('back_to_today')}
                    </Link>
                </div>

                <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
                
                <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <LoadingSpinner className="w-5 h-5" />
                        <span className="text-sm">{t('loading_past_puzzles')}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {t('past_fjordles')}
                    </h1>
                </div>
                <div className="text-center text-red-600">{t('error')}: {error}</div>
            </>
        )
    }

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {t('past_fjordles')}
                </h1>
            </div>
            <div className="space-y-6">

            <div className="text-center">
                <Link
                    href="/"
                    className="px-6 py-2 rounded-lg transition-colors norwegian-button"
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
        </>
    )
}