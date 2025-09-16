import { v4 as uuidv4 } from 'uuid'
import { GameState, UserStats, GameProgress, HintState, PuzzleResult, HintUsageStats, PerformanceData, DifficultyStats, EnhancedUserStats } from '@/types/game'
import { getDailyPuzzleSchedule, getDailyPuzzleWithFjords, getFjordDifficulties } from './puzzleApi'

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
    return { firstLetter: false, satellite: false, municipalities: false, counties: false, measurements: false, weather: false } // Safe fallback for SSR
  }

  const key = `fjordle_hints_${puzzleId}`
  const saved = localStorage.getItem(key)
  if (!saved) return { firstLetter: false, satellite: false, municipalities: false, counties: false, measurements: false, weather: false }

  try {
    const parsed = JSON.parse(saved)
    // Ensure all properties exist with defaults
    return {
      firstLetter: parsed.firstLetter || false,
      satellite: parsed.satellite || false,
      municipalities: parsed.municipalities || false,
      counties: parsed.counties || false,
      measurements: parsed.measurements || false,
      weather: parsed.weather || false
    }
  } catch {
    return { firstLetter: false, satellite: false, municipalities: false, counties: false, measurements: false, weather: false }
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

// Enhanced stats functionality for the stats page

// Track data corruption issues
interface DataCorruptionReport {
  corruptedKeys: string[]
  invalidEntries: number
  lastChecked: Date
}

let dataCorruptionReport: DataCorruptionReport | null = null

export function getDataCorruptionReport(): DataCorruptionReport | null {
  return dataCorruptionReport
}

export function clearDataCorruptionReport(): void {
  dataCorruptionReport = null
}

export function getPuzzleHistory(): PuzzleResult[] {
  if (typeof window === 'undefined') {
    return []
  }

  const results: PuzzleResult[] = []
  const stats = getUserStats()
  const corruptedKeys: string[] = []
  let invalidEntries = 0

  try {
    // Get all localStorage keys that match puzzle progress pattern
    const puzzleKeys = Object.keys(localStorage).filter(key => 
      /^fjordle_puzzle_(\d+)_progress$/.test(key)
    )

    for (const key of puzzleKeys) {
      try {
        const match = key.match(/^fjordle_puzzle_(\d+)_progress$/)
        if (!match) continue

        const puzzleId = parseInt(match[1])
        const progressData = localStorage.getItem(key)
        
        if (!progressData) {
          corruptedKeys.push(key)
          continue
        }

        let progress: GameProgress
        try {
          progress = JSON.parse(progressData)
        } catch (parseError) {
          console.error(`JSON parse error for key ${key}:`, parseError)
          corruptedKeys.push(key)
          invalidEntries++
          continue
        }
        
        // Validate progress data
        if (!isValidProgressData(progress) || progress.puzzleId !== puzzleId) {
          console.warn(`Invalid progress data for key ${key}`, progress)
          corruptedKeys.push(key)
          invalidEntries++
          continue
        }

        // Get hint usage for this puzzle
        const hintsForPuzzle = stats.hintsUsed?.[puzzleId] || {
          firstLetter: false,
          satellite: false,
          municipalities: false,
          counties: false,
          measurements: false,
          weather: false
        }

        // Calculate total hints used
        const totalHintsUsed = Object.values(hintsForPuzzle).filter(Boolean).length

        // Create puzzle result
        const puzzleResult: PuzzleResult = {
          puzzleId,
          date: new Date(progress.timestamp).toISOString().split('T')[0],
          won: progress.gameStatus === 'won',
          attemptsUsed: progress.attemptsUsed,
          hintsUsed: hintsForPuzzle,
          totalHintsUsed,
          completionTime: undefined // Could be calculated from session tracking if available
        }

        results.push(puzzleResult)
      } catch (error) {
        console.warn(`Failed to process puzzle data from key ${key}:`, error)
        corruptedKeys.push(key)
        invalidEntries++
      }
    }

    // Update corruption report
    if (corruptedKeys.length > 0 || invalidEntries > 0) {
      dataCorruptionReport = {
        corruptedKeys,
        invalidEntries,
        lastChecked: new Date()
      }
      console.warn(`Data corruption detected: ${corruptedKeys.length} corrupted keys, ${invalidEntries} invalid entries`)
    }

    // Sort by puzzle ID descending (newest first)
    return results.sort((a, b) => b.puzzleId - a.puzzleId)
  } catch (error) {
    console.error('Failed to reconstruct puzzle history:', error)
    dataCorruptionReport = {
      corruptedKeys: [],
      invalidEntries: 0,
      lastChecked: new Date()
    }
    return []
  }
}

function isValidProgressData(data: unknown): data is GameProgress {
  if (!data || typeof data !== 'object') return false
  
  const progress = data as Record<string, unknown>
  
  // Basic type checks
  if (!(
    typeof progress.puzzleId === 'number' &&
    typeof progress.attemptsUsed === 'number' &&
    typeof progress.timestamp === 'number' &&
    ['playing', 'won', 'lost'].includes(progress.gameStatus as string) &&
    Array.isArray(progress.guesses)
  )) {
    return false
  }

  // Value range validation
  const puzzleId = progress.puzzleId as number
  const attemptsUsed = progress.attemptsUsed as number
  const timestamp = progress.timestamp as number
  const guesses = progress.guesses as unknown[]

  // Puzzle ID should be positive
  if (puzzleId <= 0 || !Number.isInteger(puzzleId)) {
    console.warn(`Invalid puzzle ID: ${puzzleId}`)
    return false
  }

  // Attempts should be between 0-6
  if (attemptsUsed < 0 || attemptsUsed > 6 || !Number.isInteger(attemptsUsed)) {
    console.warn(`Invalid attempts used: ${attemptsUsed} for puzzle ${puzzleId}`)
    return false
  }

  // Timestamp should be reasonable (after 2020 and before far future)
  const minTimestamp = new Date('2020-01-01').getTime()
  const maxTimestamp = Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year from now
  if (timestamp < minTimestamp || timestamp > maxTimestamp) {
    console.warn(`Invalid timestamp: ${timestamp} for puzzle ${puzzleId}`)
    return false
  }

  // Guesses array should not exceed attempts used
  if (guesses.length > attemptsUsed) {
    console.warn(`Guesses array length (${guesses.length}) exceeds attempts used (${attemptsUsed}) for puzzle ${puzzleId}`)
    return false
  }

  // For completed games, attempts should match guesses length and be > 0
  if ((progress.gameStatus === 'won' || progress.gameStatus === 'lost')) {
    if (attemptsUsed === 0) {
      console.warn(`Completed game with 0 attempts for puzzle ${puzzleId}`)
      return false
    }
    if (guesses.length !== attemptsUsed) {
      console.warn(`Completed game guesses mismatch: ${guesses.length} guesses vs ${attemptsUsed} attempts for puzzle ${puzzleId}`)
      return false
    }
  }

  return true
}

export function getHintUsageStats(): HintUsageStats {
  if (typeof window === 'undefined') {
    return {
      totalHintsUsed: 0,
      byType: {},
      averagePerGame: 0,
      gamesWithoutHints: 0
    }
  }

  try {
    const stats = getUserStats()
    const hintData = stats.hintsUsed || {}
    const puzzleIds = Object.keys(hintData)

    if (puzzleIds.length === 0) {
      return {
        totalHintsUsed: 0,
        byType: {
          firstLetter: 0,
          satellite: 0,
          municipalities: 0,
          counties: 0,
          measurements: 0,
          weather: 0
        },
        averagePerGame: 0,
        gamesWithoutHints: stats.gamesPlayed
      }
    }

    // Count hints by type
    const hintCounts: Record<string, number> = {
      firstLetter: 0,
      satellite: 0,
      municipalities: 0,
      counties: 0,
      measurements: 0,
      weather: 0
    }

    let totalHintsUsed = 0
    let gamesWithoutHints = 0

    for (const puzzleId of puzzleIds) {
      const hints = hintData[parseInt(puzzleId)]
      if (!hints) continue

      let hintsInThisGame = 0
      Object.entries(hints).forEach(([hintType, used]) => {
        if (used) {
          hintCounts[hintType] = (hintCounts[hintType] || 0) + 1
          hintsInThisGame++
          totalHintsUsed++
        }
      })

      if (hintsInThisGame === 0) {
        gamesWithoutHints++
      }
    }

    // Calculate games without hints from total games vs games with hint data
    const gamesWithHintData = puzzleIds.length
    gamesWithoutHints += Math.max(0, stats.gamesPlayed - gamesWithHintData)

    return {
      totalHintsUsed,
      byType: hintCounts,
      averagePerGame: stats.gamesPlayed > 0 ? totalHintsUsed / stats.gamesPlayed : 0,
      gamesWithoutHints
    }
  } catch (error) {
    console.error('Failed to calculate hint usage stats:', error)
    return {
      totalHintsUsed: 0,
      byType: {},
      averagePerGame: 0,
      gamesWithoutHints: 0
    }
  }
}

export async function getPerformanceData(): Promise<PerformanceData[]> {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    // Get daily puzzle history (filtered for actual daily puzzles only)
    const dailyHistory = await getDailyPuzzleHistory()
    
    if (dailyHistory.length === 0) {
      return []
    }

    // Group puzzles by date (the date they were completed)
    const dateGroups: { [date: string]: PuzzleResult[] } = {}
    
    dailyHistory.forEach(puzzle => {
      const dateKey = puzzle.date
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = []
      }
      dateGroups[dateKey].push(puzzle)
    })

    // Calculate performance metrics for each date
    const performanceData: PerformanceData[] = []
    
    Object.entries(dateGroups).forEach(([date, puzzles]) => {
      // For daily puzzles, there should typically be only 1 puzzle per date
      // But handle multiple in case of edge cases
      const totalAttempts = puzzles.reduce((sum, p) => sum + p.attemptsUsed, 0)
      const wins = puzzles.filter(p => p.won).length
      const total = puzzles.length
      
      performanceData.push({
        date,
        averageAttempts: Math.round((totalAttempts / total) * 100) / 100,
        winRate: Math.round((wins / total) * 100),
        gamesPlayed: total
      })
    })

    // Sort by date
    return performanceData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch (error) {
    console.error('Failed to calculate performance data:', error)
    return []
  }
}

export async function getDifficultyBreakdown(): Promise<DifficultyStats> {
  if (typeof window === 'undefined') {
    return {
      easy: { won: 0, total: 0 },
      medium: { won: 0, total: 0 },
      hard: { won: 0, total: 0 }
    }
  }

  try {
    // Get daily puzzle history (filtered for actual daily puzzles only)
    const dailyHistory = await getDailyPuzzleHistory()
    
    if (dailyHistory.length === 0) {
      return {
        easy: { won: 0, total: 0 },
        medium: { won: 0, total: 0 },
        hard: { won: 0, total: 0 }
      }
    }

    // Get daily puzzle schedule with fjord IDs
    const dailyPuzzleData = await getDailyPuzzleWithFjords()
    
    // Extract unique fjord IDs from our puzzle history
    const fjordIds = Array.from(new Set(
      dailyHistory
        .map(puzzle => dailyPuzzleData[puzzle.puzzleId]?.fjordId)
        .filter(Boolean)
    ))

    if (fjordIds.length === 0) {
      return {
        easy: { won: 0, total: 0 },
        medium: { won: 0, total: 0 },
        hard: { won: 0, total: 0 }
      }
    }

    // Get difficulty tiers from Supabase
    const fjordDifficulties = await getFjordDifficulties(fjordIds)

    // Initialize stats
    const stats: DifficultyStats = {
      easy: { won: 0, total: 0 },
      medium: { won: 0, total: 0 },
      hard: { won: 0, total: 0 }
    }

    // Process each puzzle result
    dailyHistory.forEach(puzzle => {
      const puzzleData = dailyPuzzleData[puzzle.puzzleId]
      if (!puzzleData) return

      const difficulty = fjordDifficulties[puzzleData.fjordId]
      if (!difficulty) return

      // Map difficulty_tier (1,2,3) to difficulty names
      let difficultyKey: keyof DifficultyStats
      switch (difficulty) {
        case 1:
          difficultyKey = 'easy'
          break
        case 2:
          difficultyKey = 'medium'
          break
        case 3:
          difficultyKey = 'hard'
          break
        default:
          return // Skip unknown difficulty tiers
      }

      stats[difficultyKey].total++
      if (puzzle.won) {
        stats[difficultyKey].won++
      }
    })

    return stats
  } catch (error) {
    console.error('Failed to calculate difficulty breakdown:', error)
    return {
      easy: { won: 0, total: 0 },
      medium: { won: 0, total: 0 },
      hard: { won: 0, total: 0 }
    }
  }
}

export async function getDailyPuzzleHistory(): Promise<PuzzleResult[]> {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    // Get the daily puzzle schedule from Supabase
    const dailySchedule = await getDailyPuzzleSchedule()
    
    // Get all puzzle history
    const allPuzzleHistory = getPuzzleHistory()
    
    // Filter to only include puzzles played on their actual daily puzzle date
    const dailyOnlyHistory = allPuzzleHistory.filter(puzzle => {
      const puzzleScheduledDate = dailySchedule[puzzle.puzzleId]
      if (!puzzleScheduledDate) return false
      
      // Check if the puzzle was played on its scheduled date
      // Allow some flexibility for time zones (same day or next day)
      const puzzleDate = new Date(puzzle.date)
      const scheduledDate = new Date(puzzleScheduledDate)
      
      // Calculate difference in days
      const timeDiff = Math.abs(puzzleDate.getTime() - scheduledDate.getTime())
      const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      
      // Allow puzzles played within 1 day of their scheduled date
      return dayDiff <= 1
    })
    
    return dailyOnlyHistory.sort((a, b) => a.puzzleId - b.puzzleId)
  } catch (error) {
    console.error('Failed to get daily puzzle history:', error)
    // Fallback to all puzzle history if API fails
    return getPuzzleHistory()
  }
}

export async function getEnhancedUserStats(): Promise<EnhancedUserStats> {
  if (typeof window === 'undefined') {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: '',
      puzzleHistory: [],
      hintAnalytics: {
        totalHintsUsed: 0,
        byType: {},
        averagePerGame: 0,
        gamesWithoutHints: 0
      },
      performanceData: [],
      difficultyBreakdown: {
        easy: { won: 0, total: 0 },
        medium: { won: 0, total: 0 },
        hard: { won: 0, total: 0 }
      },
      lastUpdated: new Date()
    }
  }

  try {
    const baseStats = getUserStats()
    
    // Run async operations in parallel for better performance
    const [performanceData, difficultyBreakdown] = await Promise.all([
      getPerformanceData(),
      getDifficultyBreakdown()
    ])
    
    return {
      ...baseStats,
      puzzleHistory: getPuzzleHistory(),
      hintAnalytics: getHintUsageStats(),
      performanceData,
      difficultyBreakdown,
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Failed to get enhanced user stats:', error)
    // Return safe fallback
    const baseStats = getUserStats()
    return {
      ...baseStats,
      puzzleHistory: [],
      hintAnalytics: {
        totalHintsUsed: 0,
        byType: {},
        averagePerGame: 0,
        gamesWithoutHints: baseStats.gamesPlayed
      },
      performanceData: [],
      difficultyBreakdown: {
        easy: { won: 0, total: 0 },
        medium: { won: 0, total: 0 },
        hard: { won: 0, total: 0 }
      },
      lastUpdated: new Date()
    }
  }
}