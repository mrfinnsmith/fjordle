'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PastPuzzle {
    puzzle_id: number
    puzzle_number: number
    fjord_name: string
    date: string
}

export default function PastPuzzlesPage() {
    const [puzzles, setPuzzles] = useState<PastPuzzle[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPuzzles = async () => {
            try {
                const response = await fetch('/api/past-puzzles')
                if (!response.ok) {
                    throw new Error('Failed to fetch puzzles')
                }
                const data = await response.json()
                setPuzzles(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchPuzzles()
    }, [])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4">
                <div className="text-center">Loading past puzzles...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4">
                <div className="text-center text-red-600">Error: {error}</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">Past Fjordles</h1>

            <div className="mb-6 text-center">
                <Link
                    href="/"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Back to Today's Fjordle
                </Link>
            </div>

            <div className="space-y-2">
                {puzzles.map((puzzle) => (
                    <div key={puzzle.puzzle_number} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div>
                            <h3 className="font-semibold">Fjordle #{puzzle.puzzle_number}</h3>
                            <p className="text-sm text-gray-600">
                                {puzzle.fjord_name} • {formatDate(puzzle.date)}
                            </p>
                        </div>
                        <Link
                            href={`/puzzle/${puzzle.puzzle_number}`}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            Play
                        </Link>
                    </div>
                ))}
            </div>

            {puzzles.length === 0 && (
                <div className="text-center text-gray-600">
                    No past puzzles available yet.
                </div>
            )}
        </div>
    )
}