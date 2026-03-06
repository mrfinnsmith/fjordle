'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/lib/languageContext'
import { ShipPosition } from '@/lib/hurtigrutenApi'
import { COASTAL_PORTS, ROUTE_FJORDS } from '@/lib/hurtigrutenData'

const HurtigrutenMap = dynamic(() => import('./HurtigrutenMap'), { ssr: false })

interface HurtigrutenContentProps {
  ships: ShipPosition[]
}

function weatherIcon(symbolCode: string): string {
  if (symbolCode.includes('clear') || symbolCode.includes('fair')) return '\u2600\ufe0f'
  if (symbolCode.includes('partlycloudy')) return '\u26c5'
  if (symbolCode.includes('cloud')) return '\u2601\ufe0f'
  if (symbolCode.includes('rain') || symbolCode.includes('sleet')) return '\ud83c\udf27\ufe0f'
  if (symbolCode.includes('snow')) return '\ud83c\udf28\ufe0f'
  if (symbolCode.includes('thunder')) return '\u26a1'
  if (symbolCode.includes('fog')) return '\ud83c\udf2b\ufe0f'
  return '\u2601\ufe0f'
}

function formatDestination(raw: string): string {
  const trimmed = raw?.trim()
  if (!trimmed) return ''
  const locodeMap: Record<string, string> = {
    'NO BGO': 'Bergen', 'NO KKN': 'Kirkenes', 'NO TOS': 'Tromsø',
    'NO HVG': 'Honningsvåg', 'NO SVJ': 'Svolvær', 'NO BOO': 'Bodø',
    'NO TRD': 'Trondheim', 'NO AES': 'Ålesund', 'NO MOL': 'Molde',
    'NO KSU': 'Kristiansund', 'NO HAM': 'Hammerfest',
    'KIRKENES': 'Kirkenes', 'BERGEN': 'Bergen', 'NOKKN': 'Kirkenes',
  }
  return locodeMap[trimmed] || trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export default function HurtigrutenContent({ ships }: HurtigrutenContentProps) {
  const { t, language } = useLanguage()

  const sailingShips = ships.filter(s => !s.isInPort)
  const portShips = ships.filter(s => s.isInPort)
  const sortedShips = [...sailingShips, ...portShips]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('hurtigruten_title')}</h1>
        <p className="text-lg text-gray-600 mb-6">{t('hurtigruten_subtitle')}</p>

        {/* Ship Map */}
        {ships.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <HurtigrutenMap ships={ships} />
            {ships[0]?.lastUpdate && (
              <p className="text-xs text-gray-400 mt-2">
                {t('hurtigruten_positions_updated')}: {new Date(ships[0].lastUpdate).toLocaleString(language === 'no' ? 'nb-NO' : 'en-GB')}
              </p>
            )}
          </section>
        )}

        {/* Ship Cards */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('hurtigruten_ships_title')}</h2>

          {ships.length === 0 ? (
            <p className="text-gray-500">{t('hurtigruten_no_ships')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedShips.map(ship => {
                const dest = formatDestination(ship.destination)
                return (
                  <div
                    key={ship.mmsi}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{ship.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ship.operator === 'hurtigruten'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {ship.operator === 'hurtigruten' ? 'Hurtigruten' : 'Havila'}
                        </span>
                      </div>
                      {ship.weather && (
                        <div className="text-right">
                          <span className="text-lg">{weatherIcon(ship.weather.symbolCode)}</span>
                          <p className="text-sm text-gray-700">{ship.weather.temperature}°C</p>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      {ship.isInPort ? (
                        <p>{t('hurtigruten_in_port').replace('{port}', ship.nearestPort || '')}</p>
                      ) : (
                        <>
                          <p>{ship.speed.toFixed(1)} {t('hurtigruten_knots')}</p>
                          {dest && <p>{t('hurtigruten_heading_to').replace('{destination}', dest)}</p>}
                        </>
                      )}
                    </div>

                    {ship.weather && (
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'no' ? 'Vind' : 'Wind'}: {ship.weather.windSpeed} m/s
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Route Ports */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('hurtigruten_ports_title')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {COASTAL_PORTS.map(port => {
              const shipHere = ships.some(s => s.isInPort && s.nearestPort === port.name)
              return (
                <div
                  key={port.order}
                  className={`text-sm py-1.5 px-3 rounded ${
                    shipHere ? 'bg-blue-50 text-blue-800 font-medium' : 'text-gray-600'
                  }`}
                >
                  <span className="text-gray-400 mr-1.5">{port.order}.</span>
                  {port.name}
                  {shipHere && <span className="ml-1">{'\u{1F6A2}'}</span>}
                </div>
              )
            })}
          </div>
        </section>

        {/* Fjords Along the Route */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('hurtigruten_fjords_title')}</h2>
          <p className="text-gray-600 mb-4">{t('hurtigruten_fjords_subtitle')}</p>
          <p className="text-sm text-gray-500 mb-4">{t('hurtigruten_summer_detour')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ROUTE_FJORDS.map(fjord => {
              const nearPort = COASTAL_PORTS.find(p => p.order === fjord.nearPortOrder)
              return (
                <Link
                  key={fjord.slug}
                  href={`/fjorder/${fjord.slug}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-medium text-gray-900">{fjord.name}</h3>
                  {nearPort && (
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'no' ? 'Nær' : 'Near'} {nearPort.name}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

        {/* About Section */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('hurtigruten_about_title')}</h2>
          <p className="text-gray-700 mb-4">{t('hurtigruten_about_text')}</p>
          <p className="text-xs text-gray-400">{t('hurtigruten_attribution')}</p>
        </section>

      </div>
    </div>
  )
}
