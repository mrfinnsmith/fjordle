'use client'

import Image from 'next/image'

interface FjordDisplayProps {
    svgFilename?: string
    isGameOver: boolean
    correctAnswer?: string
}

export default function FjordDisplay({
    svgFilename,
    isGameOver,
    correctAnswer
}: FjordDisplayProps) {
    if (!svgFilename) {
        return (
            <div className="fjord-display">
                <div className="fjord-svg-container">
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Loading fjord...
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
                    alt={isGameOver && correctAnswer ? `${correctAnswer} fjordkontur` : "Norsk fjordkontur for gjettelek"}
                    className="fjord-svg"
                    width={400}
                    height={300}
                    onError={(e) => {
                        console.error('Failed to load SVG:', svgFilename)
                        e.currentTarget.style.display = 'none'
                    }}
                />
            </div>
            {isGameOver && correctAnswer && (
                <div className="correct-answer-reveal">
                    <div className="answer-label">Fjord:</div>
                    <div className="answer-name">{correctAnswer}</div>
                </div>
            )}
        </div>
    )
} 