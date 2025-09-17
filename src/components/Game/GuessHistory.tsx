'use client'

import { Guess } from '@/types/game'
import { useLanguage } from '@/lib/languageContext'
import { formatDistance } from '@/lib/utils'
import { trackGamePerformance } from '@/lib/performance'
import React, { useMemo } from 'react'

interface GuessHistoryProps {
    guesses: Guess[]
}

function GuessHistory({ guesses }: GuessHistoryProps) {
    const { language, t } = useLanguage()

    // Memoize expensive distance formatting calculations
    const formattedGuesses = useMemo(() => {
        const startTime = performance.now()
        
        const formatted = guesses.map(guess => ({
            ...guess,
            formattedDistance: formatDistance(guess.distance, language)
        }))
        
        const duration = performance.now() - startTime
        trackGamePerformance('guess_history_format', duration)
        
        return formatted
    }, [guesses, language])

    if (guesses.length === 0) return null

    return (
        <div 
            className="guess-history" 
            role="region" 
            aria-label={t('a11y_guess_history')}
            aria-live="polite"
        >
            <div className="guess-history-grid">
                {formattedGuesses.map((guess, index) => (
                    <React.Fragment key={index}>
                        <div
                            className={`guess-item fjord-name ${guess.isCorrect ? 'correct' : ''}`}
                            role="gridcell"
                            aria-label={guess.isCorrect ? t('a11y_guess_correct') : undefined}
                        >
                            {guess.fjordName}
                        </div>

                        {!guess.isCorrect ? (
                            <>
                                <div
                                    className="guess-item"
                                    role="gridcell"
                                    aria-label={`${t('distance')}: ${guess.formattedDistance}`}
                                >
                                    {guess.formattedDistance}
                                </div>

                                <div
                                    className="guess-item"
                                    role="gridcell"
                                    aria-label={`${t('direction')}: ${guess.direction}`}
                                >
                                    {guess.direction}
                                </div>

                                <div
                                    className="guess-item"
                                    role="gridcell"
                                    aria-label={`${t('proximity')}: ${guess.proximityPercent}%`}
                                >
                                    {guess.proximityPercent}%
                                </div>
                            </>
                        ) : (
                            <div
                                className="guess-item correct"
                                style={{ gridColumn: 'span 3' }}
                                role="gridcell"
                                aria-label={t('a11y_guess_correct')}
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

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(GuessHistory)