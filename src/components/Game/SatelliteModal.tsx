import { useState } from 'react'
import { useLanguage } from '@/lib/languageContext'
import LoadingSpinner from './LoadingSpinner'

interface SatelliteModalProps {
    isOpen: boolean
    onClose: () => void
    satelliteFilename: string
    fjordName: string
}

export default function SatelliteModal({ isOpen, onClose, satelliteFilename, fjordName }: SatelliteModalProps) {
    const { t } = useLanguage()
    const [isLoading, setIsLoading] = useState(true)

    if (!isOpen) return null

    const imagePath = `/fjord_satellite/${satelliteFilename}`

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-4 max-w-2xl w-full relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl z-10"
                >
                    ×
                </button>
                <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">
                        {t('satellite_image_hint')}
                    </h3>
                    {isLoading && (
                        <div className="flex justify-center mb-4">
                            <LoadingSpinner />
                        </div>
                    )}
                    <img
                        src={imagePath}
                        alt={`Satellite view of ${fjordName}`}
                        className={`w-full h-auto rounded-lg ${isLoading ? 'hidden' : ''}`}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    )
}