'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameState, Puzzle, FjordOption, HintState } from '@/types/game'
import { createInitialGameState, makeGuess } from '@/lib/gameLogic'
import { createSession, getSessionExists, updateSessionHints } from '@/lib/session_api'
import { getAllFjords } from '@/lib/puzzleApi'
import { useLanguage } from '@/lib/languageContext'
import FjordDisplay from './FjordDisplay'
import GuessInput from './GuessInput'
import GuessHistory from './GuessHistory'
import ResultsModal from './ResultsModal'
import { Toast } from './Toast'
import LoadingSpinner from './LoadingSpinner'
import FirstLetterHint from './FirstLetterHint'
import SatelliteHint from './SatelliteHint'
import SatelliteModal from './SatelliteModal'
import { saveGameProgress, loadGameProgress, getOrCreateSessionId, updateUserStats, saveHintsUsed, getHintsUsed } from '@/lib/localStorage'
import { getUserStats } from '@/lib/localStorage'

interface GameBoardProps {
  puzzle: Puzzle
  puzzleId?: number
}

export default function GameBoard({ puzzle, puzzleId }: GameBoardProps) {
  const { t } = useLanguage()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [fjords, setFjords] = useState<FjordOption[]>([])
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [userStats, setUserStats] = useState(getUserStats())
  const [showHintModal, setShowHintModal] = useState(false)
  const [showSatelliteModal, setShowSatelliteModal] = useState(false)
  const [firstLetterRevealed, setFirstLetterRevealed] = useState<string | null>(null)

  const getEffectivePuzzleId = useCallback(() => puzzleId || puzzle.id, [puzzleId, puzzle.id])

  const handleToastComplete = () => {
    setGameState(prev => prev ? {
      ...prev,
      showToast: false,
      toastMessage: ""
    } : null)
  }

  const updateHint = async (hintType: keyof HintState) => {
    if (!gameState) return

    const newHints = { ...gameState.hintsUsed, [hintType]: true }

    // Save to localStorage
    saveHintsUsed(getEffectivePuzzleId(), newHints)

    // Update game state
    setGameState(prev => prev ? { ...prev, hintsUsed: newHints } : null)

    // Update session in database
    if (gameState.sessionId) {
      await updateSessionHints(gameState.sessionId, newHints)
    }
  }

  // Initialize fjords list and session
  useEffect(() => {
    const initialize = async () => {
      // Load all fjords for autocomplete
      const fjordsList = await getAllFjords()
      setFjords(fjordsList)

      // Initialize session
      const sessionId = getOrCreateSessionId()
      const effectivePuzzleId = getEffectivePuzzleId()
      const sessionExists = await getSessionExists(sessionId, effectivePuzzleId)

      if (!sessionExists) {
        await createSession(sessionId, effectivePuzzleId)
      }

      // Load hints used
      const savedHints = getHintsUsed(effectivePuzzleId)

      // Set first letter if already revealed
      if (savedHints.firstLetter) {
        setFirstLetterRevealed(puzzle.fjord.name.charAt(0).toUpperCase())
      }

      // Create initial game state
      const initialState = createInitialGameState(puzzle, fjordsList, sessionId)

      // Load saved progress
      const savedProgress = loadGameProgress(effectivePuzzleId)
      if (savedProgress) {
        setGameState({
          ...initialState,
          ...savedProgress,
          hintsUsed: savedHints
        })

        if (savedProgress.gameStatus !== 'playing') {
          setShowResultsModal(true)
        }
      } else {
        setGameState({
          ...initialState,
          hintsUsed: savedHints
        })
      }

      setSessionInitialized(true)
    }

    initialize()
  }, [getEffectivePuzzleId, puzzle])

  // Save progress when game state changes
  useEffect(() => {
    if (gameState && sessionInitialized) {
      saveGameProgress(getEffectivePuzzleId(), gameState)
    }
  }, [gameState, getEffectivePuzzleId, sessionInitialized])

  // Update stats when game completes
  useEffect(() => {
    if (gameState &&
      (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') &&
      !gameState.statsUpdated) {
      updateUserStats(gameState.gameStatus === 'won')
      setUserStats(getUserStats())
      setGameState(prev => prev ? { ...prev, statsUpdated: true } as GameState : null)
    }
  }, [gameState])

  const handleGuess = async (fjordId: number, fjordName: string, coords: { lat: number; lng: number }) => {
    if (!gameState) return

    const { newGameState } = await makeGuess(gameState, fjordId, fjordName, coords)
    setGameState(newGameState)

    // Show results modal if game ended
    if (newGameState.gameStatus !== 'playing') {
      setTimeout(() => setShowResultsModal(true), 1000)
    }
  }

  const handleHintClick = () => {
    setShowHintModal(true)
  }

  const handleRevealFirstLetter = async () => {
    if (!gameState || gameState.hintsUsed.firstLetter) return

    setShowHintModal(false)
    setFirstLetterRevealed(puzzle.fjord.name.charAt(0).toUpperCase())
    await updateHint('firstLetter')
  }

  const handleRevealSatellite = async () => {
    if (!gameState) return

    if (!gameState.hintsUsed.satellite) {
      await updateHint('satellite')
    }

    setShowHintModal(false)
    setShowSatelliteModal(true)
  }

  if (!gameState) {
    return (
      <div className="game-container">
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner className="w-12 h-12 mb-4" />
          <div className="text-lg">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container">
      <FjordDisplay
        svgFilename={puzzle.fjord.svg_filename}
        isGameOver={gameState.gameStatus !== 'playing'}
        correctAnswer={gameState.gameStatus !== 'playing' ? puzzle.fjord.name : undefined}
        firstLetterHint={firstLetterRevealed}
      />

      {gameState.gameStatus === 'playing' && (
        <GuessInput
          fjords={fjords}
          onGuess={handleGuess}
          disabled={gameState.gameStatus !== 'playing'}
          attemptsUsed={gameState.attemptsUsed}
          maxAttempts={6}
          onHintClick={handleHintClick}
        />
      )}

      <GuessHistory guesses={gameState.guesses} />

      <ResultsModal
        gameState={gameState}
        userStats={userStats}
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
      />

      <Toast
        message={gameState.toastMessage}
        isVisible={gameState.showToast}
        onComplete={handleToastComplete}
      />

      {/* Hint Modal */}
      {showHintModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHintModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHintModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-6 text-center">
              {t('need_hint')}
            </h3>

            <div className="space-y-4">
              <FirstLetterHint
                isRevealed={gameState.hintsUsed.firstLetter}
                revealedLetter={firstLetterRevealed}
                onReveal={handleRevealFirstLetter}
              />
              {puzzle.fjord.satellite_filename && (
                <SatelliteHint
                  isRevealed={gameState.hintsUsed.satellite}
                  onReveal={handleRevealSatellite}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Satellite Modal */}
      {puzzle.fjord.satellite_filename && (
        <SatelliteModal
          isOpen={showSatelliteModal}
          onClose={() => setShowSatelliteModal(false)}
          satelliteFilename={puzzle.fjord.satellite_filename}
          fjordName={puzzle.fjord.name}
        />
      )}
    </div>
  )
}