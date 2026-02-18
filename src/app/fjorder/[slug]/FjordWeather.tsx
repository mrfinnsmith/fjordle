'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/languageContext'
import { WeatherData, getWindDirection } from '@/types/weather'

interface FjordWeatherProps {
    fjordId: number
}

function getWeatherIcon(conditions: string): string {
    const condition = conditions.toLowerCase()
    if (condition.includes('klart') || condition.includes('clear')) return '☀️'
    if (condition.includes('skyet') || condition.includes('cloudy')) return '⛅'
    if (condition.includes('overskyet') || condition.includes('overcast')) return '☁️'
    if (condition.includes('regn') || condition.includes('rain')) return '🌧️'
    if (condition.includes('snø') || condition.includes('snow')) return '❄️'
    if (condition.includes('tåke') || condition.includes('fog')) return '🌫️'
    if (condition.includes('torden') || condition.includes('thunder')) return '⛈️'
    if (condition.includes('duskregn') || condition.includes('drizzle')) return '🌦️'
    return '🌤️'
}

export default function FjordWeather({ fjordId }: FjordWeatherProps) {
    const { language } = useLanguage()
    const [weather, setWeather] = useState<WeatherData | null>(null)

    useEffect(() => {
        fetch(`/api/weather/${fjordId}?lang=${language}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then((data: WeatherData) => setWeather(data))
            .catch(() => {})
    }, [fjordId, language])

    if (!weather) return null

    const windDirection = getWindDirection(weather.winddirection)

    return (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
                <span className="text-4xl">{getWeatherIcon(weather.conditions)}</span>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{weather.temperature}°C</div>
                    <div className="text-gray-600">{weather.conditions}</div>
                </div>
                <div className="ml-auto text-right text-sm text-gray-500">
                    <div>💨 {weather.windspeed} m/s {windDirection[language]}</div>
                    <div className="mt-1 text-xs">Open-Meteo</div>
                </div>
            </div>
        </section>
    )
}
