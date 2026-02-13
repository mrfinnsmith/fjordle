'use client'

import { useLanguage } from '@/lib/languageContext'
import { trackGamePerformance } from '@/lib/performance'
import LoadingSpinner from './LoadingSpinner'
import React, { useMemo } from 'react'

interface FjordDisplayProps {
    svgFilename: string
    isGameOver: boolean
    correctAnswer?: string
    firstLetterHint?: string | undefined
    municipalityHint?: string[]
    countyHint?: string[]
    measurementsData?: {
        length_km?: number
        width_km?: number
        depth_m?: number
    } | undefined
    weatherHint?: { temperature: number; conditions: string; icon: string } | null
}

function FjordDisplay({
    svgFilename,
    isGameOver,
    correctAnswer,
    firstLetterHint,
    municipalityHint,
    countyHint,
    measurementsData,
    weatherHint
}: FjordDisplayProps) {
    const { t, language } = useLanguage()

    // Track component render performance
    const renderStartTime = useMemo(() => performance.now(), [])

    // Memoize expensive measurements formatting
    const formattedMeasurements = useMemo(() => {
        if (!measurementsData) return null
        
        const startTime = performance.now()
        
        const parts = []
        if (measurementsData.length_km) {
            if (language === 'no') {
                const formattedLength = measurementsData.length_km.toString().replace('.', ',')
                parts.push(`${formattedLength} km ${t('length')}`)
            } else {
                parts.push(`${measurementsData.length_km} km ${t('length')}`)
            }
        }
        if (measurementsData.width_km) {
            if (language === 'no') {
                const formattedWidth = measurementsData.width_km.toString().replace('.', ',')
                parts.push(`${formattedWidth} km ${t('width')}`)
            } else {
                parts.push(`${measurementsData.width_km} km ${t('width')}`)
            }
        }
        if (measurementsData.depth_m) {
            if (language === 'no') {
                const formattedDepth = measurementsData.depth_m.toString().replace('.', ',')
                parts.push(`${formattedDepth} m ${t('depth')}`)
            } else {
                parts.push(`${measurementsData.depth_m} m ${t('depth')}`)
            }
        }
        
        const duration = performance.now() - startTime
        trackGamePerformance('fjord_display_measurements', duration)
        
        return parts.join(', ')
    }, [measurementsData, language, t])

    // Memoize SVG display container to prevent unnecessary re-renders
    const svgContainer = useMemo(() => {
        if (!svgFilename) {
            return (
                <div className="fjord-svg-container">
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <LoadingSpinner />
                        <div className="text-lg mt-4">{t('no_fjord_to_display')}</div>
                    </div>
                </div>
            )
        }

        return (
            <div className="fjord-svg-container">
                <div className="mist-overlay"></div>
                <img
                    src={`/fjord_svgs/${svgFilename}`}
                    alt={t('a11y_current_fjord')}
                    width={400}
                    height={300}
                    className="fjord-svg fjord-svg-dramatic"
                />
            </div>
        )
    }, [svgFilename, t])

    // Memoize correct answer display
    const correctAnswerDisplay = useMemo(() => {
        if (!isGameOver || !correctAnswer) return null
        
        return (
            <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-green-700 mb-2">
                    {correctAnswer}
                </div>
            </div>
        )
    }, [isGameOver, correctAnswer])

    // Memoize hint cards display
    const hintCardsDisplay = useMemo(() => {
        const hasAnyHints = firstLetterHint ||
                           (municipalityHint && municipalityHint.length > 0) ||
                           (countyHint && countyHint.length > 0) ||
                           formattedMeasurements ||
                           weatherHint

        if (!hasAnyHints) return null

        return (
            <div className="hint-card-grid">
                {firstLetterHint && (
                    <div className="hint-card letter-hint">
                        <div className="hint-icon">🏔️</div>
                        <div className="hint-content">
                            <span className="hint-label">{t('hint_starts_with')}</span>
                            <span className="hint-value">{firstLetterHint}</span>
                        </div>
                    </div>
                )}

                {municipalityHint && municipalityHint.length > 0 && (
                    <div className="hint-card municipality-hint">
                        <div className="hint-icon">🏘️</div>
                        <div className="hint-content">
                            <span className="hint-label">{t('municipality_hint')}</span>
                            <span className="hint-value">{municipalityHint.join(', ')}</span>
                        </div>
                    </div>
                )}

                {countyHint && countyHint.length > 0 && (
                    <div className="hint-card county-hint">
                        <div className="hint-icon">🏛️</div>
                        <div className="hint-content">
                            <span className="hint-label">{t('county_hint')}</span>
                            <span className="hint-value">{countyHint.join(', ')}</span>
                        </div>
                    </div>
                )}

                {formattedMeasurements && (
                    <div className="hint-card measurements-hint">
                        <div className="hint-icon">📏</div>
                        <div className="hint-content">
                            <span className="hint-label">{t('measurements_hint')}</span>
                            <span className="hint-value">{formattedMeasurements}</span>
                        </div>
                    </div>
                )}

                {weatherHint && (
                    <div className="hint-card weather-hint">
                        <div className="hint-icon">{weatherHint.icon}</div>
                        <div className="hint-content">
                            <span className="hint-label">{t('weather_hint')}</span>
                            <span className="hint-value">{weatherHint.temperature}°C</span>
                            <span className="hint-detail">{weatherHint.conditions}</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }, [firstLetterHint, municipalityHint, countyHint, formattedMeasurements, weatherHint, t])

    // Track total render time on component unmount or significant prop changes
    React.useEffect(() => {
        const renderDuration = performance.now() - renderStartTime
        trackGamePerformance('fjord_display_render', renderDuration)
    }, [renderStartTime])

    if (!svgFilename) {
        return (
            <div className="fjord-display">
                {svgContainer}
            </div>
        )
    }

    return (
        <div className="fjord-display" role="img" aria-label={t('a11y_fjord_display')}>
            {svgContainer}
            {correctAnswerDisplay}
            {hintCardsDisplay}
        </div>
    )
}

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(FjordDisplay)