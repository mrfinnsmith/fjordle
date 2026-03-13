'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { formatDate } from '@/lib/utils'

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

export default function PastPuzzlesList({ puzzles }: { puzzles: PastPuzzle[] }) {
    const { t, language } = useLanguage()
    const [formattedPuzzles, setFormattedPuzzles] = useState<FormattedPuzzle[]>([])

    const getDifficultyBadge = (tier: number | null) => {
        if (tier === 1) return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{t('difficulty')}: {t('easy')}</span>
        if (tier === 2) return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">{t('difficulty')}: {t('medium')}</span>
        if (tier === 3) return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">{t('difficulty')}: {t('hard')}</span>
        return null
    }

    useEffect(() => {
        if (puzzles.length > 0) {
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

                setFormattedPuzzles([...formatted])

                if (endIndex < puzzles.length) {
                    setTimeout(() => processBatch(endIndex), 0)
                }
            }

            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => processBatch(0))
            } else {
                setTimeout(() => processBatch(0), 0)
            }
        }
    }, [puzzles, language])

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

            {puzzles.length === 0 && (
                <div className="text-center text-gray-600">
                    {t('no_past_puzzles')}
                </div>
            )}
            </div>
        </>
    )
}
