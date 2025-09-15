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
import FjordDisplaySkeleton from './FjordDisplaySkeleton'
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
import { useScreenReader } from '@/lib/useScreenReader'
import { formatDistance } from '@/lib/utils'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { trackGamePerformance } from '@/lib/performance'

declare const trackGameEvent: (eventName: string, additionalData?: Record<string, unknown>) => void;

interface GameBoardProps {
  puzzle: Puzzle
  puzzleId?: number
}

export default function GameBoard({ puzzle, puzzleId }: GameBoardProps) {
  const { t, language } = useLanguage()
  const { announce } = useScreenReader()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [fjords, setFjords] = useState<FjordOption[]>([])
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [userStats, setUserStats] = useState(getUserStats())
  const [showHintModal, setShowHintModal] = useState(false)
  const hintModalRef = useFocusTrap(showHintModal)
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
      const initStartTime = performance.now()
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
        const heavyOpsStartTime = performance.now()
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

        // Track heavy operations performance
        const heavyOpsDuration = performance.now() - heavyOpsStartTime
        trackGamePerformance('heavy_operations_complete', heavyOpsDuration)
      }, 0)

      // Track initial game setup performance
      const initDuration = performance.now() - initStartTime
      trackGamePerformance('game_initialization', initDuration)
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

    const guessStartTime = performance.now()
    const { newGameState } = await makeGuess(gameState, fjordId, fjordName, coords)
    const guessDuration = performance.now() - guessStartTime
    
    trackGamePerformance('guess_processing', guessDuration)
    setGameState(newGameState)

    // Announce the result of the guess
    const lastGuess = newGameState.guesses[newGameState.guesses.length - 1]
    if (lastGuess?.isCorrect) {
      announce(t('a11y_game_won').replace('{attempts}', newGameState.guesses.length.toString()))
    } else if (lastGuess) {
      const distance = formatDistance(lastGuess.distance, language)
      announce(
        t('a11y_guess_incorrect')
          .replace('{distance}', distance)
          .replace('{direction}', lastGuess.direction)
          .replace('{proximity}', lastGuess.proximityPercent.toString())
      )
    }

    if (newGameState.gameStatus === 'lost') {
      announce(t('a11y_game_lost').replace('{fjord}', puzzle.fjord.name))
    }

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

    const firstLetter = puzzle.fjord.name.charAt(0).toUpperCase()
    setShowHintModal(false)
    setFirstLetterRevealed(firstLetter)
    await updateHint('firstLetter')
    
    announce(t('a11y_hint_revealed').replace('{hint}', `${t('hint_starts_with')} ${firstLetter}`))
  }

  const handleRevealSatellite = async () => {
    if (!gameState) return

    if (!gameState.hintsUsed?.satellite) {
      await updateHint('satellite')
      announce(t('a11y_hint_revealed').replace('{hint}', t('satellite_image_hint')))
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
  }, [language, gameState?.puzzle?.fjord?.id, gameState?.hintsUsed?.weather, weatherHintRevealed])

  if (!gameState) {
    return (
      <div className="game-container">
        <FjordDisplaySkeleton />
        <div className="flex flex-col items-center justify-center py-4">
          <LoadingSpinner className="w-6 h-6" />
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
        <div className="w-full max-w-md mx-auto mb-6">
          <div className="guess-input-container">
            <div className="input-button-row">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t('loading_fjords')}
                  className="guess-input w-full"
                  disabled
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg opacity-50 cursor-not-allowed"
                  type="button"
                  disabled
                >
                  🛟
                </button>
                <button
                  disabled
                  className="game-button primary flex-1 opacity-50 cursor-not-allowed"
                >
                  {t('guess_button')}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <LoadingSpinner className="w-5 h-5" />
          </div>
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
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowHintModal(false)
            }
          }}
        >
          <div
            ref={hintModalRef}
            className="bg-white rounded-lg p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hint-modal-title"
            aria-describedby="hint-modal-description"
          >
            <button
              onClick={() => setShowHintModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              aria-label={t('a11y_close_modal')}
            >
              ×
            </button>
            <h3 id="hint-modal-title" className="text-lg font-semibold mb-6 text-center">
              {t('need_hint')}
            </h3>
            <div id="hint-modal-description" className="sr-only">
              {t('a11y_hint_modal')}
            </div>

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