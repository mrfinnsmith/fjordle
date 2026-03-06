import { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import CountyContent, { CountyFjord } from './CountyContent'

interface PageProps {
    params: { slug: string }
}

interface CountyRow {
    id: number
    name: string
    slug: string
}

async function getCountyBySlugUncached(slug: string): Promise<CountyRow | null> {
    const { data, error } = await supabase
        .from('fjordle_counties')
        .select('id, name, slug')
        .eq('slug', decodeURIComponent(slug))
        .single()

    if (error || !data) return null
    return data
}

const getCountyBySlug = (slug: string) =>
    unstable_cache(
        () => getCountyBySlugUncached(slug),
        [`county-${slug}`],
        { revalidate: 86400 }
    )()

async function getFjordsInCountyUncached(countyId: number): Promise<CountyFjord[]> {
    const { data: junctions } = await supabase
        .from('fjordle_fjord_counties')
        .select('fjord_id')
        .eq('county_id', countyId)

    if (!junctions || junctions.length === 0) return []

    const fjordIds = junctions.map(j => j.fjord_id)

    const { data: fjords } = await supabase
        .from('fjordle_fjords')
        .select('id, name, slug, length_km, width_km, depth_m')
        .in('id', fjordIds)
        .eq('quarantined', false)
        .order('name')

    return (fjords ?? []).map(f => ({
        name: f.name,
        slug: f.slug,
        length_km: f.length_km,
        width_km: f.width_km,
        depth_m: f.depth_m,
    }))
}

const getFjordsInCounty = (countyId: number) =>
    unstable_cache(
        () => getFjordsInCountyUncached(countyId),
        [`county-fjords-${countyId}`],
        { revalidate: 86400 }
    )()

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const county = await getCountyBySlug(params.slug)
    if (!county) return {}

    const language = getLanguageFromCookies()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    const title = language === 'no'
        ? `Fjorder i ${county.name} | Fjordle`
        : `Fjords in ${county.name} | Fjordle`

    const description = language === 'no'
        ? `Utforsk alle fjorder i ${county.name}. Se fakta, målinger og informasjon om fjordene i dette fylket.`
        : `Explore all fjords in ${county.name}. View facts, measurements, and information about fjords in this county.`

    return {
        title,
        description,
        robots: { index: true, follow: true },
        alternates: {
            canonical: `${siteUrl}/fjorder/fylke/${params.slug}`,
        },
        openGraph: { title, description },
        twitter: { title, description },
    }
}

export default async function CountyPage({ params }: PageProps) {
    const county = await getCountyBySlug(params.slug)
    if (!county) notFound()

    const fjords = await getFjordsInCounty(county.id)

    return <CountyContent countyName={county.name} fjords={fjords} />
}
