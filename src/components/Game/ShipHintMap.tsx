'use client'

import { useEffect, useRef } from 'react'
import type L from 'leaflet'

interface ShipHintMapProps {
    shipLat: number
    shipLng: number
    shipName: string
    isOpen: boolean
    onClose: () => void
}

export default function ShipHintMap({ shipLat, shipLng, shipName, isOpen, onClose }: ShipHintMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)

    useEffect(() => {
        if (!isOpen || !mapRef.current) return

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

            // Clean up any existing map on this container
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }

            const map = leaflet.map(mapRef.current, {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
            }).setView([shipLat, shipLng], 7)

            leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                maxZoom: 19,
                subdomains: 'abcd',
            }).addTo(map)

            const shipIcon = leaflet.divIcon({
                className: '',
                html: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="12" fill="#1a5276" fill-opacity="0.15" stroke="#1a5276" stroke-width="1.5"/>
                    <path d="M14 7 L18 18 L14 16 L10 18 Z" fill="#1a5276"/>
                </svg>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            })

            leaflet.marker([shipLat, shipLng], { icon: shipIcon }).addTo(map)
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
    }, [isOpen, shipLat, shipLng])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
        >
            <div
                className="bg-white rounded-lg p-4 max-w-md w-full relative"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl z-10"
                    aria-label="Close"
                >
                    ×
                </button>
                <p className="text-sm text-gray-600 mb-3 pr-8">{shipName}</p>
                <div
                    ref={mapRef}
                    style={{ width: '100%', height: '350px', borderRadius: '6px' }}
                />
            </div>
        </div>
    )
}
