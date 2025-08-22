'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameState, Puzzle, FjordOption, HintState } from '@/types/game'
import { createInitialGameState, makeGuess } from '@/lib/gameLogic'
import { updateSessionHints } from '@/lib/session_api'
import { getAllFjords, getFjordLocationData, fjordHasLocationData } from '@/lib/puzzleApi'
import { useLanguage } from '@/lib/languageContext'
import FjordDisplay from './FjordDisplay'
import GuessInput from './GuessInput'
import GuessHistory from './GuessHistory'
import ResultsModal from './ResultsModal'
import { Toast } from './Toast'
import LoadingSpinner from './LoadingSpinner'
import FirstLetterHint from './FirstLetterHint'
import SatelliteHint from './SatelliteHint'
import MunicipalityHint from './MunicipalityHint'
import CountyHint from './CountyHint'
import SatelliteModal from './SatelliteModal'
import { saveGameProgress, loadGameProgress, updateUserStats, saveHintsUsed, getHintsUsed, hasSeenOnboarding, markOnboardingSeen } from '@/lib/localStorage'
import { getUserStats } from '@/lib/localStorage'
import OnboardingModal from './OnboardingModal'

interface GameBoardProps {
  puzzle: Puzzle
  puzzleId?: number
}

export default function GameBoard({ puzzle, puzzleId }: GameBoardProps) {
  const { t } = useLanguage()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [fjords, setFjords] = useState<FjordOption[]>([])
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [userStats, setUserStats] = useState(getUserStats())
  const [showHintModal, setShowHintModal] = useState(false)
  const [showSatelliteModal, setShowSatelliteModal] = useState(false)
  const [firstLetterRevealed, setFirstLetterRevealed] = useState<string | null>(null)
  const [municipalityHintRevealed, setMunicipalityHintRevealed] = useState<string[]>([])
  const [countyHintRevealed, setCountyHintRevealed] = useState<string[]>([])
  const [locationData, setLocationData] = useState<{ municipalities: string[], counties: string[] }>({ municipalities: [], counties: [] })
  const [hasLocationData, setHasLocationData] = useState<{ hasMunicipalities: boolean, hasCounties: boolean }>({ hasMunicipalities: false, hasCounties: false })
  const [showOnboarding, setShowOnboarding] = useState(false)

  const getEffectivePuzzleId = useCallback(() => puzzleId || puzzle.id, [puzzleId, puzzle.id])

  const handleToastComplete = () => {
    setGameState(prev => prev ? {
      ...prev,
      showToast: false,
      toastMessage: ""
    } : null)
  }

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    markOnboardingSeen()
  }

  const updateHint = async (hintType: keyof HintState) => {
    if (!gameState) return

    const newHints: HintState = {
      firstLetter: gameState.hintsUsed?.firstLetter || false,
      satellite: gameState.hintsUsed?.satellite || false,
      municipalities: gameState.hintsUsed?.municipalities || false,
      counties: gameState.hintsUsed?.counties || false,
      [hintType]: true
    }

    saveHintsUsed(getEffectivePuzzleId(), newHints)
    setGameState(prev => prev ? { ...prev, hintsUsed: newHints } : null)

    if (gameState.sessionId) {
      await updateSessionHints(gameState.sessionId, newHints)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const [fjordsList, locationExists] = await Promise.all([
        getAllFjords(),
        fjordHasLocationData(puzzle.fjord.id)
      ])
      setFjords(fjordsList)
      setHasLocationData(locationExists)

      const savedHints = getHintsUsed(getEffectivePuzzleId())

      if (savedHints?.firstLetter) {
        setFirstLetterRevealed(puzzle.fjord.name.charAt(0).toUpperCase())
      }

      const initialState = createInitialGameState(puzzle, fjordsList)
      const savedProgress = loadGameProgress(getEffectivePuzzleId())

      if (savedProgress) {
        setGameState({
          ...initialState,
          ...savedProgress,
          hintsUsed: savedHints,
          fjords: fjordsList
        })

        if (savedProgress.gameStatus !== 'playing') {
          setShowResultsModal(true)
          // Load location data for results display if game has ended
          if (locationExists.hasMunicipalities) {
            const locData = await getFjordLocationData(puzzle.fjord.id)
            setLocationData(locData)
          }
        }
      } else {
        setGameState({
          ...initialState,
          hintsUsed: savedHints,
          fjords: fjordsList
        })
      }

      if (!hasSeenOnboarding()) {
        setShowOnboarding(true)
      }
    }

    initialize()
  }, [getEffectivePuzzleId, puzzle])

  // Load previously revealed hints after location data is available
  useEffect(() => {
    if (locationData.municipalities.length > 0 && gameState?.hintsUsed) {
      if (gameState.hintsUsed.municipalities) {
        setMunicipalityHintRevealed(locationData.municipalities)
      }
      if (gameState.hintsUsed.counties) {
        setCountyHintRevealed(locationData.counties)
      }
    }
  }, [locationData, gameState?.hintsUsed])

  useEffect(() => {
    if (gameState) {
      saveGameProgress(getEffectivePuzzleId(), gameState)
    }
  }, [gameState, getEffectivePuzzleId])

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

    if (newGameState.gameStatus !== 'playing') {
      // Load location data for results display if not already loaded
      if (locationData.municipalities.length === 0 && hasLocationData.hasMunicipalities) {
        const locData = await getFjordLocationData(puzzle.fjord.id)
        setLocationData(locData)
      }
      setTimeout(() => setShowResultsModal(true), 1000)
    }
  }

  const handleHintClick = async () => {
    // Show modal immediately - no waiting for data
    setShowHintModal(true)
  }

  const handleHintHover = async () => {
    // Preload location data on hover if not already loaded
    if (hasLocationData.hasMunicipalities && locationData.municipalities.length === 0) {
      const locData = await getFjordLocationData(puzzle.fjord.id)
      setLocationData(locData)
    }
  }

  const handleRevealFirstLetter = async () => {
    if (!gameState || gameState.hintsUsed?.firstLetter) return

    setShowHintModal(false)
    setFirstLetterRevealed(puzzle.fjord.name.charAt(0).toUpperCase())
    await updateHint('firstLetter')
  }

  const handleRevealSatellite = async () => {
    if (!gameState) return

    if (!gameState.hintsUsed?.satellite) {
      await updateHint('satellite')
    }

    setShowHintModal(false)
    setShowSatelliteModal(true)
  }

  const handleRevealMunicipalities = async () => {
    if (!gameState || gameState.hintsUsed?.municipalities) return

    // Location data should already be loaded from handleHintClick
    if (locationData.municipalities.length > 0) {
      setMunicipalityHintRevealed(locationData.municipalities)
      await updateHint('municipalities')
      setShowHintModal(false)
    }
  }

  const handleRevealCounties = async () => {
    if (!gameState || gameState.hintsUsed?.counties) return

    // Location data should already be loaded from handleHintClick
    if (locationData.counties.length > 0) {
      setCountyHintRevealed(locationData.counties)
      await updateHint('counties')
      setShowHintModal(false)
    }
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
        municipalityHint={municipalityHintRevealed}
        countyHint={countyHintRevealed}
      />

      {gameState.gameStatus === 'playing' && (
        <GuessInput
          fjords={fjords}
          onGuess={handleGuess}
          disabled={gameState.gameStatus !== 'playing'}
          attemptsUsed={gameState.attemptsUsed}
          maxAttempts={6}
          onHintClick={handleHintClick}
          onHintHover={handleHintHover}
        />
      )}

      <GuessHistory guesses={gameState.guesses} />

      <ResultsModal
        gameState={gameState}
        userStats={userStats}
        locationData={locationData}
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
      />

      <Toast
        message={
          gameState.toastMessage === 'DUPLICATE_GUESS' && gameState.duplicateFjordName
            ? t('already_guessed_fjord').replace('{fjordName}', gameState.duplicateFjordName)
            : gameState.toastMessage === 'KEEP_GOING_MESSAGE'
            ? t('keep_going_message')
            : gameState.toastMessage
        }
        isVisible={gameState.showToast}
        onComplete={handleToastComplete}
      />

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
                isRevealed={gameState.hintsUsed?.firstLetter || false}
                revealedLetter={firstLetterRevealed}
                onReveal={handleRevealFirstLetter}
              />
              {puzzle.fjord.satellite_filename && (
                <SatelliteHint
                  isRevealed={gameState.hintsUsed?.satellite || false}
                  onReveal={handleRevealSatellite}
                />
              )}
              {hasLocationData.hasMunicipalities && (
                <MunicipalityHint
                  isRevealed={gameState.hintsUsed?.municipalities || false}
                  municipalities={municipalityHintRevealed.length > 0 ? municipalityHintRevealed : locationData.municipalities}
                  onReveal={handleRevealMunicipalities}
                />
              )}
              {hasLocationData.hasCounties && (
                <CountyHint
                  isRevealed={gameState.hintsUsed?.counties || false}
                  counties={countyHintRevealed.length > 0 ? countyHintRevealed : locationData.counties}
                  onReveal={handleRevealCounties}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {puzzle.fjord.satellite_filename && (
        <SatelliteModal
          isOpen={showSatelliteModal}
          onClose={() => setShowSatelliteModal(false)}
          satelliteFilename={puzzle.fjord.satellite_filename}
          fjordName={puzzle.fjord.name}
        />
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
      />
    </div>
  )
}