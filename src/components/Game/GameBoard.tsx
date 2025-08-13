'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameState, Puzzle, FjordOption } from '@/types/game'
import { createInitialGameState, makeGuess } from '@/lib/gameLogic'
import { createSession, getSessionExists } from '@/lib/session_api'
import { getAllFjords } from '@/lib/puzzleApi'
import { useLanguage } from '@/lib/languageContext'
import FjordDisplay from './FjordDisplay'
import GuessInput from './GuessInput'
import GuessHistory from './GuessHistory'
import ResultsModal from './ResultsModal'
import { Toast } from './Toast'
import { saveGameProgress, loadGameProgress, getOrCreateSessionId, updateUserStats } from '@/lib/localStorage'
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

  const getEffectivePuzzleId = useCallback(() => puzzleId || puzzle.id, [puzzleId, puzzle.id])

  const handleToastComplete = () => {
    setGameState(prev => prev ? {
      ...prev,
      showToast: false,
      toastMessage: ""
    } : null)
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

      // Create initial game state
      const initialState = createInitialGameState(puzzle, fjordsList, sessionId)

      // Load saved progress
      const savedProgress = loadGameProgress(effectivePuzzleId)
      if (savedProgress) {
        setGameState({
          ...initialState,
          ...savedProgress
        })

        if (savedProgress.gameStatus !== 'playing') {
          setShowResultsModal(true)
        }
      } else {
        setGameState(initialState)
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

  const handleInvalidGuess = () => {
    if (!gameState) return

    setGameState(prev => prev ? {
      ...prev,
      showToast: true,
      toastMessage: t('unknown_fjord')
    } : null)
  }

  if (!gameState) {
    return (
      <div className="game-container">
        <div className="flex flex-col items-center justify-center py-8">
          <img src="/favicon-32x32.png" alt="Fjordle" className="w-12 h-12 mb-4 animate-pulse" />
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
      />

      {gameState.gameStatus === 'playing' && (
        <GuessInput
          fjords={fjords}
          onGuess={handleGuess}
          onInvalidGuess={handleInvalidGuess}
          disabled={gameState.gameStatus !== 'playing'}
          attemptsUsed={gameState.attemptsUsed}
          maxAttempts={6}
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
    </div>
  )
}