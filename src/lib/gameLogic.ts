import { GameState, Puzzle, Guess, FjordOption, MAX_ATTEMPTS } from '@/types/game'
import { recordGuess, updateSession, completeSession } from './session_api'

export function createInitialGameState(puzzle: Puzzle, fjords: FjordOption[], sessionId?: string): GameState {
  return {
    puzzle,
    guesses: [],
    attemptsUsed: 0,
    gameStatus: 'playing',
    fjords,
    sessionId,
    showToast: false,
    toastMessage: ""
  }
}

// Distance calculation using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// Direction calculation returning arrow emoji
export function calculateDirection(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng)
  let bearing = Math.atan2(y, x) * 180 / Math.PI
  bearing = (bearing + 360) % 360

  // Convert to emoji arrows
  if (bearing >= 337.5 || bearing < 22.5) return '⬆️'
  if (bearing >= 22.5 && bearing < 67.5) return '↗️'
  if (bearing >= 67.5 && bearing < 112.5) return '➡️'
  if (bearing >= 112.5 && bearing < 157.5) return '↘️'
  if (bearing >= 157.5 && bearing < 202.5) return '⬇️'
  if (bearing >= 202.5 && bearing < 247.5) return '↙️'
  if (bearing >= 247.5 && bearing < 292.5) return '⬅️'
  return '↖️'
}

// Calculate proximity percentage
export function calculateProximity(distance: number, maxDistance: number = 4000): number {
  if (distance === 0) return 100

  // For distances under 20km, use a more granular scale
  if (distance <= 20) {
    // 0km = 100%, 20km = 95%, linear scale
    const granularProximity = 100 - (distance / 20) * 5

    // For 5km or less, return with decimal points
    if (distance <= 5) {
      return Math.round(granularProximity * 100) / 100
    }

    return Math.round(granularProximity)
  }

  // For distances over 20km, use a more reasonable scale
  // 20km = 95%, 100km = 90%, 500km = 75%, 4000km = 0%
  const proximity = Math.max(0, 95 - (distance - 20) / 3980 * 95)
  return Math.round(proximity)
}

export async function makeGuess(
  gameState: GameState,
  fjordId: number,
  fjordName: string,
  guessedCoords: { lat: number; lng: number }
): Promise<{ newGameState: GameState; isCorrect: boolean }> {
  if (!gameState.puzzle || gameState.gameStatus !== 'playing') {
    return { newGameState: gameState, isCorrect: false }
  }

  const isCorrect = fjordId === gameState.puzzle.fjord.id
  const newAttemptsUsed = gameState.attemptsUsed + 1

  let distance = 0
  let direction = '🎯'
  let proximityPercent = 100

  if (!isCorrect) {
    const correctCoords = {
      lat: gameState.puzzle.fjord.center_lat,
      lng: gameState.puzzle.fjord.center_lng
    }

    distance = calculateDistance(
      guessedCoords.lat, guessedCoords.lng,
      correctCoords.lat, correctCoords.lng
    )
    direction = calculateDirection(
      guessedCoords.lat, guessedCoords.lng,
      correctCoords.lat, correctCoords.lng
    )
    proximityPercent = calculateProximity(distance)
  }

  const guess: Guess = {
    fjordName,
    distance,
    direction,
    proximityPercent,
    isCorrect,
    attemptNumber: newAttemptsUsed
  }

  const newGuesses = [...gameState.guesses, guess]
  let newGameStatus: 'playing' | 'won' | 'lost' = gameState.gameStatus

  if (isCorrect) {
    newGameStatus = 'won'
  } else if (newAttemptsUsed >= MAX_ATTEMPTS) {
    newGameStatus = 'lost'
  }

  const newGameState: GameState = {
    ...gameState,
    guesses: newGuesses,
    attemptsUsed: newAttemptsUsed,
    gameStatus: newGameStatus,
    showToast: !isCorrect && proximityPercent > 95,
    toastMessage: !isCorrect && proximityPercent > 95 ? "So close!" : ""
  }

  // Record guess in database if session tracking is enabled
  if (gameState.sessionId) {
    await recordGuess({
      session_id: gameState.sessionId,
      puzzle_id: gameState.puzzle.id,
      guessed_fjord_id: fjordId,
      is_correct: isCorrect,
      distance_km: distance,
      proximity_percent: proximityPercent,
      attempt_number: newAttemptsUsed
    })

    await updateSession(gameState.sessionId, {
      attempts_used: newAttemptsUsed,
      won: isCorrect,
      completed: newGameStatus !== 'playing'
    })

    if (newGameStatus !== 'playing') {
      await completeSession(gameState.sessionId, newAttemptsUsed, isCorrect)
    }
  }

  return { newGameState, isCorrect }
}

export function canSubmitGuess(selectedFjord: string | null): boolean {
  return selectedFjord !== null && selectedFjord.length > 0
}

export function getRemainingAttempts(gameState: GameState): number {
  return Math.max(0, MAX_ATTEMPTS - gameState.attemptsUsed)
}

