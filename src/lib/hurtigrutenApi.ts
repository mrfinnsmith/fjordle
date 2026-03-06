import { getTrackedShipPositions, BarentsWatchVessel } from './shipApi'
import { COASTAL_SHIPS, COASTAL_PORTS, CoastalShip } from './hurtigrutenData'

export interface ShipWeather {
  temperature: number
  windSpeed: number
  symbolCode: string
}

export interface ShipPosition {
  mmsi: number
  name: string
  operator: 'hurtigruten' | 'havila'
  lat: number
  lng: number
  speed: number
  course: number
  destination: string
  lastUpdate: string
  isInPort: boolean
  nearestPort: string | null
  weather: ShipWeather | null
}

const SHIP_MAP = new Map<number, CoastalShip>(
  COASTAL_SHIPS.map(s => [s.mmsi, s])
)

function findNearestPort(lat: number, lng: number): string | null {
  let nearest: string | null = null
  let minDist = Infinity

  for (const port of COASTAL_PORTS) {
    const dLat = lat - port.lat
    const dLng = lng - port.lng
    const dist = dLat * dLat + dLng * dLng
    if (dist < minDist) {
      minDist = dist
      nearest = port.name
    }
  }

  return nearest
}

async function fetchWeather(lat: number, lng: number): Promise<ShipWeather | null> {
  try {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Fjordle/1.0 https://fjordle.lol/',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return null

    const data = await response.json()
    const instant = data?.properties?.timeseries?.[0]?.data?.instant?.details
    const next1h = data?.properties?.timeseries?.[0]?.data?.next_1_hours?.summary

    if (!instant) return null

    return {
      temperature: Math.round(instant.air_temperature ?? 0),
      windSpeed: Math.round((instant.wind_speed ?? 0) * 10) / 10,
      symbolCode: next1h?.symbol_code ?? 'cloudy',
    }
  } catch {
    return null
  }
}

function vesselToPosition(vessel: BarentsWatchVessel, ship: CoastalShip): Omit<ShipPosition, 'weather'> {
  const [lng, lat] = vessel.geometry.coordinates
  const isInPort = vessel.sog < 0.5

  return {
    mmsi: vessel.mmsi,
    name: ship.name,
    operator: ship.operator,
    lat,
    lng,
    speed: vessel.sog,
    course: vessel.cog,
    destination: vessel.destination?.trim() || '',
    lastUpdate: vessel.timeStamp,
    isInPort,
    nearestPort: findNearestPort(lat, lng),
  }
}

export async function getCoastalShipPositions(): Promise<ShipPosition[]> {
  try {
    const vessels = await getTrackedShipPositions()

    const positions: Omit<ShipPosition, 'weather'>[] = []
    for (const vessel of vessels) {
      const ship = SHIP_MAP.get(vessel.mmsi)
      if (ship) {
        positions.push(vesselToPosition(vessel, ship))
      }
    }

    // Fetch weather for all ships in parallel
    const weatherResults = await Promise.allSettled(
      positions.map(p => fetchWeather(p.lat, p.lng))
    )

    return positions.map((pos, i) => ({
      ...pos,
      weather: weatherResults[i].status === 'fulfilled' ? weatherResults[i].value : null,
    }))
  } catch {
    return []
  }
}
