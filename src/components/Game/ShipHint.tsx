'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/languageContext'

interface ShipHintData {
    name: string
    destination: string
    lat: number
    lng: number
    distanceKm: number
}

interface ShipHintProps {
    fjordId: number
    isRevealed: boolean
    shipData?: ShipHintData | null
    onReveal: (shipData: ShipHintData) => void
}

export default function ShipHint({ fjordId, isRevealed, shipData, onReveal }: ShipHintProps) {
    const { t, language } = useLanguage()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchShipData = async () => {
        if (isLoading) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/ship/${fjordId}?lang=${language}`)

            if (!response.ok) {
                if (response.status === 503) {
                    setError(language === 'no' ? 'Skipdata ikke tilgjengelig akkurat nå' : 'Ship data not available right now')
                } else {
                    setError(language === 'no' ? 'Kunne ikke hente skipdata' : 'Could not fetch ship data')
                }
                return
            }

            const data: ShipHintData = await response.json()
            onReveal(data)
        } catch (err) {
            console.error('Error fetching ship data:', err)
            setError(language === 'no' ? 'Kunne ikke hente skipdata' : 'Could not fetch ship data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClick = () => {
        if (isRevealed && shipData) {
            onReveal(shipData)
        } else {
            fetchShipData()
        }
    }

    if (error) {
        return (
            <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex-1">
                    <h4 className="font-medium">{t('ship_hint')}</h4>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
                <h4 className="font-medium">{t('ship_hint')}</h4>
                <p className="text-sm text-gray-600">{t('ship_hint_description')}</p>
            </div>
            <div className="flex-shrink-0">
                {isRevealed && shipData ? (
                    <button
                        onClick={handleClick}
                        className="game-button secondary w-[140px]"
                    >
                        {t('view_again')}
                    </button>
                ) : (
                    <button
                        onClick={handleClick}
                        disabled={isLoading}
                        className="game-button primary w-[140px] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span className="text-sm">{t('loading')}</span>
                            </>
                        ) : (
                            t('reveal')
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
