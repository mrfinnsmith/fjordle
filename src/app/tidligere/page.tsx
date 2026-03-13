import { supabase } from '@/lib/supabase'
import PastPuzzlesList from './PastPuzzlesList'

interface PastPuzzle {
    puzzle_id: number
    puzzle_number: number
    fjord_name: string
    date: string
    difficulty_tier: number | null
}

async function getPastPuzzles(): Promise<PastPuzzle[]> {
    const { data, error } = await supabase.rpc('fjordle_get_past_puzzles')

    if (error) {
        console.error('RPC error:', error)
        return []
    }

    return data || []
}

export default async function PastPuzzlesPage() {
    const puzzles = await getPastPuzzles()

    return <PastPuzzlesList puzzles={puzzles} />
}
