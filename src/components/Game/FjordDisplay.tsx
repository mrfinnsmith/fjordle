'use client'

import Image from 'next/image'
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
                <Image
                    src={`/fjord_svgs/${svgFilename}`}
                    alt={t('a11y_current_fjord')}
                    width={400}
                    height={300}
                    className="fjord-svg"
                    priority
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

    // Memoize first letter hint display
    const firstLetterHintDisplay = useMemo(() => {
        if (!firstLetterHint) return null
        
        return (
            <div className="mt-4 text-center">
                <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                    💡 {t('hint_starts_with')} &apos;{firstLetterHint}&apos;
                </div>
            </div>
        )
    }, [firstLetterHint, t])

    // Memoize municipality hint display
    const municipalityHintDisplay = useMemo(() => {
        if (!municipalityHint || municipalityHint.length === 0) return null
        
        return (
            <div className="mt-4 text-center">
                <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                    🏘️ {t('municipality_hint')}: {municipalityHint.join(', ')}
                </div>
            </div>
        )
    }, [municipalityHint, t])

    // Memoize county hint display
    const countyHintDisplay = useMemo(() => {
        if (!countyHint || countyHint.length === 0) return null
        
        return (
            <div className="mt-2 text-center">
                <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-medium">
                    🏛️ {t('county_hint')}: {countyHint.join(', ')}
                </div>
            </div>
        )
    }, [countyHint, t])

    // Memoize measurements hint display
    const measurementsHintDisplay = useMemo(() => {
        if (!formattedMeasurements) return null
        
        return (
            <div className="mt-2 text-center">
                <div className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-sm font-medium">
                    📏 {t('measurements_hint')}: {formattedMeasurements}
                </div>
            </div>
        )
    }, [formattedMeasurements, t])

    // Memoize weather hint display
    const weatherHintDisplay = useMemo(() => {
        if (!weatherHint) return null
        
        return (
            <div className="mt-2 text-center">
                <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium">
                    🌤️ {t('weather_hint')}: {weatherHint.icon} {weatherHint.temperature}°C - {weatherHint.conditions}
                </div>
            </div>
        )
    }, [weatherHint, t])

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
            {firstLetterHintDisplay}
            {municipalityHintDisplay}
            {countyHintDisplay}
            {measurementsHintDisplay}
            {weatherHintDisplay}
        </div>
    )
}

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(FjordDisplay)