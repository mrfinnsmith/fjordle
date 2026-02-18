import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import FjordIndexContent, { FjordListItem } from './FjordIndexContent'

async function getAllFjords(): Promise<FjordListItem[]> {
    const [fjordsResult, junctionResult, countiesResult] = await Promise.all([
        supabase
            .from('fjordle_fjords')
            .select('id, name, slug')
            .eq('quarantined', false)
            .order('name'),
        supabase
            .from('fjordle_fjord_counties')
            .select('fjord_id, county_id'),
        supabase
            .from('fjordle_counties')
            .select('id, name'),
    ])

    if (fjordsResult.error || !fjordsResult.data) return []

    const countyMap = new Map<number, string>()
    for (const c of (countiesResult.data ?? [])) {
        countyMap.set(c.id, c.name)
    }

    const fjordCountyMap = new Map<number, string[]>()
    for (const jc of (junctionResult.data ?? [])) {
        const countyName = countyMap.get(jc.county_id)
        if (!countyName) continue
        if (!fjordCountyMap.has(jc.fjord_id)) {
            fjordCountyMap.set(jc.fjord_id, [])
        }
        fjordCountyMap.get(jc.fjord_id)!.push(countyName)
    }

    return fjordsResult.data.map(f => ({
        name: f.name,
        slug: f.slug,
        counties: (fjordCountyMap.get(f.id) ?? []).sort(),
    }))
}

export async function generateMetadata(): Promise<Metadata> {
    const language = getLanguageFromCookies()

    const title = language === 'no'
        ? 'Norske fjorder | Fjordle'
        : 'Norwegian fjords | Fjordle'

    const description = language === 'no'
        ? 'Utforsk alle norske fjorder i Fjordle. Se fakta og informasjon om hvert enkelt fjord.'
        : 'Explore all Norwegian fjords in Fjordle. View facts and information about each fjord.'

    return {
        title,
        description,
        robots: { index: true, follow: true },
        openGraph: { title, description },
        twitter: { title, description },
    }
}

export default async function FjordIndexPage() {
    const fjords = await getAllFjords()
    return <FjordIndexContent fjords={fjords} />
}
