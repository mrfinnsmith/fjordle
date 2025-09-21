import { useLanguage } from '@/lib/languageContext'

interface FirstLetterHintProps {
    isRevealed: boolean
    revealedLetter: string | null
    onReveal: () => void
}

export default function FirstLetterHint({ isRevealed, revealedLetter, onReveal }: FirstLetterHintProps) {
    const { t } = useLanguage()

    return (
        <div className="flex justify-between items-center gap-4 pt-4">
            <div className="flex-1">
                <h4 className="font-medium">💡 {t('first_letter_hint')}</h4>
                <p className="text-sm text-gray-600">{t('reveal_first_letter')}</p>
            </div>
            <div className="flex-shrink-0">
                {isRevealed ? (
                    <div className="text-lg font-bold min-w-[100px] text-center" style={{ color: 'var(--norwegian-red)' }}>
                        {revealedLetter}
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