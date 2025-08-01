import { supabase } from './supabase'
import { Puzzle, FjordOption } from '@/types/game'

export async function getTodaysPuzzle(): Promise<Puzzle | null> {
  try {
    const { data, error } = await supabase.rpc('get_daily_fjord_puzzle')

    if (error) {
      console.error('Error fetching puzzle:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const puzzleData = data[0]
    const puzzle: Puzzle = {
      id: puzzleData.puzzle_id,
      date: new Date().toISOString().split('T')[0],
      puzzle_number: puzzleData.puzzle_number,
      fjord: {
        id: puzzleData.fjord_id,
        name: puzzleData.fjord_name,
        svg_filename: puzzleData.svg_filename,
        center_lat: puzzleData.center_lat,
        center_lng: puzzleData.center_lng
      }
    }

    return puzzle
  } catch (error) {
    console.error('Error fetching puzzle:', error)
    return null
  }
}

export async function getAllFjords(): Promise<FjordOption[]> {
  try {
    const { data, error } = await supabase
      .from('fjords')
      .select('id, name, center_lat, center_lng')
      .order('name')

    if (error) {
      console.error('Error fetching fjords:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching fjords:', error)
    return []
  }
}

export async function getPuzzleByNumber(puzzleNumber: number): Promise<Puzzle | null> {
  try {
    const { data, error } = await supabase.rpc('get_fjord_puzzle_by_number', {
      puzzle_num: puzzleNumber
    })

    if (error) {
      console.error('Error fetching puzzle by number:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    const puzzleData = data[0]
    return {
      id: puzzleData.puzzle_id,
      date: puzzleData.date,
      puzzle_number: puzzleData.puzzle_number,
      fjord: {
        id: puzzleData.fjord_id,
        name: puzzleData.fjord_name,
        svg_filename: puzzleData.svg_filename,
        center_lat: puzzleData.center_lat,
        center_lng: puzzleData.center_lng
      }
    }
  } catch (error) {
    console.error('Error fetching puzzle by number:', error)
    return null
  }
}