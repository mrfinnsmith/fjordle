'use client'

import { GameState } from '@/types/game'
import { useState } from 'react'
import { getUserStats } from '@/lib/localStorage'

interface ResultsModalProps {
  gameState: GameState
  isOpen: boolean
  onClose: () => void
}

export default function ResultsModal({ gameState, isOpen, onClose }: ResultsModalProps) {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)

  if (!isOpen || !gameState.puzzle) return null

  const userStats = getUserStats()
  const winPercentage = userStats.gamesPlayed > 0
    ? Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100)
    : 0

  const generateShareText = (): string => {
    const { puzzle, guesses, gameStatus } = gameState
    if (!puzzle) return ''

    const attempts = gameStatus === 'won' ? guesses.length : 'X'
    let shareText = `#Fjordle #${puzzle.puzzle_number} ${attempts}/6\n\n`

    guesses.forEach(guess => {
      if (guess.isCorrect) {
        shareText += '🟩\n'
      } else {
        // Use exact proximity percentages
        shareText += `${guess.proximityPercent}%\n`
      }
    })

    // Fill remaining attempts if lost
    if (gameStatus === 'lost') {
      for (let i = guesses.length; i < 6; i++) {
        shareText += '⬜\n'
      }
    }

    shareText += `\n${process.env.NEXT_PUBLIC_SITE_URL}`
    return shareText
  }

  const handleShare = async () => {
    const shareText = generateShareText()
    try {
      await navigator.clipboard.writeText(shareText)
      setShowCopiedMessage(true)
      setTimeout(() => setShowCopiedMessage(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">🇳🇴</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {gameState.gameStatus === 'won' ? 'Congratulations!' : 'Next Time!'}
          </h2>
          {gameState.gameStatus === 'lost' && gameState.puzzle && (
            <p className="text-lg text-gray-600 mb-4">
              The answer was: <strong>{gameState.puzzle.fjord.name}</strong>
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.gamesPlayed}</div>
            <div className="text-sm text-gray-600">Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{winPercentage}</div>
            <div className="text-sm text-gray-600">Win %</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.currentStreak}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{userStats.maxStreak}</div>
            <div className="text-sm text-gray-600">Max Streak</div>
          </div>
        </div>

        <hr className="border-gray-300 mb-6" />

        {/* Guess Pattern */}
        <div className="space-y-2 mb-6">
          {gameState.guesses.map((guess, index) => (
            <div key={index} className="text-center">
              <div className="inline-block px-3 py-1 rounded bg-gray-100">
                {guess.isCorrect ? '🎯' : `${guess.proximityPercent}%`}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleShare}
          className="w-full bg-black text-white py-3 rounded-full font-medium"
        >
          {showCopiedMessage ? 'Copied!' : 'Share Your Results'}
        </button>
      </div>
    </div>
  )
}