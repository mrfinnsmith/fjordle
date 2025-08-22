import { v4 as uuidv4 } from 'uuid'
import { GameState, UserStats, GameProgress, HintState } from '@/types/game'

const ONBOARDING_VERSION = 1

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-session-id' // Safe fallback for SSR
  }

  const key = 'fjordle-session-id'
  let sessionId = localStorage.getItem(key)

  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem(key, sessionId)
  }

  return sessionId
}

export function saveGameProgress(puzzleId: number, gameState: Partial<GameState & { statsUpdated?: boolean }>) {
  if (typeof window === 'undefined') {
    return // Safe no-op for SSR
  }

  const progress: GameProgress = {
    sessionId: 'no-session',
    puzzleId,
    guesses: gameState.guesses || [],
    attemptsUsed: gameState.attemptsUsed || 0,
    gameStatus: gameState.gameStatus || 'playing',
    statsUpdated: gameState.statsUpdated || false,
    timestamp: Date.now(),
    keepGoingMessageShown: gameState.keepGoingMessageShown || false
  }

  const key = `fjordle_puzzle_${puzzleId}_progress`
  localStorage.setItem(key, JSON.stringify(progress))
}

export function loadGameProgress(puzzleId: number): Partial<GameState & { statsUpdated?: boolean }> | null {
  if (typeof window === 'undefined') {
    return null // Safe fallback for SSR
  }

  const key = `fjordle_puzzle_${puzzleId}_progress`
  const saved = localStorage.getItem(key)
  if (!saved) return null

  try {
    const progress: GameProgress = JSON.parse(saved)
    if (progress.puzzleId !== puzzleId) return null

    return {
      guesses: progress.guesses,
      attemptsUsed: progress.attemptsUsed,
      gameStatus: progress.gameStatus,
      statsUpdated: progress.statsUpdated || false,
      keepGoingMessageShown: progress.keepGoingMessageShown || false
    }
  } catch {
    return null
  }
}

export function clearGameProgress(puzzleId?: number) {
  if (typeof window === 'undefined') {
    return // Safe no-op for SSR
  }

  if (puzzleId) {
    const key = `fjordle_puzzle_${puzzleId}_progress`
    localStorage.removeItem(key)
  }
}

export function updateUserStats(won: boolean) {
  if (typeof window === 'undefined') {
    return // Safe no-op for SSR
  }

  const stats = getUserStats()
  const today = new Date().toISOString().split('T')[0]

  stats.gamesPlayed++

  if (won) {
    stats.gamesWon++

    if (stats.lastPlayedDate === getPreviousDate(today)) {
      stats.currentStreak++
    } else {
      stats.currentStreak = 1
    }

    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)
  } else {
    stats.currentStreak = 0
  }

  stats.lastPlayedDate = today
  localStorage.setItem('fjordle-stats', JSON.stringify(stats))
}

export function saveHintsUsed(puzzleId: number, hints: HintState) {
  if (typeof window === 'undefined') {
    return
  }

  const stats = getUserStats()
  const key = 'fjordle-stats'
  const updatedStats = {
    ...stats,
    hintsUsed: {
      ...stats.hintsUsed,
      [puzzleId]: hints
    }
  }
  localStorage.setItem(key, JSON.stringify(updatedStats))
}

// Location data cache
export function getLocationDataCache(fjordId: number): { municipalities: string[], counties: string[] } | null {
  try {
    const cached = localStorage.getItem(`fjordle-location-${fjordId}`)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export function saveLocationDataCache(fjordId: number, data: { municipalities: string[], counties: string[] }): void {
  try {
    localStorage.setItem(`fjordle-location-${fjordId}`, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

export function getHintsUsed(puzzleId: number): HintState {
  if (typeof window === 'undefined') {
    return { firstLetter: false, satellite: false, municipalities: false, counties: false } // Safe fallback for SSR
  }

  const key = `fjordle_hints_${puzzleId}`
  const saved = localStorage.getItem(key)
  if (!saved) return { firstLetter: false, satellite: false, municipalities: false, counties: false }

  try {
    const parsed = JSON.parse(saved)
    // Ensure all properties exist with defaults
    return {
      firstLetter: parsed.firstLetter || false,
      satellite: parsed.satellite || false,
      municipalities: parsed.municipalities || false,
      counties: parsed.counties || false
    }
  } catch {
    return { firstLetter: false, satellite: false, municipalities: false, counties: false }
  }
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') {
    return false // Safe fallback for SSR
  }

  const saved = localStorage.getItem('fjordle-onboarding-version')
  return saved === ONBOARDING_VERSION.toString() // Convert number to string for localStorage
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') {
    return // Safe no-op for SSR
  }

  localStorage.setItem('fjordle-onboarding-version', ONBOARDING_VERSION.toString())
}

export function getUserStats(): UserStats & { hintsUsed?: Record<number, HintState> } {
  if (typeof window === 'undefined') {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: '',
      hintsUsed: {}
    } // Safe fallback for SSR
  }

  const saved = localStorage.getItem('fjordle-stats')
  if (!saved) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: '',
      hintsUsed: {}
    }
  }

  try {
    const parsed = JSON.parse(saved)
    return {
      ...parsed,
      hintsUsed: parsed.hintsUsed || {}
    }
  } catch {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: '',
      hintsUsed: {}
    }
  }
}

function getPreviousDate(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}