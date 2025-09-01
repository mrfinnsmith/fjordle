'use client'

import { useLanguage } from '@/lib/languageContext'
import { WeatherData, getWindDirection } from '@/types/weather'

interface WeatherModalProps {
  weatherData: WeatherData
  onClose: () => void
}

export default function WeatherModal({ weatherData, onClose }: WeatherModalProps) {
  const { language } = useLanguage()

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

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString)
      return date.toLocaleString(language === 'no' ? 'nb-NO' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  const windDirection = getWindDirection(weatherData.winddirection)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'no' ? 'Værdata' : 'Weather Data'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Weather Icon and Conditions */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">
              {getWeatherIcon(weatherData.conditions)}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {weatherData.temperature}°C
            </div>
            <div className="text-lg text-gray-600">
              {weatherData.conditions}
            </div>
          </div>

          {/* Weather Details */}
          <div className="space-y-4">
            {/* Wind */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💨</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {language === 'no' ? 'Vind' : 'Wind'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {weatherData.windspeed} m/s {windDirection[language]}
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌡️</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {language === 'no' ? 'Temperatur' : 'Temperature'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {weatherData.temperature}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getWeatherIcon(weatherData.conditions)}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {language === 'no' ? 'Forhold' : 'Conditions'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {weatherData.conditions}
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {language === 'no' ? 'Sist oppdatert' : 'Last updated'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(weatherData.time)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {language === 'no'
                ? 'Værdata levert av Open-Meteo API'
                : 'Weather data provided by Open-Meteo API'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
