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
        <>
            {isLoading && (
                <div className="flex justify-center mb-4">
                    <LoadingSpinner />
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={`/fjord_satellite/${satelliteFilename}`}
                alt={alt}
                className={`w-full h-auto rounded-lg ${isLoading ? 'hidden' : ''}`}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
            />
        </>
    )
}
