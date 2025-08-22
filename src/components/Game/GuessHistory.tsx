'use client'

import { Guess } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'
import { formatDistance } from '@/lib/utils'
import React, { useState, useEffect } from 'react'

interface GuessHistoryProps {
    guesses: Guess[]
}

interface FormattedGuess extends Guess {
    formattedDistance: string
}

export default function GuessHistory({ guesses }: GuessHistoryProps) {
    const { language, t } = useLanguage()
    const [formattedGuesses, setFormattedGuesses] = useState<FormattedGuess[]>([])

    // Format distances when language or guesses change
    useEffect(() => {
        const formatted = guesses.map(guess => ({
            ...guess,
            formattedDistance: formatDistance(guess.distance, language)
        }))
        setFormattedGuesses(formatted)
    }, [guesses, language])

    if (guesses.length === 0) return null

    return (
        <div className="guess-history">
            <div className="guess-history-grid">
                {formattedGuesses.map((guess, index) => (
                    <React.Fragment key={index}>
                        <div
                            className={`guess-item fjord-name ${guess.isCorrect ? 'correct' : ''}`}
                        >
                            {guess.fjordName}
                        </div>

                        {!guess.isCorrect ? (
                            <>
                                <div
                                    className="guess-item"
                                >
                                    {guess.formattedDistance}
                                </div>

                                <div
                                    className="guess-item"
                                >
                                    {guess.direction}
                                </div>

                                <div
                                    className="guess-item"
                                >
                                    {guess.proximityPercent}%
                                </div>
                            </>
                        ) : (
                            <div
                                className="guess-item correct"
                                style={{ gridColumn: 'span 3' }}
                            >
                                🎯 {t('correct')}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}