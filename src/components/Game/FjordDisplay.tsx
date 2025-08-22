'use client'

import Image from 'next/image'
import { useLanguage } from '@/lib/languageContext'
import LoadingSpinner from './LoadingSpinner'

interface FjordDisplayProps {
    svgFilename?: string
    isGameOver: boolean
    correctAnswer?: string
    firstLetterHint?: string | null
    municipalityHint?: string[]
    countyHint?: string[]
}

export default function FjordDisplay({
    svgFilename,
    isGameOver,
    correctAnswer,
    firstLetterHint,
    municipalityHint,
    countyHint
}: FjordDisplayProps) {
    const { t } = useLanguage()

    if (!svgFilename) {
        return (
            <div className="fjord-display">
                <div className="fjord-svg-container">
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <LoadingSpinner />
                        <div className="text-lg mt-4">{t('no_fjord_to_display')}</div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fjord-display">
            <div className="fjord-svg-container">
                <Image
                    src={`/fjord_svgs/${svgFilename}`}
                    alt="Fjord outline"
                    width={400}
                    height={300}
                    className="fjord-svg"
                    priority
                />
            </div>

            {isGameOver && correctAnswer && (
                <div className="mt-4 text-center">
                    <div className="text-2xl font-bold text-green-700 mb-2">
                        {correctAnswer}
                    </div>
                </div>
            )}
            {firstLetterHint && (
                <div className="mt-4 text-center">
                    <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                        💡 {t('hint_starts_with')} &apos;{firstLetterHint}&apos;
                    </div>
                </div>
            )}
            {municipalityHint && municipalityHint.length > 0 && (
                <div className="mt-4 text-center">
                    <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                        🏘️ {t('municipality_hint')}: {municipalityHint.join(', ')}
                    </div>
                </div>
            )}
            {countyHint && countyHint.length > 0 && (
                <div className="mt-2 text-center">
                    <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium">
                        🏛️ {t('county_hint')}: {countyHint.join(', ')}
                    </div>
                </div>
            )}
        </div>
    )
}