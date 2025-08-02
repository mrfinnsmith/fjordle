export interface GameState {
  puzzle: Puzzle | null
  guesses: Guess[]
  attemptsUsed: number
  gameStatus: 'playing' | 'won' | 'lost'
  fjords: FjordOption[]
  sessionId?: string
  showToast: boolean
  toastMessage: string
}

export interface Puzzle {
  id: number
  date: string
  puzzle_number: number
  fjord: Fjord
}

export interface Fjord {
  id: number
  name: string
  svg_filename: string
  center_lat: number
  center_lng: number
}

export interface FjordOption {
  id: number
  name: string
  center_lat: number
  center_lng: number
}

export interface Guess {
  fjordName: string
  distance: number
  direction: string
  proximityPercent: number
  isCorrect: boolean
  attemptNumber: number
}

export interface UserStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  lastPlayedDate: string
}

export interface GameProgress {
  sessionId: string
  puzzleId: number
  guesses: Guess[]
  attemptsUsed: number
  gameStatus: 'playing' | 'won' | 'lost'
  timestamp: number
}

// Session tracking types
export interface SessionData {
  session_id: string
  puzzle_id: number
  completed: boolean
  attempts_used: number
  won: boolean
  start_time: string
  end_time?: string
}

export interface GuessData {
  session_id: string
  puzzle_id: number
  guessed_fjord_id: number
  is_correct: boolean
  distance_km: number
  proximity_percent: number
  attempt_number: number
}

export const MAX_ATTEMPTS = 6

export interface Translations {
  [key: string]: string
}

export type Language = 'no' | 'en'