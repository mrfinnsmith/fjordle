'use client'

import { useState } from 'react'
import LoadingSpinner from '@/components/Game/LoadingSpinner'

interface SatelliteImageProps {
    satelliteFilename: string
    alt: string
}

export default function SatelliteImage({ satelliteFilename, alt }: SatelliteImageProps) {
    const [isLoading, setIsLoading] = useState(true)

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={`/fjord_satellite/${satelliteFilename}`}
                alt={alt}
                className={`w-full h-auto rounded-lg transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
            />
        </div>
    )
}
