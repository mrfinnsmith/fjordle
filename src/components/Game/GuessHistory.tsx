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
            className="guess-journey"
            role="region"
            aria-label={t('a11y_guess_history')}
            aria-live="polite"
        >
            <div className="journey-label">{t('your_guesses')}</div>
            {formattedGuesses.map((guess, index) => (
                <div
                    key={index}
                    className="journey-step"
                    style={{ '--proximity': `${guess.proximityPercent}%` } as React.CSSProperties}
                >
                    <div className="step-marker" data-step={index + 1}></div>
                    <div className="step-content">
                        <div className="fjord-name-journey">{guess.fjordName}</div>
                        {!guess.isCorrect ? (
                            <div className="step-metrics">
                                <span className="metric-distance">{guess.formattedDistance}</span>
                                <span className="metric-arrow">{guess.direction}</span>
                                <span className="metric-proximity">{guess.proximityPercent}%</span>
                            </div>
                        ) : (
                            <div className="step-success">🎯 {t('correct')}</div>
                        )}
                    </div>
                    <div className="proximity-bar">
                        <div className="proximity-fill" style={{ width: `${guess.proximityPercent}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(GuessHistory)