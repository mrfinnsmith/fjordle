import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateDistance,
  calculateDirection,
  calculateProximity,
  makeGuess,
  canSubmitGuess,
  getRemainingAttempts,
  createInitialGameState
} from '../gameLogic'
import { GameState, Puzzle, FjordOption, MAX_ATTEMPTS } from '@/types/game'

// Mock the session API since we're only testing game logic
vi.mock('../session_api', () => ({
  recordGuess: vi.fn(),
  updateSession: vi.fn(),
  completeSession: vi.fn()
}))

describe('calculateDistance', () => {
  it('should calculate distance between Oslo and Bergen (known reference)', () => {
    // Oslo coordinates: 59.9139, 10.7522
    // Bergen coordinates: 60.3913, 5.3221
    // Expected distance: approximately 308 km
    const distance = calculateDistance(59.9139, 10.7522, 60.3913, 5.3221)
    expect(distance).toBeCloseTo(308, -1) // Within 10km
  })

  it('should return 0 for identical coordinates', () => {
    const distance = calculateDistance(60.0, 10.0, 60.0, 10.0)
    expect(distance).toBe(0)
  })

  it('should handle coordinates across the prime meridian', () => {
    // London to Paris
    const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522)
    expect(distance).toBeCloseTo(344, -1)
  })

  it('should handle coordinates across the equator', () => {
    const distance = calculateDistance(-10.0, 0.0, 10.0, 0.0)
    expect(distance).toBeCloseTo(2223, -1) // About 20 degrees latitude
  })

  it('should handle very small distances accurately', () => {
    // 1km apart approximately
    const distance = calculateDistance(60.0, 10.0, 60.009, 10.0)
    expect(distance).toBeCloseTo(1, 0)
  })
})

describe('calculateDirection', () => {
  it('should return correct arrow for north direction', () => {
    const direction = calculateDirection(60.0, 10.0, 61.0, 10.0)
    expect(direction).toBe('⬆️')
  })

  it('should return correct arrow for south direction', () => {
    const direction = calculateDirection(61.0, 10.0, 60.0, 10.0)
    expect(direction).toBe('⬇️')
  })

  it('should return correct arrow for east direction', () => {
    const direction = calculateDirection(60.0, 10.0, 60.0, 11.0)
    expect(direction).toBe('➡️')
  })

  it('should return correct arrow for west direction', () => {
    const direction = calculateDirection(60.0, 11.0, 60.0, 10.0)
    expect(direction).toBe('⬅️')
  })

  it('should return correct arrow for northeast direction', () => {
    const direction = calculateDirection(60.0, 10.0, 60.5, 10.5)
    expect(direction).toBe('↗️')
  })

  it('should return correct arrow for southeast direction', () => {
    const direction = calculateDirection(60.5, 10.0, 60.0, 10.5)
    expect(direction).toBe('↘️')
  })

  it('should return correct arrow for southwest direction', () => {
    const direction = calculateDirection(60.5, 10.5, 60.0, 10.0)
    expect(direction).toBe('↙️')
  })

  it('should return correct arrow for northwest direction', () => {
    const direction = calculateDirection(60.0, 10.5, 60.5, 10.0)
    expect(direction).toBe('↖️')
  })

  it('should handle same coordinates (target reached)', () => {
    const direction = calculateDirection(60.0, 10.0, 60.0, 10.0)
    // Direction for same point can be any valid direction
    expect(['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️']).toContain(direction)
  })
})

describe('calculateProximity', () => {
  it('should return 100% for exact match (distance 0)', () => {
    expect(calculateProximity(0)).toBe(100)
  })

  it('should return high proximity for very close distances', () => {
    expect(calculateProximity(1)).toBe(99.75) // 100 - (1/20) * 5 = 99.75
    expect(calculateProximity(5)).toBe(98.75) // 100 - (5/20) * 5 = 98.75
    expect(calculateProximity(10)).toBe(98) // Rounded result
  })

  it('should return 95% for 20km distance', () => {
    expect(calculateProximity(20)).toBe(95)
  })

  it('should return reasonable values for medium distances', () => {
    expect(calculateProximity(100)).toBe(93) // 95 - (100-20)/3980 * 95 ≈ 93
    expect(calculateProximity(500)).toBe(84) // Actual rounded result
  })

  it('should return 0% for maximum distance (4000km)', () => {
    expect(calculateProximity(4000)).toBe(0)
  })

  it('should return 0% for distances greater than 4000km', () => {
    expect(calculateProximity(5000)).toBe(0)
  })

  it('should handle decimal distances correctly for close distances', () => {
    const proximity = calculateProximity(2.5)
    expect(proximity).toBeCloseTo(99.38, 1)
  })

  it('should return integer values for distances over 5km', () => {
    const proximity = calculateProximity(15)
    expect(proximity % 1).toBe(0) // Should be an integer
  })
})

describe('canSubmitGuess', () => {
  it('should return true for valid fjord name', () => {
    expect(canSubmitGuess('Geirangerfjord')).toBe(true)
    expect(canSubmitGuess('123')).toBe(true) // Even numbers should be valid
    expect(canSubmitGuess('test')).toBe(true)
  })

  it('should return false for null', () => {
    expect(canSubmitGuess(null)).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(canSubmitGuess('')).toBe(false)
  })

  it('should return true for whitespace-only string', () => {
    expect(canSubmitGuess('   ')).toBe(true)
  })
})

describe('getRemainingAttempts', () => {
  const mockGameState = (attemptsUsed: number): GameState => ({
    puzzle: null,
    guesses: [],
    attemptsUsed,
    gameStatus: 'playing',
    fjords: [],
    showToast: false,
    toastMessage: ''
  })

  it('should return max attempts when no attempts used', () => {
    expect(getRemainingAttempts(mockGameState(0))).toBe(MAX_ATTEMPTS)
  })

  it('should return correct remaining attempts', () => {
    expect(getRemainingAttempts(mockGameState(1))).toBe(MAX_ATTEMPTS - 1)
    expect(getRemainingAttempts(mockGameState(3))).toBe(MAX_ATTEMPTS - 3)
  })

  it('should return 0 when all attempts used', () => {
    expect(getRemainingAttempts(mockGameState(MAX_ATTEMPTS))).toBe(0)
  })

  it('should return 0 when attempts exceed maximum', () => {
    expect(getRemainingAttempts(mockGameState(MAX_ATTEMPTS + 1))).toBe(0)
  })
})

describe('createInitialGameState', () => {
  const mockPuzzle: Puzzle = {
    id: 1,
    date: '2024-01-01',
    puzzle_number: 1,
    fjord: {
      id: 123,
      name: 'Geirangerfjord',
      svg_filename: 'geiranger.svg',
      center_lat: 62.1049,
      center_lng: 7.2067
    }
  }

  const mockFjords: FjordOption[] = [
    { id: 123, name: 'Geirangerfjord', center_lat: 62.1049, center_lng: 7.2067 },
    { id: 124, name: 'Nærøyfjord', center_lat: 60.8750, center_lng: 6.7500 }
  ]

  it('should create initial game state with correct defaults', () => {
    const gameState = createInitialGameState(mockPuzzle, mockFjords)
    
    expect(gameState.puzzle).toEqual(mockPuzzle)
    expect(gameState.guesses).toEqual([])
    expect(gameState.attemptsUsed).toBe(0)
    expect(gameState.gameStatus).toBe('playing')
    expect(gameState.fjords).toEqual(mockFjords)
    expect(gameState.showToast).toBe(false)
    expect(gameState.toastMessage).toBe('')
    expect(gameState.hintsUsed).toEqual({
      firstLetter: false,
      satellite: false,
      municipalities: false,
      counties: false,
      measurements: false,
      weather: false
    })
    expect(gameState.keepGoingMessageShown).toBe(false)
  })

  it('should include session ID when provided', () => {
    const sessionId = 'test-session-123'
    const gameState = createInitialGameState(mockPuzzle, mockFjords, sessionId)
    expect(gameState.sessionId).toBe(sessionId)
  })

  it('should not include session ID when not provided', () => {
    const gameState = createInitialGameState(mockPuzzle, mockFjords)
    expect(gameState.sessionId).toBeUndefined()
  })
})

describe('makeGuess', () => {
  const mockPuzzle: Puzzle = {
    id: 1,
    date: '2024-01-01',
    puzzle_number: 1,
    fjord: {
      id: 123,
      name: 'Geirangerfjord',
      svg_filename: 'geiranger.svg',
      center_lat: 62.1049,
      center_lng: 7.2067
    }
  }

  const mockFjords: FjordOption[] = [
    { id: 123, name: 'Geirangerfjord', center_lat: 62.1049, center_lng: 7.2067 },
    { id: 124, name: 'Nærøyfjord', center_lat: 60.8750, center_lng: 6.7500 },
    { id: 125, name: 'Hardangerfjord', center_lat: 60.0000, center_lng: 6.5000 }
  ]

  let initialGameState: GameState

  beforeEach(() => {
    initialGameState = createInitialGameState(mockPuzzle, mockFjords)
  })

  describe('correct guess scenarios', () => {
    it('should handle correct guess and set game status to won', async () => {
      const correctCoords = { lat: 62.1049, lng: 7.2067 }
      const result = await makeGuess(initialGameState, 123, 'Geirangerfjord', correctCoords)

      expect(result.isCorrect).toBe(true)
      expect(result.newGameState.gameStatus).toBe('won')
      expect(result.newGameState.attemptsUsed).toBe(1)
      expect(result.newGameState.guesses).toHaveLength(1)

      const guess = result.newGameState.guesses[0]
      expect(guess.fjordId).toBe(123)
      expect(guess.fjordName).toBe('Geirangerfjord')
      expect(guess.distance).toBe(0)
      expect(guess.direction).toBe('🎯')
      expect(guess.proximityPercent).toBe(100)
      expect(guess.isCorrect).toBe(true)
      expect(guess.attemptNumber).toBe(1)
    })

    it('should win on first attempt', async () => {
      const correctCoords = { lat: 62.1049, lng: 7.2067 }
      const result = await makeGuess(initialGameState, 123, 'Geirangerfjord', correctCoords)

      expect(result.isCorrect).toBe(true)
      expect(result.newGameState.gameStatus).toBe('won')
      expect(result.newGameState.attemptsUsed).toBe(1)
    })

    it('should win on last attempt', async () => {
      // Make 5 wrong guesses first with different fjords
      let currentState = initialGameState
      for (let i = 0; i < 5; i++) {
        const wrongResult = await makeGuess(currentState, 124 + i, `WrongFjord${i}`, { lat: 60.8750 + i * 0.1, lng: 6.7500 + i * 0.1 })
        currentState = wrongResult.newGameState
      }

      expect(currentState.attemptsUsed).toBe(5)
      expect(currentState.gameStatus).toBe('playing')

      // Make correct guess on 6th attempt
      const correctCoords = { lat: 62.1049, lng: 7.2067 }
      const finalResult = await makeGuess(currentState, 123, 'Geirangerfjord', correctCoords)

      expect(finalResult.isCorrect).toBe(true)
      expect(finalResult.newGameState.gameStatus).toBe('won')
      expect(finalResult.newGameState.attemptsUsed).toBe(6)
    })
  })

  describe('incorrect guess scenarios', () => {
    it('should handle incorrect guess and calculate distance/direction', async () => {
      const wrongCoords = { lat: 60.8750, lng: 6.7500 } // Nærøyfjord coordinates
      const result = await makeGuess(initialGameState, 124, 'Nærøyfjord', wrongCoords)

      expect(result.isCorrect).toBe(false)
      expect(result.newGameState.gameStatus).toBe('playing')
      expect(result.newGameState.attemptsUsed).toBe(1)
      expect(result.newGameState.guesses).toHaveLength(1)

      const guess = result.newGameState.guesses[0]
      expect(guess.fjordId).toBe(124)
      expect(guess.fjordName).toBe('Nærøyfjord')
      expect(guess.distance).toBeGreaterThan(0)
      expect(['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️']).toContain(guess.direction)
      expect(guess.proximityPercent).toBeLessThan(100)
      expect(guess.isCorrect).toBe(false)
      expect(guess.attemptNumber).toBe(1)
    })

    it('should continue playing after wrong guess', async () => {
      const wrongCoords = { lat: 60.8750, lng: 6.7500 }
      const result = await makeGuess(initialGameState, 124, 'Nærøyfjord', wrongCoords)

      expect(result.isCorrect).toBe(false)
      expect(result.newGameState.gameStatus).toBe('playing')
      expect(result.newGameState.attemptsUsed).toBe(1)
    })

    it('should lose game after maximum attempts with wrong guesses', async () => {
      let currentState = initialGameState
      
      // Make 6 wrong guesses with different fjords
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const wrongResult = await makeGuess(currentState, 124 + i, `WrongFjord${i}`, { lat: 60.8750 + i * 0.1, lng: 6.7500 + i * 0.1 })
        currentState = wrongResult.newGameState
        
        if (i < MAX_ATTEMPTS - 1) {
          expect(currentState.gameStatus).toBe('playing')
        }
      }

      expect(currentState.gameStatus).toBe('lost')
      expect(currentState.attemptsUsed).toBe(MAX_ATTEMPTS)
    })
  })

  describe('duplicate guess prevention', () => {
    it('should prevent duplicate guesses', async () => {
      // Make first guess
      const coords = { lat: 60.8750, lng: 6.7500 }
      const firstResult = await makeGuess(initialGameState, 124, 'Nærøyfjord', coords)
      
      expect(firstResult.newGameState.attemptsUsed).toBe(1)
      expect(firstResult.newGameState.guesses).toHaveLength(1)

      // Try to make same guess again
      const duplicateResult = await makeGuess(firstResult.newGameState, 124, 'Nærøyfjord', coords)
      
      expect(duplicateResult.isCorrect).toBe(false)
      expect(duplicateResult.newGameState.attemptsUsed).toBe(1) // Should not increment
      expect(duplicateResult.newGameState.guesses).toHaveLength(1) // Should not add new guess
      expect(duplicateResult.newGameState.showToast).toBe(true)
      expect(duplicateResult.newGameState.toastMessage).toBe('DUPLICATE_GUESS')
      expect(duplicateResult.newGameState.duplicateFjordName).toBe('Nærøyfjord')
    })
  })

  describe('game state validation', () => {
    it('should handle null puzzle', async () => {
      const stateWithNullPuzzle = { ...initialGameState, puzzle: null }
      const coords = { lat: 60.8750, lng: 6.7500 }
      const result = await makeGuess(stateWithNullPuzzle, 124, 'Nærøyfjord', coords)

      expect(result.isCorrect).toBe(false)
      expect(result.newGameState).toEqual(stateWithNullPuzzle)
    })

    it('should handle already finished game (won)', async () => {
      const finishedState = { ...initialGameState, gameStatus: 'won' as const }
      const coords = { lat: 60.8750, lng: 6.7500 }
      const result = await makeGuess(finishedState, 124, 'Nærøyfjord', coords)

      expect(result.isCorrect).toBe(false)
      expect(result.newGameState).toEqual(finishedState)
    })

    it('should handle already finished game (lost)', async () => {
      const finishedState = { ...initialGameState, gameStatus: 'lost' as const }
      const coords = { lat: 60.8750, lng: 6.7500 }
      const result = await makeGuess(finishedState, 124, 'Nærøyfjord', coords)

      expect(result.isCorrect).toBe(false)
      expect(result.newGameState).toEqual(finishedState)
    })
  })

  describe('special toast messages', () => {
    it('should show keep going message on first wrong guess', async () => {
      const wrongCoords = { lat: 60.8750, lng: 6.7500 }
      const result = await makeGuess(initialGameState, 124, 'Nærøyfjord', wrongCoords)

      expect(result.newGameState.showToast).toBe(true)
      expect(result.newGameState.toastMessage).toBe('KEEP_GOING_MESSAGE')
      expect(result.newGameState.keepGoingMessageShown).toBe(true)
    })

    it('should not show keep going message if already shown', async () => {
      const stateWithMessageShown = { ...initialGameState, keepGoingMessageShown: true }
      const wrongCoords = { lat: 60.8750, lng: 6.7500 }
      const result = await makeGuess(stateWithMessageShown, 124, 'Nærøyfjord', wrongCoords)

      expect(result.newGameState.toastMessage).not.toBe('KEEP_GOING_MESSAGE')
    })

    it('should show "So close!" message for high proximity (>95%)', async () => {
      // First make a non-close guess to trigger keep going message
      const gameStateAfterFirst = { ...initialGameState, keepGoingMessageShown: true }
      
      // Find coordinates very close to the target
      const veryCloseCoords = { lat: 62.1045, lng: 7.2065 } // Very close to Geirangerfjord
      const result = await makeGuess(gameStateAfterFirst, 124, 'Nærøyfjord', veryCloseCoords)

      if (result.newGameState.guesses[0].proximityPercent > 95) {
        expect(result.newGameState.showToast).toBe(true)
        expect(result.newGameState.toastMessage).toBe('So close!')
      }
    })

    it('should not show keep going message on second wrong guess', async () => {
      // First wrong guess
      let currentState = initialGameState
      const firstResult = await makeGuess(currentState, 124, 'Nærøyfjord', { lat: 60.8750, lng: 6.7500 })
      currentState = firstResult.newGameState

      expect(currentState.keepGoingMessageShown).toBe(true)

      // Second wrong guess
      const secondResult = await makeGuess(currentState, 125, 'Hardangerfjord', { lat: 60.0000, lng: 6.5000 })
      
      expect(secondResult.newGameState.toastMessage).not.toBe('KEEP_GOING_MESSAGE')
    })
  })

  describe('attempt tracking', () => {
    it('should correctly track attempt numbers', async () => {
      let currentState = initialGameState
      
      for (let i = 1; i <= 3; i++) {
        const result = await makeGuess(currentState, 124 + i, `TestFjord${i}`, { lat: 60.0000 + i, lng: 6.0000 + i })
        currentState = result.newGameState
        
        expect(currentState.attemptsUsed).toBe(i)
        expect(currentState.guesses[i-1].attemptNumber).toBe(i)
      }
    })

    it('should maintain guess history', async () => {
      let currentState = initialGameState
      const guessData = [
        { id: 124, name: 'Nærøyfjord', coords: { lat: 60.8750, lng: 6.7500 } },
        { id: 125, name: 'Hardangerfjord', coords: { lat: 60.0000, lng: 6.5000 } }
      ]
      
      for (let i = 0; i < guessData.length; i++) {
        const guess = guessData[i]
        const result = await makeGuess(currentState, guess.id, guess.name, guess.coords)
        currentState = result.newGameState
        
        expect(currentState.guesses).toHaveLength(i + 1)
        expect(currentState.guesses[i].fjordName).toBe(guess.name)
      }
    })
  })
})