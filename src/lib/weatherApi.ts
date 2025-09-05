import { WeatherData, WeatherCacheEntry, OpenMeteoResponse, WeatherCode, WEATHER_CODE_MAP } from '@/types/weather'

// Module-level cache with 2-hour TTL for multi-language weather data
const weatherCache = new Map<string, WeatherCacheEntry>()
const CACHE_TTL = 2 * 60 * 60 * 1000 // 2 hours in milliseconds

interface MultiLanguageWeatherData {
    no: WeatherData
    en: WeatherData
}

interface MultiLanguageWeatherCacheEntry {
    data: MultiLanguageWeatherData
    timestamp: number
}

export async function fetchWeatherData(latitude: number, longitude: number, language: 'no' | 'en' = 'en'): Promise<WeatherData | null> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        })

        if (!response.ok) {
            console.error('Weather API request failed:', response.status, response.statusText)
            return null
        }

        const data: OpenMeteoResponse = await response.json()

        if (!data.current_weather) {
            console.error('No current weather data in response')
            return null
        }

        const weatherCode = data.current_weather.weathercode as WeatherCode
        const conditions = WEATHER_CODE_MAP[weatherCode] || { no: 'Ukjent', en: 'Unknown' }

        return {
            temperature: Math.round(data.current_weather.temperature * 10) / 10, // Round to 1 decimal
            windspeed: Math.round(data.current_weather.windspeed * 10) / 10,
            winddirection: data.current_weather.winddirection,
            conditions: conditions[language], // Use the correct language
            time: data.current_weather.time
        }
    } catch (error) {
        console.error('Error fetching weather data:', error)
        return null
    }
}

export function getCachedWeatherData(fjordId: number, language: 'no' | 'en' = 'en'): WeatherData | null {
    const cacheKey = `weather_${fjordId}_${language}`
    const cached = weatherCache.get(cacheKey)

    if (!cached) {
        return null
    }

    const now = Date.now()
    if (now - cached.timestamp > CACHE_TTL) {
        // Cache expired, remove it
        weatherCache.delete(cacheKey)
        return null
    }

    return cached.data
}

export function setCachedWeatherData(fjordId: number, data: WeatherData, language: 'no' | 'en' = 'en'): void {
    const cacheKey = `weather_${fjordId}_${language}`
    weatherCache.set(cacheKey, {
        data,
        timestamp: Date.now()
    })
}

export async function getWeatherForFjord(fjordId: number, latitude: number, longitude: number, language: 'no' | 'en' = 'en'): Promise<WeatherData | null> {
    // Check if we have multi-language cached data
    const multiLangCacheKey = `weather_${fjordId}_multilang`
    const multiLangCached = weatherCache.get(multiLangCacheKey) as MultiLanguageWeatherCacheEntry | undefined
    
    if (multiLangCached) {
        const now = Date.now()
        if (now - multiLangCached.timestamp < CACHE_TTL) {
            return multiLangCached.data[language]
        }
    }

    // Fetch both languages at once
    const [noData, enData] = await Promise.all([
        fetchWeatherData(latitude, longitude, 'no'),
        fetchWeatherData(latitude, longitude, 'en')
    ])

    if (noData && enData) {
        const multiLangData: MultiLanguageWeatherData = {
            no: noData,
            en: enData
        }

        // Cache both languages together
        weatherCache.set(multiLangCacheKey, {
            data: multiLangData as unknown as WeatherData,
            timestamp: Date.now()
        })

        return multiLangData[language]
    }

    // Fallback to single language if multi-language fails
    const weatherData = await fetchWeatherData(latitude, longitude, language)
    if (weatherData) {
        setCachedWeatherData(fjordId, weatherData, language)
    }

    return weatherData
}

export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: weatherCache.size,
        keys: Array.from(weatherCache.keys())
    }
}

export function clearWeatherCache(): void {
    weatherCache.clear()
}
