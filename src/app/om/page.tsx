'use client'

import { useLanguage } from '@/lib/languageContext'

export default function About() {
    const { t } = useLanguage()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('about_title')}</h1>

            <div className="space-y-4">
                <p>
                    {t('about_created')}{' '}
                    <a
                        href="https://mrfinnsmith.com"
                        className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                    >
                        Finn Smith
                    </a>.
                </p>
                <p>
                    {t('about_inspired')}
                </p>
                <p>
                    {t('about_collaborate')}{' '}
                    <a
                        href="https://mrfinnsmith.com/about"
                        className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                    >
                        {t('about_platforms')}
                    </a>.
                </p>
            </div>
        </div>
    );
}