'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'

export interface FjordListItem {
    name: string
    slug: string
    counties: string[]
}

interface FjordIndexContentProps {
    fjords: FjordListItem[]
}

export default function FjordIndexContent({ fjords }: FjordIndexContentProps) {
    const { t } = useLanguage()
    const [search, setSearch] = useState('')
    const [selectedCounty, setSelectedCounty] = useState<string | null>(null)

    const allCounties = useMemo(() => {
        const countySet = new Set<string>()
        for (const f of fjords) {
            for (const c of f.counties) {
                countySet.add(c)
            }
        }
        return Array.from(countySet).sort()
    }, [fjords])

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return fjords.filter(f => {
            const matchesSearch = !term || f.name.toLowerCase().includes(term)
            const matchesCounty = !selectedCounty || f.counties.includes(selectedCounty)
            return matchesSearch && matchesCounty
        })
    }, [fjords, search, selectedCounty])

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">

                <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('fjorder_index_h1')}</h1>
                <p className="text-lg text-gray-600 mb-6">{t('fjorder_index_subtitle')}</p>

                <div className="mb-4">
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('fjorder_search_placeholder')}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={t('fjorder_search_placeholder')}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    <button
                        onClick={() => setSelectedCounty(null)}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                            selectedCounty === null
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                    >
                        {t('all')}
                    </button>
                    {allCounties.map(county => (
                        <button
                            key={county}
                            onClick={() => setSelectedCounty(selectedCounty === county ? null : county)}
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                                selectedCounty === county
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {county}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <p className="text-gray-500">{t('fjorder_no_results')}</p>
                ) : (
                    <ul className="space-y-1">
                        {filtered.map(fjord => (
                            <li key={fjord.slug}>
                                <Link
                                    href={`/fjorder/${fjord.slug}`}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-900">{fjord.name}</span>
                                    {fjord.counties.length > 0 && (
                                        <span className="text-sm text-gray-500">{fjord.counties.join(', ')}</span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                <nav className="mt-12 flex gap-4 text-sm text-gray-500">
                    <Link href="/" className="hover:text-gray-700 hover:underline">{t('play_fjordle')}</Link>
                    <Link href="/om" className="hover:text-gray-700 hover:underline">{t('about')}</Link>
                    <Link href="/hvordan-spille" className="hover:text-gray-700 hover:underline">{t('how_to_play')}</Link>
                </nav>

            </div>
        </div>
    )
}
