'use client'

import { useEffect, useRef } from 'react'
import type L from 'leaflet'
import { useLanguage } from '@/lib/languageContext'
import { ShipPosition } from '@/lib/hurtigrutenApi'

interface HurtigrutenMapProps {
  ships: ShipPosition[]
}

export default function HurtigrutenMap({ ships }: HurtigrutenMapProps) {
  const { language } = useLanguage()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || ships.length === 0) return

    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    let cancelled = false

    const loadMap = async () => {
      const leaflet = (await import('leaflet')).default

      if (cancelled || !mapRef.current) return

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Center on Norway's coast
      const map = leaflet.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        touchZoom: true,
      }).setView([66.5, 14], 4)

      leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map)

      const makeShipIcon = (operator: 'hurtigruten' | 'havila') => {
        const color = operator === 'hurtigruten' ? '#1a5276' : '#0e6655'
        return leaflet.divIcon({
          className: '',
          html: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1.5"/>
            <path d="M14 7 L18 18 L14 16 L10 18 Z" fill="${color}"/>
          </svg>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
      }

      for (const ship of ships) {
        const icon = makeShipIcon(ship.operator)
        const port = ship.nearestPort || '?'
        const status = ship.isInPort
          ? (language === 'no' ? `I havn ved ${port}` : `In port at ${port}`)
          : `${ship.speed.toFixed(1)} kn`

        leaflet.marker([ship.lat, ship.lng], { icon })
          .bindPopup(`<strong>${ship.name}</strong><br/>${status}`)
          .addTo(map)
      }

      // Fit bounds to show all ships
      if (ships.length > 1) {
        const bounds = leaflet.latLngBounds(ships.map(s => [s.lat, s.lng] as [number, number]))
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 7 })
      }

      mapInstanceRef.current = map
    }

    loadMap()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [ships, language])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '450px', borderRadius: '6px' }}
    />
  )
}
