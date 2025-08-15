'use client'

import Image from 'next/image'
import { useLanguage } from '@/lib/languageContext'

interface FjordDisplayProps {
    svgFilename?: string
    isGameOver: boolean
    correctAnswer?: string
    firstLetterHint?: string | null
}

export default function FjordDisplay({
    svgFilename,
    isGameOver,
    correctAnswer,
    firstLetterHint
}: FjordDisplayProps) {
    const { t } = useLanguage()

    if (!svgFilename) {
        return (
            <div className="fjord-display">
                <div className="fjord-svg-container">
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="text-lg">No fjord to display</div>
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
                    <div className="text-lg font-semibold text-green-700 mb-2">
                        Answer revealed!
                    </div>
                    <div className="answer-name">{correctAnswer}</div>
                </div>
            )}
            {firstLetterHint && (
                <div className="mt-4 text-center">
                    <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                        💡 {t('hint_starts_with')} &apos;{firstLetterHint}&apos;
                    </div>
                </div>
            )}
        </div>
    )
}