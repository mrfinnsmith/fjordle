'use client'

import GameBoard from '@/components/Game/GameBoard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useLanguage } from '@/lib/languageContext'
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
        <h1 className="sr-only">Fjordle</h1>
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

export default function HomeContent({ puzzle }: { puzzle: Puzzle | null }) {
  if (!puzzle) {
    return <NoPuzzleMessage />
  }

  return (
    <ErrorBoundary>
      <GameContent puzzle={puzzle} />
    </ErrorBoundary>
  )
}
