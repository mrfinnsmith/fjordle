export interface BarentsWatchVessel {
  mmsi: number
  name: string
  geometry: { type: string; coordinates: [number, number] }
  sog: number
  cog: number
  destination: string
  eta: string
  timeStamp: string
  shipType: number
}

export interface NearestShipData {
  name: string
  destination: string
  lat: number
  lng: number
  speed: number
  distanceKm: number
}

// Hurtigruten coastal voyage + Havila ships
const TRACKED_MMSIS = new Set([
  257200000, // Kong Harald
  259330000, // Nordkapp
  259139000, // Nordlys
  259371000, // Nordnorge
  258500000, // Richard With
  258465000, // Trollfjord
  258478000, // Vesterålen
  257753000, // Havila Capella
  257752000, // Havila Castor
  258094000, // Havila Polaris
])

// Destination code to readable name mapping
const DESTINATION_NAMES: Record<string, Record<string, string>> = {
  'NO BGO': { no: 'Bergen', en: 'Bergen' },
  'NO KKN': { no: 'Kirkenes', en: 'Kirkenes' },
  'NO TOS': { no: 'Tromsø', en: 'Tromsø' },
  'NO HVG': { no: 'Honningsvåg', en: 'Honningsvåg' },
  'NO SVJ': { no: 'Svolvær', en: 'Svolvær' },
  'NO BOO': { no: 'Bodø', en: 'Bodø' },
  'NO TRD': { no: 'Trondheim', en: 'Trondheim' },
  'NO AES': { no: 'Ålesund', en: 'Ålesund' },
  'NO MOL': { no: 'Molde', en: 'Molde' },
  'NO KSU': { no: 'Kristiansund', en: 'Kristiansund' },
  'NO HAM': { no: 'Hammerfest', en: 'Hammerfest' },
  'KIRKENES': { no: 'Kirkenes', en: 'Kirkenes' },
  'BERGEN': { no: 'Bergen', en: 'Bergen' },
  'NOKKN': { no: 'Kirkenes', en: 'Kirkenes' },
}

function formatDestination(raw: string, language: 'no' | 'en'): string {
  const trimmed = raw?.trim()
  if (!trimmed) return language === 'no' ? 'Ukjent' : 'Unknown'

  const mapped = DESTINATION_NAMES[trimmed]
  if (mapped) return mapped[language]

  // Try without spaces
  const noSpace = trimmed.replace(/\s+/g, '')
  for (const [key, val] of Object.entries(DESTINATION_NAMES)) {
    if (key.replace(/\s+/g, '') === noSpace) return val[language]
  }

  // Capitalize the raw destination as fallback
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Token cache
let cachedToken: { token: string; expires: number } | null = null

async function getBarentsWatchToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token
  }

  const clientId = process.env.BARENTSWATCH_CLIENT_ID
  const clientSecret = process.env.BARENTSWATCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('BarentsWatch credentials not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'api',
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const response = await fetch('https://id.barentswatch.no/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error(`BarentsWatch token request failed: ${response.status}`)
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000, // Refresh 1 min early
  }

  return cachedToken.token
}

// Ship position cache (refresh every 15 minutes)
let shipCache: { vessels: BarentsWatchVessel[]; timestamp: number } | null = null
const SHIP_CACHE_TTL = 15 * 60 * 1000

export async function getTrackedShipPositions(): Promise<BarentsWatchVessel[]> {
  if (shipCache && Date.now() - shipCache.timestamp < SHIP_CACHE_TTL) {
    return shipCache.vessels
  }

  const token = await getBarentsWatchToken()

  const response = await fetch(
    'https://www.barentswatch.no/bwapi/v2/geodata/ais/openpositions?modelType=Full',
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    throw new Error(`BarentsWatch AIS request failed: ${response.status}`)
  }

  const allVessels: BarentsWatchVessel[] = await response.json()
  const tracked = allVessels.filter(v => TRACKED_MMSIS.has(v.mmsi))

  shipCache = { vessels: tracked, timestamp: Date.now() }
  return tracked
}

export async function getNearestShip(
  fjordLat: number,
  fjordLng: number,
  language: 'no' | 'en' = 'en'
): Promise<NearestShipData | null> {
  const ships = await getTrackedShipPositions()

  if (ships.length === 0) return null

  let nearest: NearestShipData | null = null
  let minDistance = Infinity

  for (const ship of ships) {
    const [lng, lat] = ship.geometry.coordinates // GeoJSON: [lon, lat]
    const distance = haversineDistance(fjordLat, fjordLng, lat, lng)

    if (distance < minDistance) {
      minDistance = distance
      nearest = {
        name: ship.name,
        destination: formatDestination(ship.destination, language),
        lat,
        lng,
        speed: ship.sog,
        distanceKm: Math.round(distance),
      }
    }
  }

  return nearest
}
