import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { supabase } from '@/lib/supabase'

function getStaticRoutes(): string[] {
    const appDir = path.join(process.cwd(), 'src/app')
    const routes = ['/']

    const scanDir = (dir: string, basePath: string = '') => {
        const items = fs.readdirSync(dir, { withFileTypes: true })

        for (const item of items) {
            if (item.isDirectory() && !item.name.startsWith('_') && !item.name.startsWith('[') && item.name !== 'api') {
                const routePath = `${basePath}/${item.name}`
                const fullPath = path.join(dir, item.name)

                // Check if directory contains a page.tsx file
                if (fs.existsSync(path.join(fullPath, 'page.tsx'))) {
                    routes.push(routePath)
                }

                // Recursively scan subdirectories
                scanDir(fullPath, routePath)
            }
        }
    }

    scanDir(appDir)
    return routes
}

async function getCountySlugs(): Promise<string[]> {
    const { data } = await supabase
        .from('fjordle_counties')
        .select('slug')
        .order('name')

    return (data ?? []).map(c => c.slug).filter(Boolean)
}

async function getFjordSlugs(): Promise<string[]> {
    const slugs: string[] = []
    const pageSize = 1000
    let offset = 0

    while (true) {
        const { data } = await supabase
            .from('fjordle_fjords')
            .select('slug')
            .not('slug', 'is', null)
            .order('name')
            .range(offset, offset + pageSize - 1)

        if (!data || data.length === 0) break
        slugs.push(...data.map(f => f.slug).filter(Boolean))
        if (data.length < pageSize) break
        offset += pageSize
    }

    return slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    const staticRoutes = getStaticRoutes()
    const [pastPuzzles, countySlugs, fjordSlugs] = await Promise.all([
        supabase.rpc('fjordle_get_past_puzzles'),
        getCountySlugs(),
        getFjordSlugs(),
    ])

    const staticSitemapEntries = staticRoutes.map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '/' ? 'daily' as const : 'monthly' as const,
        priority: route === '/' ? 1 : 0.8,
    }))

    const puzzleSitemapEntries = (pastPuzzles.data || []).map((puzzle: { puzzle_number: number; last_presented: string | null }) => ({
        url: `${baseUrl}/puzzle/${puzzle.puzzle_number}`,
        lastModified: puzzle.last_presented ? new Date(puzzle.last_presented) : new Date(),
        changeFrequency: 'never' as const,
        priority: 0.6,
    }))

    const countySitemapEntries = countySlugs.map(slug => ({
        url: `${baseUrl}/fjorder/fylke/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    const fjordSitemapEntries = fjordSlugs.map(slug => ({
        url: `${baseUrl}/fjorder/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
    }))

    return [...staticSitemapEntries, ...puzzleSitemapEntries, ...countySitemapEntries, ...fjordSitemapEntries]
}