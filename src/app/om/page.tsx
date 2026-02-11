'use client'

import { useLanguage } from '@/lib/languageContext'
import Link from 'next/link'

export default function About() {
    const { t } = useLanguage()

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {t('about_title')}
                </h1>
            </div>
            <div className="space-y-6">
                <div className="space-y-4">
                    <p>
                        {t('about_created')}{' '}
                        <a
                            href="https://mrfinnsmith.com"
                            className="font-medium hover:underline"
                        >
                            Finn Smith
                        </a>.
                    </p>
                    <p>
                        {t('about_inspired')}{' '}
                        <Link href="/hvordan-spille" className="underline">
                            {t('how_to_play')}
                        </Link>
                        {' '}for detailed instructions.
                    </p>
                    <p>
                        {t('about_collaborate')}{' '}
                        <a
                            href="https://mrfinnsmith.com/about"
                            className="font-medium hover:underline"
                        >
                            {t('about_platforms')}
                        </a>.
                    </p>
                </div>
            </div>
        </>
    )
}