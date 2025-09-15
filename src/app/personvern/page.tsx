'use client'

import { useLanguage } from '@/lib/languageContext'

export default function PrivacyPage() {
    const { t } = useLanguage()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t('privacy_title')}</h1>

            <p className="text-sm text-gray-600">
                <strong>{t('last_updated')}</strong> August 2, 2025
            </p>

            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('overview_title')}</h2>
                    <p>
                        {t('overview_text')}
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('info_collect_title')}</h2>

                    <h3 className="text-lg font-medium mt-4 mb-2">{t('analytics_data')}</h3>
                    <p className="mb-3">
                        {t('analytics_text')}
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                        <li>{t('pages_visit')}</li>
                        <li>{t('time_spent')}</li>
                        <li>{t('general_location')}</li>
                        <li>{t('device_browser')}</li>
                        <li>{t('how_found')}</li>
                    </ul>
                    <p>
                        {t('mixpanel_text')}
                    </p>

                    <h3 className="text-lg font-medium mt-4 mb-2">{t('game_data')}</h3>
                    <p className="mb-3">
                        {t('game_data_text')}
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>{t('guesses_sessions')}</li>
                        <li>{t('stats_local')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('info_not_collect_title')}</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>{t('no_names')}</li>
                        <li>{t('no_accounts')}</li>
                        <li>{t('no_location')}</li>
                        <li>{t('no_personal')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('how_use_title')}</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>{t('improve_experience')}</li>
                        <li>{t('understand_challenging')}</li>
                        <li>{t('monitor_performance')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('data_storage_title')}</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>{t('progress_local')}</li>
                        <li>{t('anonymous_secure')}</li>
                        <li>{t('no_sell')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('choices_title')}</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>{t('clear_browser')}</li>
                        <li>{t('disable_analytics')}</li>
                        <li>{t('works_without_cookies')}</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('changes_policy_title')}</h2>
                    <p>
                        {t('changes_policy_text')}
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3">{t('contact_title')}</h2>
                    <p>
                        {t('contact_text')}{' '}
                        <a
                            href="https://mrfinnsmith.com"
                            className="text-blue-600 hover:text-blue-800 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            https://mrfinnsmith.com
                        </a>{' '}
                        {t('contact_info')}
                    </p>
                </section>

                <hr className="border-gray-200" />

                <p className="text-sm text-gray-600 italic">
                    {t('independent_project')}
                </p>
            </div>
        </div>
    )
}