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
        satellite_filename: puzzleData.satellite_filename,
        center_lat: puzzleData.center_lat,
        center_lng: puzzleData.center_lng,
        wikipedia_url_no: puzzleData.wikipedia_url_no,
        wikipedia_url_en: puzzleData.wikipedia_url_en
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
    // First, get the total count
    const { count } = await supabase
      .from('fjords')
      .select('*', { count: 'exact', head: true })

    if (!count) {
      return []
    }

    // Fetch all fjords using pagination to work around Supabase's 1000 row limit
    const allFjords: FjordOption[] = []
    const pageSize = 1000

    for (let offset = 0; offset < count; offset += pageSize) {
      const { data, error } = await supabase
        .from('fjords')
        .select('id, name, center_lat, center_lng')
        .eq('quarantined', false)
        .order('name')
        .range(offset, offset + pageSize - 1)

      if (error) {
        console.error(`Error fetching fjords page ${offset}-${offset + pageSize - 1}:`, error)
        continue
      }

      if (data) {
        allFjords.push(...data)
      }
    }

    return allFjords
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
        satellite_filename: puzzleData.satellite_filename,
        center_lat: puzzleData.center_lat,
        center_lng: puzzleData.center_lng,
        wikipedia_url_no: puzzleData.wikipedia_url_no,
        wikipedia_url_en: puzzleData.wikipedia_url_en
      }
    }
  } catch (error) {
    console.error('Error fetching puzzle by number:', error)
    return null
  }
}

export async function getAllPuzzleNumbers(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('puzzle_number')
      .order('puzzle_number')

    if (error || !data) return []
    return data.map(p => p.puzzle_number)
  } catch (error) {
    console.error('Error fetching puzzle numbers:', error)
    return []
  }
}