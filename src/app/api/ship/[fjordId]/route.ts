import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getNearestShip } from '@/lib/shipApi'

export async function GET(
    request: NextRequest,
    { params }: { params: { fjordId: string } }
) {
    try {
        const fjordId = parseInt(params.fjordId)
        const { searchParams } = new URL(request.url)
        const language = (searchParams.get('lang') as 'no' | 'en') || 'en'

        if (isNaN(fjordId)) {
            return NextResponse.json(
                { error: 'Invalid fjord ID' },
                { status: 400 }
            )
        }

        const { data: fjord, error } = await supabase
            .from('fjordle_fjords')
            .select('center_lat, center_lng')
            .eq('id', fjordId)
            .single()

        if (error || !fjord) {
            return NextResponse.json(
                { error: 'Fjord not found' },
                { status: 404 }
            )
        }

        if (!fjord.center_lat || !fjord.center_lng) {
            return NextResponse.json(
                { error: 'Fjord coordinates not available' },
                { status: 404 }
            )
        }

        const shipData = await getNearestShip(fjord.center_lat, fjord.center_lng, language)

        if (!shipData) {
            return NextResponse.json(
                { error: 'Ship data not available' },
                { status: 503 }
            )
        }

        return NextResponse.json(shipData)
    } catch (error) {
        console.error('Ship API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
