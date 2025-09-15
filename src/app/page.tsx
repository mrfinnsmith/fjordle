'use client'

import GameBoard from '@/components/Game/GameBoard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getTodaysPuzzle } from '@/lib/puzzleApi'
import { useLanguage } from '@/lib/languageContext'
import { useEffect, useState } from 'react'
import { Puzzle } from '@/types/game'

function NoPuzzleMessage() {
  const { t } = useLanguage()

  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {t('no_puzzle_today')}
      </h2>
      <p className="text-gray-600">
        {t('no_puzzle_message')}
      </p>
    </div>
  )
}

function GameContent({ puzzle }: { puzzle: Puzzle }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-gray-700 mb-4">
          {t('game_description')}
        </p>
      </div>
      <ErrorBoundary>
        <GameBoard puzzle={puzzle} />
      </ErrorBoundary>
    </div>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPuzzle() {
      try {
        const todaysPuzzle = await getTodaysPuzzle()
        setPuzzle(todaysPuzzle)
      } catch (error) {
        console.error('Failed to load puzzle:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPuzzle()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            {t('game_description')}
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm min-h-96">
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return <NoPuzzleMessage />
  }

  return (
    <ErrorBoundary>
      <GameContent puzzle={puzzle} />
    </ErrorBoundary>
  )
}