'use client'

import Image from 'next/image'
import { useLanguage } from '@/lib/languageContext'

export default function HowToPlay() {
    const { t } = useLanguage()

    return (
        <>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {t('how_to_play_title')}
                </h1>
            </div>
            <div className="space-y-6">

                <div className="space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">{t('goal_title')}</h2>
                        <p>{t('goal_text')}</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">{t('how_to_play_section')}</h2>
                        <div className="space-y-2">
                            <p><strong>{t('study_shape')}</strong> {t('study_shape_text')}</p>
                            <p><strong>{t('make_guess')}</strong> {t('make_guess_text')}</p>
                            <p><strong>{t('use_clues')}</strong> {t('use_clues_text')}</p>
                            <p><strong>{t('triangulate')}</strong> {t('triangulate_text')}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">{t('feedback_title')}</h2>
                        <div className="space-y-2">
                            <p><strong>{t('distance')}</strong> {t('distance_text')}</p>
                            <p><strong>{t('direction')}</strong> {t('direction_text')}</p>
                            <p><strong>{t('proximity')}</strong> {t('proximity_text')}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">{t('example_title')}</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="mb-2"><strong>{t('example_guess')}</strong> &quot;Geirangerfjord&quot;</p>
                            <p className="mb-2"><strong>{t('example_result')}</strong> 127 km ↗️ 45%</p>
                            <p className="text-sm text-gray-600">
                                {t('example_explanation')}
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">{t('hints_title')}</h2>
                        <div className="space-y-2">
                            <p>{t('hint_button_text')}</p>
                            <p><strong>💡 {t('first_letter_hint_title')}</strong> {t('first_letter_hint_text')}</p>
                            <p><strong>🏘️ {t('municipality_hint')}:</strong> {t('municipality_hint_description')}</p>
                            <p><strong>🏛️ {t('county_hint')}:</strong> {t('county_hint_description')}</p>
                            <p><strong>📏 {t('measurements_hint')}:</strong> {t('measurements_hint_description')}</p>
                            <p><strong>🌤️ {t('weather_hint')}:</strong> {t('weather_hint_description')}</p>
                            <div>
                                <p><strong>🛰️ {t('satellite_hint_title')}</strong> {t('satellite_hint_text')}</p>
                                <div className="mt-4">
                                    <Image
                                        src="/fjord_satellite/1617_Indre-oslofjord.png"
                                        alt={t('satellite_hint_example')}
                                        width={800}
                                        height={600}
                                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                        sizes="(max-width: 768px) 100vw, 448px"
                                    />
                                    <p className="text-sm text-gray-600 text-center mt-2">
                                        <em>{t('satellite_area_note')}</em>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>


                    <section>
                        <h2 className="text-xl font-semibold mb-3">{t('winning_title')}</h2>
                        <p>{t('winning_text')}</p>
                    </section>
                </div>
            </div>
        </>
    )
}