import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import FjordIndexContent, { FjordListItem } from './FjordIndexContent'

async function getAllFjords(): Promise<FjordListItem[]> {
    const { data, error } = await supabase.rpc('get_fjords_with_counties')

    if (error || !data) return []

    return data.map((f: { fjord_name: string; fjord_slug: string; county_names: string[] }) => ({
        name: f.fjord_name,
        slug: f.fjord_slug,
        counties: f.county_names,
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
