import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
    request: NextRequest,
    { params }: { params: { number: string } }
) {
    try {
        const puzzleNumber = parseInt(params.number)

        if (isNaN(puzzleNumber)) {
            return NextResponse.json(
                { error: 'Invalid puzzle number' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase.rpc('fjordle_get_fjord_puzzle_by_number', {
            puzzle_num: puzzleNumber
        })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 })
        }

        const puzzleData = data[0]

        // Fetch full fjord data including measurements
        const { data: fjordData, error: fjordError } = await supabase
            .from('fjordle_fjords')
            .select('id, name, svg_filename, satellite_filename, center_lat, center_lng, wikipedia_url_no, wikipedia_url_en, wikipedia_url_nn, wikipedia_url_da, wikipedia_url_ceb, length_km, width_km, depth_m, measurement_source_url')
            .eq('id', puzzleData.fjord_id)
            .single()

        if (fjordError) {
            console.error('Error fetching fjord data:', fjordError)
            return NextResponse.json({ error: 'Error fetching fjord data' }, { status: 500 })
        }

        // Structure the response to match Puzzle interface
        const puzzle = {
            id: puzzleData.puzzle_id,
            date: puzzleData.date,
            puzzle_number: puzzleData.puzzle_number,
            fjord: fjordData
        }

        return NextResponse.json(puzzle)
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}