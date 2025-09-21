// Mock data for testing the stats page
import { EnhancedUserStats } from '@/types/game'

export type MockScenario = 'newUser' | 'fewGames' | 'someGames' | 'manyGames' | 'veteran'

export function createMockStatsData(scenario: MockScenario = 'someGames'): EnhancedUserStats {
  const scenarioConfig = {
    newUser: { days: 0, winRate: 0 },
    fewGames: { days: 3, winRate: 0.67 },
    someGames: { days: 10, winRate: 0.70 },
    manyGames: { days: 25, winRate: 0.72 },
    veteran: { days: 50, winRate: 0.75 }
  }
  
  const config = scenarioConfig[scenario]
  const today = new Date()
  const mockPuzzleHistory = []
  
  // Generate mock puzzles based on scenario
  for (let i = config.days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const puzzleId = 100 + (config.days - 1 - i)
    const won = Math.random() < config.winRate
    const attemptsUsed = won ? Math.floor(Math.random() * 4) + 1 : 6
    
    // Random hint usage
    const hintsUsed = {
      firstLetter: Math.random() > 0.7,
      satellite: Math.random() > 0.8,
      municipalities: Math.random() > 0.9,
      counties: Math.random() > 0.9,
      measurements: Math.random() > 0.85,
      weather: Math.random() > 0.95
    }
    
    const totalHintsUsed = Object.values(hintsUsed).filter(Boolean).length
    
    mockPuzzleHistory.push({
      puzzleId,
      date: date.toISOString().split('T')[0],
      won,
      attemptsUsed,
      hintsUsed,
      totalHintsUsed
    })
  }
  
  const gamesWon = mockPuzzleHistory.filter(p => p.won).length
  const gamesPlayed = mockPuzzleHistory.length
  
  // Calculate performance data - only for scenarios with enough data
  const performanceData = []
  if (config.days >= 7) {
    const performanceDays = Math.min(config.days, 30) // Show up to 30 days
    for (let i = performanceDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dayPuzzles = mockPuzzleHistory.filter(p => {
        const puzzleDate = new Date(p.date)
        return puzzleDate.toDateString() === date.toDateString()
      })
      
      if (dayPuzzles.length > 0) {
        const dayWins = dayPuzzles.filter(p => p.won).length
        const dayAttempts = dayPuzzles.reduce((sum, p) => sum + p.attemptsUsed, 0) / dayPuzzles.length
        
        performanceData.push({
          date: date.toISOString().split('T')[0],
          winRate: (dayWins / dayPuzzles.length) * 100,
          gamesPlayed: dayPuzzles.length,
          averageAttempts: dayAttempts
        })
      }
    }
  }
  
  // Calculate difficulty breakdown
  const difficultyBreakdown = {
    easy: { won: 0, total: 0 },
    medium: { won: 0, total: 0 },
    hard: { won: 0, total: 0 }
  }
  
  mockPuzzleHistory.forEach(puzzle => {
    const date = new Date(puzzle.date)
    const dayOfWeek = date.getDay()
    
    let difficulty: 'easy' | 'medium' | 'hard'
    if (dayOfWeek === 1 || dayOfWeek === 2) {
      difficulty = 'easy'
    } else if (dayOfWeek === 3 || dayOfWeek === 4) {
      difficulty = 'medium'
    } else {
      difficulty = 'hard'
    }
    
    difficultyBreakdown[difficulty].total++
    if (puzzle.won) {
      difficultyBreakdown[difficulty].won++
    }
  })
  
  // Calculate hint analytics
  const hintAnalytics = {
    totalHintsUsed: mockPuzzleHistory.reduce((sum, p) => sum + p.totalHintsUsed, 0),
    byType: {
      firstLetter: mockPuzzleHistory.filter(p => p.hintsUsed.firstLetter).length,
      satellite: mockPuzzleHistory.filter(p => p.hintsUsed.satellite).length,
      municipalities: mockPuzzleHistory.filter(p => p.hintsUsed.municipalities).length,
      counties: mockPuzzleHistory.filter(p => p.hintsUsed.counties).length,
      measurements: mockPuzzleHistory.filter(p => p.hintsUsed.measurements).length,
      weather: mockPuzzleHistory.filter(p => p.hintsUsed.weather).length
    },
    averagePerGame: mockPuzzleHistory.reduce((sum, p) => sum + p.totalHintsUsed, 0) / gamesPlayed,
    gamesWithoutHints: mockPuzzleHistory.filter(p => p.totalHintsUsed === 0).length
  }
  
  // Calculate streaks based on recent games
  let currentStreak = 0
  let maxStreak = 0
  let tempStreak = 0
  
  // Calculate current streak (from most recent games)
  for (let i = mockPuzzleHistory.length - 1; i >= 0; i--) {
    if (mockPuzzleHistory[i].won) {
      currentStreak++
    } else {
      break
    }
  }
  
  // Calculate max streak
  for (const puzzle of mockPuzzleHistory) {
    if (puzzle.won) {
      tempStreak++
      maxStreak = Math.max(maxStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  
  return {
    gamesPlayed,
    gamesWon,
    currentStreak,
    maxStreak,
    lastPlayedDate: config.days > 0 ? today.toISOString().split('T')[0] : '',
    puzzleHistory: mockPuzzleHistory,
    hintAnalytics,
    performanceData,
    difficultyBreakdown,
    lastUpdated: new Date()
  }
}