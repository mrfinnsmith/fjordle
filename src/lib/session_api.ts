import { supabase } from './supabase'

export async function createSession(sessionId: string, puzzleId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_sessions')
      .insert({
        session_id: sessionId,
        puzzle_id: puzzleId,
        completed: false,
        attempts_used: 0,
        won: false,
        start_time: new Date().toISOString()
      })

    return !error
  } catch (error) {
    console.error('Error creating session:', error)
    return false
  }
}

export async function updateSession(
  sessionId: string,
  updates: { attempts_used?: number; won?: boolean; completed?: boolean }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('session_id', sessionId)

    return !error
  } catch (error) {
    console.error('Error updating session:', error)
    return false
  }
}

export async function completeSession(
  sessionId: string,
  attemptsUsed: number,
  won: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update({
        completed: true,
        attempts_used: attemptsUsed,
        won: won,
        end_time: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    return !error
  } catch (error) {
    console.error('Error completing session:', error)
    return false
  }
}

export async function recordGuess(guessData: {
  session_id: string
  puzzle_id: number
  guessed_fjord_id: number
  is_correct: boolean
  distance_km: number
  proximity_percent: number
  attempt_number: number
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('guesses')
      .insert({
        session_id: guessData.session_id,
        puzzle_id: guessData.puzzle_id,
        guessed_fjord_id: guessData.guessed_fjord_id,
        is_correct: guessData.is_correct,
        distance_km: guessData.distance_km,
        proximity_percent: guessData.proximity_percent,
        attempt_number: guessData.attempt_number
      })

    return !error
  } catch (error) {
    console.error('Error recording guess:', error)
    return false
  }
}

export async function getSessionExists(sessionId: string, puzzleId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('puzzle_id', puzzleId)
      .single()

    return !error && !!data
  } catch {
    return false
  }
}

export async function updateSessionHints(
  sessionId: string,
  hints: { firstLetter?: boolean; satellite?: boolean; municipalities?: boolean; counties?: boolean; measurements?: boolean; weather?: boolean }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('game_sessions')
      .update({ hints })
      .eq('session_id', sessionId)

    return !error
  } catch (error) {
    console.error('Error updating session hints:', error)
    return false
  }
}