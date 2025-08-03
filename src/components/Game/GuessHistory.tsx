'use client'

import { Guess } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'
import { formatNumber } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface GuessHistoryProps {
    guesses: Guess[]
}

interface FormattedGuess extends Guess {
    formattedDistance: string
}

export default function GuessHistory({ guesses }: GuessHistoryProps) {
    const { language } = useLanguage()
    const [formattedGuesses, setFormattedGuesses] = useState<FormattedGuess[]>([])

    // Format numbers when language or guesses change
    useEffect(() => {
        const formatted = guesses.map(guess => ({
            ...guess,
            formattedDistance: formatNumber(guess.distance, language)
        }))
        setFormattedGuesses(formatted)
    }, [guesses, language])

    if (guesses.length === 0) return null

    return (
        <div className="guess-history">
            {formattedGuesses.map((guess, index) => (
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
                                {guess.formattedDistance}km
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