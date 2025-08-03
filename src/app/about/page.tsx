'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useLanguage } from '@/lib/languageContext'

export default function About() {
    const { t, mounted } = useLanguage()
    const router = useRouter()

    console.log('[DEBUG] AboutPage render - router:', router)
    console.log('[DEBUG] AboutPage render - mounted:', mounted)

    useEffect(() => {
        console.log('[DEBUG] AboutPage mounted')
        console.log('[DEBUG] Router in AboutPage:', router)
        if (typeof window !== 'undefined') {
          console.log('[DEBUG] Current URL:', window.location.href)
        }
    }, [router])

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