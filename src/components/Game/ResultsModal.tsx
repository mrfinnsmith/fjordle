'use client'

import { GameState, UserStats } from '@/types/game'
import { useState } from 'react'
import { useLanguage } from '@/lib/languageContext'
import { formatDistance } from '@/lib/utils'
import { useFocusTrap } from '@/lib/useFocusTrap'

interface ResultsModalProps {
  gameState: GameState
  userStats: UserStats
  locationData: { municipalities: string[], counties: string[] }
  isOpen: boolean
  onClose: () => void
}

export default function ResultsModal({ gameState, userStats, locationData, isOpen, onClose }: ResultsModalProps) {
  const { t, language } = useLanguage()
  const resultsModalRef = useFocusTrap(isOpen)
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)

  if (!isOpen || !gameState.puzzle) return null

  const winPercentage = userStats.gamesPlayed > 0
    ? Math.round((userStats.gamesWon / userStats.gamesPlayed) * 100)
    : 0

  const formatProximitySquares = (proximityPercent: number, isCorrect: boolean) => {
    if (isCorrect) {
      return '🟩🟩🟩🟩🟩🎯'
    }

    const rounded = Math.floor(proximityPercent / 10) * 10
    const greenSquares = Math.floor(rounded / 20)
    const yellowSquares = (rounded % 20) >= 10 ? 1 : 0
    const blackSquares = 5 - greenSquares - yellowSquares

    return '🟩'.repeat(greenSquares) + '🟨'.repeat(yellowSquares) + '⬛'.repeat(blackSquares)
  }

  const getCurrentDate = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return `${day}.${month}.${year}`
  }

  const generateResultText = () => {
    if (!gameState.puzzle) return ''

    const attempts = gameState.guesses.length
    const maxAttempts = 6
    const resultScore = gameState.gameStatus === "won" ? `${attempts}/${maxAttempts}` : `X/${maxAttempts}`
    const percentage = gameState.gameStatus === "won" ? '(100%)' : '(0%)'
    const currentDate = getCurrentDate()

    const guessLines = gameState.guesses.map(guess => {
      const squares = formatProximitySquares(guess.proximityPercent, guess.isCorrect)
      return squares + (guess.isCorrect ? '' : guess.direction)
    }).join('\n')

    return `#Fjordle #${gameState.puzzle.puzzle_number} (${currentDate}) ${resultScore} ${percentage}\n🔥 ${t('current_streak_label')}: ${userStats.currentStreak} ${t('days')}\n${guessLines}\n\n${process.env.NEXT_PUBLIC_SITE_URL}`
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

  const openGoogleMaps = () => {
    if (!gameState.puzzle) return
    const { center_lat, center_lng } = gameState.puzzle.fjord
    const url = `https://www.google.com/maps/@${center_lat},${center_lng},11z`
    window.open(url, '_blank')
  }

  const wikipediaUrl = language === 'no'
    ? gameState.puzzle.fjord.wikipedia_url_no
    : gameState.puzzle.fjord.wikipedia_url_en;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 results-modal-backdrop flex items-center justify-center z-50 p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }}
    >
      <div
        ref={resultsModalRef}
        className="bg-white rounded-lg p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto results-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="results-modal-title"
        aria-describedby="results-modal-description"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          aria-label={t('a11y_close_modal')}
        >
          ×
        </button>

        <div className="text-center">
          <h2 id="results-modal-title" className="text-2xl font-bold mb-4 page-text">
            {gameState.gameStatus === "won" ? t('congratulations') : t('next_time')}
          </h2>
          <div id="results-modal-description" className="sr-only">
            {t('a11y_results_modal')}
          </div>

          {gameState.gameStatus === "won" && (
            <div className="mb-4">
              <p className="text-lg page-text">
                {gameState.guesses.length === 1
                  ? t('guessed_in_attempt')
                  : t('guessed_in_attempts_plural').replace('{count}', gameState.guesses.length.toString())
                }
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 page-text">
              {t('the_answer_was')}: <span className="font-semibold">{gameState.puzzle.fjord.name}</span>
            </p>

            {/* Location Information */}
            {(locationData.municipalities.length > 0 || locationData.counties.length > 0) && (
              <div className="mt-2 text-xs text-gray-500">
                {locationData.municipalities.length > 0 && (
                  <div className="mb-1">
                    <span className="font-medium">{t('municipalities')}:</span> {locationData.municipalities.join(', ')}
                  </div>
                )}
                {locationData.counties.length > 0 && (
                  <div>
                    <span className="font-medium">{t('counties')}:</span> {locationData.counties.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Measurements Information */}
            {(gameState.puzzle.fjord.length_km || gameState.puzzle.fjord.width_km || gameState.puzzle.fjord.depth_m) && (
              <div className="mt-2 text-xs text-gray-500">
                <div className="font-medium">
                  {t('measurements_hint')}: {(() => {
                    const parts = []
                    if (gameState.puzzle.fjord.length_km) {
                      if (language === 'no') {
                        // Norwegian format: "1,5 km lengde" (comma as decimal separator, no colon)
                        const formattedLength = gameState.puzzle.fjord.length_km.toString().replace('.', ',')
                        parts.push(`${formattedLength} km ${t('length')}`)
                      } else {
                        // English format: "1.5 km length" (period as decimal separator, no colon)
                        parts.push(`${gameState.puzzle.fjord.length_km} km ${t('length')}`)
                      }
                    }
                    if (gameState.puzzle.fjord.width_km) {
                      if (language === 'no') {
                        const formattedWidth = gameState.puzzle.fjord.width_km.toString().replace('.', ',')
                        parts.push(`${formattedWidth} km ${t('width')}`)
                      } else {
                        parts.push(`${gameState.puzzle.fjord.width_km} km ${t('width')}`)
                      }
                    }
                    if (gameState.puzzle.fjord.depth_m) {
                      if (language === 'no') {
                        const formattedDepth = gameState.puzzle.fjord.depth_m.toString().replace('.', ',')
                        parts.push(`${formattedDepth} m ${t('depth')}`)
                      } else {
                        parts.push(`${gameState.puzzle.fjord.depth_m} m ${t('depth')}`)
                      }
                    }
                    return parts.join(', ')
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Guess History Table */}
          {gameState.guesses.length > 0 && (
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 page-text text-left">{t('your_guesses')}</h3>
                <div className="space-y-2">
                  {gameState.guesses.map((guess, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded border text-sm"
                    >
                      <div className="flex-1 text-left font-medium">
                        {guess.fjordName}
                      </div>
                      {!guess.isCorrect ? (
                        <>
                          <div className="w-16 text-center">
                            {formatDistance(guess.distance, language)}
                          </div>
                          <div className="w-8 text-center text-lg">
                            {guess.direction}
                          </div>
                          <div className="w-12 text-center font-medium">
                            {guess.proximityPercent}%
                          </div>
                        </>
                      ) : (
                        <div className="text-lg">
                          🎯
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2 page-text">{t('statistics')}</h3>
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
            <div className="flex gap-2">
              <button
                onClick={openGoogleMaps}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>🗺️</span>
                <span>Google Maps</span>
              </button>
              {wikipediaUrl && (
                <a
                  href={wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 link-button"
                >
                  <span>📖</span>
                  <span>Wikipedia</span>
                </a>
              )}
            </div>

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
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}