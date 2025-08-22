import { supabase } from './supabase'
import { Puzzle, FjordOption } from '@/types/game'
import { getLocationDataCache, saveLocationDataCache } from './localStorage'

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
        wikipedia_url_en: puzzleData.wikipedia_url_en,
        wikipedia_url_nn: puzzleData.wikipedia_url_nn,
        wikipedia_url_da: puzzleData.wikipedia_url_da,
        wikipedia_url_ceb: puzzleData.wikipedia_url_ceb
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
        wikipedia_url_en: puzzleData.wikipedia_url_en,
        wikipedia_url_nn: puzzleData.wikipedia_url_nn,
        wikipedia_url_da: puzzleData.wikipedia_url_da,
        wikipedia_url_ceb: puzzleData.wikipedia_url_ceb
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

export async function getFjordLocationData(fjordId: number): Promise<{ municipalities: string[], counties: string[] }> {
  // Check cache first
  const cached = getLocationDataCache(fjordId)
  if (cached) {
    return cached
  }

  try {
    const [municipalityData, countyData] = await Promise.all([
      supabase
        .from('fjord_municipalities')
        .select('municipality_id')
        .eq('fjord_id', fjordId),
      supabase
        .from('fjord_counties')
        .select('county_id')
        .eq('fjord_id', fjordId)
    ])

    // Get municipality names
    const municipalityIds = municipalityData.data?.map(fm => fm.municipality_id).filter(Boolean) || []
    const municipalities: string[] = []

    if (municipalityIds.length > 0) {
      // Use explicit queries instead of .in() to avoid potential issues
      for (const municipalityId of municipalityIds) {
        const { data: municipalityName } = await supabase
          .from('municipalities')
          .select('name')
          .eq('id', municipalityId)
          .single()

        if (municipalityName?.name) {
          municipalities.push(municipalityName.name)
        }
      }
    }

    // Get county names
    const countyIds = countyData.data?.map(fc => fc.county_id).filter(Boolean) || []
    const counties: string[] = []

    if (countyIds.length > 0) {
      // Use explicit queries instead of .in() to avoid potential issues
      for (const countyId of countyIds) {
        const { data: countyName } = await supabase
          .from('counties')
          .select('name')
          .eq('id', countyId)
          .single()

        if (countyName?.name) {
          counties.push(countyName.name)
        }
      }
    }

    // Get counties from municipalities
    if (municipalityIds.length > 0) {
      for (const municipalityId of municipalityIds) {
        const { data: municipalityCounty } = await supabase
          .from('municipalities')
          .select('county_id')
          .eq('id', municipalityId)
          .single()

        if (municipalityCounty?.county_id) {
          const { data: derivedCountyName } = await supabase
            .from('counties')
            .select('name')
            .eq('id', municipalityCounty.county_id)
            .single()

          if (derivedCountyName?.name) {
            counties.push(derivedCountyName.name)
          }
        }
      }
    }

    // Combine and dedupe counties
    const allCounties = Array.from(new Set(counties))

    const result = {
      municipalities: municipalities.sort(),
      counties: allCounties.sort()
    }

    // Cache the result
    saveLocationDataCache(fjordId, result)

    return result
  } catch (error) {
    console.error('Error fetching location data:', error)
    return { municipalities: [], counties: [] }
  }
}

export async function fjordHasLocationData(fjordId: number): Promise<{ hasMunicipalities: boolean, hasCounties: boolean }> {
  try {
    const [municipalityData, countyData] = await Promise.all([
      supabase
        .from('fjord_municipalities')
        .select('municipality_id')
        .eq('fjord_id', fjordId)
        .limit(1),
      supabase
        .from('fjord_counties')
        .select('county_id')
        .eq('fjord_id', fjordId)
        .limit(1)
    ])

    return {
      hasMunicipalities: (municipalityData.data?.length || 0) > 0,
      hasCounties: (countyData.data?.length || 0) > 0 || (municipalityData.data?.length || 0) > 0
    }
  } catch {
    return { hasMunicipalities: false, hasCounties: false }
  }
}