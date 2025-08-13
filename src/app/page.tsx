'use client'

import GameBoard from '@/components/Game/GameBoard'
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
      <GameBoard puzzle={puzzle} />
    </div>
  )
}

export default function Home() {
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
      <div className="text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!puzzle) {
    return <NoPuzzleMessage />
  }

  return <GameContent puzzle={puzzle} />
}