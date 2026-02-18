import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import { Fjord } from '@/types/game'
import FjordFactContent from './FjordFactContent'

interface PageProps {
    params: { slug: string }
}

async function getFjordBySlug(slug: string): Promise<Fjord | null> {
    const { data: fjordRow, error } = await supabase
        .from('fjordle_fjords')
        .select('id, name, slug, svg_filename, satellite_filename, center_lat, center_lng, length_km, width_km, depth_m, measurement_source_url, wikipedia_url_no, wikipedia_url_en, wikipedia_url_nn, wikipedia_url_da, wikipedia_url_ceb')
        .eq('slug', decodeURIComponent(slug))
        .single()

    if (error || !fjordRow) return null

    const [countyJunctionResult, munJunctionResult] = await Promise.all([
        supabase.from('fjordle_fjord_counties').select('county_id').eq('fjord_id', fjordRow.id),
        supabase.from('fjordle_fjord_municipalities').select('municipality_id').eq('fjord_id', fjordRow.id),
    ])

    const countyIds = countyJunctionResult.data?.map(r => r.county_id) ?? []
    const munIds = munJunctionResult.data?.map(r => r.municipality_id) ?? []

    const [countiesResult, municipalitiesResult] = await Promise.all([
        countyIds.length > 0
            ? supabase.from('fjordle_counties').select('name').in('id', countyIds)
            : Promise.resolve({ data: [] }),
        munIds.length > 0
            ? supabase.from('fjordle_municipalities').select('name').in('id', munIds)
            : Promise.resolve({ data: [] }),
    ])

    return {
        id: fjordRow.id,
        name: fjordRow.name,
        slug: fjordRow.slug,
        svg_filename: fjordRow.svg_filename,
        satellite_filename: fjordRow.satellite_filename,
        center_lat: fjordRow.center_lat,
        center_lng: fjordRow.center_lng,
        counties: (countiesResult.data ?? []).map(r => r.name).sort(),
        municipalities: (municipalitiesResult.data ?? []).map(r => r.name).sort(),
        wikipedia_url_no: fjordRow.wikipedia_url_no,
        wikipedia_url_en: fjordRow.wikipedia_url_en,
        wikipedia_url_nn: fjordRow.wikipedia_url_nn,
        wikipedia_url_da: fjordRow.wikipedia_url_da,
        wikipedia_url_ceb: fjordRow.wikipedia_url_ceb,
        length_km: fjordRow.length_km,
        width_km: fjordRow.width_km,
        depth_m: fjordRow.depth_m,
        measurement_source_url: fjordRow.measurement_source_url,
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
