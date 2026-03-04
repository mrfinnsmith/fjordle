'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'

export interface CountyListItem {
    name: string
    slug: string
    fjordCount: number
}

interface CountyIndexContentProps {
    counties: CountyListItem[]
}

export default function CountyIndexContent({ counties }: CountyIndexContentProps) {
    const { t, language } = useLanguage()

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">

                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {language === 'no' ? 'Fylker i Norge' : 'Counties of Norway'}
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    {language === 'no'
                        ? 'Utforsk fjordene i hvert norsk fylke.'
                        : 'Explore the fjords in each Norwegian county.'}
                </p>

                <ul className="space-y-1">
                    {counties.map(county => (
                        <li key={county.slug}>
                            <Link
                                href={`/fjorder/fylke/${county.slug}`}
                                className="flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-gray-900">{county.name}</span>
                                <span className="text-sm text-gray-500">
                                    {county.fjordCount} {language === 'no' ? 'fjorder' : 'fjords'}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <nav className="mt-12 flex gap-4 text-sm text-gray-500">
                    <Link href="/fjorder" className="hover:text-gray-700 hover:underline">
                        {language === 'no' ? 'Alle fjorder' : 'All fjords'}
                    </Link>
                    <Link href="/" className="hover:text-gray-700 hover:underline">{t('play_fjordle')}</Link>
                    <Link href="/om" className="hover:text-gray-700 hover:underline">{t('about')}</Link>
                    <Link href="/hvordan-spille" className="hover:text-gray-700 hover:underline">{t('how_to_play')}</Link>
                </nav>

            </div>
        </div>
    )
}
