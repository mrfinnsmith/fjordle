import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import { Fjord } from '@/types/game'
import FjordFactContent from './FjordFactContent'

interface PageProps {
    params: { slug: string }
}

interface FjordBySlugRow {
    fjord_id: number
    fjord_name: string
    slug: string
    svg_filename: string
    satellite_filename?: string
    center_lat: number
    center_lng: number
    municipalities?: string[]
    counties?: string[]
    wikipedia_url_no?: string
    wikipedia_url_en?: string
    wikipedia_url_nn?: string
    wikipedia_url_da?: string
    wikipedia_url_ceb?: string
    length_km?: number
    width_km?: number
    depth_m?: number
    measurement_source_url?: string
}

async function getFjordBySlug(slug: string): Promise<Fjord | null> {
    const { data, error } = await supabase.rpc('fjordle_get_fjord_by_slug', { p_slug: slug })
    if (error || !data || !Array.isArray(data) || data.length === 0) return null
    const row = data[0] as FjordBySlugRow
    return {
        id: row.fjord_id,
        name: row.fjord_name,
        svg_filename: row.svg_filename,
        satellite_filename: row.satellite_filename,
        center_lat: row.center_lat,
        center_lng: row.center_lng,
        municipalities: row.municipalities,
        counties: row.counties,
        wikipedia_url_no: row.wikipedia_url_no,
        wikipedia_url_en: row.wikipedia_url_en,
        wikipedia_url_nn: row.wikipedia_url_nn,
        wikipedia_url_da: row.wikipedia_url_da,
        wikipedia_url_ceb: row.wikipedia_url_ceb,
        length_km: row.length_km,
        width_km: row.width_km,
        depth_m: row.depth_m,
        measurement_source_url: row.measurement_source_url,
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const fjord = await getFjordBySlug(params.slug)
    if (!fjord) return {}

    const language = getLanguageFromCookies()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    const title = language === 'no'
        ? `${fjord.name} - fakta og informasjon | Fjordle`
        : `${fjord.name} - facts and information | Fjordle`

    const county = fjord.counties?.[0] ?? ''
    let descNO = `${fjord.name} er en norsk fjord`
    let descEN = `${fjord.name} is a Norwegian fjord`

    if (county) {
        descNO += ` i ${county}`
        descEN += ` in ${county}`
    }
    if (fjord.length_km != null) {
        descNO += `. ${fjord.length_km} km lang`
        descEN += `. ${fjord.length_km} km long`
    }
    if (fjord.depth_m != null) {
        descNO += ` og ${fjord.depth_m} m dyp`
        descEN += ` and ${fjord.depth_m} m deep`
    }
    descNO += '.'
    descEN += '.'

    const description = language === 'no' ? descNO : descEN

    const ogImage = fjord.satellite_filename
        ? `${siteUrl}/fjord_satellite/${fjord.satellite_filename}`
        : `${siteUrl}/fjord_svgs/${fjord.svg_filename}`

    return {
        title,
        description,
        robots: { index: true, follow: true },
        openGraph: {
            title,
            description,
            images: [ogImage],
        },
        twitter: {
            title,
            description,
            images: [ogImage],
        },
    }
}

export default async function FjordFactPage({ params }: PageProps) {
    const fjord = await getFjordBySlug(params.slug)
    if (!fjord) notFound()

    return <FjordFactContent fjord={fjord} />
}
