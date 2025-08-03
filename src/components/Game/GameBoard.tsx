'use client'

import { useState, useEffect } from 'react'
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

  const getEffectivePuzzleId = () => puzzleId || puzzle.id

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
  }, [getEffectivePuzzleId()])

  // Save progress when game state changes
  useEffect(() => {
    if (gameState && sessionInitialized) {
      saveGameProgress(getEffectivePuzzleId(), gameState)
    }
  }, [gameState, getEffectivePuzzleId(), sessionInitialized])

  // Update stats when game completes
  useEffect(() => {
    if (gameState && (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost')) {
      updateUserStats(gameState.gameStatus === 'won')
    }
  }, [gameState?.gameStatus])

  const handleGuess = async (fjordId: number, fjordName: string, coords: { lat: number; lng: number }) => {
    if (!gameState) return

    const { newGameState } = await makeGuess(gameState, fjordId, fjordName, coords)
    setGameState(newGameState)

    // Show results modal if game ended
    if (newGameState.gameStatus !== 'playing') {
      setTimeout(() => setShowResultsModal(true), 1000)
    }
  }

  if (!gameState) {
    return (
      <div className="game-container">
        <div className="loading-spinner">{t('loading')}</div>
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
          disabled={gameState.gameStatus !== 'playing'}
          attemptsUsed={gameState.attemptsUsed}
          maxAttempts={6}
        />
      )}

      <GuessHistory guesses={gameState.guesses} />

      <ResultsModal
        gameState={gameState}
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