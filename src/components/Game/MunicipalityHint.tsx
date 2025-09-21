import { useLanguage } from '@/lib/languageContext'

interface MunicipalityHintProps {
    isRevealed: boolean
    municipalities: string[]
    onReveal: () => void
}

export default function MunicipalityHint({ isRevealed, municipalities, onReveal }: MunicipalityHintProps) {
    const { t } = useLanguage()

    return (
        <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
                <h4 className="font-medium">🏘️ {t('municipality_hint')}</h4>
                <p className="text-sm text-gray-600">{t('municipality_hint_description')}</p>
            </div>
            <div className="flex-shrink-0">
                {isRevealed ? (
                    <div className="text-sm min-w-[140px] text-right" style={{ color: 'var(--norwegian-red)' }}>
                        {municipalities.join(', ')}
                    </div>
                ) : (
                    <button
                        onClick={onReveal}
                        className="game-button primary w-[140px]"
                    >
                        {t('reveal')}
                    </button>
                )}
            </div>
        </div>
    )
}