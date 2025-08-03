'use client'

import { Guess } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'
import { formatNumber } from '@/lib/utils'

interface GuessHistoryProps {
    guesses: Guess[]
}

export default function GuessHistory({ guesses }: GuessHistoryProps) {
    const { language } = useLanguage()
    
    if (guesses.length === 0) return null

    return (
        <div className="guess-history">
            {guesses.map((guess, index) => (
                <div
                    key={index}
                    className={`guess-row ${guess.isCorrect ? 'correct' : ''}`}
                >
                    <div className="guess-fjord">
                        {guess.fjordName}
                    </div>

                    {!guess.isCorrect && (
                        <>
                            <div className="guess-distance">
                                {formatNumber(guess.distance, language)}km
                            </div>

                            <div className="guess-direction">
                                {guess.direction}
                            </div>

                            <div className="guess-proximity">
                                {guess.proximityPercent}%
                            </div>
                        </>
                    )}

                    {guess.isCorrect && (
                        <div className="guess-correct">
                            🎯 Correct!
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
} 