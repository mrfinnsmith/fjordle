export interface WeatherData {
  temperature: number
  windspeed: number
  winddirection: number
  conditions: string
  time: string
}

export interface WeatherCacheEntry {
  data: WeatherData
  timestamp: number
}

export interface OpenMeteoResponse {
  current_weather: {
    temperature: number
    windspeed: number
    winddirection: number
    weathercode: number
    time: string
  }
}

export type WeatherCode = 
  | 0   // Clear sky
  | 1   // Mainly clear
  | 2   // Partly cloudy
  | 3   // Overcast
  | 45  // Fog
  | 48  // Depositing rime fog
  | 51  // Light drizzle
  | 53  // Moderate drizzle
  | 55  // Dense drizzle
  | 56  // Light freezing drizzle
  | 57  // Dense freezing drizzle
  | 61  // Slight rain
  | 63  // Moderate rain
  | 65  // Heavy rain
  | 66  // Light freezing rain
  | 67  // Heavy freezing rain
  | 71  // Slight snow fall
  | 73  // Moderate snow fall
  | 75  // Heavy snow fall
  | 77  // Snow grains
  | 80  // Slight rain showers
  | 81  // Moderate rain showers
  | 82  // Violent rain showers
  | 85  // Slight snow showers
  | 86  // Heavy snow showers
  | 95  // Thunderstorm
  | 96  // Thunderstorm with slight hail
  | 99  // Thunderstorm with heavy hail

export const WEATHER_CODE_MAP: Record<WeatherCode, { no: string; en: string }> = {
  0: { no: 'Klart', en: 'Clear sky' },
  1: { no: 'Hovedsakelig klart', en: 'Mainly clear' },
  2: { no: 'Delvis skyet', en: 'Partly cloudy' },
  3: { no: 'Overskyet', en: 'Overcast' },
  45: { no: 'Tåke', en: 'Fog' },
  48: { no: 'Rimtåke', en: 'Depositing rime fog' },
  51: { no: 'Lett duskregn', en: 'Light drizzle' },
  53: { no: 'Moderat duskregn', en: 'Moderate drizzle' },
  55: { no: 'Tett duskregn', en: 'Dense drizzle' },
  56: { no: 'Lett underkjølt duskregn', en: 'Light freezing drizzle' },
  57: { no: 'Tett underkjølt duskregn', en: 'Dense freezing drizzle' },
  61: { no: 'Lett regn', en: 'Slight rain' },
  63: { no: 'Moderat regn', en: 'Moderate rain' },
  65: { no: 'Kraftig regn', en: 'Heavy rain' },
  66: { no: 'Lett underkjølt regn', en: 'Light freezing rain' },
  67: { no: 'Kraftig underkjølt regn', en: 'Heavy freezing rain' },
  71: { no: 'Lett snøfall', en: 'Slight snow fall' },
  73: { no: 'Moderat snøfall', en: 'Moderate snow fall' },
  75: { no: 'Kraftig snøfall', en: 'Heavy snow fall' },
  77: { no: 'Snøkorn', en: 'Snow grains' },
  80: { no: 'Lett regnbyger', en: 'Slight rain showers' },
  81: { no: 'Moderate regnbyger', en: 'Moderate rain showers' },
  82: { no: 'Kraftige regnbyger', en: 'Violent rain showers' },
  85: { no: 'Lett snøbyger', en: 'Slight snow showers' },
  86: { no: 'Kraftige snøbyger', en: 'Heavy snow showers' },
  95: { no: 'Torden', en: 'Thunderstorm' },
  96: { no: 'Torden med lett hagl', en: 'Thunderstorm with slight hail' },
  99: { no: 'Torden med kraftig hagl', en: 'Thunderstorm with heavy hail' }
}

export const WIND_DIRECTION_MAP: Record<number, { no: string; en: string }> = {
  0: { no: 'N', en: 'N' },
  22.5: { no: 'NNØ', en: 'NNE' },
  45: { no: 'NØ', en: 'NE' },
  67.5: { no: 'ØNØ', en: 'ENE' },
  90: { no: 'Ø', en: 'E' },
  112.5: { no: 'ØSØ', en: 'ESE' },
  135: { no: 'SØ', en: 'SE' },
  157.5: { no: 'SSØ', en: 'SSE' },
  180: { no: 'S', en: 'S' },
  202.5: { no: 'SSV', en: 'SSW' },
  225: { no: 'SV', en: 'SW' },
  247.5: { no: 'VSV', en: 'WSW' },
  270: { no: 'V', en: 'W' },
  292.5: { no: 'VNV', en: 'WNW' },
  315: { no: 'NV', en: 'NW' },
  337.5: { no: 'NNV', en: 'NNW' }
}

export function getWindDirection(direction: number): { no: string; en: string } {
  const directions = Object.keys(WIND_DIRECTION_MAP).map(Number).sort((a, b) => a - b)
  
  for (let i = 0; i < directions.length; i++) {
    const current = directions[i]
    const next = directions[(i + 1) % directions.length]
    
    // Handle the wrap-around case (337.5 to 0)
    if (current === 337.5) {
      if (direction >= current || direction < next) {
        return WIND_DIRECTION_MAP[current]
      }
    } else {
      if (direction >= current && direction < next) {
        return WIND_DIRECTION_MAP[current]
      }
    }
  }
  
  return WIND_DIRECTION_MAP[0] // Default to North
}
