// Mock data for testing the stats page
import { EnhancedUserStats } from '@/types/game'

export function createMockStatsData(): EnhancedUserStats {
  const today = new Date()
  const mockPuzzleHistory = []
  
  // Generate 15 mock puzzles over the last 15 days
  for (let i = 14; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const puzzleId = 100 + (14 - i)
    const won = Math.random() > 0.3 // 70% win rate
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
  
  // Calculate performance data
  const performanceData = []
  for (let i = 6; i >= 0; i--) {
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
  
  return {
    gamesPlayed,
    gamesWon,
    currentStreak: 3,
    maxStreak: 7,
    lastPlayedDate: today.toISOString().split('T')[0],
    puzzleHistory: mockPuzzleHistory,
    hintAnalytics,
    performanceData,
    difficultyBreakdown,
    lastUpdated: new Date()
  }
}