import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        console.log('Calling get_past_puzzles RPC...')
        const { data, error } = await supabase.rpc('get_past_puzzles')

        if (error) {
            console.error('RPC error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        console.log(`Loading past puzzles... first one is ${data?.[0]?.fjord_name || 'unknown'}`)
        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Catch block error:', error)
        return NextResponse.json({
            error: 'Failed to fetch past puzzles'
        }, { status: 500 })
    }
}