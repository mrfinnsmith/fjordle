]'use client'

import { GameState } from '@/types/game'
import { useState, useEffect } from 'react'
import { getUserStats } from '@/lib/localStorage'
import { useLanguage } from '@/lib/languageContext'

interface ResultsModalProps {
  gameState: GameState
  isOpen: boolean
  onClose: () => void
}

export default function ResultsModal({ gameState, isOpen, onClose }: ResultsModalProps) {
  const { t } = useLanguage()
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)
  const [userStats, setUserStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: ''
  })

  useEffect(() => {
    // Only access localStorage after component mounts
    setUserStats(getUserStats())
  }, [])

  if (!isOpen || !gameState.puzzle) return null

  const winPercentage = userStats.gamesPlayed > 0
    ? Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100)
    : 0

  const generateResultText = () => {
    if (!gameState.puzzle) return ''

    const attempts = gameState.guesses.length
    const maxAttempts = 6
    const emojiResult = gameState.gameStatus === "won"
      ? '🎯'
      : '❌'

    const guessEmojis = gameState.guesses.map(guess => {
      if (guess.proximityPercent >= 100) return '🎯'
      if (guess.proximityPercent >= 75) return '🔥'
      if (guess.proximityPercent >= 50) return '🟠'
      if (guess.proximityPercent >= 25) return '🟡'
      return '🔵'
    }).join('')

    if (gameState.gameStatus !== "won") {
      for (let i = attempts; i < maxAttempts; i++) {
        // Don't add extra empty squares for failed games
      }
    }

    return `Fjordle #${gameState.puzzle.puzzle_number} ${emojiResult}\n${attempts}/${maxAttempts}\n\n${guessEmojis}\n\n${process.env.NEXT_PUBLIC_SITE_URL}`
  }

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(generateResultText())
      setShowCopiedMessage(true)
      setTimeout(() => setShowCopiedMessage(false), 2000)
    } catch (err) {
      console.error('Failed to copy results:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 page-text">
            {gameState.gameStatus === "won" ? t('congratulations') : t('next_time')}
          </h2>

          {gameState.gameStatus === "won" && (
            <div className="mb-4">
              <p className="text-lg page-text">
                You guessed it in {gameState.guesses.length} attempts!
              </p>
              <p className="text-sm text-gray-600 mt-2 page-text">
                {t('the_answer_was')}: <span className="font-semibold">{gameState.puzzle.fjord.name}</span>
              </p>
            </div>
          )}

          {gameState.gameStatus !== "won" && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 page-text">
                {t('the_answer_was')}: <span className="font-semibold">{gameState.puzzle.fjord.name}</span>
              </p>
            </div>
          )}

          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2 page-text">Statistics</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold page-text">{userStats.gamesPlayed}</div>
                <div className="text-xs text-gray-600 page-text">{t('played')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold page-text">{winPercentage}%</div>
                <div className="text-xs text-gray-600 page-text">{t('win_percent')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold page-text">{userStats.currentStreak}</div>
                <div className="text-xs text-gray-600 page-text">{t('current_streak')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold page-text">{userStats.maxStreak}</div>
                <div className="text-xs text-gray-600 page-text">{t('max_streak')}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={copyResults}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              {showCopiedMessage ? t('copied') : t('share_results')}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors page-text"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}