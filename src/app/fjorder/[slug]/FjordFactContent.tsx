'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/languageContext'
import { Fjord } from '@/types/game'
import SatelliteImage from '@/components/shared/SatelliteImage'

interface FjordFactContentProps {
    fjord: Fjord
}

export default function FjordFactContent({ fjord }: FjordFactContentProps) {
    const { t } = useLanguage()

    const hasStats = fjord.length_km != null || fjord.width_km != null || fjord.depth_m != null

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">

                <h1 className="text-4xl font-bold text-gray-900 mb-2">{fjord.name}</h1>

                {fjord.counties && fjord.counties.length > 0 && (
                    <p className="text-lg text-gray-600 mb-6">
                        {fjord.counties.join(', ')}
                    </p>
                )}

                {hasStats && (
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            {t('fjord_key_stats')}
                        </h2>
                        <dl className="grid grid-cols-3 gap-4">
                            {fjord.length_km != null && (
                                <div>
                                    <dt className="text-sm text-gray-500 capitalize">{t('length')}</dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {fjord.length_km} <span className="text-sm font-normal">km</span>
                                    </dd>
                                </div>
                            )}
                            {fjord.width_km != null && (
                                <div>
                                    <dt className="text-sm text-gray-500 capitalize">{t('width')}</dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {fjord.width_km} <span className="text-sm font-normal">km</span>
                                    </dd>
                                </div>
                            )}
                            {fjord.depth_m != null && (
                                <div>
                                    <dt className="text-sm text-gray-500 capitalize">{t('depth')}</dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        {fjord.depth_m} <span className="text-sm font-normal">m</span>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                )}

                {fjord.satellite_filename && (
                    <section className="mb-6">
                        <SatelliteImage
                            satelliteFilename={fjord.satellite_filename}
                            alt={fjord.name}
                        />
                    </section>
                )}

                <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/fjord_svgs/${fjord.svg_filename}`}
                        alt={fjord.name}
                        className="w-full h-auto max-h-80 object-contain"
                    />
                </section>

                {fjord.municipalities && fjord.municipalities.length > 0 && (
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">
                            {t('municipalities')}
                        </h2>
                        <ul className="space-y-1">
                            {fjord.municipalities.map(m => (
                                <li key={m} className="text-gray-700">{m}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {(fjord.wikipedia_url_no || fjord.wikipedia_url_en) && (
                    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <ul className="space-y-2">
                            {fjord.wikipedia_url_no && (
                                <li>
                                    <a
                                        href={fjord.wikipedia_url_no}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-700 hover:underline"
                                    >
                                        {t('fjord_wikipedia_no')}
                                    </a>
                                </li>
                            )}
                            {fjord.wikipedia_url_en && (
                                <li>
                                    <a
                                        href={fjord.wikipedia_url_en}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-700 hover:underline"
                                    >
                                        {t('fjord_wikipedia_en')}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </section>
                )}

                <div className="text-center mt-8">
                    <Link href="/" className="px-6 py-2 rounded-lg transition-colors norwegian-button">
                        {t('play_fjordle')}
                    </Link>
                </div>

            </div>
        </div>
    )
}
