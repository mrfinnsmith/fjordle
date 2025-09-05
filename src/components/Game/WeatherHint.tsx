'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/languageContext'
import { WeatherData } from '@/types/weather'
import WeatherModal from './WeatherModal'

interface WeatherHintProps {
    fjordId: number
    isRevealed: boolean
    weatherData?: { temperature: number; conditions: string; icon: string } | null
    onReveal: (weatherData: { temperature: number; conditions: string; icon: string }) => void
}

export default function WeatherHint({ fjordId, isRevealed, weatherData, onReveal }: WeatherHintProps) {
    const { t, language } = useLanguage()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [fullWeatherData, setFullWeatherData] = useState<WeatherData | null>(null)

    const fetchWeather = async () => {
        if (isRevealed || isLoading) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/weather/${fjordId}?lang=${language}`)

            if (!response.ok) {
                if (response.status === 404) {
                    setError(language === 'no' ? 'Værdata ikke tilgjengelig for denne fjorden' : 'Weather data not available for this fjord')
                } else if (response.status === 503) {
                    setError(language === 'no' ? 'Værdata ikke tilgjengelig akkurat nå' : 'Weather data not available right now')
                } else {
                    setError(language === 'no' ? 'Kunne ikke hente værdata' : 'Could not fetch weather data')
                }
                return
            }

            const data: WeatherData = await response.json()
            setFullWeatherData(data)

            const getWeatherIcon = (conditions: string): string => {
                const condition = conditions.toLowerCase()

                if (condition.includes('klart') || condition.includes('clear')) return '☀️'
                if (condition.includes('skyet') || condition.includes('cloudy')) return '⛅'
                if (condition.includes('overskyet') || condition.includes('overcast')) return '☁️'
                if (condition.includes('regn') || condition.includes('rain')) return '🌧️'
                if (condition.includes('snø') || condition.includes('snow')) return '❄️'
                if (condition.includes('tåke') || condition.includes('fog')) return '🌫️'
                if (condition.includes('torden') || condition.includes('thunder')) return '⛈️'
                if (condition.includes('duskregn') || condition.includes('drizzle')) return '🌦️'

                return '🌤️' // Default
            }

            onReveal({
                temperature: data.temperature,
                conditions: data.conditions,
                icon: getWeatherIcon(data.conditions)
            })
        } catch (err) {
            console.error('Error fetching weather:', err)
            setError(language === 'no' ? 'Kunne ikke hente værdata' : 'Could not fetch weather data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReveal = () => {
        if (isRevealed && fullWeatherData) {
            setShowModal(true)
        } else {
            fetchWeather()
        }
    }

    if (error) {
        return (
            <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex-1">
                    <h4 className="font-medium">{t('weather_hint')}</h4>
                    <p className="text-sm text-red-600">⚠️ {error}</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex-1">
                    <h4 className="font-medium">{t('weather_hint')}</h4>
                    <p className="text-sm text-gray-600">{t('weather_hint_description')}</p>
                </div>
                <div className="flex-shrink-0">
                    {isRevealed && weatherData ? (
                        <div className="flex items-center gap-2 text-sm min-w-[140px] justify-end" style={{ color: 'var(--norwegian-red)' }}>
                            <span className="text-lg">{weatherData.icon}</span>
                            <span>{weatherData.temperature}°C</span>
                        </div>
                    ) : isRevealed ? (
                        <button
                            onClick={handleReveal}
                            className="game-button secondary w-[140px]"
                        >
                            {t('view_again')}
                        </button>
                    ) : (
                        <button
                            onClick={handleReveal}
                            disabled={isLoading}
                            className="game-button primary w-[140px] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span className="text-sm">
                                        {t('loading')}
                                    </span>
                                </>
                            ) : (
                                t('reveal')
                            )}
                        </button>
                    )}
                </div>
            </div>

            {showModal && fullWeatherData && (
                <WeatherModal
                    weatherData={fullWeatherData}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}
