export interface GameState {
  puzzle: Puzzle | null
  guesses: Guess[]
  attemptsUsed: number
  gameStatus: 'playing' | 'won' | 'lost'
  fjords: FjordOption[]
  sessionId?: string
  showToast: boolean
  toastMessage: string
  statsUpdated?: boolean
  hintsUsed?: HintState
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
  wikipedia_url_no?: string
  wikipedia_url_en?: string
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

export interface HintState {
  firstLetter: boolean
}

export interface GameProgress {
  sessionId: string
  puzzleId: number
  guesses: Guess[]
  attemptsUsed: number
  gameStatus: 'playing' | 'won' | 'lost'
  statsUpdated: boolean
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

// Type-safe translation keys
export type TranslationKey =
  // Header
  | 'past_fjordles'
  | 'about'
  | 'how_to_play'
  | 'privacy'
  | 'no_puzzle_today'
  | 'no_puzzle_message'
  | 'game_description'

  // Game
  | 'guesses'
  | 'enter_fjord_name'
  | 'loading'
  | 'play'

  // Results Modal
  | 'congratulations'
  | 'next_time'
  | 'the_answer_was'
  | 'played'
  | 'win_percent'
  | 'current_streak'
  | 'max_streak'
  | 'share_results'
  | 'copied'
  | 'guessed_in_attempts'
  | 'current_streak_label'
  | 'days'
  | 'your_guesses'
  | 'statistics'
  | 'close'

  // Past Puzzles Page
  | 'back_to_today'
  | 'loading_past_puzzles'
  | 'error'
  | 'no_past_puzzles'
  | 'fjordle_number'

  // About Page
  | 'about_title'
  | 'about_created'
  | 'about_inspired'
  | 'about_collaborate'
  | 'about_platforms'

  // How to Play Page
  | 'how_to_play_title'
  | 'goal_title'
  | 'goal_text'
  | 'how_to_play_section'
  | 'study_shape'
  | 'study_shape_text'
  | 'make_guess'
  | 'make_guess_text'
  | 'use_clues'
  | 'use_clues_text'
  | 'triangulate'
  | 'triangulate_text'
  | 'feedback_title'
  | 'distance'
  | 'distance_text'
  | 'direction'
  | 'direction_text'
  | 'proximity'
  | 'proximity_text'
  | 'example_title'
  | 'example_guess'
  | 'example_result'
  | 'example_explanation'
  | 'weekly_difficulty'
  | 'monday_tuesday'
  | 'monday_tuesday_text'
  | 'wednesday_thursday'
  | 'wednesday_thursday_text'
  | 'friday_sunday'
  | 'friday_sunday_text'
  | 'tips_title'
  | 'start_broad'
  | 'start_broad_text'
  | 'use_geography'
  | 'use_geography_text'
  | 'learn_map'
  | 'learn_map_text'
  | 'shape_matters'
  | 'shape_matters_text'
  | 'winning_title'
  | 'winning_text'

  // Privacy Page
  | 'privacy_title'
  | 'last_updated'
  | 'overview_title'
  | 'overview_text'
  | 'info_collect_title'
  | 'analytics_data'
  | 'analytics_text'
  | 'pages_visit'
  | 'time_spent'
  | 'general_location'
  | 'device_browser'
  | 'how_found'
  | 'mixpanel_text'
  | 'game_data'
  | 'game_data_text'
  | 'guesses_sessions'
  | 'stats_local'
  | 'info_not_collect_title'
  | 'no_names'
  | 'no_accounts'
  | 'no_location'
  | 'no_personal'
  | 'how_use_title'
  | 'improve_experience'
  | 'understand_challenging'
  | 'monitor_performance'
  | 'data_storage_title'
  | 'progress_local'
  | 'anonymous_secure'
  | 'no_sell'
  | 'choices_title'
  | 'clear_browser'
  | 'disable_analytics'
  | 'works_without_cookies'
  | 'changes_policy_title'
  | 'changes_policy_text'
  | 'contact_title'
  | 'contact_text'
  | 'contact_info'
  | 'independent_project'

  // FAQ Page
  | 'faq'
  | 'faq_title'
  | 'faq_what_is_fjordle'
  | 'faq_what_is_fjordle_answer'
  | 'faq_arrows_distances'
  | 'faq_arrows_distances_answer'
  | 'faq_proximity_percentage'
  | 'faq_proximity_percentage_answer'
  | 'faq_previous_puzzles'
  | 'faq_previous_puzzles_answer'
  | 'faq_share_results'
  | 'faq_share_results_answer'
  | 'faq_data_source'
  | 'faq_data_source_answer'

  // Metadata
  | 'site_title'
  | 'site_description'
  | 'site_keywords'
  | 'unknown_fjord'
  | 'guess_button'
  | 'correct'
  | 'need_hint'
  | 'reveal_first_letter'
  | 'hint_starts_with'
  | 'hint_starts_with'
  | 'reveal'
  | 'already_used'
  | 'get_hint'