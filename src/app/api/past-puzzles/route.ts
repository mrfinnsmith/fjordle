import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const { data, error } = await supabase.rpc('fjordle_get_past_puzzles')

        if (error) {
            console.error('RPC error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Error fetching past puzzles:', error)
        return NextResponse.json({
            error: 'Failed to fetch past puzzles'
        }, { status: 500 })
    }
}