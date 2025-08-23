'use client'

import { useLanguage } from '@/lib/languageContext'

interface MeasurementsHintProps {
    isRevealed: boolean
    measurements: {
        length_km?: number
        width_km?: number
        depth_m?: number
    }
    onReveal: () => void
}

export default function MeasurementsHint({ isRevealed, measurements, onReveal }: MeasurementsHintProps) {
    const { t, language } = useLanguage()

    const hasMeasurements = measurements.length_km || measurements.width_km || measurements.depth_m

    if (!hasMeasurements) {
        return null
    }

    const formatMeasurements = () => {
        const parts = []
        if (measurements.length_km) {
            if (language === 'no') {
                // Norwegian format: "1,5 km lengde" (comma as decimal separator, no colon)
                const formattedLength = measurements.length_km.toString().replace('.', ',')
                parts.push(`${formattedLength} km ${t('length')}`)
            } else {
                // English format: "1.5 km length" (period as decimal separator, no colon)
                parts.push(`${measurements.length_km} km ${t('length')}`)
            }
        }
        if (measurements.width_km) {
            if (language === 'no') {
                const formattedWidth = measurements.width_km.toString().replace('.', ',')
                parts.push(`${formattedWidth} km ${t('width')}`)
            } else {
                parts.push(`${measurements.width_km} km ${t('width')}`)
            }
        }
        if (measurements.depth_m) {
            if (language === 'no') {
                const formattedDepth = measurements.depth_m.toString().replace('.', ',')
                parts.push(`${formattedDepth} m ${t('depth')}`)
            } else {
                parts.push(`${measurements.depth_m} m ${t('depth')}`)
            }
        }
        return parts.join(', ')
    }

    return (
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
                <h4 className="font-medium">{t('measurements_hint')}</h4>
                <p className="text-sm text-gray-600">{t('measurements_hint_description')}</p>
            </div>
            <div className="flex-shrink-0">
                {isRevealed ? (
                    <div className="text-sm min-w-[140px] text-right" style={{ color: 'var(--norwegian-red)' }}>
                        {formatMeasurements()}
                    </div>
                ) : (
                    <button
                        onClick={onReveal}
                        className="game-button primary w-[140px]"
                    >
                        {t('reveal')}
                    </button>
                )}
            </div>
        </div>
    )
}
