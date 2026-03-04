import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import CountyIndexContent, { CountyListItem } from './CountyIndexContent'

async function getAllCounties(): Promise<CountyListItem[]> {
    const { data, error } = await supabase.rpc('get_county_fjord_counts')

    if (error || !data) return []

    return data.map((c: { name: string; slug: string; fjord_count: number }) => ({
        name: c.name,
        slug: c.slug,
        fjordCount: c.fjord_count,
    }))
}

export async function generateMetadata(): Promise<Metadata> {
    const language = getLanguageFromCookies()

    const title = language === 'no'
        ? 'Fylker i Norge | Fjordle'
        : 'Counties of Norway | Fjordle'

    const description = language === 'no'
        ? 'Utforsk norske fylker og fjordene i hvert fylke. Se alle fylkene i Norge med antall fjorder.'
        : 'Explore Norwegian counties and the fjords in each county. See all counties of Norway with fjord counts.'

    return {
        title,
        description,
        robots: { index: true, follow: true },
        openGraph: { title, description },
        twitter: { title, description },
    }
}

export default async function CountyIndexPage() {
    const counties = await getAllCounties()
    return <CountyIndexContent counties={counties} />
}
