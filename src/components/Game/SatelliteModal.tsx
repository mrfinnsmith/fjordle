import { useLanguage } from '@/lib/languageContext'
import { useFocusTrap } from '@/lib/useFocusTrap'
import SatelliteImage from '@/components/shared/SatelliteImage'

interface SatelliteModalProps {
    isOpen: boolean
    onClose: () => void
    satelliteFilename: string
}

export default function SatelliteModal({ isOpen, onClose, satelliteFilename }: SatelliteModalProps) {
    const { t } = useLanguage()
    const satelliteModalRef = useFocusTrap(isOpen)

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    onClose()
                }
            }}
        >
            <div
                ref={satelliteModalRef}
                className="bg-white rounded-lg p-4 max-w-2xl w-full relative"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="satellite-modal-title"
                aria-describedby="satellite-modal-description"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl z-10"
                    aria-label={t('a11y_close_modal')}
                >
                    ×
                </button>
                <div className="text-center">
                    <h3 id="satellite-modal-title" className="text-lg font-semibold mb-4">
                        {t('satellite_image_hint')}
                    </h3>
                    <div id="satellite-modal-description" className="sr-only">
                        {t('a11y_satellite_modal')}
                    </div>
                    <SatelliteImage
                        satelliteFilename={satelliteFilename}
                        alt={t('satellite_image_hint')}
                    />
                </div>
            </div>
        </div>
    )
}