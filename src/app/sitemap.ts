import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { getAllPuzzleNumbers } from '@/lib/puzzleApi'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    const staticRoutes = getStaticRoutes()
    const puzzleNumbers = await getAllPuzzleNumbers()

    const staticSitemapEntries = staticRoutes.map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '/' ? 'daily' as const : 'monthly' as const,
        priority: route === '/' ? 1 : 0.8,
    }))

    const puzzleSitemapEntries = puzzleNumbers.map(number => ({
        url: `${baseUrl}/puzzle/${number}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    return [...staticSitemapEntries, ...puzzleSitemapEntries]
}