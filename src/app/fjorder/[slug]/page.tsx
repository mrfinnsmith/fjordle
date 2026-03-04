import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getLanguageFromCookies } from '@/lib/serverCookies'
import { Fjord } from '@/types/game'
import FjordFactContent from './FjordFactContent'

interface PageProps {
    params: { slug: string }
}

interface FjordWithCountySlugs {
    fjord: Fjord
    countySlugs: Record<string, string>
}

async function getFjordBySlug(slug: string): Promise<FjordWithCountySlugs | null> {
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
            ? supabase.from('fjordle_counties').select('name, slug').in('id', countyIds)
            : Promise.resolve({ data: [] as { name: string; slug: string }[] }),
        munIds.length > 0
            ? supabase.from('fjordle_municipalities').select('name').in('id', munIds)
            : Promise.resolve({ data: [] }),
    ])

    const countySlugs: Record<string, string> = {}
    for (const c of (countiesResult.data ?? [])) {
        countySlugs[c.name] = c.slug
    }

    return {
        fjord: {
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
        },
        countySlugs,
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const result = await getFjordBySlug(params.slug)
    if (!result) return {}

    const { fjord } = result
    const language = getLanguageFromCookies()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    const title = language === 'no'
        ? `${fjord.name} - fakta og informasjon | Fjordle`
        : `${fjord.name} - facts and information | Fjordle`

    const countyStr = fjord.counties?.join(', ') ?? ''
    let descNO = `${fjord.name} er en norsk fjord`
    let descEN = `${fjord.name} is a Norwegian fjord`

    if (countyStr) {
        descNO += ` i ${countyStr}`
        descEN += ` in ${countyStr}`
    }
    descNO += '.'
    descEN += '.'

    const measurePartsNO: string[] = []
    const measurePartsEN: string[] = []
    if (fjord.length_km != null) {
        measurePartsNO.push(`${fjord.length_km} km lang`)
        measurePartsEN.push(`${fjord.length_km} km long`)
    }
    if (fjord.width_km != null) {
        measurePartsNO.push(`${fjord.width_km} km bred`)
        measurePartsEN.push(`${fjord.width_km} km wide`)
    }
    if (fjord.depth_m != null) {
        measurePartsNO.push(`${fjord.depth_m} m dyp`)
        measurePartsEN.push(`${fjord.depth_m} m deep`)
    }
    if (measurePartsNO.length > 0) {
        descNO += ` ${measurePartsNO.join(', ')}.`
        descEN += ` ${measurePartsEN.join(', ')}.`
    } else if (fjord.municipalities && fjord.municipalities.length > 0) {
        const munStr = fjord.municipalities.slice(0, 2).join(' og ')
        const munStrEN = fjord.municipalities.slice(0, 2).join(' and ')
        descNO += ` Fjorden ligger i ${munStr}.`
        descEN += ` The fjord is located in ${munStrEN}.`
    }

    descNO += ' Gjett fjorden i Fjordle, det daglige norske fjordspillet.'
    descEN += ' Guess the fjord in Fjordle, the daily Norwegian fjord guessing game.'

    const description = language === 'no' ? descNO : descEN

    const ogImage = fjord.satellite_filename
        ? `${siteUrl}/fjord_satellite/${fjord.satellite_filename}`
        : `${siteUrl}/fjord_svgs/${fjord.svg_filename}`

    return {
        title,
        description,
        robots: { index: true, follow: true },
        alternates: {
            canonical: `${siteUrl}/fjorder/${params.slug}`,
        },
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
    const result = await getFjordBySlug(params.slug)
    if (!result) notFound()

    return <FjordFactContent fjord={result.fjord} countySlugs={result.countySlugs} />
}
