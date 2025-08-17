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

        const { data, error } = await supabase.rpc('get_fjord_puzzle_by_number', {
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

        // Structure the response to match Puzzle interface
        const puzzle = {
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

        return NextResponse.json(puzzle)
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}