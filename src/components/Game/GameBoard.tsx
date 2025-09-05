'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameState, Puzzle, FjordOption, HintState } from '@/types/game'
import { createInitialGameState, makeGuess } from '@/lib/gameLogic'
import { createSession, getSessionExists, updateSessionHints } from '@/lib/session_api'
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
import MeasurementsHint from './MeasurementsHint'
import WeatherHint from './WeatherHint'
import SatelliteModal from './SatelliteModal'
import { saveGameProgress, loadGameProgress, updateUserStats, saveHintsUsed, getHintsUsed, hasSeenOnboarding, markOnboardingSeen, getOrCreateSessionId } from '@/lib/localStorage'
import { getUserStats } from '@/lib/localStorage'
import OnboardingModal from './OnboardingModal'

declare const trackGameEvent: (eventName: string, additionalData?: Record<string, unknown>) => void;

interface GameBoardProps {
  puzzle: Puzzle
  puzzleId?: number
}

export default function GameBoard({ puzzle, puzzleId }: GameBoardProps) {
  const { t, language } = useLanguage()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [fjords, setFjords] = useState<FjordOption[]>([])
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [userStats, setUserStats] = useState(getUserStats())
  const [showHintModal, setShowHintModal] = useState(false)
  const [showSatelliteModal, setShowSatelliteModal] = useState(false)
  const [firstLetterRevealed, setFirstLetterRevealed] = useState<string | undefined>(undefined)
  const [municipalityHintRevealed, setMunicipalityHintRevealed] = useState<string[]>([])
  const [countyHintRevealed, setCountyHintRevealed] = useState<string[]>([])
  const [weatherHintRevealed, setWeatherHintRevealed] = useState<{ temperature: number; conditions: string; icon: string } | null>(null)

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
      measurements: gameState.hintsUsed?.measurements || false,
      weather: gameState.hintsUsed?.weather || false,
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
      trackGameEvent('instructions_shown');

      // Fast path: Set up game state immediately for SVG rendering
      const savedHints = getHintsUsed(getEffectivePuzzleId())
      const savedProgress = loadGameProgress(getEffectivePuzzleId())

      if (savedHints?.firstLetter) {
        setFirstLetterRevealed(puzzle.fjord.name.charAt(0).toUpperCase())
      }

      // Generate session ID and check if session exists
      const sessionId = getOrCreateSessionId()
      const effectivePuzzleId = getEffectivePuzzleId()

      // Check if session already exists, only create if it doesn't
      const sessionExists = await getSessionExists(sessionId, effectivePuzzleId)
      if (!sessionExists) {
        await createSession(sessionId, effectivePuzzleId)
      }

      // Initialize with empty fjords - SVG doesn't need them
      const initialState = createInitialGameState(puzzle, [], sessionId)

      if (savedProgress) {
        setGameState({
          ...initialState,
          ...savedProgress,
          hintsUsed: savedHints,
          fjords: []
        })
        trackGameEvent('game_loaded_successfully');

        if (savedProgress.gameStatus !== 'playing') {
          setShowResultsModal(true)
        }
      } else {
        setGameState({
          ...initialState,
          hintsUsed: savedHints,
          fjords: []
        })
      }

      if (!hasSeenOnboarding()) {
        setShowOnboarding(true)
      }

      // Heavy operations run after gameState is set - don't block SVG
      setTimeout(async () => {
        const [fjordsList, locationExists] = await Promise.all([
          getAllFjords(),
          fjordHasLocationData(puzzle.fjord.id)
        ])

        setFjords(fjordsList)
        setHasLocationData(locationExists)

        // Update gameState with fjords for GuessInput
        setGameState(prev => prev ? { ...prev, fjords: fjordsList } : null)

        // Load location data for completed games
        if (savedProgress?.gameStatus !== 'playing' && locationExists.hasMunicipalities) {
          const locData = await getFjordLocationData(puzzle.fjord.id)
          setLocationData(locData)
        }
      }, 0)
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
    if ((hasLocationData.hasMunicipalities || hasLocationData.hasCounties) && locationData.municipalities.length === 0) {
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

    // Load location data if not already available
    if (locationData.municipalities.length === 0 && hasLocationData.hasMunicipalities) {
      const locData = await getFjordLocationData(puzzle.fjord.id)
      setLocationData(locData)

      if (locData.municipalities.length > 0) {
        setMunicipalityHintRevealed(locData.municipalities)
        await updateHint('municipalities')
        setShowHintModal(false)
      }
    } else if (locationData.municipalities.length > 0) {
      setMunicipalityHintRevealed(locationData.municipalities)
      await updateHint('municipalities')
      setShowHintModal(false)
    }
  }

  const handleRevealCounties = async () => {
    if (!gameState || gameState.hintsUsed?.counties) return

    // Load location data if not already available
    if (locationData.counties.length === 0 && hasLocationData.hasCounties) {
      const locData = await getFjordLocationData(puzzle.fjord.id)
      setLocationData(locData)

      if (locData.counties.length > 0) {
        setCountyHintRevealed(locData.counties)
        await updateHint('counties')
        setShowHintModal(false)
      }
    } else if (locationData.counties.length > 0) {
      setCountyHintRevealed(locationData.counties)
      await updateHint('counties')
      setShowHintModal(false)
    }
  }

  const handleRevealMeasurements = async () => {
    if (!gameState || gameState.hintsUsed?.measurements) return

    await updateHint('measurements')
    setShowHintModal(false)
  }

  const handleRevealWeather = async (weatherData: { temperature: number; conditions: string; icon: string }) => {
    if (!gameState || gameState.hintsUsed?.weather) return

    setWeatherHintRevealed(weatherData)
    await updateHint('weather')
    setShowHintModal(false)
  }

  // Refetch weather data when language changes
  useEffect(() => {
    if (weatherHintRevealed && gameState?.hintsUsed?.weather) {
      // Refetch weather data in the new language
      const refetchWeather = async () => {
        try {
          const response = await fetch(`/api/weather/${gameState?.puzzle?.fjord?.id}?lang=${language}`)
          if (response.ok) {
            const data = await response.json()
            const getWeatherIcon = (conditions: string): string => {
              const condition = conditions.toLowerCase()
              if (condition.includes('klart') || condition.includes('clear')) return '☀️'
              if (condition.includes('skyet') || condition.includes('cloudy')) return '⛅'
              if (condition.includes('overskyet') || condition.includes('overcast')) return '☁️'
              if (condition.includes('regn') || condition.includes('rain')) return '🌧️'
              if (condition.includes('snø') || condition.includes('snow')) return '❄️'
              if (condition.includes('tåke') || condition.includes('fog')) return '🌫️'
              if (condition.includes('torden') || condition.includes('thunder')) return '⛈️'
              if (condition.includes('duskregn') || condition.includes('drizzle')) return '🌦️'
              return '🌤️'
            }
            setWeatherHintRevealed({
              temperature: data.temperature,
              conditions: data.conditions,
              icon: getWeatherIcon(data.conditions)
            })
          }
        } catch (error) {
          console.error('Error refetching weather:', error)
        }
      }
      refetchWeather()
    }
  }, [language, gameState?.puzzle?.fjord?.id, gameState?.hintsUsed?.weather])

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
        measurementsData={gameState.hintsUsed?.measurements ? {
          length_km: puzzle.fjord.length_km,
          width_km: puzzle.fjord.width_km,
          depth_m: puzzle.fjord.depth_m
        } : undefined}
        weatherHint={weatherHintRevealed}
      />

      {gameState.gameStatus === 'playing' && fjords.length > 0 && (
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

      {gameState.gameStatus === 'playing' && fjords.length === 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner className="w-6 h-6" />
        </div>
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
                revealedLetter={firstLetterRevealed ?? null}
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
              {(puzzle.fjord.length_km || puzzle.fjord.width_km || puzzle.fjord.depth_m) && (
                <MeasurementsHint
                  isRevealed={gameState.hintsUsed?.measurements || false}
                  measurements={{
                    length_km: puzzle.fjord.length_km,
                    width_km: puzzle.fjord.width_km,
                    depth_m: puzzle.fjord.depth_m
                  }}
                  onReveal={handleRevealMeasurements}
                />
              )}
              <WeatherHint
                fjordId={puzzle.fjord.id}
                isRevealed={gameState.hintsUsed?.weather || false}
                weatherData={weatherHintRevealed}
                onReveal={handleRevealWeather}
              />
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