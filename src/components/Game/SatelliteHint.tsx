import { useLanguage } from '@/lib/languageContext'

interface SatelliteHintProps {
    isRevealed: boolean
    onReveal: () => void
}

export default function SatelliteHint({ isRevealed, onReveal }: SatelliteHintProps) {
    const { t } = useLanguage()

    return (
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
                <h4 className="font-medium">🛰️ {t('satellite_image_hint')}</h4>
                <p className="text-sm text-gray-600">{t('satellite_hint_description')}</p>
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={onReveal}
                    className="game-button primary w-[140px]"
                >
                    {isRevealed ? t('view_again') : t('satellite_image_hint')}
                </button>
            </div>
        </div>
    )
}