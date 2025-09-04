import GameBoard from '@/components/Game/GameBoard'
import { getTodaysPuzzle } from '@/lib/puzzleApi'
import { Puzzle } from '@/types/game'
import { Suspense } from 'react'
import LoadingSpinner from '@/components/Game/LoadingSpinner'

function NoPuzzleMessage() {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Ingen puslespill i dag
      </h2>
      <p className="text-gray-600">
        Det er ingen puslespill tilgjengelig for i dag. Prøv igjen senere.
      </p>
    </div>
  )
}

function GameContent({ puzzle }: { puzzle: Puzzle }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-gray-700 mb-4">
          Gjett fjorden ut fra omrisset. Nytt puslespill hver dag!
        </p>
      </div>
      <GameBoard puzzle={puzzle} />
    </div>
  )
}

async function PuzzleLoader() {
  try {
    const puzzle = await getTodaysPuzzle()

    if (!puzzle) {
      return <NoPuzzleMessage />
    }

    return <GameContent puzzle={puzzle} />
  } catch (error) {
    console.error('Failed to load puzzle:', error)
    return <NoPuzzleMessage />
  }
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PuzzleLoader />
    </Suspense>
  )
}