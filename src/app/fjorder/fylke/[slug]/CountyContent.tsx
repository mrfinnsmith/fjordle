'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'

export interface CountyFjord {
    name: string
    slug: string
    length_km: number | null
    width_km: number | null
    depth_m: number | null
}

interface CountyContentProps {
    countyName: string
    fjords: CountyFjord[]
}

export default function CountyContent({ countyName, fjords }: CountyContentProps) {
    const { t, language } = useLanguage()

    const deepest = fjords.reduce<CountyFjord | null>((best, f) => {
        if (f.depth_m == null) return best
        if (!best || best.depth_m == null || f.depth_m > best.depth_m) return f
        return best
    }, null)

    const longest = fjords.reduce<CountyFjord | null>((best, f) => {
        if (f.length_km == null) return best
        if (!best || best.length_km == null || f.length_km > best.length_km) return f
        return best
    }, null)

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">

                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {language === 'no' ? `Fjorder i ${countyName}` : `Fjords in ${countyName}`}
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    {language === 'no'
                        ? `${fjords.length} fjorder i dette fylket`
                        : `${fjords.length} fjords in this county`}
                </p>

                {(deepest || longest) && (
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <dl className="grid grid-cols-2 gap-4">
                            {deepest && deepest.depth_m != null && (
                                <div>
                                    <dt className="text-sm text-gray-500">
                                        {language === 'no' ? 'Dypeste fjord' : 'Deepest fjord'}
                                    </dt>
                                    <dd className="text-lg font-bold text-gray-900">
                                        {deepest.name}
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            {deepest.depth_m} m
                                        </span>
                                    </dd>
                                </div>
                            )}
                            {longest && longest.length_km != null && (
                                <div>
                                    <dt className="text-sm text-gray-500">
                                        {language === 'no' ? 'Lengste fjord' : 'Longest fjord'}
                                    </dt>
                                    <dd className="text-lg font-bold text-gray-900">
                                        {longest.name}
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            {longest.length_km} km
                                        </span>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                )}

                <ul className="space-y-1">
                    {fjords.map(fjord => (
                        <li key={fjord.slug}>
                            <Link
                                href={`/fjorder/${fjord.slug}`}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-gray-900">{fjord.name}</span>
                                <span className="text-sm text-gray-500">
                                    {[
                                        fjord.length_km != null ? `${fjord.length_km} km` : null,
                                        fjord.depth_m != null ? `${fjord.depth_m} m ${language === 'no' ? 'dyp' : 'deep'}` : null,
                                    ].filter(Boolean).join(' · ') || ''}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <nav className="mt-12 flex gap-4 text-sm text-gray-500">
                    <Link href="/fjorder/fylke" className="hover:text-gray-700 hover:underline">
                        {language === 'no' ? 'Alle fylker' : 'All counties'}
                    </Link>
                    <Link href="/fjorder" className="hover:text-gray-700 hover:underline">
                        {language === 'no' ? 'Alle fjorder' : 'All fjords'}
                    </Link>
                    <Link href="/" className="hover:text-gray-700 hover:underline">{t('play_fjordle')}</Link>
                    <Link href="/om" className="hover:text-gray-700 hover:underline">{t('about')}</Link>
                </nav>

            </div>
        </div>
    )
}
