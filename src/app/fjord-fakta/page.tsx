'use client'

import { useLanguage } from '@/lib/languageContext'
import Link from 'next/link'

interface FjordSection {
    title: string
    content: string
}

export default function FjordFacts() {
    const { t } = useLanguage()

    const fjordSections: FjordSection[] = [
        {
            title: t('fjord_facts_overview_title'),
            content: t('fjord_facts_overview_content')
        },
        {
            title: t('fjord_facts_famous_title'),
            content: t('fjord_facts_famous_content')
        },
        {
            title: t('fjord_facts_records_title'),
            content: t('fjord_facts_records_content')
        },
        {
            title: t('fjord_facts_unesco_title'),
            content: t('fjord_facts_unesco_content')
        },
        {
            title: t('fjord_facts_geography_title'),
            content: t('fjord_facts_geography_content')
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {t('fjord_facts_title')}
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                        {t('fjord_facts_subtitle')}
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Link
                            href="/"
                            className="px-6 py-2 rounded-lg transition-colors norwegian-button"
                        >
                            {t('back_to_today')}
                        </Link>
                        <Link
                            href="/spoersmaal-og-svar"
                            className="underline"
                            style={{ color: '#00205B' }}
                        >
                            {t('faq')}
                        </Link>
                    </div>
                </div>

                <div className="space-y-8">
                    {fjordSections.map((section, index) => (
                        <section key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                                {section.title}
                            </h2>
                            <div 
                                className="text-gray-700 leading-relaxed prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: section.content }}
                            />
                        </section>
                    ))}
                </div>

            </div>
        </div>
    )
}